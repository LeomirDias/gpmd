"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { products } from "@/db/schema";
import { actionClient } from "@/lib/next-safe-action";

const deleteProductSchema = z.object({
  id: z.string().uuid("ID inválido"),
});

export const deleteProduct = actionClient
  .schema(deleteProductSchema)
  .action(async ({ parsedInput }) => {
    const { id } = parsedInput;

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

    // Deleta o produto (onDelete: "set null" nas foreign keys vai manter os registros relacionados)
    await db.delete(products).where(eq(products.id, id));

    return {
      success: true,
      message: "Produto deletado com sucesso",
    };
  });
