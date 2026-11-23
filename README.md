# Remotion Studio — cinematic 4-minute videos

A vertical 9:16 Remotion project for four-minute Russian-language explainer videos.

## Render MP4
1. Open the **Actions** tab.
2. Select **Render Remotion video**.
3. Click **Run workflow**.
4. Download the `remotion-video-9x16` artifact after the workflow finishes.

GitHub Actions generates Russian narration with Microsoft Edge TTS, creates an original soundtrack, and renders `out/video.mp4` at 1080×1920, 30 fps, exactly 4 minutes (7,200 frames).

Edit `public/narration.txt` to change the narration and `src/scenes/Main.tsx` to change the visuals and captions. The cinematic visual redesign is being developed on the `cinematic-4min` branch so the existing `main` branch remains untouched.
