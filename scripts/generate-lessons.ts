import { mkdir, writeFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { lessons } from "../prisma/learning-content";

const output = join(process.cwd(), "public", "lessons");
await mkdir(output, { recursive: true });
const temporary = await mkdtemp(join(tmpdir(), "pulso-lessons-"));
try {
  for (const lesson of lessons) {
    const filters: string[] = ["drawbox=x=60:y=45:w=80:h=8:color=0xdafb83:t=fill"];
    const captions: string[] = ["WEBVTT\n"];
    for (let index = 0; index < lesson.cards.length; index++) {
      await writeFile(join(temporary, `card-${index}.txt`), lesson.cards[index]!);
      filters.push(`drawtext=font='Arial':textfile=card-${index}.txt:fontcolor=0xf0f1e8:fontsize=26:x=60:y=110:enable='between(t,${index * 8},${index * 8 + 7.99})'`);
      captions.push(`${index + 1}\n00:00:${String(index * 8).padStart(2, "0")}.000 --> 00:00:${String(index * 8 + 8).padStart(2, "0")}.000\n${lesson.cards[index]}\n`);
    }
    for (let beat = 0; beat < 4; beat++) {
      filters.push(`drawbox=x=${180 + beat * 170}:y=230:w=110:h=100:color=0x333a31:t=fill`);
      filters.push(`drawbox=x=${180 + beat * 170}:y=230:w=110:h=100:color=0xdafb83:t=fill:enable='eq(mod(floor(t*2),4),${beat})'`);
      filters.push(`drawtext=font='Arial':text='${beat + 1}':fontcolor=0x101312:fontsize=52:x=${218 + beat * 170}:y=250`);
    }
    await writeFile(join(temporary, "footer.txt"), "PULSO / 120 BPM / Video original - conte e pratique junto");
    filters.push("drawtext=font='Arial':textfile=footer.txt:fontcolor=0xafb5aa:fontsize=19:x=60:y=430");
    const result = spawnSync("ffmpeg", ["-y", "-f", "lavfi", "-i", "color=c=0x101312:s=960x540:r=24:d=32", "-f", "lavfi", "-i", "aevalsrc=0.15*sin(2*PI*900*t)*exp(-80*mod(t\\,0.5)):s=22050:d=32", "-vf", filters.join(","), "-c:v", "libx264", "-preset", "fast", "-pix_fmt", "yuv420p", "-c:a", "aac", "-movflags", "+faststart", "-shortest", join(output, `${lesson.slug}.mp4`)], { cwd: temporary, encoding: "utf8", windowsHide: true });
    if (result.status !== 0) throw new Error(`FFmpeg falhou. ${result.stderr.slice(-1500)}`);
    await writeFile(join(output, `${lesson.slug}.vtt`), captions.join("\n"));
    console.log(`Video gerado: ${lesson.slug}`);
  }
} finally {
  // Exact directory returned by mkdtemp, inside the OS temp folder.
  await rm(temporary, { recursive: true, force: true });
}
