"use server";

import { z } from "zod";

import { db } from "@/db";
import { products } from "@/db/schema";
import { actionClient } from "@/lib/next-safe-action";

const createProductSchema = z.object({
  sale_product_id: z.string().min(1, "ID do produto no gateway é obrigatório"),
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.string().min(1, "Tipo é obrigatório").optional(),
  version: z.number().int().positive().optional(),
  storage_provider: z
    .string()
    .min(1, "Provedor de armazenamento é obrigatório"),
  provider_path: z.string().min(1, "Caminho do provedor é obrigatório"),
});

export const createProduct = actionClient
  .schema(createProductSchema)
  .action(async ({ parsedInput }) => {
    const {
      sale_product_id,
      name,
      type = "ebook",
      version = 1,
      storage_provider,
      provider_path,
    } = parsedInput;

    const [newProduct] = await db
      .insert(products)
      .values({
        sale_product_id,
        name,
        type,
        version,
        storage_provider,
        provider_path,
      })
      .returning();

    return {
      success: true,
      data: newProduct,
    };
  });
