import { eq, or } from "drizzle-orm";

import { db } from "@/db";
import { leads } from "@/db/schema";

export const getLeadByEmailOrPhone = async (
  email?: string | null,
  phone?: string | null,
) => {
  if (!email && !phone) {
    return null;
  }

  const conditions = [];
  if (email) {
    conditions.push(eq(leads.email, email));
  }
  if (phone) {
    conditions.push(eq(leads.phone, phone));
  }

  const [lead] = await db
    .select()
    .from(leads)
    .where(or(...conditions))
    .limit(1);

  return lead || null;
};
