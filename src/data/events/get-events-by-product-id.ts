import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { email_events } from "@/db/schema";

export const getEventsByProductId = async (productId: string) => {
  return await db
    .select()
    .from(email_events)
    .where(eq(email_events.product_id, productId))
    .orderBy(desc(email_events.created_at));
};
