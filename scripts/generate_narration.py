#!/usr/bin/env python3
"""Generate Russian narration with Edge TTS and an offline eSpeak NG fallback."""

from __future__ import annotations

import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEXT_PATH = ROOT / "public" / "narration.txt"
OUTPUT_PATH = ROOT / "public" / "narration.mp3"
VOICE = "ru-RU-DmitryNeural"
MIN_AUDIO_BYTES = 512


def run_checked(command: list[str], *, cwd: Path | None = None) -> None:
    print("+", " ".join(command), flush=True)
    subprocess.run(command, cwd=cwd, check=True)


def audio_duration(path: Path) -> float:
    ffprobe = shutil.which("ffprobe")
    if not ffprobe:
        raise RuntimeError("ffprobe is required; install ffmpeg before generating narration.")
    result = subprocess.run(
        [ffprobe, "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        check=True, capture_output=True, text=True,
    )
    return float(result.stdout.strip())


def is_valid_audio(path: Path) -> bool:
    try:
        return path.is_file() and path.stat().st_size > MIN_AUDIO_BYTES and audio_duration(path) > 0.5
    except (OSError, ValueError, subprocess.CalledProcessError):
        return False


def generate_with_edge_tts(paragraphs: list[str]) -> bool:
    edge_tts = shutil.which("edge-tts")
    ffmpeg = shutil.which("ffmpeg")
    if not edge_tts or not ffmpeg:
        print("Edge TTS or FFmpeg executable is unavailable; using offline fallback.")
        return False

    with tempfile.TemporaryDirectory(prefix="remotion-edge-tts-") as temporary:
        workdir = Path(temporary)
        segment_paths: list[Path] = []

        for index, paragraph in enumerate(paragraphs, start=1):
            text_file = workdir / f"text-{index:03d}.txt"
            segment = workdir / f"segment-{index:03d}.mp3"
            text_file.write_text(paragraph, encoding="utf-8")
            generated = False

            for attempt in range(1, 3):
                segment.unlink(missing_ok=True)
                command = [
                    edge_tts, "--voice", VOICE, "--rate=0%", "--file",
                    str(text_file), "--write-media", str(segment),
                ]
                print(
                    f"Edge TTS paragraph {index}/{len(paragraphs)}, attempt {attempt}/2",
                    flush=True,
                )
                try:
                    result = subprocess.run(
                        command, check=False, capture_output=True, text=True, timeout=90,
                    )
                except subprocess.TimeoutExpired:
                    print("Edge TTS timed out; retrying this paragraph.", flush=True)
                    continue

                if result.returncode == 0 and is_valid_audio(segment):
                    generated = True
                    segment_paths.append(segment)
                    break

                error = (result.stderr or result.stdout or "No audio returned").strip()
                print(f"Edge TTS did not produce valid audio: {error[-800:]}", flush=True)

            if not generated:
                return False

        manifest = workdir / "segments.txt"
        manifest.write_text(
            "".join(f"file '{segment.name}'\n" for segment in segment_paths),
            encoding="utf-8",
        )
        OUTPUT_PATH.unlink(missing_ok=True)
        run_checked(
            [ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-f", "concat",
             "-safe", "0", "-i", manifest.name, "-vn", "-codec:a", "libmp3lame",
             "-q:a", "3", str(OUTPUT_PATH)],
            cwd=workdir,
        )

    return is_valid_audio(OUTPUT_PATH)


def generate_with_espeak_ng() -> None:
    espeak = shutil.which("espeak-ng") or shutil.which("espeak")
    ffmpeg = shutil.which("ffmpeg")
    if not espeak:
        raise RuntimeError(
            "Edge TTS failed and neither espeak-ng nor espeak is installed. "
            "Install espeak-ng to enable the offline Russian voice fallback."
        )
    if not ffmpeg:
        raise RuntimeError("FFmpeg is required to encode the offline fallback as MP3.")

    wav_path = ROOT / "public" / "narration-fallback.wav"
    OUTPUT_PATH.unlink(missing_ok=True)
    wav_path.unlink(missing_ok=True)
    run_checked([
        espeak, "-v", "ru", "-s", "165", "-a", "175",
        "-w", str(wav_path), "-f", str(TEXT_PATH),
    ])
    if not wav_path.is_file() or wav_path.stat().st_size < 1024:
        raise RuntimeError("Offline TTS did not create a valid WAV file.")

    run_checked([
        ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav_path),
        "-vn", "-codec:a", "libmp3lame", "-b:a", "128k", str(OUTPUT_PATH),
    ])
    wav_path.unlink(missing_ok=True)

    if not is_valid_audio(OUTPUT_PATH):
        raise RuntimeError("Offline TTS fallback created an invalid MP3 file.")


def main() -> int:
    if not TEXT_PATH.is_file():
        raise FileNotFoundError(f"Narration text is missing: {TEXT_PATH}")
    text = TEXT_PATH.read_text(encoding="utf-8").strip()
    if not text:
        raise ValueError("Narration text is empty.")
    paragraphs = [part.strip() for part in text.split("\n\n") if part.strip()]
    print(f"Generating Russian narration from {len(paragraphs)} text blocks.")

    try:
        if generate_with_edge_tts(paragraphs):
            duration = audio_duration(OUTPUT_PATH)
            print(
                f"Generated Edge TTS narration: {OUTPUT_PATH} "
                f"({OUTPUT_PATH.stat().st_size} bytes, {duration:.1f} seconds)"
            )
            return 0
    except (OSError, RuntimeError, subprocess.CalledProcessError, ValueError) as error:
        print(f"Edge TTS generation failed: {error}", file=sys.stderr)

    print("Using offline eSpeak NG fallback.", flush=True)
    generate_with_espeak_ng()
    duration = audio_duration(OUTPUT_PATH)
    print(
        f"Generated offline Russian narration: {OUTPUT_PATH} "
        f"({OUTPUT_PATH.stat().st_size} bytes, {duration:.1f} seconds)"
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"NARRATION ERROR: {error}", file=sys.stderr)
        raise SystemExit(1)
