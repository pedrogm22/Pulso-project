import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const sampleRate = 44_100;
const bpm = 163;
const duration = 169.308;
const samples = Math.ceil(sampleRate * duration);
const beatLength = 60 / bpm;
const output = join(process.cwd(), "public", "audio", "paranoid-drumless.wav");
const audio = new Float32Array(samples);

function addDrum(start: number, length: number, sound: (time: number) => number) {
  const first = Math.floor(start * sampleRate);
  const last = Math.min(samples, first + Math.ceil(length * sampleRate));
  for (let index = first; index < last; index++) {
    const currentValue = audio[index] ?? 0;
    audio[index] = currentValue + sound((index - first) / sampleRate);
  }
}

function kick(time: number) {
  const envelope = Math.exp(-time * 22);
  const frequency = 125 - 75 * Math.min(time / 0.12, 1);
  return Math.sin(2 * Math.PI * frequency * time) * envelope * 0.75;
}

function snare(time: number) {
  const envelope = Math.exp(-time * 26);
  const noise = Math.sin(time * 19_127.3) * 0.7 + Math.sin(time * 7_913.1) * 0.3;
  return noise * envelope * 0.34 + Math.sin(2 * Math.PI * 190 * time) * Math.exp(-time * 30) * 0.18;
}

function hiHat(time: number) {
  const envelope = Math.exp(-time * 75);
  return (Math.sin(time * 17_341.7) * 0.6 + Math.sin(time * 13_119.2) * 0.4) * envelope * 0.11;
}

for (let beat = 0; beat < duration / beatLength; beat++) {
  const start = beat * beatLength;
  const position = beat % 4;
  addDrum(start, 0.22, kick);
  if (position === 1 || position === 3) addDrum(start, 0.16, snare);
  addDrum(start, 0.08, hiHat);
  addDrum(start + beatLength / 2, 0.08, hiHat);
  if (position === 3) addDrum(start + beatLength / 2, 0.08, hiHat);
}

let peak = 1;
for (const value of audio) peak = Math.max(peak, Math.abs(value));
const data = Buffer.alloc(samples * 2);
for (let index = 0; index < samples; index++) {
  const sample = audio[index] ?? 0;
  data.writeInt16LE(Math.max(-1, Math.min(1, sample / peak)) * 32_000, index * 2);
}

const header = Buffer.alloc(44);
header.write("RIFF", 0);
header.writeUInt32LE(36 + data.length, 4);
header.write("WAVE", 8);
header.write("fmt ", 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(1, 22);
header.writeUInt32LE(sampleRate, 24);
header.writeUInt32LE(sampleRate * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);
header.write("data", 36);
header.writeUInt32LE(data.length, 40);

await mkdir(join(process.cwd(), "public", "audio"), { recursive: true });
await writeFile(output, Buffer.concat([header, data]));
console.log(`Faixa de prática gerada: ${output}`);