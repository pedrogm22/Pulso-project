import "dotenv/config";
import { createDatabaseClient } from "../src/lib/db/create-client";
import { syncParanoidTab } from "../prisma/sync-paranoid";

const database = createDatabaseClient();
try {
  const document = await syncParanoidTab(database);
  console.log(`Paranoid atualizada: ${document.sections.length} seções, ${document.sections.flatMap((section) => section.measures).length} compassos.`);
} finally {
  await database.$disconnect();
}
