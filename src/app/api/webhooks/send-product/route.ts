import { eq } from "drizzle-orm";
import { after } from "next/server";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

import ProductDeliveryEmail from "@/components/emails/product-delivery";
import { getLeadByEmailOrPhone } from "@/data/leads/get-lead-by-contact";
import {
  getProductsByExternalIds,
  getProductsByIds,
} from "@/data/products/get-products";
import { db } from "@/db";
import { events, leads, ordersTable } from "@/db/schema";
import { fetchBlobWithRetry } from "@/lib/fetch-blob-with-retry";
import { getEmailLogoAttachment } from "@/lib/email-logo";
import { sendWhatsappDocument } from "@/lib/zapi-service";

const CAKTO_WEBHOOK_SECRET = process.env.CAKTO_WEBHOOK_SECRET || "";
const resend = new Resend(process.env.RESEND_API_KEY as string);

/** Tempo máximo para a função (inclui trabalho em background via after) */
export const maxDuration = 60;

type OrderProduct = { product_id: string; quantity: number };

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

/** Normaliza payload Cakto: product (único) ou products (array) -> lista de external_id */
function normalizeCaktoProductIds(data: {
  product?: { id?: string } | null;
  products?: Array<{ id?: string }> | null;
}): string[] {
  const single = data.product?.id?.trim();
  const multiple = data.products
    ?.map((p) => p.id?.trim())
    .filter((id): id is string => !!id);
  if (multiple && multiple.length > 0) return multiple;
  if (single) return [single];
  return [];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const secret = body?.secret;
    if (!secret || secret !== CAKTO_WEBHOOK_SECRET) {
      console.warn("[CAKTO][Webhook] Secret inválido ou ausente");
      return NextResponse.json({ error: "Segredo inválido" }, { status: 401 });
    }

    const event = body?.event;
    if (event !== "purchase_approved") {
      return NextResponse.json(
        { ok: true, ignored: true, reason: "evento não processado" },
        { status: 200 },
      );
    }

    const data = body?.data;
    const customer = data?.customer;

    if (!customer) {
      return NextResponse.json(
        { error: "Dados do cliente ausentes" },
        { status: 400 },
      );
    }

    const customerEmail = customer.email?.trim() || null;
    const customerPhone = customer.phone?.trim() || null;
    const customerName = customer.name?.trim() || "Cliente";
    const rawAmount = data?.amount;
    const totalAmount = Math.round(
      typeof rawAmount === "number"
        ? rawAmount
        : typeof rawAmount === "string"
          ? Number(rawAmount.trim()) || 0
          : 0,
    );

    if (!customerEmail && !customerPhone) {
      return NextResponse.json(
        { error: "Email ou telefone do cliente é obrigatório" },
        { status: 400 },
      );
    }

    // IDs do produto no Cakto = external_id no nosso banco
    const externalIds = normalizeCaktoProductIds(data);
    if (externalIds.length === 0) {
      return NextResponse.json(
        {
          error: "ID(s) do produto ausente(s) em data.product ou data.products",
        },
        { status: 400 },
      );
    }

    // Resolve external_id (Cakto) -> produto interno (mantém ordem do payload)
    const dbProductsByExternal = await getProductsByExternalIds(externalIds);
    if (dbProductsByExternal.length !== externalIds.length) {
      const found = new Set(dbProductsByExternal.map((p) => p.external_id));
      const missing = externalIds.filter((id) => !found.has(id));
      console.error(
        "[CAKTO][Webhook] Produto(s) não encontrado(s) por external_id:",
        missing,
      );
      return NextResponse.json(
        {
          error: "Produto(s) não encontrado(s)",
          detail: `Nenhum produto com external_id: ${missing.join(", ")}`,
        },
        { status: 404 },
      );
    }
    const byExternalId = new Map(
      dbProductsByExternal.map((p) => [p.external_id, p]),
    );
    const productIds = externalIds
      .map((eid) => byExternalId.get(eid)?.id)
      .filter((id): id is string => !!id);
    const contactType = determineContactType(customerEmail, customerPhone);

    // 1) Criar ou atualizar lead com os dados
    let lead = await getLeadByEmailOrPhone(customerEmail, customerPhone);

    if (lead) {
      await db
        .update(leads)
        .set({
          conversion_status: "converted",
          name: customerName,
          email: customerEmail ?? lead.email,
          phone: customerPhone ?? lead.phone,
          contact_type: contactType,
          product_id: productIds[0] ?? lead.product_id,
        })
        .where(eq(leads.id, lead.id));

      const [updatedLead] = await db
        .select()
        .from(leads)
        .where(eq(leads.id, lead.id))
        .limit(1);
      lead = updatedLead!;
    } else {
      const [newLead] = await db
        .insert(leads)
        .values({
          landing_source: "checkout",
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          contact_type: contactType,
          user_type: "direct-customer",
          consent_marketing: true,
          conversion_status: "converted",
          remarketing_status: "not_sent_remarketing",
          product_id: productIds[0] ?? null,
        })
        .returning();
      lead = newLead!;
    }

    // 2) Criar order com todos os produtos enviados
    const orderProducts: OrderProduct[] = productIds.map((id) => ({
      product_id: id,
      quantity: 1,
    }));
    const [newOrder] = await db
      .insert(ordersTable)
      .values({
        order_id: crypto.randomUUID(),
        lead_id: lead.id,
        order_date: new Date(),
        order_type: "sale",
        total_amount: totalAmount,
        status: "created",
        products: orderProducts,
      })
      .returning();

    const orderProductIds = (newOrder!.products as OrderProduct[]).map(
      (p) => p.product_id,
    );
    const orderId = newOrder!.id;

    // Responde 200 imediatamente para evitar timeout da Cakto; entrega roda em background
    after(async () => {
      try {
        // 3) Buscar produtos pelo pedido
        const dbProductsRaw = await getProductsByIds(orderProductIds);
        const dbProducts = orderProductIds
          .map((id) => dbProductsRaw.find((p) => p.id === id))
          .filter((p): p is NonNullable<typeof p> => p != null);

        if (dbProducts.length === 0) {
          console.error(
            "[CAKTO][Webhook] Nenhum produto encontrado para entrega:",
            orderProductIds,
          );
          return;
        }

        // 4) Baixar arquivos do Vercel Blob
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
            productBuffers.push({ product, buffer: Buffer.from(arrayBuffer) });
          } catch (err) {
            console.error(
              "[CAKTO][Webhook] Erro ao baixar arquivo do produto:",
              product.id,
              err,
            );
            return;
          }
        }

        // 5) Enviar arquivos (email + WhatsApp)
        const sendTasks: Array<{
          channel: "email" | "whatsapp";
          fn: () => Promise<void>;
        }> = [];

        if (contactType === "email" || contactType === "both") {
          if (customerEmail) {
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
                  to: customerEmail,
                  subject:
                    dbProducts.length === 1
                      ? `O seu ${dbProducts[0]!.name} está pronto!`
                      : "Seus produtos estão prontos!",
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
                    category: "sale",
                    to: customerEmail,
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
          if (customerPhone) {
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
                    customerPhone,
                    buffer,
                    fileName,
                    ` Olá ${customerName}! 👋 
                
Seu *${product.name}* está pronto!  🎉
                
A CarsLab agradece por escolher nossos produtos! 🚗

• Siga nossas redes sociais: @carslab.br
                
Até mais! 👋

Equipe CarsLab 💛

📱Fale conosco via WhatsApp: +55 64 9 9999-9999 

📧 Fale conosco via Email: suportecarslab@gmail.com
                `,
                  );
                  await db.insert(events).values({
                    type: "whatsapp_delivery",
                    category: "sale",
                    to: customerPhone,
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
          let deliveryErrors = 0;
          results.forEach((result, i) => {
            if (result.status === "rejected") {
              console.error(
                `[CAKTO][Webhook] Erro ao enviar por ${sendTasks[i]!.channel}:`,
                result.reason,
              );
              deliveryErrors++;
            }
          });

          // 6) Se envio for ok, atualizar status do order para delivered
          if (deliveryErrors === 0) {
            await db
              .update(ordersTable)
              .set({ status: "delivered" })
              .where(eq(ordersTable.id, orderId));
          }
        }
      } catch (err) {
        console.error("[CAKTO][Webhook] Erro na entrega em background:", err);
      }
    });

    return NextResponse.json({
      ok: true,
      leadId: lead.id,
      orderId: newOrder?.id,
      productIds,
      message: "Pedido criado. Entrega em processamento.",
    });
  } catch (error) {
    console.error("[CAKTO][Webhook] Erro ao processar webhook:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
