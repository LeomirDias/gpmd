"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { actionClient } from "@/lib/next-safe-action";

const deleteUserSchema = z.object({
  id: z.string().min(1, "ID é obrigatório"),
});

export const deleteUser = actionClient
  .schema(deleteUserSchema)
  .action(async ({ parsedInput }) => {
    const { id } = parsedInput;

    // Verifica se o usuário existe
    const [existingUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);

    if (!existingUser) {
      return {
        success: false,
        error: "Usuário não encontrado",
      };
    }

    // Deleta o usuário (cascade vai deletar sessões e contas relacionadas)
    await db.delete(usersTable).where(eq(usersTable.id, id));

    return {
      success: true,
      message: "Usuário deletado com sucesso",
    };
  });
