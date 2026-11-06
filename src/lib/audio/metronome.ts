import type { TabDocument } from "@/domain/music/document";
import { timelineBeats } from "../../domain/music/transport";

export type MetronomeBeat = { time: number; accent: boolean };
type Sound = "click" | "drums";

/** Uses each measure's real duration, so the click also follows tempo changes. */
export function metronomeBeats(document: TabDocument): MetronomeBeat[] {
  return timelineBeats(document);
}

type MediaClock = Pick<HTMLAudioElement, "currentTime" | "playbackRate">;

export class Metronome {
  private readonly beats: MetronomeBeat[];
  private context: AudioContext | null = null;
  private output: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private scheduled = new Map<number, OscillatorNode>();
  private enabled = false;
  private sound: Sound = "click";
  private playing = false;
  private nextBeat = 0;
  private lastMediaTime = 0;

  constructor(private readonly media: MediaClock, document: TabDocument) {
    this.beats = metronomeBeats(document);
  }

  async setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) { this.stopScheduler(); return; }
    this.context ??= new AudioContext();
    this.output ??= this.createOutput(this.context);
    await this.context.resume();
    this.resync();
    if (this.playing) this.startScheduler();
  }

  setSound(sound: Sound) {
    this.sound = sound;
  }

  setPlaying(playing: boolean) {
    this.playing = playing;
    if (playing && this.enabled) { this.resync(); this.startScheduler(); }
    else this.stopScheduler();
  }

  resync() {
    this.cancelScheduled();
    const time = this.media.currentTime;
    this.lastMediaTime = time;
    this.nextBeat = this.lowerBound(Math.max(0, time - 0.015));
    if (this.playing && this.enabled) this.schedule();
  }

  dispose() {
    this.enabled = false;
    this.playing = false;
    this.stopScheduler();
    void this.context?.close();
    this.context = null;
    this.output = null;
  }

  private createOutput(context: AudioContext) {
    const output = context.createGain();
    output.gain.value = 0.32;
    output.connect(context.destination);
    return output;
  }

  private startScheduler() {
    if (this.timer) return;
    this.schedule();
    this.timer = setInterval(() => this.schedule(), 25);
  }

  private stopScheduler() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.cancelScheduled();
  }

  private schedule() {
    if (!this.context || !this.output || !this.enabled || !this.playing) return;
    const mediaTime = this.media.currentTime;
    const rate = Math.max(0.01, this.media.playbackRate);
    // A seek is much larger than normal clock progress between scheduler ticks.
    if (mediaTime < this.lastMediaTime - 0.03 || mediaTime - this.lastMediaTime > 0.2 * rate) {
      this.cancelScheduled();
      this.nextBeat = this.lowerBound(Math.max(0, mediaTime - 0.015));
    }
    this.lastMediaTime = mediaTime;
    const horizon = mediaTime + 0.12 * rate;
    while (this.nextBeat < this.beats.length && this.beats[this.nextBeat]!.time <= horizon) {
      const index = this.nextBeat++;
      const beat = this.beats[index]!;
      if (beat.time < mediaTime - 0.015) continue;
      this.playBeat(index, this.context.currentTime + Math.max(0, (beat.time - mediaTime) / rate), beat.accent);
    }
  }

  private playBeat(index: number, when: number, accent: boolean) {
    if (!this.context || !this.output) return;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    const beatInMeasure = index % 4;
    const drum = this.sound === "drums";
    oscillator.frequency.value = drum ? (beatInMeasure === 0 ? 130 : beatInMeasure === 2 ? 180 : 220) : accent ? 1450 : 950;
    if (drum && beatInMeasure === 0) oscillator.frequency.exponentialRampToValueAtTime(55, when + 0.12);
    envelope.gain.setValueAtTime(drum ? (beatInMeasure === 0 ? 0.8 : beatInMeasure === 2 ? 0.5 : 0.22) : accent ? 0.8 : 0.52, when);
    envelope.gain.exponentialRampToValueAtTime(0.001, when + (drum ? 0.14 : 0.035));
    oscillator.connect(envelope);
    envelope.connect(this.output);
    oscillator.start(when);
    oscillator.stop(when + (drum ? 0.15 : 0.04));
    this.scheduled.set(index, oscillator);
    oscillator.onended = () => {
      this.scheduled.delete(index);
      oscillator.disconnect();
      envelope.disconnect();
    };
  }

  private cancelScheduled() {
    for (const oscillator of this.scheduled.values()) {
      try { oscillator.stop(); } catch { /* it already ended */ }
      oscillator.disconnect();
    }
    this.scheduled.clear();
  }

  private lowerBound(time: number) {
    let low = 0;
    let high = this.beats.length;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if (this.beats[middle]!.time < time) low = middle + 1;
      else high = middle;
    }
    return low;
  }
}
