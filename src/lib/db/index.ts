import "server-only";
import { createDatabaseClient } from "./create-client";

const databaseGlobal = globalThis as typeof globalThis & {
  database?: ReturnType<typeof createDatabaseClient>;
};

// Lazy initialization keeps public static pages independent of database availability.
export function getDatabase() {
  databaseGlobal.database ??= createDatabaseClient();
  return databaseGlobal.database;
}
