# Remotion Studio

A starter project for creating videos with [Remotion](https://www.remotion.dev/) and rendering MP4 files with GitHub Actions.

## Run locally

```bash
npm install
npm run dev
```

## Render an MP4 locally

```bash
npm run build
```

The rendered file is written to `out/video.mp4`.

## Render on GitHub

1. Open the **Actions** tab in this repository.
2. Select **Render Remotion video**.
3. Click **Run workflow**.
4. When it finishes, open the run and download the `remotion-video` artifact. It contains `video.mp4`.

The starter composition is `Main` in `src/scenes/Main.tsx`. Edit it to create your own video.
