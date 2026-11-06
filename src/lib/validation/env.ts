import { z } from "zod";

const databaseEnvironmentSchema = z.object({
  DATABASE_URL: z.url().refine((url) => /^postgres(ql)?:\/\//.test(url), "Use uma URL PostgreSQL direta."),
});

export function readDatabaseEnvironment(environment: Record<string, string | undefined> = process.env) {
  const result = databaseEnvironmentSchema.safeParse(environment);
  if (!result.success) {
    // Do not include the input: connection strings can contain credentials.
    throw new Error("DATABASE_URL ausente ou inválida. Consulte .env.example.");
  }
  return result.data;
}
