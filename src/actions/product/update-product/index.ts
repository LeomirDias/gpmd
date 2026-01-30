"use server";

import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { products } from "@/db/schema";
import { actionClient } from "@/lib/next-safe-action";

const updateProductSchema = z.object({
  id: z.string().uuid("ID inválido"),
  name: z.string().min(1, "Nome é obrigatório").optional(),
  type: z.string().min(1, "Tipo é obrigatório").optional(),
  version: z.number().int().positive().optional(),
  external_id: z.string().min(1, "ID externo é obrigatório").optional(),
  provider_path: z
    .string()
    .min(1, "Caminho do provedor é obrigatório")
    .optional(),
});

export const updateProduct = actionClient
  .schema(updateProductSchema)
  .action(async ({ parsedInput }) => {
    const { id, ...updateData } = parsedInput;

    // Verifica se o produto existe
    const [existingProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!existingProduct) {
      return {
        success: false,
        error: "Produto não encontrado",
      };
    }

    // Prepara os dados para atualização
    const dataToUpdate: Partial<typeof existingProduct> = {
      updated_at: dayjs().toDate(),
    };

    if (updateData.name !== undefined) dataToUpdate.name = updateData.name;
    if (updateData.type !== undefined) dataToUpdate.type = updateData.type;
    if (updateData.version !== undefined)
      dataToUpdate.version = updateData.version;
    if (updateData.external_id !== undefined)
      dataToUpdate.external_id = updateData.external_id;
    if (updateData.provider_path !== undefined)
      dataToUpdate.provider_path = updateData.provider_path;

    // Atualiza o produto
    const [updatedProduct] = await db
      .update(products)
      .set(dataToUpdate)
      .where(eq(products.id, id))
      .returning();

    return {
      success: true,
      data: updatedProduct,
    };
  });
