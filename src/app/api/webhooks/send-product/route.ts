import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

import ProductDeliveryEmail from "@/components/emails/product-delivery";
import { getLeadByEmailOrPhone } from "@/data/leads/get-lead-by-contact";
import { getProductBySaleProductId } from "@/data/products/get-products";
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

    if (!product?.id) {
      return NextResponse.json(
        { error: "ID do produto ausente" },
        { status: 400 },
      );
    }

    const customerEmail = customer.email || null;
    const customerPhone = customer.phone || null;
    const customerName = customer.name || "Cliente";

    if (!customerEmail && !customerPhone) {
      return NextResponse.json(
        { error: "Email ou telefone do cliente é obrigatório" },
        { status: 400 },
      );
    }

    // Busca o produto pelo sale_product_id
    const dbProduct = await getProductBySaleProductId(product.id);
    if (!dbProduct) {
      console.error("[CAKTO][Webhook] Produto não encontrado:", product.id);
      return NextResponse.json(
        { error: "Produto não encontrado" },
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

    // Baixa o arquivo do Vercel Blob
    let fileBuffer: Buffer;
    try {
      // O provider_path pode ser uma URL completa ou um path relativo
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
      const arrayBuffer = await response.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    } catch (error) {
      console.error("[CAKTO][Webhook] Erro ao baixar arquivo do Blob:", error);
      return NextResponse.json(
        { error: "Erro ao baixar arquivo do produto" },
        { status: 500 },
      );
    }

    // Extrai o nome do arquivo do provider_path
    const fileName =
      dbProduct.provider_path.split("/").pop() || `${dbProduct.name}.pdf`;

    // Envia o produto conforme o contact_type
    const sendPromises: Promise<void>[] = [];

    if (lead.contact_type === "email" || lead.contact_type === "both") {
      if (customerEmail) {
        sendPromises.push(
          (async () => {
            try {
              await resend.emails.send({
                from: `${process.env.NAME_FOR_ACCOUNT_MANAGEMENT_SUBMISSIONE} <${process.env.EMAIL_FOR_ACCOUNT_MANAGEMENT_SUBMISSION}>`,
                to: customerEmail,
                subject: `Seu produto ${dbProduct.name} está pronto!`,
                react: ProductDeliveryEmail({
                  customerName: customerName,
                  productName: dbProduct.name,
                }),
                attachments: [
                  {
                    filename: fileName,
                    content: fileBuffer,
                  },
                ],
              });

              // Registra evento de email
              await db.insert(email_events).values({
                type: "email_delivery",
                category: "sale",
                to: customerEmail,
                subject: `Seu produto ${dbProduct.name} está pronto!`,
                product_id: dbProduct.id,
                sent_at: new Date(),
              });
            } catch (error) {
              console.error("[CAKTO][Webhook] Erro ao enviar email:", error);
              throw error;
            }
          })(),
        );
      }
    }

    if (lead.contact_type === "phone" || lead.contact_type === "both") {
      if (customerPhone) {
        sendPromises.push(
          (async () => {
            try {
              await sendWhatsappDocument(
                customerPhone,
                fileBuffer,
                fileName,
                `🎉 Olá ${customerName}! Seu produto *${dbProduct.name}* está pronto! Obrigado pela compra! 💚`,
              );

              // Registra evento de WhatsApp (usando email_events com tipo diferente)
              await db.insert(email_events).values({
                type: "whatsapp_delivery",
                category: "sale",
                to: customerPhone,
                subject: `Produto ${dbProduct.name} entregue via WhatsApp`,
                product_id: dbProduct.id,
                sent_at: new Date(),
              });
            } catch (error) {
              console.error("[CAKTO][Webhook] Erro ao enviar WhatsApp:", error);
              throw error;
            }
          })(),
        );
      }
    }

    // Aguarda todos os envios
    await Promise.allSettled(sendPromises);

    return NextResponse.json({
      ok: true,
      leadId: lead.id,
      productId: dbProduct.id,
      sentVia: lead.contact_type,
    });
  } catch (error) {
    console.error("[CAKTO][Webhook] Erro ao processar webhook:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
