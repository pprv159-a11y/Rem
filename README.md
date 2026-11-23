# Remotion Studio — 30-second test video

A vertical 9:16 Remotion project for a short Russian-language cinematic explainer test.

## Render MP4
1. Open the **Actions** tab.
2. Select **Render Remotion video**.
3. Click **Run workflow**.
4. Download the `remotion-test-30s-9x16` artifact after the workflow finishes.

GitHub Actions generates Russian narration with Microsoft Edge TTS, creates an original soundtrack, and renders `out/video.mp4` at 1080×1920, 30 fps, exactly 30 seconds (900 frames).

Edit `public/narration.txt` to change the narration and `src/scenes/Main.tsx` to change the visuals. This 30-second version is a preview build on the `cinematic-4min` branch; the `main` branch remains untouched.
