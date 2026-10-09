# Dark Copilot — AI Assistant 🚀

A modern, production-ready Full-Stack AI Copilot web application with local-first AI via **Ollama**, seamless multi-provider **Cloud AI fallback**, multimodal vision, real-time streaming, and interactive **Voice Mode supporting Urdu (اردو), Hindi (हिन्दी), and English**.

---

## 🛠️ Tools & Technologies Used

### 🖥️ Frontend Stack
* **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Standalone output)
* **Core Library:** [React 19](https://react.dev/)
* **Language:** [TypeScript 7](https://www.typescriptlang.org/)
* **Styling & Design System:**
  * [Tailwind CSS v4](https://tailwindcss.com/)
  * [shadcn/ui](https://ui.shadcn.com/) & [Radix UI](https://www.radix-ui.com/)
  * [Lucide React](https://lucide.dev/) (Icons)
  * [Geist Font](https://vercel.com/font)
* **Theme Management:** [next-themes](https://github.com/pacocoursey/next-themes) (Dark & Light modes)
* **Markdown Rendering:** [react-markdown](https://github.com/remarkjs/react-markdown) & [remark-gfm](https://github.com/remarkjs/remark-gfm)
* **Notifications / Toasts:** [Sonner](https://sonner.emilkowal.ski/)
* **Audio & Speech Processing:**
  * **Web Speech API:** `SpeechRecognition` / `webkitSpeechRecognition` for voice-to-text dictation
  * **SpeechSynthesis:** Browser TTS engine with custom language detection
  * **Web Audio API (`AudioContext` & `AnalyserNode`):** Real-time microphone waveform and volume visualizer

---

### ⚙️ Backend Stack
* **Language & Runtime:** Python 3.13
* **Web Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Async ASGI)
* **Server:** [Uvicorn](https://www.uvicorn.org/)
* **Package Manager & Environment:** [uv](https://docs.astral.sh/uv/)
* **Data Validation & Settings:** [Pydantic v2](https://docs.pydantic.dev/) & [pydantic-settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/)
* **HTTP Client:** [HTTPX](https://www.python-httpx.org/) (Async HTTP & SSE streaming)
* **Linting & Code Formatting:** [Ruff](https://docs.astral.sh/ruff/)
* **Testing:** [Pytest](https://docs.pytest.org/) & [pytest-asyncio](https://pytest-asyncio.readthedocs.io/)

---

### 🤖 AI Providers & Model Architecture
* **Local AI (Primary / Offline Priority):**
  * [Ollama](https://ollama.com/) on `http://localhost:11434`
  * Official `ollama` Python SDK
* **Cloud AI Fallbacks:**
  * **Anthropic:** Claude 3.5 / 3.7 (`anthropic` Python SDK)
  * **OpenAI:** GPT-4o / GPT-4o-mini (`openai` Python SDK)
  * **Google Gemini:** Gemini 2.5 / 2.0 / 1.5 Flash & Pro via OpenAI-compatible endpoint
  * **xAI Grok:** Grok-2 / Grok-beta via OpenAI-compatible endpoint
  * **Meta Llama:** Llama 3.3 / Llama 3.1 via OpenAI-compatible endpoint
* **Streaming Protocol:** Server-Sent Events (SSE) with `meta`, `delta`, `done`, and `error` events

---

## ✨ Features Added in this Project

1. **Local-First with Smart Cloud Fallback:**
   * Automatically detects and uses local Ollama models with zero cloud egress.
   * If local model is unavailable or encounters an error, seamlessly falls back to cloud providers without dropping connections.

2. **🎙️ Multilingual Voice Mode & Speech Support:**
   * **🇵🇰 Urdu (اردو):** Voice input (`ur-PK`) and authentic Urdu speech synthesis playback.
   * **🇮🇳 Hindi (हिन्दी):** Voice input (`hi-IN`) and Hindi speech synthesis playback.
   * **🇺🇸 English:** Standard and neural English voice support (`en-US`).
   * **Interactive Voice Bar:** Live microphone waveform bars, speech-to-text transcript preview, mute/unmute, and interruptible playback.
   * **Read Aloud (TTS):** Read any message out loud in its native language.

3. **Multimodal Vision & Attachment Uploads:**
   * Drag-and-drop, paste images from clipboard, or click attachment menu (`Ctrl+U`).
   * Supported formats: JPEG, PNG, WebP, GIF.

4. **Dynamic Model Picker:**
   * Real-time model listing from Ollama and configured cloud APIs.
   * Visual indicator for local models, cloud providers, parameters, and sizes.

5. **Conversation Management:**
   * Real-time conversation search (`Ctrl+K`).
   * Local storage persistence with undoable delete and clear options.
   * Keyboard shortcuts (`Ctrl+Shift+O` for new chat, `Esc` to stop generating or exit voice mode).

6. **Chat & Cowork Modes:**
   * Switch between standard chat view and focused Cowork mode.
   * Integrated web search and memory toggle controls.

---

## 🚀 Getting Started

### 1. Prerequisites
* **Python 3.13+** with [uv](https://docs.astral.sh/uv/) installed
* **Node.js 20.9+** and `npm`
* **Ollama** (optional, for offline local models): [https://ollama.com](https://ollama.com)

---

### 2. Setup Ollama (Local AI)
```powershell
# Pull your desired local model (e.g. Llama 3.2 or Qwen 2.5)
ollama pull llama3.2
# or
ollama pull qwen2.5:1.5b
```

---

### 3. Start Backend API (Port 8001)
```powershell
cd d:\AI-ML\Copilot\ai-assistant\api

# Install dependencies
uv sync

# Configure environment variables
# Copy .env.example to .env and add cloud API keys if desired
cp .env.example .env

# Run FastAPI server on port 8001
uv run uvicorn app.main:app --port 8001 --reload
```

---

### 4. Start Frontend (Port 3000)
```powershell
cd d:\AI-ML\Copilot\ai-assistant\web

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```

Open your browser at [http://localhost:3000](http://localhost:3000).

---

## 🧪 Testing & Quality Checks

### Backend Quality
```powershell
cd d:\AI-ML\Copilot\ai-assistant\api
uv run pytest
uv run ruff check .
uv run ruff format --check .
```

### Frontend Quality
```powershell
cd d:\AI-ML\Copilot\ai-assistant\web
npm run typecheck
npm run build
```

---

## 📂 Project Directory Structure

```
Copilot/
├── README.md                      # Root documentation
├── AGENTS.md                      # Agent rules & tech stack reference
└── ai-assistant/
    ├── api/                       # FastAPI Backend
    │   ├── app/
    │   │   ├── core/              # App config & logging
    │   │   ├── providers/         # Ollama, Anthropic, OpenAI-compat providers
    │   │   ├── routes/            # /health, /models, /chat, /upload
    │   │   ├── services/          # Chat orchestration & SSE streaming
    │   │   ├── main.py            # FastAPI entrypoint
    │   │   └── schemas.py         # Pydantic request/response models
    │   ├── tests/                 # Pytest test suite
    │   ├── pyproject.toml         # Python dependencies & Ruff config
    │   └── uv.lock
    │
    └── web/                       # Next.js Frontend
        ├── app/                   # Next.js App Router & Layouts
        ├── components/
        │   ├── chat/              # ChatApp, VoiceBar, Composer, ModelPicker, MessageList
        │   └── ui/                # shadcn/ui components (Button, Dropdown, Sheet, etc.)
        ├── hooks/
        │   ├── use-chat.ts        # Chat state & SSE streaming logic
        │   ├── use-models.ts      # Model list & selection
        │   └── use-speech.ts      # Multilingual STT/TTS (Urdu, Hindi, English) & AudioContext
        ├── lib/                   # API client, types & utility functions
        ├── next.config.ts         # API rewrites & security headers
        └── package.json           # Frontend dependencies & scripts
```
