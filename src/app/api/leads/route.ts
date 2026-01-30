import { eq, or } from "drizzle-orm";

type OrderProduct = { product_id: string; quantity: number };
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

import ProductDeliveryEmail from "@/components/emails/product-delivery";
import { getProductsByIds } from "@/data/products/get-products";
import { db } from "@/db";
import { events, leads, ordersTable } from "@/db/schema";
import { fetchBlobWithRetry } from "@/lib/fetch-blob-with-retry";
import { getEmailLogoAttachment } from "@/lib/email-logo";
import { sendWhatsappDocument } from "@/lib/zapi-service";

const LEAD_API_TOKEN = process.env.LEAD_API_TOKEN;

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];

function withCorsHeaders(res: NextResponse, req: NextRequest): NextResponse {
  const origin = req.headers.get("origin");
  if (origin && allowedOrigins.includes(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
  }
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );
  return res;
}

export async function OPTIONS(_req: NextRequest) {
  const res = new NextResponse(null, { status: 200 });
  return withCorsHeaders(res, _req);
}
const resend = new Resend(process.env.RESEND_API_KEY as string);

function determineContactType(
  email?: string | null,
  phone?: string | null,
): "email" | "phone" | "both" {
  const hasEmail = !!email;
  const hasPhone = !!phone;
  if (hasEmail && hasPhone) return "both";
  if (hasEmail) return "email";
  if (hasPhone) return "phone";
  return "email";
}

const createLeadSchema = z
  .object({
    landing_source: z.string().min(1, "Landing source é obrigatório"),
    name: z.string().min(1, "Nome é obrigatório"),
    email: z.string().optional(),
    phone: z.string().optional(),
    contact_type: z.string().default("email"),
    user_type: z.string().default("hobby"),
    consent_marketing: z.boolean().default(true),
    conversion_status: z.string().default("not_converted"),
    product_id: z.string().uuid("product_id deve ser um UUID válido").nullish(),
    product_ids: z
      .array(z.string().uuid("Cada product_id deve ser um UUID válido"))
      .optional(),
    remarketing_status: z.string().default("not_sent_remarketing"),
  })
  .refine(
    (data) => {
      const email = data.email?.trim();
      const phone = data.phone?.trim();
      return !!(email || phone);
    },
    { message: "Informe ao menos email ou telefone", path: ["email"] },
  )
  .refine(
    (data) => (data.product_ids?.length ?? 0) > 0 || data.product_id != null,
    {
      message: "Informe ao menos um produto (product_id ou product_ids)",
      path: ["product_id"],
    },
  );

const updateLeadSchema = z
  .object({
    user_type: z.string().min(1, "user_type é obrigatório"),
    email: z.string().email("Email inválido").optional(),
    phone: z.string().min(1, "Telefone é obrigatório para busca").optional(),
  })
  .refine((data) => data.email ?? data.phone, {
    message: "Informe email ou phone para identificar o lead",
    path: ["email"],
  });

