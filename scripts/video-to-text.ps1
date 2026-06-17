<#
.SYNOPSIS
  Turn a training video into things Claude can read: a text transcript and
  (optionally) one slide frame every N seconds.

.DESCRIPTION
  Uses ffmpeg to pull the audio track, whisper-ctranslate2 (faster-whisper)
  to transcribe it locally/offline, and ffmpeg again to sample frames.
  Output goes to:  training-videos\<video-name>\
    - transcript.txt   (plain text Claude reads)
    - transcript.srt   (timestamped, optional reference)
    - frames\frame_0001.png ...  (slides, if -Frames)

.EXAMPLE
  ./scripts/video-to-text.ps1 -Video "training-videos\returns-process.mp4"

.EXAMPLE
  ./scripts/video-to-text.ps1 -Video "C:\path\demo.mov" -Frames -FrameEverySec 8 -Model small
#>
param(
  [Parameter(Mandatory = $true)] [string] $Video,
  [switch] $Frames,
  [int] $FrameEverySec = 10,
  [ValidateSet('tiny', 'base', 'small', 'medium', 'large-v3')]
  [string] $Model = 'base',
  [string] $Language = 'en'
)

$ErrorActionPreference = 'Stop'

# Make sure freshly-installed tools are on PATH for this session.
$env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' +
            [System.Environment]::GetEnvironmentVariable('Path', 'User')

if (-not (Test-Path $Video)) { throw "Video not found: $Video" }

$name = [System.IO.Path]::GetFileNameWithoutExtension($Video)
$root = Split-Path -Parent $PSScriptRoot          # project root
$outDir = Join-Path $root "training-videos\$name"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$audio = Join-Path $outDir 'audio.mp3'

Write-Host "[1/3] Extracting audio -> $audio" -ForegroundColor Cyan
ffmpeg -y -i "$Video" -vn -ac 1 -ar 16000 -b:a 96k "$audio"
if (-not $?) { throw 'ffmpeg audio extraction failed' }

Write-Host "[2/3] Transcribing with whisper ($Model)... first run downloads the model" -ForegroundColor Cyan
whisper-ctranslate2 "$audio" --model $Model --language $Language `
  --output_format txt --output_format srt --output_dir "$outDir"
if (-not $?) { throw 'transcription failed' }

if ($Frames) {
  $framesDir = Join-Path $outDir 'frames'
  New-Item -ItemType Directory -Force -Path $framesDir | Out-Null
  Write-Host "[3/3] Sampling a frame every $FrameEverySec s -> $framesDir" -ForegroundColor Cyan
  ffmpeg -y -i "$Video" -vf "fps=1/$FrameEverySec" (Join-Path $framesDir 'frame_%04d.png')
} else {
  Write-Host "[3/3] Skipping frames (pass -Frames to extract slides)" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "Done. Give Claude these:" -ForegroundColor Green
Write-Host "  Transcript: $outDir\audio.txt"
if ($Frames) { Write-Host "  Slides:     $outDir\frames\" }
