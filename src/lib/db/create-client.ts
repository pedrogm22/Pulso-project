import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import { readDatabaseEnvironment } from "../validation/env";

export function createDatabaseClient() {
  const { DATABASE_URL } = readDatabaseEnvironment();
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: DATABASE_URL }) });
}
