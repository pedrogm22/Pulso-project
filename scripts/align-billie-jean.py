"""Rebuild beat boundaries for the supplied recording (Python + numpy + ffmpeg).

Spectral-flux peaks are tracked near 117 BPM, allowing gradual tempo changes.
This aligns the manually transcribed score; it does not infer drum notes.
"""
import hashlib
import json
import pathlib
import subprocess
import numpy as np

root = pathlib.Path(__file__).resolve().parent.parent
source = root / "michael-jackson-billie-jean.mp3"
raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", str(source), "-ar", "22050", "-ac", "1", "-f", "f32le", "-"])
samples = np.frombuffer(raw, dtype="<f4")
rate, hop, window = 22050, 128, 1024
frames = np.lib.stride_tricks.sliding_window_view(samples, window)[::hop]
spectrum = abs(np.fft.rfft(frames * np.hanning(window), axis=1))
flux = np.maximum(np.diff(np.log1p(100 * spectrum), axis=0), 0).mean(axis=1)
times = (np.arange(len(flux)) * hop + window / 2) / rate
beats, period = [0.128], 60 / 117
extrapolated = []
for index in range(1, 576):
    expected = beats[-1] + period
    candidates = np.where(abs(times - expected) < 0.055)[0]
    if len(candidates):
        score = flux[candidates] - 0.6 * ((times[candidates] - expected) / 0.055) ** 2
        best = candidates[score.argmax()]
        detected = float(times[best]) if flux[best] > 0.025 else expected
    else:
        detected = expected
    if detected == expected:
        extrapolated.append(index)
    beats.append(detected)
    period = 0.95 * period + 0.05 * (beats[-1] - beats[-2])
# Spectral peak centers lag the attack by roughly one analysis hop.
beats = [round(max(0, beat - hop / rate), 6) for beat in beats]
# The source ends with a three-beat partial bar, during the recording fade.
beats[-1] = round(min(beats[-1], len(samples) / rate), 6)
output = {
    "audioSha256": hashlib.sha256(source.read_bytes()).hexdigest(),
    "method": "Spectral flux, 1024-sample window, 128-sample hop; local beat tracking near 117 BPM",
    "extrapolatedBeatIndices": extrapolated,
    "beatTimes": beats,
}
(root / "prisma/tabs/billie-jean-timing.json").write_text(json.dumps(output, indent=2) + "\n", encoding="utf8")
print(f"{len(beats)-1} beats; {len(extrapolated)} boundaries extrapolated in the fade; end {beats[-1]:.3f}s")
