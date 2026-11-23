import math
import struct
import wave

SAMPLE_RATE = 22050
DURATION = 30
CHUNK_SECONDS = 1
CHORDS = [
    (146.83, 174.61, 220.00),  # D minor
    (116.54, 146.83, 174.61),  # Bb
    (174.61, 220.00, 261.63),  # F
    (130.81, 164.81, 196.00),  # C
]

with wave.open("public/soundtrack.wav", "wb") as out:
    out.setnchannels(2)
    out.setsampwidth(2)
    out.setframerate(SAMPLE_RATE)
    for start in range(0, DURATION, CHUNK_SECONDS):
        frames = bytearray()
        end = min((start + CHUNK_SECONDS) * SAMPLE_RATE, DURATION * SAMPLE_RATE)
        for i in range(start * SAMPLE_RATE, end):
            t = i / SAMPLE_RATE
            chord = CHORDS[int(t // 7.5) % len(CHORDS)]
            fade_in = min(1.0, t / 2.0)
            fade_out = min(1.0, (DURATION - t) / 3.0)
            envelope = max(0.0, min(fade_in, fade_out))
            slow_pulse = 0.72 + 0.28 * math.sin(2 * math.pi * 0.075 * t)
            sample = sum(math.sin(2 * math.pi * f * t) for f in chord) / 3
            shimmer = 0.22 * math.sin(2 * math.pi * (chord[1] * 2) * t)
            value = int(32767 * 0.12 * envelope * slow_pulse * (0.78 * sample + shimmer))
            frames.extend(struct.pack("<hh", value, value))
        out.writeframes(frames)
