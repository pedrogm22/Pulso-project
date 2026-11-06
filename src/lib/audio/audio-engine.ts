export type AudioMedia = {
  play(): Promise<void> | void;
  pause(): void;
  currentTime: number;
  duration: number;
  playbackRate: number;
};

export class AudioEngine {
  constructor(private readonly audio: AudioMedia) {}
  play() { return this.audio.play(); }
  pause() { this.audio.pause(); }
  seek(time: number) {
    // Media clocks quantize to microseconds. Round upward so a fractional bar
    // boundary (e.g. 90 BPM) cannot land in the preceding measure after seeking.
    const target = Math.ceil(time * 1_000_000) / 1_000_000;
    this.audio.currentTime = Math.max(0, Math.min(target, this.audio.duration || target));
  }
  setPlaybackRate(rate: number) { this.audio.playbackRate = rate; }
  getCurrentTime() { return this.audio.currentTime; }
}
