import { asc, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { products } from "@/db/schema";

interface GetProductsParams {
  orderBy?: "created_at" | "updated_at" | "name";
  orderDirection?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export const getProducts = async (params?: GetProductsParams) => {
  const {
    orderBy = "created_at",
    orderDirection = "desc",
    limit,
    offset,
  } = params || {};

  // Determina a ordenação
  let orderByClause;
  if (orderBy === "created_at") {
    orderByClause =
      orderDirection === "desc"
        ? desc(products.created_at)
        : asc(products.created_at);
  } else if (orderBy === "updated_at") {
    orderByClause =
      orderDirection === "desc"
        ? desc(products.updated_at)
        : asc(products.updated_at);
  } else {
    orderByClause =
      orderDirection === "desc" ? desc(products.name) : asc(products.name);
  }

  // Constrói a query
  const baseQuery = db.select().from(products).orderBy(orderByClause);

  // Aplica limit e offset de forma que o TypeScript entenda
  if (limit !== undefined && offset !== undefined) {
    return await baseQuery.limit(limit).offset(offset);
  }
  if (limit !== undefined) {
    return await baseQuery.limit(limit);
  }
  if (offset !== undefined) {
    return await baseQuery.offset(offset);
  }

  return await baseQuery;
};

export const getProductById = async (id: string) => {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  return product || null;
};

export const getProductBySaleProductId = async (saleProductId: string) => {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.sale_product_id, saleProductId))
    .limit(1);

  return product || null;
};
