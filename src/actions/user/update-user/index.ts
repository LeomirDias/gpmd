"use server";

import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { actionClient } from "@/lib/next-safe-action";

const updateUserSchema = z.object({
  id: z.string().min(1, "ID é obrigatório"),
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
});

export const updateUser = actionClient
  .schema(updateUserSchema)
  .action(async ({ parsedInput }) => {
    const { id, name, email } = parsedInput;

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

    // Verifica se o email já está em uso por outro usuário
    if (email !== existingUser.email) {
      const [userWithEmail] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1);

      if (userWithEmail) {
        return {
          success: false,
          error: "Email já está em uso",
        };
      }
    }

    // Atualiza o usuário
    const [updatedUser] = await db
      .update(usersTable)
      .set({
        name,
        email,
        updatedAt: dayjs().toDate(),
      })
      .where(eq(usersTable.id, id))
      .returning();

    return {
      success: true,
      data: updatedUser,
    };
  });
