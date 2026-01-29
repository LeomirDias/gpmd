import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { customSession } from "better-auth/plugins";
import { Resend } from "resend";

import ForgotPasswordEmail from "@/components/emails/reset-password";
import { db } from "@/db";
import * as schema from "@/db/schema";

const resend = new Resend(process.env.RESEND_API_KEY as string);

export const auth = betterAuth({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  basePath: "/api/auth",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      users: schema.usersTable,
      sessions: schema.sessionsTable,
      accounts: schema.accountsTable,
      verifications: schema.verificationsTable,
    },
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [
    customSession(async ({ user, session }) => {
      return {
        user: {
          ...user,
        },
        session,
      };
    }),
  ],
  user: {
    modelName: "users",
  },
  session: {
    modelName: "sessions",
  },
  account: {
    modelName: "accounts",
  },
  verification: {
    modelName: "verifications",
  },
  emailAndPassword: {
    enabled: true,
    resetPasswordTokenExpiresIn: 3600, // 1 hora
    revokeOtherSessions: true,
    sendResetPassword: async ({ user, url }) => {
      resend.emails.send({
        from: `${process.env.NAME_FOR_ACCOUNT_MANAGEMENT_SUBMISSIONE} <${process.env.EMAIL_FOR_ACCOUNT_MANAGEMENT_SUBMISSION}>`,
        to: user.email,
        subject: "Redefina sua senha - iGenda App",
        react: ForgotPasswordEmail({
          username: user.name,
          resetUrl: url,
          userEmail: user.email,
        }),
      });
    },
  },
});
