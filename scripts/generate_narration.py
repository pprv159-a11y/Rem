#!/usr/bin/env python3
"""Generate five natural-sounding Russian narration tracks using Edge TTS only.

The workflow deliberately fails instead of silently substituting a robotic offline voice.
"""
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "public" / "narration"
OUTPUT_DIR = ROOT / "public" / "audio"
VOICE = "ru-RU-DmitryNeural"
RATE = "-3%"
PITCH = "-2Hz"
EXPECTED_PARTS = range(1, 6)


def run(command: list[str], *, timeout: int = 180) -> None:
    print("+", " ".join(command), flush=True)
    subprocess.run(command, check=True, timeout=timeout)


def duration(path: Path) -> float:
    ffprobe = shutil.which("ffprobe")
    if not ffprobe:
        raise RuntimeError("ffprobe is required (install ffmpeg).")
    result = subprocess.run(
        [ffprobe, "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        check=True, capture_output=True, text=True,
    )
    return float(result.stdout.strip())


def main() -> int:
    edge_tts = shutil.which("edge-tts")
    if not edge_tts:
        raise RuntimeError("edge-tts executable is missing; refusing low-quality fallback.")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for part in EXPECTED_PARTS:
        source = SOURCE_DIR / f"part-{part}.txt"
        output = OUTPUT_DIR / f"part-{part}.mp3"
        if not source.is_file():
            raise FileNotFoundError(f"Missing narration source: {source}")
        text = source.read_text(encoding="utf-8").strip()
        if len(text.split()) < 85:
            raise ValueError(f"Part {part} narration is too short (<85 words).")
        output.unlink(missing_ok=True)
        command = [
            edge_tts, "--voice", VOICE, f"--rate={RATE}", f"--pitch={PITCH}",
            "--text", text, "--write-media", str(output),
        ]
        last_error: Exception | None = None
        for attempt in range(1, 4):
            try:
                print(f"Generating part {part}/5, attempt {attempt}/3, voice={VOICE}")
                run(command, timeout=180)
                if output.is_file() and output.stat().st_size > 8_000:
                    seconds = duration(output)
                    if 35 <= seconds <= 65:
                        print(f"Part {part}: {seconds:.2f}s, {output.stat().st_size} bytes")
                        last_error = None
                        break
                    last_error = RuntimeError(
                        f"Part {part} narration duration is {seconds:.2f}s; expected 35–65s."
                    )
                else:
                    last_error = RuntimeError(f"Part {part} audio file is missing or too small.")
            except (subprocess.SubprocessError, OSError, ValueError) as exc:
                last_error = exc
            output.unlink(missing_ok=True)
        if last_error is not None:
            raise RuntimeError(f"Natural TTS generation failed for part {part}: {last_error}")
    print("All five Russian narration tracks passed audio validation.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"NARRATION ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