export async function POST(req: NextRequest) {
  try {
    // Validação do token
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") || authHeader;

    if (!token || token !== LEAD_API_TOKEN) {
      return withCorsHeaders(
        NextResponse.json(
          { error: "Token de autenticação inválido ou ausente" },
          { status: 401 },
        ),
        req,
      );
    }

    // Parse e validação do body
    const body = await req.json();
    const validatedData = createLeadSchema.parse(body);

    // Normaliza email/phone (string vazia vira null para o banco)
    const email = validatedData.email?.trim() || null;
    const phone = validatedData.phone?.trim() || null;

    // Verifica se já existe um lead com o mesmo contato (só pelos campos enviados)
    const conditions = [
      ...(email ? [eq(leads.email, email)] : []),
      ...(phone ? [eq(leads.phone, phone)] : []),
    ];
    const existingLead =
      conditions.length > 0
        ? await db.query.leads.findFirst({ where: or(...conditions) })
        : null;

    if (existingLead) {
      return withCorsHeaders(
        NextResponse.json(
          {
            error: "Já existe um lead com este email ou telefone",
            lead_id: existingLead.id,
          },
          { status: 409 },
        ),
        req,
      );
    }

    const contactType = determineContactType(email, phone);

    // Normaliza lista de produtos (product_ids ou product_id único)
    const productIds = (
      validatedData.product_ids?.length
        ? validatedData.product_ids
        : validatedData.product_id
          ? [validatedData.product_id]
          : []
    ).filter(Boolean) as string[];

    // Valida que todos os produtos existem
    const productsFromDb = await getProductsByIds(productIds);
    if (productsFromDb.length !== productIds.length) {
      const foundIds = new Set(productsFromDb.map((p) => p.id));
      const missing = productIds.filter((id) => !foundIds.has(id));
      return withCorsHeaders(
        NextResponse.json(
          {
            error: "Produto(s) não encontrado(s)",
            detail: `Nenhum produto com id: ${missing.join(", ")}`,
          },
          { status: 404 },
        ),
        req,
      );
    }

    // 1) Criar lead com os dados
    const [newLead] = await db
      .insert(leads)
      .values({
        landing_source: validatedData.landing_source,
        name: validatedData.name,
        email,
        phone,
        contact_type: contactType,
        user_type: validatedData.user_type,
        consent_marketing: validatedData.consent_marketing,
        conversion_status: validatedData.conversion_status,
        remarketing_status: validatedData.remarketing_status,
        product_id: productIds[0] ?? null,
      })
      .returning();

    // 2) Criar order com todos os produtos enviados
    const orderProducts: OrderProduct[] = productIds.map((id) => ({
      product_id: id,
      quantity: 1,
    }));
    const [newOrder] = await db
      .insert(ordersTable)
      .values({
        order_id: crypto.randomUUID(),
        lead_id: newLead.id,
        order_date: new Date(),
        order_type: "lead_capture",
        total_amount: 0,
        status: "created",
        products: orderProducts,
      })
      .returning();

    // 3) Buscar produtos pelo pedido (todos que foram enviados)
    const orderProductIds = (newOrder.products as OrderProduct[]).map(
      (p) => p.product_id,
    );
    const dbProducts = await getProductsByIds(orderProductIds);

    // 4) Baixar arquivos do Vercel Blob (um por produto)
    const productBuffers: {
      product: (typeof dbProducts)[0];
      buffer: Buffer;
    }[] = [];
    for (const product of dbProducts) {
      try {
        const blobUrl =
          product.provider_path.startsWith("http") ||
          product.provider_path.startsWith("https")
            ? product.provider_path
            : `https://${product.provider_path}`;
        const arrayBuffer = await fetchBlobWithRetry(blobUrl);
        const buffer = Buffer.from(arrayBuffer);
        productBuffers.push({ product, buffer });
      } catch (err) {
        console.error(
          "[API][Leads] Erro ao baixar arquivo do produto:",
          product.id,
          err,
        );
        return withCorsHeaders(
          NextResponse.json(
            {
              error: "Erro ao baixar arquivo do produto",
              detail: err instanceof Error ? err.message : "Erro desconhecido",
              product_id: product.id,
            },
            { status: 500 },
          ),
          req,
        );
      }
    }

    // 5) Enviar arquivos (email com todos os anexos; WhatsApp um doc por produto)
    let deliverySent: "email" | "phone" | "both" | null = null;
    const deliveryErrors: { channel: "email" | "whatsapp"; error: string }[] =
      [];
    const customerName = validatedData.name;

    if (productBuffers.length > 0) {
      const sendTasks: Array<{
        channel: "email" | "whatsapp";
        fn: () => Promise<void>;
      }> = [];

      if (contactType === "email" || contactType === "both") {
        if (email) {
          sendTasks.push({
            channel: "email",
            fn: async () => {
              const attachments = [
                getEmailLogoAttachment(),
                ...productBuffers.map(({ product, buffer }) => {
                  const rawFileName =
                    product.provider_path.split("/").pop() ||
                    `${product.name}.pdf`;
                  const fileName = (() => {
                    try {
                      return decodeURIComponent(rawFileName);
                    } catch {
                      return rawFileName;
                    }
                  })();
                  return {
                    filename: fileName,
                    content: buffer.toString("base64"),
                  };
                }),
              ];
              const productNames = dbProducts.map((p) => p.name).join(", ");
              await resend.emails.send({
                from: `${process.env.NAME_FOR_ACCOUNT_MANAGEMENT_SUBMISSIONE} <${process.env.EMAIL_FOR_ACCOUNT_MANAGEMENT_SUBMISSION}>`,
                to: email,
                subject: `Seus produtos estão prontos!`,
                react: ProductDeliveryEmail({
                  customerName,
                  productName:
                    dbProducts.length === 1
                      ? dbProducts[0]!.name
                      : productNames,
                }),
                attachments,
              });
              for (const { product } of productBuffers) {
                await db.insert(events).values({
                  type: "email_delivery",
                  category: "lead_capture",
                  to: email,
                  subject: `Produto ${product.name} entregue por email.`,
                  product_id: product.id,
                  sent_at: new Date(),
                });
              }
            },
          });
        }
      }

      if (contactType === "phone" || contactType === "both") {
        if (phone) {
          for (const { product, buffer } of productBuffers) {
            const rawFileName =
              product.provider_path.split("/").pop() || `${product.name}.pdf`;
            const fileName = (() => {
              try {
                return decodeURIComponent(rawFileName);
              } catch {
                return rawFileName;
              }
            })();
            sendTasks.push({
              channel: "whatsapp",
              fn: async () => {
                await sendWhatsappDocument(
                  phone,
                  buffer,
                  fileName,
                  ` Olá ${customerName}! 👋  
                
Seu ${product.name} está pronto!  🎉
                
A CarsLab agradece por escolher nossos produtos! 🚗

• Siga nossas redes sociais: https://www.instagram.com/carslab.br

• Conheca nosso guia completo sobre Estética automotiva: https://carslab.vercel.app/
                
Até mais! 👋

Equipe CarsLab 💛

📱Fale conosco via WhatsApp: +55 64 9 9999-9999 

📧 Fale conosco via Email: suportecarslab@gmail.com
                `,
                );
                await db.insert(events).values({
                  type: "whatsapp_delivery",
                  category: "lead_capture",
                  to: phone,
                  subject: `Produto ${product.name} entregue via WhatsApp`,
                  product_id: product.id,
                  sent_at: new Date(),
                });
              },
            });
          }
        }
      }

      if (sendTasks.length > 0) {
        const results = await Promise.allSettled(
          sendTasks.map((task) => task.fn()),
        );
        results.forEach((result, i) => {
          if (result.status === "rejected") {
            const channel = sendTasks[i]!.channel;
            const msg =
              result.reason?.message ??
              String(result.reason ?? "Erro desconhecido");
            console.error(
              `[API][Leads] Erro ao enviar por ${channel}:`,
              result.reason,
            );
            deliveryErrors.push({ channel, error: msg });
          }
        });
        if (deliveryErrors.length < sendTasks.length) {
          deliverySent = contactType;
        }

        // 6) Se envio for ok, atualizar status do order para delivered
        if (deliveryErrors.length === 0 && newOrder.id) {
          await db
            .update(ordersTable)
            .set({ status: "delivered" })
            .where(eq(ordersTable.id, newOrder.id));
        }
      }
    }

    return withCorsHeaders(
      NextResponse.json(
        {
          success: true,
          data: newLead,
          ...(deliverySent && { delivery_sent: deliverySent }),
          ...(deliveryErrors.length > 0 && { delivery_errors: deliveryErrors }),
        },
        { status: 201 },
      ),
      req,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return withCorsHeaders(
        NextResponse.json(
          {
            error: "Dados inválidos",
            details: error.issues,
          },
          { status: 400 },
        ),
        req,
      );
    }

    console.error("[API][Leads] Erro ao criar lead:", error);
    return withCorsHeaders(
      NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 }),
      req,
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") || authHeader;

    if (!token || token !== LEAD_API_TOKEN) {
      return withCorsHeaders(
        NextResponse.json(
          { error: "Token de autenticação inválido ou ausente" },
          { status: 401 },
        ),
        req,
      );
    }

    const body = await req.json();
    const validatedData = updateLeadSchema.parse(body);

    const conditions = [
      ...(validatedData.email ? [eq(leads.email, validatedData.email)] : []),
      ...(validatedData.phone ? [eq(leads.phone, validatedData.phone)] : []),
    ];
    const existingLead = await db.query.leads.findFirst({
      where: or(...conditions),
    });

    if (!existingLead) {
      return withCorsHeaders(
        NextResponse.json(
          { error: "Lead não encontrado com o email ou telefone informado" },
          { status: 404 },
        ),
        req,
      );
    }

    const [updatedLead] = await db
      .update(leads)
      .set({ user_type: validatedData.user_type })
      .where(eq(leads.id, existingLead.id))
      .returning();

    return withCorsHeaders(
      NextResponse.json({ success: true, data: updatedLead }, { status: 200 }),
      req,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return withCorsHeaders(
        NextResponse.json(
          {
            error: "Dados inválidos",
            details: error.issues,
          },
          { status: 400 },
        ),
        req,
      );
    }

    console.error("[API][Leads] Erro ao atualizar lead:", error);
    return withCorsHeaders(
      NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 }),
      req,
    );
  }
}
