import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { events } from "@/db/schema";

export const getEventsByProductId = async (productId: string) => {
  return await db
    .select()
    .from(events)
    .where(eq(events.product_id, productId))
    .orderBy(desc(events.created_at));
};
