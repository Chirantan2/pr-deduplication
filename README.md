# PR RANKER

An AI-powered dashboard for managing GitHub pull requests. It scores PRs against issues using LLMs, displays repo statistics, and lets you merge PRs — all from a modern React UI.

## Features

- **AI-Powered PR Ranking** — Score how well each PR addresses an issue (0–100), with strengths/gaps analysis.
  - Multi-provider: **Google Gemini**, **Groq**, **OpenAI**, **Claude (Anthropic)**, or **Ollama** (local).
  - Automatic Groq model fallback on rate limits.
- **Multi-Repository Support** — Track multiple GitHub repos per account. Switch between them from the dashboard.
- **Repository Stats** — At-a-glance tiles showing stars, forks, language, contributors, open issues, and latest commit.
- **User Authentication** — Register/login with JWT-based auth. API keys and tokens stored securely per user.
- **GitHub Integration** — Fetch open issues, view linked PRs, inspect file diffs, and merge PRs directly.
- **Responsive UI** — Works on desktop and mobile with a collapsible sidebar.

## Tech Stack

| Layer    | Technology |
|----------|------------|
| Frontend | React + Vite + Tailwind CSS |
| Backend  | FastAPI + SQLAlchemy (SQLite/PostgreSQL) |
| Auth     | JWT (python-jose) + Argon2 (passlib) |
| AI       | google-generativeai, groq, openai, anthropic, ollama |
| Language | Python 3.11+, JavaScript (ES2020+) |

## Prerequisites

- **Python 3.11+** and **Node.js 18+**
- **GitHub Personal Access Token** with `repo` scope
- At least one LLM API key (or a local Ollama instance):
  - [Google Gemini API Key](https://aistudio.google.com/apikey)
  - [Groq API Key](https://console.groq.com/keys)
  - [OpenAI API Key](https://platform.openai.com/api-keys)
  - [Anthropic Claude API Key](https://console.anthropic.com/settings/keys)
  - [Ollama](https://ollama.com/) installed locally (no key needed)

## Installation

```bash
git clone <repo-url>
cd pr-deduplication
```

## Run With Docker (Recommended)

### 1. Start all services

```bash
docker compose up --build
```

This starts:
- Frontend at `http://localhost:3000`
- Backend API at `http://localhost:8000`

### 2. Run in detached mode (optional)

```bash
docker compose up -d --build
```

### 3. View logs

```bash
docker compose logs -f
```

### 4. Stop services

```bash
docker compose down
```

### 5. Live-reload/watch mode (optional)

If you want Docker Compose to rebuild/restart services automatically on file changes:

```bash
docker compose watch
```

## Run Locally (Without Docker)

### 1. Backend

```bash
python -m venv venv
source venv/bin/activate   # Mac/Linux
# .\\venv\\Scripts\\activate  # Windows
pip install -r backend/requirements.txt
cd backend
uvicorn app.main:app --reload
```

Backend runs at `http://localhost:8000`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
cd ..
```
Frontend dev server runs at `http://localhost:5173`.

### 3. First-time setup

1. **Register** a new account at the login screen.
2. Go to **Settings**:
   - Add your **GitHub Personal Access Token**.
   - Add one or more **repositories** (owner + repo name).
   - Add API keys for any providers you want to use (Gemini, Groq, OpenAI, Claude). Ollama needs no key.
3. Go to **Dashboard**:
   - Select a repository from the dropdown.
   - View repo stats (stars, forks, contributors, latest commit).
   - Select an open issue to see linked PRs.
   - Choose an LLM provider and click **Rank PRs with AI**.
   - Review scores, strengths, and gaps for each PR.
   - Merge the best PR directly from the UI.

## Project Structure

```
pr-ranker/
├── backend/
│   └── app/
│       ├── main.py              # FastAPI app entry point
│       ├── core/
│       │   ├── database.py      # SQLAlchemy setup (SQLite)
│       │   └── security.py      # Argon2 hashing, JWT tokens
│       ├── models/
│       │   ├── user.py          # User + UserSettings models
│       │   └── repository.py    # Repository model (multi-repo)
│       ├── schemas/
│       │   └── user.py          # Pydantic schemas
│       ├── routes/
│       │   ├── auth.py          # Register, login
│       │   ├── users.py         # User profile, settings
│       │   ├── repositories.py  # Repo CRUD + stats
│       │   ├── issues.py        # Issues, PRs, scoring, merging
│       │   └── health.py        # Health check
│       └── services/
│           ├── github_service.py  # GitHub API calls + repo stats
│           └── matcher.py         # LLM-based PR scoring
├── frontend/
│   └── src/
│       ├── App.jsx
│       ├── context/AuthContext.jsx
│       ├── pages/
│       │   ├── LoginPage.jsx
│       │   ├── RegisterPage.jsx
│       │   ├── DashboardPage.jsx
│       │   └── SettingsPage.jsx
│       └── components/
│           ├── FoxLogo.jsx
│           ├── layout/Sidebar.jsx
│           └── dashboard/
│               ├── RepoSelector.jsx
│               ├── RepoStats.jsx
│               ├── IssueSelector.jsx
│               ├── PRList.jsx
│               ├── PRCard.jsx
│               └── PRDetailsModal.jsx
└── backend/requirements.txt
```

## Supported Models

| Provider | Models | Notes |
|----------|--------|-------|
| Gemini   | `gemini-2.5-flash` (default) | Cloud, requires API key |
| Groq     | `llama-3.1-8b-instant`, `llama-3.3-70b-versatile`, and others | Auto-fallback on rate limits |
| OpenAI   | `gpt-4o-mini` (default) | Cloud, requires API key |
| Claude   | `claude-sonnet-4-20250514` (default) | Cloud, requires API key |
| Ollama   | `llama3.2:3b` (default) | Local, no API key needed |
