import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { leads } from "@/db/schema";

export const getLeadsByProductId = async (productId: string) => {
  return await db
    .select()
    .from(leads)
    .where(eq(leads.product_id, productId))
    .orderBy(desc(leads.created_at));
};
