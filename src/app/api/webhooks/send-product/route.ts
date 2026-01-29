import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

import ProductDeliveryEmail from "@/components/emails/product-delivery";
import { getLeadByEmailOrPhone } from "@/data/leads/get-lead-by-contact";
import { getProductById } from "@/data/products/get-products";
import { db } from "@/db";
import { email_events, leads } from "@/db/schema";
import { sendWhatsappDocument } from "@/lib/zapi-service";

const CAKTO_WEBHOOK_SECRET = process.env.CAKTO_WEBHOOK_SECRET || "";
const resend = new Resend(process.env.RESEND_API_KEY as string);

// Determina o contact_type baseado nos dados do cliente
function determineContactType(
  email?: string | null,
  phone?: string | null,
): "email" | "phone" | "both" {
  const hasEmail = !!email;
  const hasPhone = !!phone;

  if (hasEmail && hasPhone) return "both";
  if (hasEmail) return "email";
  if (hasPhone) return "phone";
  return "email"; // padrão
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validação do secret
    const secret = body?.secret;
    if (!secret || secret !== CAKTO_WEBHOOK_SECRET) {
      console.warn("[CAKTO][Webhook] Secret inválido ou ausente");
      return NextResponse.json({ error: "Segredo inválido" }, { status: 401 });
    }

    // Validação do evento
    const event = body?.event;
    if (event !== "purchase_approved") {
      return NextResponse.json(
        { ok: true, ignored: true, reason: "evento não processado" },
        { status: 200 },
      );
    }

    const data = body?.data;
    const customer = data?.customer;
    const product = data?.product;

    // Validação dos dados obrigatórios
    if (!customer) {
      return NextResponse.json(
        { error: "Dados do cliente ausentes" },
        { status: 400 },
      );
    }

    // ID do produto vem da estrutura Cakto: data.product.id
    const productId = product?.id?.trim() || null;
    if (!productId) {
      return NextResponse.json(
        { error: "ID do produto ausente" },
        { status: 400 },
      );
    }

    const customerEmail = customer.email?.trim() || null;
    const customerPhone = customer.phone?.trim() || null;
    const customerName = customer.name?.trim() || "Cliente";

    if (!customerEmail && !customerPhone) {
      return NextResponse.json(
        { error: "Email ou telefone do cliente é obrigatório" },
        { status: 400 },
      );
    }

    // Busca o produto pelo UUID (mesmo padrão da rota de leads)
    const dbProduct = await getProductById(productId);
    if (!dbProduct) {
      console.error("[CAKTO][Webhook] Produto não encontrado:", productId);
      return NextResponse.json(
        {
          error: "Produto não encontrado",
          detail: `Nenhum produto com id (UUID) igual a "${productId}"`,
        },
        { status: 404 },
      );
    }

    // Busca ou cria o lead
    let lead = await getLeadByEmailOrPhone(customerEmail, customerPhone);

    const contactType = determineContactType(customerEmail, customerPhone);

    if (lead) {
      // Atualiza o lead existente
      await db
        .update(leads)
        .set({
          conversion_status: "converted",
          name: customerName,
          email: customerEmail || lead.email,
          phone: customerPhone || lead.phone,
          contact_type: contactType,
          product_id: dbProduct.id,
        })
        .where(eq(leads.id, lead.id));

      // Busca o lead atualizado
      const [updatedLead] = await db
        .select()
        .from(leads)
        .where(eq(leads.id, lead.id))
        .limit(1);
      lead = updatedLead;
    } else {
      // Cria novo lead
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
          product_id: dbProduct.id,
        })
        .returning();
      lead = newLead;
    }

    if (!lead) {
      return NextResponse.json(
        { error: "Erro ao criar/atualizar lead" },
        { status: 500 },
      );
    }

    // Baixa o arquivo do blob (mesmo padrão da rota de leads)
    let fileBuffer: Buffer;
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
      console.error("[CAKTO][Webhook] Erro ao baixar arquivo do produto:", err);
      return NextResponse.json(
        {
          error: "Erro ao baixar arquivo do produto",
          detail: err instanceof Error ? err.message : "Erro desconhecido",
        },
        { status: 500 },
      );
    }

    // Extrai e normaliza o nome do arquivo (decodifica %20 etc.) — mesmo padrão da rota de leads
    const rawFileName =
      dbProduct.provider_path.split("/").pop() || `${dbProduct.name}.pdf`;
    let fileName: string;
    try {
      fileName = decodeURIComponent(rawFileName);
    } catch {
      fileName = rawFileName;
    }

    // Envia o produto conforme o contact_type (mesmo padrão da rota de leads: sendTasks + Promise.allSettled)
    const sendTasks: Array<{
      channel: "email" | "whatsapp";
      fn: () => Promise<void>;
    }> = [];
    const deliveryErrors: { channel: "email" | "whatsapp"; error: string }[] =
      [];

    if (lead.contact_type === "email" || lead.contact_type === "both") {
      if (customerEmail) {
        sendTasks.push({
          channel: "email",
          fn: async () => {
            await resend.emails.send({
              from: `${process.env.NAME_FOR_ACCOUNT_MANAGEMENT_SUBMISSIONE} <${process.env.EMAIL_FOR_ACCOUNT_MANAGEMENT_SUBMISSION}>`,
              to: customerEmail,
              subject: `O seu ${dbProduct.name} está pronto!`,
              react: ProductDeliveryEmail({
                customerName,
                productName: dbProduct.name,
              }),
              attachments: [
                {
                  filename: fileName,
                  content: fileBuffer.toString("base64"),
                },
              ],
            });
            await db.insert(email_events).values({
              type: "email_delivery",
              category: "sale",
              to: customerEmail,
              subject: `Produto ${dbProduct.name} entregue por email.`,
              product_id: dbProduct.id,
              sent_at: new Date(),
            });
          },
        });
      }
    }

    if (lead.contact_type === "phone" || lead.contact_type === "both") {
      if (customerPhone) {
        sendTasks.push({
          channel: "whatsapp",
          fn: async () => {
            await sendWhatsappDocument(
              customerPhone,
              fileBuffer,
              fileName,
              ` Olá ${customerName}! 👋 
                
                Seu PDF gratuito *${dbProduct.name}* está pronto!  🎉
                
                A CarsLab agradece por escolher nossos produtos! 🚗

                • Siga nossas redes sociais: @carslab.br
                
                Até mais! 👋

                Equipe CarsLab 💛

                📱 Suporte CarsLab: +55 64 9 9999-9999 (WhatsApp)
                📧 Suporte CarsLab: suportecarslab@gmail.com (Email)
                `,
            );
            await db.insert(email_events).values({
              type: "whatsapp_delivery",
              category: "sale",
              to: customerPhone,
              subject: `Produto ${dbProduct.name} entregue via WhatsApp`,
              product_id: dbProduct.id,
              sent_at: new Date(),
            });
          },
        });
      }
    }

    let deliverySent: "email" | "phone" | "both" | null = null;
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
            `[CAKTO][Webhook] Erro ao enviar por ${channel}:`,
            result.reason,
          );
          deliveryErrors.push({ channel, error: msg });
        }
      });
      if (deliveryErrors.length < sendTasks.length) {
        deliverySent = lead.contact_type as "email" | "phone" | "both";
      }
    }

    return NextResponse.json({
      ok: true,
      leadId: lead.id,
      productId: dbProduct.id,
      sentVia: lead.contact_type,
      ...(deliverySent && { delivery_sent: deliverySent }),
      ...(deliveryErrors.length > 0 && { delivery_errors: deliveryErrors }),
    });
  } catch (error) {
    console.error("[CAKTO][Webhook] Erro ao processar webhook:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
