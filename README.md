# TaskFlow — Kanban Task Manager

A full-stack kanban task manager with authentication, drag-and-drop, and a PostgreSQL-backed REST API.

> **Stack:** React 18 + Vite · FastAPI (Python 3.11) · PostgreSQL 15 · JWT auth · dnd-kit

## Live demo
- Frontend: `https://taskflow-nikhil.vercel.app`
- API: `https://taskflow-api.onrender.com`
- API docs: `https://taskflow-api.onrender.com/docs` (auto-generated Swagger)

## Screenshots
*(Add screenshots after first deploy: `docs/board.png`, `docs/login.png`)*

---

## 1. Requirements analysis

### Problem
Solo developers and small teams need a lightweight place to track work without the bloat of Jira. Existing tools either lack a clean kanban or hide features behind paywalls.

### Goal
Build a kanban board where signed-in users can create boards, organize tasks across columns, and move them via drag-and-drop. Tasks persist on the server.

### Functional requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Users can register and log in with email + password | Must |
| FR-2 | Authenticated users can create, read, update, delete tasks | Must |
| FR-3 | Tasks have a title, description, status (todo / doing / done), and priority | Must |
| FR-4 | Users can drag tasks between columns to change status | Must |
| FR-5 | Users only see their own tasks | Must |
| FR-6 | Tasks can be filtered by priority and searched by title | Should |
| FR-7 | Users can edit a task inline by clicking it | Should |
| FR-8 | Auth tokens persist across reloads | Must |

### Non-functional requirements
- API response < 200ms p95 for typical CRUD on local Postgres.
- Passwords hashed with bcrypt; JWTs signed with HS256.
- CORS restricted to the deployed frontend origin.
- All endpoints documented via FastAPI's OpenAPI.
- Mobile-responsive board (columns stack vertically on small screens).

### Out of scope (v1)
Team collaboration, comments, attachments, due-date reminders. Listed in `docs/ROADMAP.md`.

---

## 2. User stories

| ID | As a... | I want... | So that... | Acceptance criteria |
|----|---------|-----------|------------|---------------------|
| US-1 | new visitor | to register an account with email + password | I can save my tasks | POST /auth/register returns 201 + JWT; duplicate email returns 409 |
| US-2 | returning user | to log in | I can pick up where I left off | POST /auth/login returns 200 + JWT on correct creds; 401 on wrong creds |
| US-3 | signed-in user | to create a task with a title | I can capture work | POST /tasks returns 201 with the task; title required |
| US-4 | signed-in user | to see all my tasks grouped by status | I can scan my board | GET /tasks returns only my tasks; UI shows three columns |
| US-5 | signed-in user | to drag a task to another column | I can update its status without a form | Drop fires PATCH /tasks/{id} with new status; UI reflects optimistically |
| US-6 | signed-in user | to edit a task's title and description inline | I can refine details quickly | Click → edit mode → save calls PATCH; cancel reverts |
| US-7 | signed-in user | to delete a task | I can remove what's done or wrong | Delete button → confirm → DELETE /tasks/{id} → row disappears |
| US-8 | signed-in user | to filter tasks by priority | I can focus on what matters | Filter chips: all / low / medium / high; client-side filter |
| US-9 | any user | to log out | nobody else can see my tasks on a shared computer | Logout clears JWT from localStorage |

---

## 3. Architecture

```
┌──────────────┐    HTTPS / JSON    ┌────────────────┐    SQL    ┌──────────────┐
│  React + Vite │ ─────────────────► │  FastAPI app   │ ────────► │  PostgreSQL  │
│  (Vercel)     │ ◄───────────────── │  (Render)      │ ◄──────── │  (Render DB) │
└──────────────┘  Bearer JWT in     └────────────────┘            └──────────────┘
                  Authorization
```

### REST contract (excerpt)

| Method | Path | Auth | Body | Returns |
|--------|------|------|------|---------|
| POST | /auth/register | — | { email, password } | 201 { access_token, user } |
| POST | /auth/login | — | { email, password } | 200 { access_token, user } |
| GET | /auth/me | Bearer | — | 200 { id, email } |
| GET | /tasks | Bearer | — | 200 [Task] |
| POST | /tasks | Bearer | { title, description?, priority? } | 201 Task |
| PATCH | /tasks/{id} | Bearer | partial Task | 200 Task |
| DELETE | /tasks/{id} | Bearer | — | 204 |

Full schemas live in the auto-generated `/docs` page.

---

## 4. Project layout

```
taskflow/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI entrypoint + CORS
│   │   ├── database.py       # SQLAlchemy engine + session
│   │   ├── auth.py           # JWT + password hashing
│   │   ├── deps.py           # get_db, get_current_user
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   └── routers/          # auth + tasks routers
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api/client.js
│   │   ├── components/{Board,Column,TaskCard,Login,Register}.jsx
│   │   └── styles.css
│   ├── package.json
│   └── vite.config.js
├── database/
│   └── schema.sql
├── docker-compose.yml
└── README.md
```

---

## 5. Local development

### Prerequisites
- Node 18+, Python 3.11+, PostgreSQL 15+ (or Docker)

### Option A — Docker (one command)
```bash
docker compose up --build
# frontend on 5173, api on 8000, postgres on 5432
```

### Option B — manual

```bash
# 1. Postgres
createdb taskflow
psql taskflow -f database/schema.sql

# 2. Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL="postgresql+psycopg://postgres:postgres@localhost:5432/taskflow"
export JWT_SECRET="dev-secret-change-me"
uvicorn app.main:app --reload         # http://localhost:8000  /docs

# 3. Frontend
cd ../frontend
npm install
echo 'VITE_API_URL=http://localhost:8000' > .env.local
npm run dev                             # http://localhost:5173
```

---

## 6. Environment variables

| Var | Where | Example |
|-----|-------|---------|
| `DATABASE_URL` | backend | `postgresql+psycopg://user:pass@host:5432/taskflow` |
| `JWT_SECRET` | backend | long random string |
| `CORS_ORIGINS` | backend | `https://taskflow-nikhil.vercel.app` |
| `VITE_API_URL` | frontend | `https://taskflow-api.onrender.com` |

---

## 7. Deployment

### Backend → Render
1. Push to GitHub.
2. Render → New → Web Service → connect repo, root dir `backend`.
3. Build: `pip install -r requirements.txt` · Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
4. Add env vars from the table above.
5. Add a Render PostgreSQL instance, paste its `DATABASE_URL`.

### Frontend → Vercel
1. `cd frontend && vercel`.
2. Set `VITE_API_URL` env var in Vercel project settings.

---

## 8. Roadmap (v2 ideas)
- Boards (multiple boards per user)
- Real-time sync via SSE
- Comments and attachments
- Email reminders for due dates
