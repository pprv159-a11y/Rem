#!/usr/bin/env python3
"""Create a 5-minute original stereo ambient soundtrack without external assets."""

from __future__ import annotations

import math
import struct
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PATH = ROOT / "public" / "soundtrack.wav"

SAMPLE_RATE = 22050
DURATION_SECONDS = 300
CHUNK_SECONDS = 1
CHANNELS = 2
SAMPLE_WIDTH_BYTES = 2

CHORDS = [
    (146.83, 174.61, 220.00),  # D minor
    (116.54, 146.83, 174.61),  # Bb
    (174.61, 220.00, 261.63),  # F
    (130.81, 164.81, 196.00),  # C
]


def main() -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    total_frames = DURATION_SECONDS * SAMPLE_RATE

    with wave.open(str(OUTPUT_PATH), "wb") as output:
        output.setnchannels(CHANNELS)
        output.setsampwidth(SAMPLE_WIDTH_BYTES)
        output.setframerate(SAMPLE_RATE)

        for start in range(0, DURATION_SECONDS, CHUNK_SECONDS):
            frames = bytearray()
            first_frame = start * SAMPLE_RATE
            last_frame = min((start + CHUNK_SECONDS) * SAMPLE_RATE, total_frames)

            for sample_index in range(first_frame, last_frame):
                time_seconds = sample_index / SAMPLE_RATE
                chord = CHORDS[int(time_seconds // 15) % len(CHORDS)]
                fade_in = min(1.0, time_seconds / 5.0)
                fade_out = min(1.0, (DURATION_SECONDS - time_seconds) / 8.0)
                envelope = max(0.0, min(fade_in, fade_out))
                slow_pulse = 0.72 + 0.28 * math.sin(2 * math.pi * 0.075 * time_seconds)
                pad = sum(
                    math.sin(2 * math.pi * frequency * time_seconds)
                    for frequency in chord
                ) / 3
                shimmer = 0.22 * math.sin(2 * math.pi * chord[1] * 2 * time_seconds)
                value = int(
                    32767 * 0.12 * envelope * slow_pulse * (0.78 * pad + shimmer)
                )
                frames.extend(struct.pack("<hh", value, value))

            output.writeframes(frames)

    print(
        f"Created {OUTPUT_PATH} ({OUTPUT_PATH.stat().st_size} bytes, "
        f"{DURATION_SECONDS}s, {SAMPLE_RATE} Hz, stereo)."
    )


if __name__ == "__main__":
    main()
