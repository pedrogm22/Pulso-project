import type { TabDocument } from "@/domain/music/document";
import type { PracticeStem } from "@/domain/music/content";
import { timelineBeats, transportTime, type LoopRegion } from "@/domain/music/transport";

type Track = { buffer: AudioBuffer; gain: GainNode; volume: number };

/** One AudioContext clock and sample-aligned sources for all stems and clicks. */
export class PracticeEngine {
  private context: AudioContext;
  private master: GainNode;
  private clickGain: GainNode;
  private tracks = new Map<string, Track>();
  private sources: AudioBufferSourceNode[] = [];
  private clicks = new Set<OscillatorNode>();
  private offset = 0;
  private startedAt = 0;
  private rate = 1;
  private playing = false;
  private metronome = false;
  private scheduledUntil = 0;
  private loop: LoopRegion | null = null;
  private timer: ReturnType<typeof setInterval>;
  private abort = new AbortController();
  private disposed = false;
  private beats: ReturnType<typeof timelineBeats>;

  constructor(private readonly duration: number, document: TabDocument, private readonly onEnd: () => void) {
    this.context = new AudioContext();
    this.master = this.context.createGain(); this.master.connect(this.context.destination);
    this.clickGain = this.context.createGain(); this.clickGain.gain.value = 0.25; this.clickGain.connect(this.context.destination);
    this.beats = timelineBeats(document);
    this.timer = setInterval(() => this.schedule(), 25);
  }
  async load(stems: PracticeStem[]) {
    await Promise.all(stems.map(async (stem) => {
      const response = await fetch(stem.url, { signal: this.abort.signal });
      if (!response.ok) throw new Error("AudioUnavailable");
      const buffer = await this.context.decodeAudioData(await response.arrayBuffer());
      if (this.disposed) return;
      if (Math.abs(buffer.duration - this.duration) > 0.02) throw new Error("StemDurationMismatch");
      const gain = this.context.createGain();
      const volume = stem.instrument === "DRUMS" ? 0 : 1;
      gain.gain.value = volume; gain.connect(this.master);
      this.tracks.set(stem.id, { buffer, gain, volume });
    }));
  }
  async play() {
    if (this.playing || !this.tracks.size || this.disposed) return;
    await this.context.resume();
    if (this.disposed) return;
    if (this.offset >= this.duration) this.offset = 0;
    this.start();
  }
  private start() {
    this.startedAt = this.context.currentTime + 0.025;
    this.scheduledUntil = this.startedAt;
    for (const track of this.tracks.values()) {
      const source = this.context.createBufferSource(); source.buffer = track.buffer;
      source.playbackRate.value = this.rate;
      source.connect(track.gain);
      if (this.loop) { source.loop = true; source.loopStart = this.loop.start; source.loopEnd = this.loop.end; }
      source.start(this.startedAt, this.offset); this.sources.push(source);
    }
    this.playing = true;
    this.schedule();
  }
  getCurrentTime() { return this.playing ? transportTime(this.offset, this.context.currentTime - this.startedAt, this.rate, this.duration, this.loop) : this.offset; }
  private stopSources() {
    for (const source of this.sources) { source.stop(); source.disconnect(); }
    this.sources = [];
    for (const click of this.clicks) { try { click.stop(); } catch { /* already ended */ } click.disconnect(); }
    this.clicks.clear();
  }
  pause() { this.offset = this.getCurrentTime(); this.playing = false; this.stopSources(); }
  seek(time: number) {
    const wasPlaying = this.playing; this.pause();
    this.offset = Math.min(this.duration, Math.max(0, time));
    if (this.loop && (this.offset < this.loop.start || this.offset >= this.loop.end)) this.offset = this.loop.start;
    if (wasPlaying) this.start();
  }
  setRate(rate: number) { const time = this.getCurrentTime(); this.rate = Math.min(1, Math.max(0.5, rate)); this.seek(time); }
  setMasterVolume(volume: number) { this.master.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)), this.context.currentTime, 0.01); }
  setStemVolume(id: string, volume: number) { const track = this.tracks.get(id); if (track) { track.volume = volume; track.gain.gain.setTargetAtTime(volume, this.context.currentTime, 0.01); } }
  setMetronome(enabled: boolean) { this.metronome = enabled; this.seek(this.getCurrentTime()); }
  setClickVolume(volume: number) { this.clickGain.gain.setTargetAtTime(volume, this.context.currentTime, 0.01); }
  setLoop(loop: LoopRegion | null) {
    if (loop && (!(loop.end > loop.start) || loop.start < 0 || loop.end > this.duration)) throw new Error("InvalidLoop");
    const time = this.getCurrentTime(); this.pause(); this.loop = loop;
    this.offset = loop ? loop.start : time;
  }
  private schedule() {
    if (!this.playing || this.context.state !== "running") return;
    const now = this.context.currentTime;
    if (!this.loop && this.getCurrentTime() >= this.duration) { this.pause(); this.onEnd(); return; }
    const from = Math.max(this.scheduledUntil, now);
    const until = now + 0.12;
    if (this.metronome) {
      // Project each timeline beat into the master clock, including future loop cycles.
      for (const beat of this.beats) {
        if (this.loop && (beat.time < this.loop.start || beat.time >= this.loop.end)) continue;
        const base = this.startedAt + (beat.time - this.offset) / this.rate;
        const period = this.loop ? (this.loop.end - this.loop.start) / this.rate : 0;
        let when = base;
        if (period && when < from) when += Math.ceil((from - when) / period) * period;
        if (when >= from && when < until) this.click(when, beat.accent);
      }
    }
    this.scheduledUntil = until;
  }
  private click(when: number, accent: boolean) {
    const oscillator = this.context.createOscillator(); const envelope = this.context.createGain();
    oscillator.frequency.value = accent ? 1400 : 950;
    envelope.gain.setValueAtTime(0.7, when); envelope.gain.exponentialRampToValueAtTime(0.001, when + 0.035);
    oscillator.connect(envelope); envelope.connect(this.clickGain);
    oscillator.start(when); oscillator.stop(when + 0.04);
    this.clicks.add(oscillator);
    oscillator.onended = () => { this.clicks.delete(oscillator); oscillator.disconnect(); envelope.disconnect(); };
  }
  dispose() { this.disposed = true; this.abort.abort(); clearInterval(this.timer); this.pause(); void this.context.close(); }
}
