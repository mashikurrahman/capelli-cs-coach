# Training videos → readable text

Drop training video files (`.mp4`, `.mov`, `.mkv`, `.webm`) in this folder,
then convert them to a transcript (+ optional slide frames) that Claude can read.

## Convert a video

```powershell
# transcript only (fastest)
./scripts/video-to-text.ps1 -Video "training-videos\my-video.mp4"

# transcript + a slide screenshot every 8 seconds, higher-accuracy model
./scripts/video-to-text.ps1 -Video "training-videos\my-video.mp4" -Frames -FrameEverySec 8 -Model small
```

Output lands in `training-videos\<video-name>\`:
- `audio.txt` — the transcript (give this to Claude)
- `audio.srt` — timestamped transcript (optional)
- `frames\` — slide screenshots (only with `-Frames`)

## Models (accuracy vs speed)
`tiny` < `base` (default) < `small` < `medium` < `large-v3`.
Bigger = more accurate, slower, larger one-time download. `base` is fine for
clear English narration; use `small`/`medium` for accents or noisy audio.

## Notes
- Runs fully offline/free on this machine (ffmpeg + faster-whisper).
- Video/audio/frame files are gitignored — they won't be committed.
