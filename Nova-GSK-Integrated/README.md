# Nova GSK — Integrated Frontend + Backend

This repository combines the React/Vite frontend with the FastAPI symptom-to-care backend. The Symptom Education page now sends the user's entered text to the backend `/triage` endpoint and displays the backend's non-diagnostic care guidance and matched concepts.

## Stack
- Frontend: React, TypeScript, Vite
- Backend: FastAPI, Pydantic, local versioned JSON data
- Optional database overlay: MongoDB Atlas (not required; local data is the default)

## Run locally
Requirements: Node.js 20+ and Python 3.11+ (Python 3.12 recommended).

1. Install frontend packages from the repository root:
   ```bash
   npm install
   ```
2. Install backend packages:
   ```bash
   python -m venv .venv
   # Windows: .venv\\Scripts\\activate
   # macOS/Linux: source .venv/bin/activate
   pip install -r backend/requirements.txt
   ```
3. Start the backend in one terminal:
   ```bash
   python -m uvicorn app:app --app-dir backend --reload --host 127.0.0.1 --port 8000
   ```
4. Start the frontend in a second terminal:
   ```bash
   npm run dev
   ```
5. Open the Vite URL shown in the terminal (normally `http://localhost:3000`). The frontend proxies `/api/*` to `http://127.0.0.1:8000/*` in local development.

Check backend health at `http://127.0.0.1:8000/health` and API docs at `http://127.0.0.1:8000/docs`.

## Deployment
Deploy frontend and backend as two services from this same GitHub repository:

### Backend (Render)
- Create a new **Web Service** from this repo.
- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app:app --host 0.0.0.0 --port $PORT`
- Health check path: `/health`
- Set `CORS_ORIGINS` to the exact deployed frontend origin (for example `https://your-app.vercel.app`, with no trailing slash). A `backend/render.yaml` is included as a reference.

### Frontend (Vercel or another static host)
- Import the same GitHub repo.
- Build command: `npm run build`
- Output directory: `dist`
- Set `VITE_API_BASE_URL` to the backend origin, e.g. `https://your-backend.onrender.com` (no trailing slash).
- The frontend calls `${VITE_API_BASE_URL}/triage` when configured, or `/api/triage` in local development. If deploying somewhere other than Vercel, configure a rewrite/proxy for `/api` or set the environment variable.

## Tests
Backend tests:
```bash
pip install -r backend/requirements.txt
cd backend
pytest -q
```
Frontend checks:
```bash
npm install
npm run lint
npm run build
```

## Safety note
This project provides educational, non-diagnostic symptom-to-care guidance. It cannot diagnose PCOS or replace a qualified clinician. Do not deploy real patient data without a privacy and security review.


## Supabase/database note
The additional `Novagsk.zip` contained a `.env` with Supabase URL and anon-key entries, but it did **not** contain a SQL dump, migrations, table definitions, or database export. Its `.env` was deliberately not copied into this repository, so credentials are not leaked to GitHub. The current API runs with its included local JSON data and supports an optional MongoDB Atlas rules overlay (`MONGODB_URI`). For a safe Supabase starting point, see `backend/database/supabase_schema.sql`; it creates a minimal non-identifying prototype-events table with RLS enabled and no public policies. Add your Supabase project URL/key as environment variables only after deciding and configuring the required access policies. The current app does not persist raw symptom text to Supabase.
