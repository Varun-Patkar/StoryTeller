# Quickstart: Fullstack Integration

**Phase 1 Output** | **Created**: 2026-03-04  
**Purpose**: Fast reference for local development of the fullstack integration

---

## Prerequisites

- Node.js 18+ and npm
- Ollama installed locally
- MongoDB Atlas cluster and connection string
- GitHub OAuth App (Client ID + Client Secret)

---

## Required Environment Variables

Set these in your Vercel project and local `.env`:

- `MONGODB_URL`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `JWT_SECRET`
- `JWT_EXPIRATION_SECONDS`
- `CORS_ALLOWED_ORIGINS` (e.g., `http://localhost:5173,http://localhost:3000`)
- `BASE_URL` (backend public base URL)

**Important**: Do not expose any of these in frontend code.

---

## Start the Local Engine (BYOE)

Run Ollama with browser access enabled for your dev origin:

```bash
OLLAMA_ORIGINS="http://localhost:5173;http://localhost:3000" ollama serve
```

---

## Run the App Locally

From the repo root:

```bash
npm run dev:api
```

In a second terminal:

```bash
npm run dev
```

- Frontend runs on `http://localhost:5173`.
- API runs on `http://localhost:8000/api`.

---

## Validate the Flow

1. Open the app and confirm the engine connection succeeds.
2. If the engine fails, verify the CORS command and retry.
3. Sign in with GitHub and verify `/api/auth/me` returns the user (once OAuth tasks are complete).
4. Create a story with Book Name + Visibility and confirm it appears in Your Stories.
5. Browse Explore and fork a public story by submitting a response.
