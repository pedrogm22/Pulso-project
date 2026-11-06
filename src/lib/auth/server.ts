import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { getDatabase } from "@/lib/db";

let instance: ReturnType<typeof betterAuth>;
export function getAuth() {
  const configuredSecret = process.env.BETTER_AUTH_SECRET;
  if (process.env.NODE_ENV === "production" && !configuredSecret) {
    throw new Error("Configure BETTER_AUTH_SECRET antes de iniciar em produção.");
  }
  const secret = configuredSecret ?? "pulso-dev-secret-key-please-change";
  if (secret.length < 32) throw new Error("Configure BETTER_AUTH_SECRET com pelo menos 32 caracteres aleatórios.");

  if (!instance) {
    const socialProviders = {} as Record<string, unknown>;
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      Object.assign(socialProviders, {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          redirectURI: `${process.env.BETTER_AUTH_URL ?? process.env.SITE_URL ?? "http://localhost:3000"}/api/auth/callback/google`,
        },
      });
    }

    const config: Parameters<typeof betterAuth>[0] = {
      secret,
      baseURL: process.env.BETTER_AUTH_URL ?? process.env.SITE_URL ?? "http://localhost:3000",
      database: prismaAdapter(getDatabase(), { provider: "postgresql" }),
      socialProviders,
      emailAndPassword: { enabled: true, minPasswordLength: 10, maxPasswordLength: 128 },
      rateLimit: { enabled: true, storage: "database", window: 60, max: 30 },
    };
    instance = betterAuth(config);
  }

  return instance;
}
