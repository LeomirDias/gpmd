"use server";

import { z } from "zod";

import { db } from "@/db";
import { products } from "@/db/schema";
import { actionClient } from "@/lib/next-safe-action";

const createProductSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.string().min(1, "Tipo é obrigatório").optional(),
  version: z.number().int().positive().optional(),
  external_id: z.string().min(1, "ID externo é obrigatório"),
  provider_path: z.string().min(1, "Caminho do provedor é obrigatório"),
});

export const createProduct = actionClient
  .schema(createProductSchema)
  .action(async ({ parsedInput }) => {
    const {
      name,
      type = "ebook",
      version = 1,
      external_id,
      provider_path,
    } = parsedInput;

    const [newProduct] = await db
      .insert(products)
      .values({
        name,
        type,
        version,
        external_id,
        provider_path,
      })
      .returning();

    return {
      success: true,
      data: newProduct,
    };
  });
