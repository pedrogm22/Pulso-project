import { copyFileSync, mkdirSync, readdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { extname, join } from "node:path";
import { allCatalogEntries, slugify } from "../src/features/songs/catalog-data";

const sourceDir = join(process.cwd(), "tabulaturas");
const targetDir = join(process.cwd(), "public", "tabs");
const outputFile = join(process.cwd(), "src", "features", "songs", "tab-images.ts");
const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg", ".txt"]);

const compact = (value: string) => value.replace(/-/g, "");

const entries = allCatalogEntries.map((entry) => ({
  key: `${slugify(entry.artist)}/${slugify(entry.title)}`,
  songSlug: slugify(entry.title),
  titleSlug: slugify(entry.title.replace(/\s*\(.*\)\s*/g, " ")),
  artistSlug: slugify(entry.artist),
}));

if (existsSync(targetDir)) rmSync(targetDir, { recursive: true });
mkdirSync(targetDir, { recursive: true });

const result: Record<string, string> = {};
const unmatched: string[] = [];
const duplicates: string[] = [];

for (const file of readdirSync(sourceDir)) {
  const extension = extname(file).toLowerCase();
  if (!imageExtensions.has(extension)) continue;
  const fileSlug = slugify(file.slice(0, -extension.length));

  const candidates = entries
    .filter((entry) => compact(fileSlug).includes(compact(entry.titleSlug)))
    .sort((first, second) => {
      const artistScore = Number(fileSlug.includes(second.artistSlug)) - Number(fileSlug.includes(first.artistSlug));
      return artistScore || second.titleSlug.length - first.titleSlug.length;
    });
  const match = candidates[0];
  if (!match) {
    unmatched.push(file);
    continue;
  }

  const publicName = `${match.songSlug}${extension}`;
  copyFileSync(join(sourceDir, file), join(targetDir, publicName));
  if (result[match.key]) duplicates.push(`${file} (substitui ${result[match.key]})`);
  result[match.key] = `/tabs/${publicName}`;
}

const body = Object.entries(result)
  .sort(([first], [second]) => first.localeCompare(second))
  .map(([key, value]) => `  "${key}": "${value}",`)
  .join("\n");

writeFileSync(outputFile, `// Gerado por scripts/sync-tab-images.ts (npm run tabs:sync). Não edite à mão.\nexport const tabImagesBySong: Record<string, string> = {\n${body}\n};\n`);

console.log(`${Object.keys(result).length} tabs ligadas às músicas.`);
if (duplicates.length) console.log(`Arquivos duplicados para a mesma música (vale o último):\n- ${duplicates.join("\n- ")}`);
if (unmatched.length) console.log(`Sem música correspondente no catálogo:\n- ${unmatched.join("\n- ")}`);
