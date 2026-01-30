import dayjs from "dayjs";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

//Schema de usuários
export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => dayjs().toDate()),
});

//Schema de sessões
export const sessionsTable = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
});

//Schema de contas
export const accountsTable = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => dayjs().toDate()),
});

//Schema de verificações
export const verificationsTable = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => dayjs().toDate()),
});

export const products = pgTable("products", {
  //Cadastrar via CRUD
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: text("type").notNull().default("ebook"),
  version: integer("version").notNull().default(1),
  external_id: uuid("external_id").notNull(),
  provider_path: text("provider_path").notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Lead captures (capturas de lead)
export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  landing_source: text("landing_source").notNull(),
  name: text("name").notNull(),
  email: text("email").unique(),
  phone: text("phone").unique(),
  contact_type: text("contact_type").notNull().default("email"),
  user_type: text("user_type").notNull().default("hobby"),
  consent_marketing: boolean("consent_marketing").notNull().default(true),
  conversion_status: text("conversion_status")
    .notNull()
    .default("not_converted"), //Alterar na venda
  remarketing_status: text("remarketing_status")
    .notNull()
    .default("not_sent_remarketing"),
  product_id: uuid("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const ordersTable = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  order_id: text("order_id").notNull(),
  order_date: timestamp("order_date", { withTimezone: true }).notNull(),
  order_type: text("order_type").notNull().default("sale"),
  total_amount: integer("total_amount").notNull(),
  status: text("status").notNull().default("pending"),
  products: jsonb("products").notNull().default([]),
  lead_id: uuid("lead_id").references(() => leads.id, {
    onDelete: "set null",
  }),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

//Eventos
export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull().default("email_delivery"),
  category: text("category").notNull().default("sale"), //sale, remarketing, upsell
  to: text("to").notNull(),
  subject: text("subject").notNull(),
  product_id: uuid("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  sent_at: timestamp("sent_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
