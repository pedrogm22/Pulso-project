import { NextResponse } from "next/server";
import { z } from "zod";
import { getDatabase } from "@/lib/db";
import { recordDailySongPlay } from "@/features/songs/daily-plays";

const playSchema = z.object({
  artistSlug: z.string().regex(/^[a-z0-9-]+$/).max(120),
  songSlug: z.string().regex(/^[a-z0-9-]+$/).max(120),
});

const SONG_WINDOW_MS = 60_000;
const IP_WINDOW_MS = 60 * 60_000;
const IP_MAX_PER_WINDOW = 60;

// Mesma música só conta uma vez por minuto por IP, e cada IP tem teto por hora.
async function allowPlay(ip: string, songSlug: string) {
  const now = Date.now();
  const prisma = getDatabase();
  const songKey = `daily-play:song:${ip}:${songSlug}`;
  const ipKey = `daily-play:ip:${ip}`;

  const [songEntry, ipEntry] = await Promise.all([
    prisma.rateLimit.findUnique({ where: { key: songKey } }),
    prisma.rateLimit.findUnique({ where: { key: ipKey } }),
  ]);

  if (songEntry && now - Number(songEntry.lastRequest) < SONG_WINDOW_MS) return false;

  const ipWindowActive = ipEntry && now - Number(ipEntry.lastRequest) < IP_WINDOW_MS;
  if (ipWindowActive && ipEntry.count >= IP_MAX_PER_WINDOW) return false;

  await prisma.rateLimit.upsert({
    where: { key: songKey },
    create: { key: songKey, count: 1, lastRequest: BigInt(now) },
    update: { count: 1, lastRequest: BigInt(now) },
  });
  await prisma.rateLimit.upsert({
    where: { key: ipKey },
    create: { key: ipKey, count: 1, lastRequest: BigInt(now) },
    update: ipWindowActive ? { count: { increment: 1 } } : { count: 1, lastRequest: BigInt(now) },
  });
  return true;
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 });
  }

  const parsed = playSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Música inválida." }, { status: 400 });

  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!(await allowPlay(ip, parsed.data.songSlug))) {
      return NextResponse.json({ recorded: false }, { status: 429 });
    }
    const recorded = await recordDailySongPlay(parsed.data.artistSlug, parsed.data.songSlug);
    if (!recorded) return NextResponse.json({ error: "Música não encontrada." }, { status: 404 });
    return NextResponse.json({ recorded: true });
  } catch (error) {
    console.error("Não foi possível registrar a reprodução da música.", error);
    return NextResponse.json({ error: "Não foi possível registrar a reprodução." }, { status: 500 });
  }
}
