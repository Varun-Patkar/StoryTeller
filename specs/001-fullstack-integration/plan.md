# Implementation Plan: Fullstack Integration

**Branch**: `001-fullstack-integration` | **Date**: 2026-03-04 | **Spec**: [specs/001-fullstack-integration/spec.md](specs/001-fullstack-integration/spec.md)
**Input**: Feature specification from `/specs/001-fullstack-integration/spec.md`

## Summary

Extend the existing Vite + React + 3D Canvas frontend to replace mocked services with real BYOE Ollama streaming, add optional GitHub OAuth, and persist users/stories/passages via Vercel Node `/api` endpoints backed by MongoDB Atlas. The plan keeps LLM calls in the frontend and limits backend scope to authentication and persistence, while adding Book Name + Visibility controls and public-story forking behavior.

## Technical Context

**Language/Version**: JavaScript (React 18, Vite, Node.js 18+)  
**Primary Dependencies**: React, Vite, Tailwind CSS, Three.js, @react-three/fiber, @react-three/drei, GSAP, mongodb, jsonwebtoken, cookie  
**Storage**: MongoDB Atlas  
**Testing**: Manual QA (no automated test framework specified)  
**Target Platform**: Modern browsers + Vercel Serverless Functions  
**Project Type**: Web application with serverless backend  
**Performance Goals**: 60 FPS UI target, backend responses < 30s, stream tokens incrementally  
**Constraints**: LLM calls only from frontend; `/api` handles GitHub OAuth + persistence only; no secrets in frontend; files < 500 lines  
**Scale/Scope**: MVP scale with public/private stories, user-authored forks

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Preserve existing Vite + React + 3D Canvas frontend (no rewrite by default)
- LLM calls stay in frontend via `http://localhost:11434`
- `/api` handles MongoDB operations and GitHub OAuth only
- Secrets never appear in frontend code or responses
- Files remain under 500 meaningful lines with required docstrings
- Root markdown limited to README.md and AGENTS.md

**Post-design re-check**: PASS (design keeps LLM calls in frontend, `/api` only handles auth + persistence)

## Project Structure

### Documentation (this feature)

```text
specs/001-fullstack-integration/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
api/
├── auth/
│   ├── github.js           # OAuth callback, session cookie
│   └── me.js               # Current user from session
├── stories/
│   ├── explore.js          # GET public stories
│   ├── mine.js             # GET user stories
│   ├── create.js           # POST create story
│   └── fork.js             # POST fork story
└── _shared/
    ├── db.js               # MongoDB client helpers
    ├── http.js             # CORS and response helpers
    ├── oauth.js            # GitHub OAuth helpers
    ├── sessions.js         # JWT helpers + cookie config
    └── validation.js       # Input validation

src/
├── animations/
├── canvas/
├── components/
│   ├── common/
│   └── ui/
├── services/
│   ├── apiClient.js        # Fetch wrappers for `/api`
│   └── ollamaClient.js     # Fetch + streaming for Ollama
├── utils/
└── styles/

public/
└── earth-like/
```

**Structure Decision**: Keep the existing Vite app layout and add Vercel `/api` functions with shared helpers in `api/_shared/`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
