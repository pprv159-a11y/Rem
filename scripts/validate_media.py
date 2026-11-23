#!/usr/bin/env python3
"""Validate generated audio assets and the final Remotion MP4."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NARRATION = ROOT / "public" / "narration.mp3"
SOUNDTRACK = ROOT / "public" / "soundtrack.wav"
EXPECTED_WIDTH = 1080
EXPECTED_HEIGHT = 1920
EXPECTED_FPS = 30
EXPECTED_SECONDS = 300


def probe(path: Path) -> dict:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_streams", "-show_format",
         "-of", "json", str(path)],
        check=True, capture_output=True, text=True,
    )
    return json.loads(result.stdout)


def validate_assets() -> None:
    for path in (NARRATION, SOUNDTRACK):
        if not path.is_file() or path.stat().st_size == 0:
            raise RuntimeError(f"Required audio asset is missing or empty: {path}")

    narration_info = probe(NARRATION)
    narration_duration = float(narration_info["format"]["duration"])
    if narration_duration <= 0.5:
        raise RuntimeError(f"Narration duration is invalid: {narration_duration:.2f}s")

    with wave.open(str(SOUNDTRACK), "rb") as soundtrack:
        soundtrack_duration = soundtrack.getnframes() / soundtrack.getframerate()
        if soundtrack.getnchannels() != 2:
            raise RuntimeError("Soundtrack must be stereo.")
        if soundtrack.getsampwidth() != 2:
            raise RuntimeError("Soundtrack must use 16-bit PCM samples.")
        if abs(soundtrack_duration - EXPECTED_SECONDS) > 0.05:
            raise RuntimeError(
                f"Soundtrack duration must be {EXPECTED_SECONDS}s; "
                f"found {soundtrack_duration:.2f}s."
            )

    if narration_duration > EXPECTED_SECONDS:
        raise RuntimeError(
            f"Narration ({narration_duration:.1f}s) is longer than the "
            f"{EXPECTED_SECONDS}s composition and would be cut off."
        )
    print(
        f"Audio assets valid: narration={narration_duration:.1f}s, "
        f"soundtrack={soundtrack_duration:.1f}s."
    )


def validate_video(path: Path) -> None:
    if not path.is_file() or path.stat().st_size < 100_000:
        raise RuntimeError(f"Rendered MP4 is missing or unexpectedly small: {path}")

    info = probe(path)
    streams = info.get("streams", [])
    video_streams = [stream for stream in streams if stream.get("codec_type") == "video"]
    audio_streams = [stream for stream in streams if stream.get("codec_type") == "audio"]

    if len(video_streams) != 1:
        raise RuntimeError(f"Expected one video stream; found {len(video_streams)}.")
    if not audio_streams:
        raise RuntimeError("The rendered MP4 has no audio stream.")

    video = video_streams[0]
    if video.get("codec_name") != "h264":
        raise RuntimeError(f"Expected H.264 video; found {video.get('codec_name')}.")
    if video.get("width") != EXPECTED_WIDTH or video.get("height") != EXPECTED_HEIGHT:
        raise RuntimeError(
            f"Expected {EXPECTED_WIDTH}x{EXPECTED_HEIGHT}; found "
            f"{video.get('width')}x{video.get('height')}."
        )

    frame_rate = video.get("avg_frame_rate", "0/1")
    numerator, denominator = (int(value) for value in frame_rate.split("/", maxsplit=1))
    actual_fps = numerator / denominator if denominator else 0
    if abs(actual_fps - EXPECTED_FPS) > 0.01:
        raise RuntimeError(f"Expected {EXPECTED_FPS} FPS; found {actual_fps:.3f}.")

    duration = float(info["format"]["duration"])
    if abs(duration - EXPECTED_SECONDS) > 1.0:
        raise RuntimeError(
            f"Expected an approximately {EXPECTED_SECONDS}s video; found {duration:.2f}s."
        )
    audio_codecs = sorted({stream.get("codec_name", "unknown") for stream in audio_streams})
    print(
        f"MP4 valid: {path.stat().st_size} bytes, {duration:.2f}s, "
        f"{EXPECTED_WIDTH}x{EXPECTED_HEIGHT}, {actual_fps:.2f} FPS, "
        f"audio={', '.join(audio_codecs)}."
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--assets-only", action="store_true")
    parser.add_argument("--video", type=Path)
    args = parser.parse_args()

    validate_assets()
    if args.video:
        validate_video(args.video.resolve())
    elif not args.assets_only:
        parser.error("Pass --assets-only or --video PATH.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"MEDIA VALIDATION ERROR: {error}", file=sys.stderr)
        raise SystemExit(1)
