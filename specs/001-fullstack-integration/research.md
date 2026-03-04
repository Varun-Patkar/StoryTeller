# Research: Fullstack Integration

**Phase 0 Output** | **Created**: 2026-03-04  
**Purpose**: Document technical decisions, alternatives considered, and best practices for fullstack integration

---

## Technology Decisions

### Decision 1: Vercel Node `/api` + MongoDB Driver

**Decision**: Use Vercel Serverless Node functions with a module-level MongoDB client cache and explicit timeouts.

**Rationale**:
- Module-level client reuse reduces cold-start overhead and avoids connection storms.
- Explicit timeouts keep serverless functions from hanging on unreachable Atlas clusters.
- MongoDB Atlas integrates cleanly with `mongodb+srv://` URIs in environment variables.

**Alternatives considered**:
- **Mongoose ODM**: Rejected to keep serverless code lightweight and avoid extra abstraction.
- **Prisma with MongoDB**: Rejected for MVP due to added schema tooling overhead.

---

### Decision 2: GitHub OAuth + httpOnly JWT Cookie

**Decision**: Use GitHub OAuth callback flow and issue a short-lived JWT in an httpOnly cookie.

**Rationale**:
- httpOnly cookies protect tokens from XSS and align with optional login requirements.
- SameSite=Lax supports OAuth redirects without exposing tokens to frontend JavaScript.
- `/api/auth/me` provides a clean way to hydrate user state in the UI.

**Alternatives considered**:
- **LocalStorage tokens**: Rejected due to XSS risk.
- **Session store + server-side sessions**: Rejected for now to keep the backend stateless.

---

### Decision 3: Frontend Streaming from Ollama `/api/generate`

**Decision**: Stream tokens via native `fetch()` and parse NDJSON lines from Ollama’s `POST /api/generate` endpoint.

**Rationale**:
- Maintains BYOE requirement: frontend talks directly to local Ollama.
- Streaming chunks preserve the existing typewriter effect with real tokens.
- ReadableStream + TextDecoder works in modern browsers without extra dependencies.

**Alternatives considered**:
- **Backend proxy streaming**: Rejected by constitution (LLM calls must stay in frontend).
- **Polling full responses**: Rejected because it breaks real-time UX.

---

### Decision 4: CORS/Error Handling for Local Engine

**Decision**: Treat `fetch()` network failures as CORS/offline and show specific remediation guidance.

**Rationale**:
- Browsers do not expose detailed CORS failures to JavaScript.
- Fast failures suggest blocked CORS or mixed content; slow failures suggest offline service.
- User-facing instructions reduce confusion and unblock setup quickly.

**Alternatives considered**:
- **Automatic proxying**: Rejected because backend must not proxy Ollama.
- **Silent retries only**: Rejected because users need actionable guidance.

---

### Decision 5: Local Development with Dedicated Node API Server

**Decision**: Use `npm run dev` (Vite) and `npm run dev:api` (Node dev server) for reliable local routing and CORS behavior.

**Rationale**:
- Keeps frontend and backend logs isolated for faster debugging.
- Avoids local `vercel dev` routing/builder issues while preserving production `/api` contracts.

**Alternatives considered**:
- **`vercel dev` unified runtime**: Rejected for local iteration due to repeated function routing inconsistencies.
