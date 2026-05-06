# AI Job Copilot 🤖

AI-powered multi-agent system to help candidates generate everything needed for a job application — instantly.

## 🚀 Features (MVP)

* Resume optimization
* Recruiter outreach message
* Cover letter generation
* Job fit analysis
* Keyword matching

## 🧠 Tech Stack

* Backend: FastAPI + CrewAI
* LLM: Ollama (Gemma)
* Frontend: Next.js

## 📂 Project Structure

* `backend/` → API + AI pipeline
* `frontend/` → UI

## ⚙️ Setup (Backend)

```bash
cd backend
conda activate crewai-backend
uvicorn app.main:app --reload
```

## ⚙️ Setup (Frontend)

```bash
cd frontend
npm install
npm run dev
```

## 📌 Status

🚧 In active development
