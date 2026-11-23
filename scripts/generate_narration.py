#!/usr/bin/env python3
"""Generate five Russian narration tracks with the neural Piper voice Denis."""
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "public" / "narration"
OUTPUT_DIR = ROOT / "public" / "audio"
MODEL_DIR = ROOT / "models"
VOICE = "ru_RU-denis-medium"
PARTS = range(1, 6)


def run(command: list[str], *, input_text: str | None = None, timeout: int = 240) -> None:
    print("+", " ".join(command), flush=True)
    subprocess.run(command, input=input_text, text=True, check=True, timeout=timeout)


def duration(path: Path) -> float:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        check=True, capture_output=True, text=True,
    )
    return float(result.stdout.strip())


def main() -> int:
    if not shutil.which("ffmpeg") or not shutil.which("ffprobe"):
        raise RuntimeError("FFmpeg and ffprobe are required.")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    model = MODEL_DIR / f"{VOICE}.onnx"
    config = MODEL_DIR / f"{VOICE}.onnx.json"
    if not model.is_file() or not config.is_file():
        run([sys.executable, "-m", "piper.download_voices", VOICE, "--data-dir", str(MODEL_DIR)], timeout=300)

    for part in PARTS:
        source = SOURCE_DIR / f"part-{part}.txt"
        wav = OUTPUT_DIR / f"part-{part}.wav"
        mp3 = OUTPUT_DIR / f"part-{part}.mp3"
        if not source.is_file():
            raise FileNotFoundError(f"Missing narration source: {source}")
        text = source.read_text(encoding="utf-8").strip()
        words = len(text.split())
        if not 110 <= words <= 155:
            raise ValueError(f"Part {part} has {words} words; expected 110–155 for a one-minute episode.")
        wav.unlink(missing_ok=True)
        mp3.unlink(missing_ok=True)
        run([
            sys.executable, "-m", "piper", "-m", VOICE,
            "--data-dir", str(MODEL_DIR), "-f", str(wav),
            "--sentence-silence", "0.28", "--input-file", str(source),
        ], timeout=240)
        if not wav.is_file() or wav.stat().st_size < 100_000:
            raise RuntimeError(f"Piper did not create a valid WAV for part {part}.")
        run([
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav),
            "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-codec:a", "libmp3lame",
            "-b:a", "192k", str(mp3),
        ])
        seconds = duration(mp3)
        if not 35 <= seconds <= 65 or mp3.stat().st_size < 20_000:
            raise RuntimeError(f"Part {part} audio invalid: {seconds:.2f}s, {mp3.stat().st_size} bytes.")
        wav.unlink(missing_ok=True)
        print(f"Part {part}: {words} words, {seconds:.2f}s, {mp3.stat().st_size} bytes.")
    print("All five neural Russian narration tracks passed validation.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"NARRATION ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
