# MailGenius AI

An AI email writer & scheduler. FastAPI backend (JWT auth, Gemini-powered
generation, encrypted-at-rest SMTP credentials, minute-interval scheduler)
+ React/Vite/Tailwind frontend.

## What's implemented (real, tested)

- Register / login (JWT, bcrypt password hashing)
- AI email generation, rewrite (shorter/longer/tone/grammar), subject line
  suggestions — via Gemini
- Save SMTP credentials (Fernet-encrypted at rest, never stored plaintext)
- Send an email immediately
- Schedule an email for a future UTC time; a background job checks every
  minute and sends anything due, recording sent/failed status
- Draft history, cancel a scheduled email

## What's explicitly NOT implemented

The original brief listed 100+ features (templates, spam scoring, analytics,
calendar integration, CSV import, landing page, etc). Building all of that
as real, tested code — not stubs — isn't a one-session task. This is a
working core product; treat the rest as a backlog, not a gap in "completeness."

Known scaling limit: the scheduler is a single in-process APScheduler job.
Fine for one backend instance. If you ever run multiple backend workers or
dynos, two workers will race to send the same email — swap this for a real
queue (Celery/RQ) with a lock before scaling horizontally.

## Local setup

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Fill in `.env`:
- `SECRET_KEY` — `python -c "import secrets; print(secrets.token_hex(32))"`
- `FERNET_KEY` — `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`
- `GEMINI_API_KEY` — from https://aistudio.google.com/app/apikey
- `DATABASE_URL` — leave as the SQLite default for local dev

```bash
uvicorn app.main:app --reload
```

API docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env    # VITE_API_URL=http://localhost:8000
npm run dev
```

App at `http://localhost:5173`. Register an account, then go to
**SMTP Settings** and add a Gmail address + an
[app password](https://myaccount.google.com/apppasswords) (not your normal
Gmail password — Google blocks that for SMTP) before sending or scheduling.

## Deployment

### Backend → Render

1. Push this repo to GitHub.
2. New Web Service on Render, point it at `backend/`, it will pick up
   `render.yaml` (build: `pip install -r requirements.txt`, start: uvicorn).
3. Set the env vars Render doesn't auto-generate: `FERNET_KEY`,
   `DATABASE_URL` (use a Render Postgres instance, not SQLite, in production
   — SQLite on Render's ephemeral disk gets wiped on redeploy), `GEMINI_API_KEY`,
   `CORS_ORIGINS` (your Vercel frontend URL).

### Frontend → Vercel

1. Import the repo, set root directory to `frontend/`.
2. Framework preset: Vite.
3. Env var: `VITE_API_URL` = your Render backend URL.
4. `vercel.json` already handles SPA routing rewrites.

## Security notes (read before going to production)

- SMTP app passwords are encrypted with Fernet using `FERNET_KEY` — that key
  is the whole ballgame. Losing it means losing every stored credential;
  leaking it means every stored credential is exposed. Keep it in your
  platform's secret manager, never in git.
- Gmail SMTP caps you at ~500 sends/day per account. That's a hard ceiling
  this app can't bypass — it's on Google's end.
- Rate limiting, CSRF protection, and audit logging are **not** implemented
  yet. Fine for a personal/internal tool; add them before opening this to
  the public internet.
