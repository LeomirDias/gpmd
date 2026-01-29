import { eq, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { leads } from "@/db/schema";

const LEAD_API_TOKEN = process.env.LEAD_API_TOKEN;

const createLeadSchema = z.object({
  landing_source: z.string().min(1, "Landing source é obrigatório"),
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().min(1, "Email é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  contact_type: z.string().default("email"),
  user_type: z.string().default("lead"),
  consent_marketing: z.boolean().default(true),
  conversion_status: z.string().default("not_converted"),
  product_id: z.string().uuid("Product ID deve ser um UUID válido").nullish(),
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

    // Verifica se já existe um lead com o mesmo contato
    const existingLead = await db.query.leads.findFirst({
      where: or(
        eq(leads.email, validatedData.email),
        eq(leads.phone, validatedData.phone),
      ),
    });

    if (existingLead) {
      return NextResponse.json(
        {
          error: "Já existe um lead com este email ou telefone",
          lead_id: existingLead.id,
        },
        { status: 409 },
      );
    }

    // Insere o novo lead
    const [newLead] = await db
      .insert(leads)
      .values({
        landing_source: validatedData.landing_source,
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        contact_type: validatedData.contact_type,
        user_type: validatedData.user_type,
        consent_marketing: validatedData.consent_marketing,
        conversion_status: validatedData.conversion_status,
        product_id: validatedData.product_id ?? null,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newLead,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: error.errors,
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
