# TwinMind — Live Meeting Copilot

A real-time AI meeting assistant that listens to your mic, transcribes speech, and surfaces 3 contextual suggestions every 30 seconds. Click any suggestion for a detailed streamed answer.

## Live: https://twin-mind-nine.vercel.app/

## Stack

- **Next.js 14** (App Router) — frontend + API routes
- **Zustand** — session state management
- **Groq SDK** — Whisper Large V3 (transcription) + Llama 4 Scout (suggestions + chat)
- **Tailwind CSS** — styling

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 3. Add your Groq API key

On first load, the Settings modal opens automatically. Paste your Groq API key from [console.groq.com](https://console.groq.com).

The key is stored in `localStorage` — it's never sent to any server except Groq directly via your browser.

**Required models** (all available on free tier):
- `whisper-large-v3` — audio transcription
- `meta-llama/llama-4-scout-17b-16e-instruct` — suggestions + chat (GPT-OSS 120B equivalent on Groq)

## Usage

1. Click **Settings** → paste Groq API key → Save
2. Click the **mic button** to start recording
3. Speak — transcript appears every ~30 seconds as audio chunks are transcribed
4. **Live Suggestions** auto-refresh every 30s with 3 context-aware cards
5. Click **Reload suggestions** to manually trigger a fresh batch
6. Click any suggestion card to get a detailed answer in the Chat panel
7. Type questions directly in the Chat panel at any time
8. Click **Export TXT** or **Export JSON** to download the full session

## Project Structure

```
app/
  page.tsx                  # Main 3-column layout + all wiring
  layout.tsx                # Root layout
  globals.css               # Global styles + fonts
  api/
    transcribe/route.ts     # POST → Whisper Large V3
    suggestions/route.ts    # POST → Llama 4 (3 suggestion cards)
    chat/route.ts           # POST → Llama 4 (streaming chat)

components/
  TranscriptPanel.tsx       # Left column — mic + transcript
  SuggestionPanel.tsx       # Middle column — batched suggestion cards
  ChatPanel.tsx             # Right column — streamed chat + markdown
  MicButton.tsx             # Mic start/stop with recording pulse
  SettingsModal.tsx         # API key + editable prompts + context windows

lib/
  types.ts                  # Shared TypeScript interfaces
  prompts.ts                # Default prompts + suggestion type metadata
  parser.ts                 # Robust JSON parser for suggestion responses
  transcript.ts             # MediaRecorder wrapper with MIME detection
  export.ts                 # Session export (JSON + plain text)

store/
  useSessionStore.ts        # Zustand store — all session state + actions
```

## Deploy to Vercel

```bash
npm run build               # verify no TypeScript errors
vercel deploy               # or push to GitHub and import in Vercel dashboard
```

No environment variables needed — the API key lives in the user's browser.

## Settings

All settings are editable in the Settings modal (gear icon):

| Setting | Default | Description |
|---|---|---|
| Groq API Key | — | Required. From console.groq.com |
| Suggestion context window | 50 chunks | Recent transcript lines sent for suggestions |
| Chat context window | 300 chunks | Transcript lines sent with chat requests |
| Suggestion max tokens | 600 | Token budget for 3-suggestion response |
| Chat max tokens | 1200 | Token budget for chat/detail responses |
| Suggestion prompt | See prompts.ts | System prompt for suggestion generation |
| Chat prompt | See prompts.ts | System prompt for user chat questions |
| Detail prompt | See prompts.ts | System prompt for suggestion click expand |

## Prompt Engineering Notes

**Suggestion types** — the model is instructed to select the right mix based on context:
- `QUESTION_TO_ASK` — sharp follow-up question for the speaker to ask
- `TALKING_POINT` — key fact, stat, or argument worth raising
- `ANSWER` — direct answer to a question just asked in the transcript
- `FACT_CHECK` — verify or gently correct a specific claim
- `CLARIFICATION` — explain a term or acronym just mentioned

**Context strategy** — suggestions use only the last 50 transcript chunks (recent context) while chat uses up to 300 (full session) so detailed answers are grounded in everything said.

**Repeat prevention** — the previous batch's suggestions are sent back to the model to avoid surfacing the same suggestions every cycle.
