import { eq, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

import ProductDeliveryEmail from "@/components/emails/product-delivery";
import { getProductById } from "@/data/products/get-products";
import { db } from "@/db";
import { email_events, leads } from "@/db/schema";
import { sendWhatsappDocument } from "@/lib/zapi-service";

const LEAD_API_TOKEN = process.env.LEAD_API_TOKEN;
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
  })
  .refine(
    (data) => {
      const email = data.email?.trim();
      const phone = data.phone?.trim();
      return !!(email || phone);
    },
    { message: "Informe ao menos email ou telefone", path: ["email"] },
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
      return NextResponse.json(
        { error: "Token de autenticação inválido ou ausente" },
        { status: 401 },
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
      return NextResponse.json(
        {
          error: "Já existe um lead com este email ou telefone",
          lead_id: existingLead.id,
        },
        { status: 409 },
      );
    }

    const contactType = determineContactType(email, phone);

    const productId = validatedData.product_id?.trim() || null;

    // 1) Buscar produto pelo UUID
    const dbProduct = productId ? await getProductById(productId) : null;
    if (productId && !dbProduct) {
      return NextResponse.json(
        {
          error: "Produto não encontrado",
          detail: `Nenhum produto com id (UUID) igual a "${productId}"`,
        },
        { status: 404 },
      );
    }

    // 2) Baixar arquivo do blob (antes de criar o lead)
    let fileBuffer: Buffer | null = null;
    if (dbProduct) {
      try {
        const blobUrl =
          dbProduct.provider_path.startsWith("http") ||
          dbProduct.provider_path.startsWith("https")
            ? dbProduct.provider_path
            : `https://${dbProduct.provider_path}`;
        const response = await fetch(blobUrl);
        if (!response.ok) {
          throw new Error(
            `Erro ao baixar arquivo: ${response.status} ${response.statusText}`,
          );
        }
        fileBuffer = Buffer.from(await response.arrayBuffer());
      } catch (err) {
        console.error("[API][Leads] Erro ao baixar arquivo do produto:", err);
        return NextResponse.json(
          {
            error: "Erro ao baixar arquivo do produto",
            detail: err instanceof Error ? err.message : "Erro desconhecido",
          },
          { status: 500 },
        );
      }
    }

    // 3) Criar registro do lead com todos os dados (product_id = UUID interno do produto)
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
        product_id: dbProduct?.id ?? null,
      })
      .returning();

    // 4) Enviar produto pelo canal (email e/ou WhatsApp)
    let deliverySent: "email" | "phone" | "both" | null = null;
    const deliveryErrors: { channel: "email" | "whatsapp"; error: string }[] =
      [];

    if (dbProduct && fileBuffer && newLead) {
      const rawFileName =
        dbProduct.provider_path.split("/").pop() || `${dbProduct.name}.pdf`;
      let fileName: string;
      try {
        fileName = decodeURIComponent(rawFileName);
      } catch {
        fileName = rawFileName;
      }
      const customerName = validatedData.name;
      const sendTasks: Array<{
        channel: "email" | "whatsapp";
        fn: () => Promise<void>;
      }> = [];

      if (contactType === "email" || contactType === "both") {
        if (email) {
          sendTasks.push({
            channel: "email",
            fn: async () => {
              await resend.emails.send({
                from: `${process.env.NAME_FOR_ACCOUNT_MANAGEMENT_SUBMISSIONE} <${process.env.EMAIL_FOR_ACCOUNT_MANAGEMENT_SUBMISSION}>`,
                to: email,
                subject: `Seu produto ${dbProduct.name} está pronto!`,
                react: ProductDeliveryEmail({
                  customerName,
                  productName: dbProduct.name,
                }),
                attachments: [
                  {
                    filename: fileName,
                    content: fileBuffer!.toString("base64"),
                  },
                ],
              });
              await db.insert(email_events).values({
                type: "email_delivery",
                category: "sale",
                to: email,
                subject: `Seu produto ${dbProduct.name} está pronto!`,
                product_id: dbProduct.id,
                sent_at: new Date(),
              });
            },
          });
        }
      }

      if (contactType === "phone" || contactType === "both") {
        if (phone) {
          sendTasks.push({
            channel: "whatsapp",
            fn: async () => {
              await sendWhatsappDocument(
                phone,
                fileBuffer!,
                fileName,
                `🎉 Olá ${customerName}! Seu produto *${dbProduct.name}* está pronto! Obrigado pela compra! 💚`,
              );
              await db.insert(email_events).values({
                type: "whatsapp_delivery",
                category: "sale",
                to: phone,
                subject: `Produto ${dbProduct.name} entregue via WhatsApp`,
                product_id: dbProduct.id,
                sent_at: new Date(),
              });
            },
          });
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
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: newLead,
        ...(deliverySent && { delivery_sent: deliverySent }),
        ...(deliveryErrors.length > 0 && { delivery_errors: deliveryErrors }),
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: error.issues,
        },
        { status: 400 },
      );
    }

    console.error("[API][Leads] Erro ao criar lead:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") || authHeader;

    if (!token || token !== LEAD_API_TOKEN) {
      return NextResponse.json(
        { error: "Token de autenticação inválido ou ausente" },
        { status: 401 },
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
      return NextResponse.json(
        { error: "Lead não encontrado com o email ou telefone informado" },
        { status: 404 },
      );
    }

    const [updatedLead] = await db
      .update(leads)
      .set({ user_type: validatedData.user_type })
      .where(eq(leads.id, existingLead.id))
      .returning();

    return NextResponse.json(
      { success: true, data: updatedLead },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: error.issues,
        },
        { status: 400 },
      );
    }

    console.error("[API][Leads] Erro ao atualizar lead:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
