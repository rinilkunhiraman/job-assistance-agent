# AI Job Application Agent 🤖

AI-powered multi-agent system to help candidates generate everything needed for a job application — instantly.

## 🚀 Features (MVP)

- Resume optimization with ATS keyword targeting
- Job fit analysis with keyword matching
- Recruiter outreach message generation
- Cover letter generation tailored to the role
- Application history saved locally

## 🧠 Tech Stack

- **Backend:** FastAPI + CrewAI + Ollama (Gemma 4)
- **Frontend:** Next.js 15 + Tailwind CSS + Zustand
- **LLM:** Ollama (local)

## 📋 Prerequisites

Before running the project, ensure you have:

1. **Node.js** (v18+) - [Install](https://nodejs.org)
2. **Python** (3.11+) - [Install](https://www.python.org)
3. **Ollama** - [Install](https://ollama.com)
4. **uv** (recommended) or pip - `pip install uv`

## ⚡ Quick Start

### 1. Start Ollama

```bash
# Pull the required model (first time only)
ollama pull gemma4:31b-cloud

# Start Ollama server (runs on port 11434 by default)
ollama serve
```

### 2. Set Up Backend

```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the backend
uvicorn app.main:app --reload
```

Alternatively, from the project root:
```bash
PYTHONPATH=backend uvicorn app.main:app --reload
```

The backend runs at **http://localhost:8000**

### 3. Set Up Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```

The frontend runs at **http://localhost:3000**

## ⚙️ Environment Variables

### Backend (.env)

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_MODEL` | `ollama/gemma4:31b-cloud` | Model to use (Ollama, OpenAI, Anthropic, Gemini) |
| `LLM_BASE_URL` | `http://localhost:11434` | Base URL for LLM provider (mainly for Ollama) |
| `CORS_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` | Allowed frontend origins |
| `APP_ENV` | `development` | Environment (development/production) |

### Frontend

No additional configuration needed. The frontend connects to the backend at `http://localhost:8000`.

## 📂 Project Structure

```
job-application-agent/
├── backend/              # FastAPI + CrewAI backend
│   ├── app/
│   │   ├── agents/      # AI agent definitions
│   │   ├── api/         # API routes
│   │   ├── core/        # Config & exceptions
│   │   ├── schemas/     # Pydantic models
│   │   ├── services/    # Pipeline execution
│   │   ├── tasks/       # Task definitions
│   │   └── main.py      # FastAPI app entry
│   └── requirements.txt  # Python dependencies
├── frontend/            # Next.js frontend
│   ├── app/             # App router pages
│   ├── components/     # React components
│   ├── lib/            # Utilities & API
│   └── store/          # Zustand state
└── README.md
```

## 🔧 Troubleshooting

### Ollama not running
```
Error: Unable to connect to Ollama at http://localhost:11434
```
**Fix:** Run `ollama serve` in a separate terminal.

### Model not found
```
Error: model 'gemma4:31b-cloud' not found
```
**Fix:** Run `ollama pull gemma4:31b-cloud`

### CORS errors
**Fix:** Ensure `CORS_ORIGINS` in backend config includes your frontend URL.

### Frontend can't connect to backend
**Fix:** Ensure backend is running at `http://localhost:8000`.

## 📌 Status

🚧 In active development