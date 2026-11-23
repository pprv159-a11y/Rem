# Remotion Studio — Единственный правитель мира

Vertical 9:16 cinematic explainer video with original Russian narration generated during GitHub Actions.

## Render MP4
1. Open the **Actions** tab.
2. Select **Render Remotion video**.
3. Click **Run workflow**.
4. Download the `remotion-video-9x16` artifact after the workflow finishes.

The workflow generates a Russian voice track with Microsoft Edge TTS and renders `out/video.mp4` (1080×1920, 30 fps, 5 minutes).

Edit `public/narration.txt` to change the narration and `src/scenes/Main.tsx` to change the visuals and captions.
