# Speechmatics Compare

A real-time speech-to-text comparison platform that puts Speechmatics head-to-head against other leading providers. Stream live audio from your microphone or run transcription against curated demo videos, with side-by-side word-error-rate (WER) analysis computed on the fly against reference transcripts.

## Providers

| Provider | Docs |
|---|---|
| [Speechmatics](https://www.speechmatics.com/) | [Docs](https://docs.speechmatics.com/) |
| [Deepgram](https://www.deepgram.com/) | [Docs](https://developers.deepgram.com/) |
| [Google](https://cloud.google.com/speech-to-text) | [Docs](https://cloud.google.com/speech-to-text/docs) |
| [Azure](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/overview) | [Docs](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/) |

## Features

- **Live microphone transcription** — compare providers in real time as you speak
- **Video mode** — transcribe demo videos and compare outputs against reference transcripts
- **WER analysis** — per-provider substitution / insertion / deletion counts and word error rate, computed live
- **Operating points** — switch between Speechmatics `standard` and `enhanced` models
- **Partial results** — toggle streaming partials per provider
- **Speaker diarisation** — where supported
- **Custom dictionary** — add domain vocabulary for Speechmatics

## Setup

### 1. Clone and configure environment

```bash
git clone git@github.com:J-Jaywalker/sm-soniox-compare.git
cd sm-soniox-compare
```

Create a `.env` file in the project root (see `.env.example`):

```env
SPEECHMATICS_API_KEY=your_key_here
DEEPGRAM_API_KEY=your_key_here
AZURE_API_KEY=your_key_here
AZURE_REGION=your_region_here

# Google — either a credentials file path or environment variable
GOOGLE_CREDENTIALS_FILE=./credentials-google.json
```

Google credentials can alternatively be provided as a service account JSON file placed at `./credentials-google.json`.

### 2. Backend

Requires Python 3.11+. Uses [uv](https://github.com/astral-sh/uv) for dependency management.

```bash
uv sync
uv run fastapi dev
# Runs on http://127.0.0.1:8000
```

### 3. Frontend

```bash
cd frontend
yarn install
yarn dev
# Runs on http://localhost:5173/compare/ui/
# API calls are proxied to the backend via vite.config.ts
```

### 4. Demo videos

Extract the demo videos folder inside the the project root. Each folder should contain:

```
Demo Videos/
  name-of-clip/
    name-of-clip.mp4          # Video clip to transcribe
    name-of-clip-ref.json     # Reference transcript
```

`Demo Videos/` is git-ignored — videos are not committed to the repository as they are too large for GitHub.

## How to use

### Microphone transcription

Select the providers you want to compare using the checkboxes in the left-hand sidebar, configure any settings (operating point, partials, speaker diarisation), then click **Start talking**. All selected providers connect simultaneously and their transcripts appear side by side in real time. Click **Stop** to end the session.

### Video transcription mode

The interface has two panes — microphone mode on the left and video mode on the right. To switch between them:

1. **Entering video mode** — hover over the right edge of the screen. A chevron (`›`) will appear. Click it to slide the interface across to video transcription mode. If the chevron is hard to see against a busy background, try clicking the edge area anyway or scroll the sidebar up or down until it becomes visible.
2. **Selecting a video** — the video gallery shows the available demo clips. Hover over a thumbnail to see a preview and a short summary of the content. Click to open the player.
3. **Running transcription** — once a video is open, click **Transcribe video** in the sidebar. All selected providers begin transcribing the audio in real time. If a reference transcript is available for the clip, each provider panel will display live substitution (Sub), insertion (Ins), and deletion (Del) counts alongside a running word error rate (WER).
4. **Returning to microphone mode** — hover over the left edge of the screen until the chevron (`‹`) appears, then click to slide back.

### Speaker enrolment

Speechmatics supports speaker identification against a set of enrolled speakers. To access enrolment and management:

1. Click the **Speechmatics logo** in the top-left corner of the sidebar. This opens a hidden management panel.
2. From here you can enrol new speakers by recording short voice samples, assign labels, and manage existing entries.
3. Enable **Speaker identification** in the sidebar settings to activate it during transcription.

> **Note:** when running locally, enrolled speaker profiles are stored on the device in `speakers.json`. This file can be copied and shared between machines to transfer enrolments.

## Project structure

```
main.py                        # FastAPI app, WebSocket handler, video API
config.py                      # Provider config and API key loading
providers/
  speechmatics/provider.py     # Speechmatics RT provider
  deepgram/provider.py
  google/provider.py
  azure/provider.py
  assembly/provider.py
frontend/
  src/
    contexts/
      comparison-context.tsx   # Mic mode state and WebSocket
      video-mode-context.tsx   # Video mode state and transcription
    components/
      video-gallery.tsx        # Demo video browser
      video-player-view.tsx    # Player + live WER panels
    lib/
      wer-diff.ts              # LCS-based SID diff algorithm
      provider-features.ts     # Provider capability matrix
    hooks/
      use-url-settings.ts      # URL-backed settings (nuqs)
```
