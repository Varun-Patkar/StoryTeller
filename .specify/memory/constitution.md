<!--
SYNC IMPACT REPORT
==================
Version: 1.1.0 → 1.2.0 (MINOR - Vercel full-stack separation + preservation rules)
Ratification Date: 2026-02-28
Last Amended: 2026-03-04

Modified Principles:
- I. Extreme Modularity (applies to frontend + /api)
- II. Comprehensive Documentation (explicit Python docstrings)
- III. Markdown File Restrictions (root-only README/AGENTS)
- IV. Safe Dependency Management (npm + pip guidance)
- V. Explicit User Consent (explicit large-file rewrite gate)
- VII. Preserve Existing Frontend (new non-negotiable guardrail)
- VIII. Separation of Concerns (frontend LLM, /api MongoDB + GitHub OAuth)
- IX. Security First: Credential Management (frontend never sees secrets)

Added Sections:
- Vercel /api Architecture (serverless layout + shared utilities)

Templates Requiring Updates:
✅ .specify/templates/plan-template.md
✅ .specify/templates/spec-template.md
✅ .specify/templates/tasks-template.md
✅ README.md
✅ AGENTS.md
✅ specs/001-frontend-mvp/quickstart.md

Follow-up TODOs:
- None
-->

# StoryTeller Constitution

## Core Principles

### I. Extreme Modularity (NON-NEGOTIABLE)

**Every file MUST contain 500 lines or fewer of meaningful code (excluding imports and standard boilerplate).**

- **3D Canvas Logic**: All Three.js scene setup, geometry, materials, lighting, and rendering logic MUST be isolated in dedicated files under `src/canvas/` or equivalent
- **UI Overlay Components**: React components for UI overlays (HUD, menus, controls) MUST be separated from 3D logic and placed in `src/components/ui/`
- **Animation Logic**: GSAP timelines, camera animations, and transition sequences MUST be extracted into `src/animations/` with descriptive filenames
- **Service/Utility Separation**: API calls, state management, and utility functions MUST reside in `src/services/` and `src/utils/` respectively
- **Serverless API Separation**: Backend logic MUST live in `api/` with shared utilities in `api/_shared/` (or equivalent)
- **Single Responsibility**: Each file addresses ONE concern—if a component grows complex, extract sub-components or hooks immediately

**Rationale**: 3D web applications naturally accumulate complexity. Strict file size limits and separation of concerns ensure maintainability, enable parallel development, and make debugging tractable when dealing with rendering pipelines, animation sequences, and interactive UI layers.

### II. Comprehensive Documentation

**Every function, component, React hook, and complex animation block MUST have detailed inline comments.**

- **Functions**: Docstring or block comment explaining purpose, parameters, return values, and side effects
- **React Components**: JSDoc comment describing props, state, lifecycle behavior, and integration points
- **Python API Handlers**: Docstrings MUST include parameters, return shape, and side effects (DB writes, OAuth calls)
- **GSAP Animations**: Inline comments above each timeline or tween explaining the visual effect, duration rationale, and dependencies
- **Complex Logic**: If a block contains non-obvious calculations (e.g., quaternion math, raycasting, viewport transformations), add explanatory comments immediately above
- **ThreeJS Setup**: Document camera parameters, light configurations, post-processing passes, and why specific values were chosen

**Rationale**: 3D graphics and animation code is inherently abstract. Clear documentation enables team members (and future you) to understand spatial relationships, animation intent, and rendering optimizations without reverse-engineering shader code or transformation matrices.

### III. Markdown File Restrictions (NON-NEGOTIABLE)

**The project root MUST contain EXACTLY two user-facing markdown files:**

- **README.md**: Human-facing project overview, setup instructions, feature highlights, deployment guide
- **AGENTS.md**: AI agent context file containing architecture overview, coding conventions, and agent-specific guidance

**All other documentation MUST exist as inline comments within source code or within the `.specify/` and `specs/` directories for specification artifacts.**

**Rationale**: Prevents documentation fragmentation and maintenance overhead. Inline documentation stays synchronized with code changes. Specification artifacts in `.specify/` follow a structured workflow and are not user-facing documentation.

### IV. Safe Dependency Management

**Dependency installation MUST follow terminal-based workflows; package.json MUST NOT be manually edited with hallucinated version numbers.**

- When adding a new npm package, provide the user with: `npm i <package-name>` (installs latest stable)
- When adding a dev dependency: `npm i -D <package-name>`
- When a specific version is required (rare), user MUST explicitly request it: `npm i <package-name>@<version>`
- AI agents MUST NOT invent or assume version numbers—always defer to npm registry
- Use `npm ls <package>` to verify installed versions before troubleshooting compatibility issues
- Python dependencies MUST be installed via `pip install <package>` and captured in `requirements.txt` via `pip freeze`

**Rationale**: Prevents version conflicts, broken builds, and phantom dependency issues. The npm ecosystem evolves rapidly; letting the registry resolve versions ensures compatibility with the current Node.js environment and other installed packages.

### V. Explicit User Consent (NON-NEGOTIABLE)

**Before creating or replacing files exceeding 50 lines, AI agents MUST explain the intended changes and request explicit user approval.**

- **Explanation MUST include**: What will be created/modified, why it's necessary, which principles guide the structure, and estimated complexity
- **User MUST respond with**: Explicit go-ahead, modification request, or cancellation
- Incremental changes (e.g., adding a single component or function) MAY proceed without explicit prompt IF under the complexity threshold
- Refactoring existing large files (e.g., `src/App.jsx`, `src/routes.jsx`) MUST be explained BEFORE execution, highlighting what will be moved and why

**Rationale**: Prevents unintended code overwrites, ensures user understanding of structural changes, and maintains alignment with project goals. 3D applications involve interconnected rendering, animation, and UI state—unexpected changes can cascade into subtle breakages.

### VI. UI/UX Excellence

**The user experience MUST feel thematic, clean, and cinematic.**

- **Styling**: All UI overlays MUST use Tailwind CSS utility classes for consistency and rapid iteration
- **Design Language**: Establish a cohesive theme (colors, typography, spacing) documented in `src/styles/theme.js` or Tailwind config
- **Responsiveness**: UI layouts MUST adapt gracefully to viewport changes (mobile, tablet, desktop)
- **Accessibility**: Interactive elements MUST have proper focus states, ARIA labels where applicable, and keyboard navigation support
- **Performance**: UI renders MUST NOT block the 3D rendering loop—use React.memo, useMemo, and lazy loading where appropriate
- **Cinematics**: Camera transitions and scene changes SHOULD feel intentional—avoid jarring cuts; favor smooth GSAP easing

**Rationale**: 3D web applications compete with desktop and game experiences. A polished, accessible, and performant UI separates professional tools from technical demos. Tailwind ensures consistency without bloating stylesheets.

### VII. Preserve Existing Frontend (NON-NEGOTIABLE)

**The existing Vite + React + 3D Canvas frontend MUST be preserved and extended, not rewritten.**

- **No Rewrite by Default**: Do not replace core UI, canvas, or animation components unless required for backend/auth integration
- **Extension Over Replacement**: Prefer new components, hooks, or utilities to integrate backend functionality
- **Minimal Touch Surface**: Only change existing files when the new feature cannot be implemented elsewhere

**Rationale**: The current frontend already implements the cinematic experience and phase flow. Preserving it reduces regression risk and keeps momentum while adding backend capabilities.

### VIII. Separation of Concerns: Frontend LLM + Vercel /api (NON-NEGOTIABLE)

**LLM communication MUST remain in the React frontend via `http://localhost:11434` (BYOE).**

- **Frontend Responsibilities**: Model selection, Ollama health checks, story generation calls
- **Backend Responsibilities**: MongoDB operations and GitHub OAuth only
- **No LLM in /api**: The Vercel `/api` layer MUST NOT proxy or wrap Ollama calls
- **Clear Boundaries**: If data flows from frontend to backend, it MUST be data that needs persistence or auth

**Rationale**: This keeps BYOE local inference fast and private while using the backend only for persistence and authentication.

### IX. Security First: Credential Management (NON-NEGOTIABLE)

**MongoDB URIs and OAuth secrets MUST never appear in frontend code.**

- **Backend Env Vars Only**: Secrets live in backend environment variables and are loaded at runtime
- **Frontend Safe Config**: Frontend may only consume public, non-secret settings (if any)
- **Git Ignore**: `.env`, `.env.local`, `*.key`, `*.pem` MUST be ignored
- **Error Messages**: Never leak internal paths, database names, or service URLs in client-visible errors

**Rationale**: Secrets exposed to the browser are compromised by default. All credentials must stay server-side.

**Extension to Existing Principles:**

- **Principle I (Extreme Modularity)**: Applies to `/api` handlers and shared backend utilities
- **Principle II (Comprehensive Documentation)**: Backend handlers MUST include docstrings with parameters, returns, and side effects
- **Principle IV (Safe Dependency Management)**: Python deps installed via `pip install <package>`; `requirements.txt` generated via `pip freeze`
- **Principle V (Explicit User Consent)**: Explain large App/routing changes before any rewrite

## Technology Stack & Constraints

**Frontend (Mandatory Technologies):**

- **Frontend Framework**: React (with hooks) for UI components
- **3D Rendering**: Three.js for WebGL scene management
- **Animation Library**: GSAP (GreenSock Animation Platform) for camera, UI, and object animations
- **Styling**: Tailwind CSS for all UI overlay styling
- **Build Tool**: Vite or equivalent ES module bundler with fast HMR
- **Language**: JavaScript or TypeScript (prefer TypeScript for type safety in complex 3D transforms)

**Backend (Mandatory Technologies):**

- **Runtime**: Vercel Serverless Functions in `/api` (Python)
- **Language**: Python 3.10+ for backend handlers
- **Database**: MongoDB for persistence
- **Auth**: GitHub OAuth for user login
- **LLM Interface**: Ollama accessed directly from the React frontend via `http://localhost:11434`
- **Configuration**: Environment variables for all backend secrets
- **Type Hints**: Python type annotations (PEP 484) required for all function signatures
- **Package Management**: `pip` with `requirements.txt` (auto-generated via `pip freeze`)

**Performance Constraints:**

- **Frame Rate**: Target 60 FPS on mid-tier hardware; 30 FPS minimum on low-end devices
- **Initial Load**: First Contentful Paint (FCP) under 2 seconds on 3G connection
- **Asset Optimization**: 3D models MUST be compressed (Draco or meshopt); textures MUST use appropriate formats (WebP, KTX2)
- **Code Splitting**: Use dynamic imports for heavy dependencies (e.g., post-processing shaders, physics engines)
- **Backend Response Time**: API responses MUST complete within 30 seconds; frontend Ollama calls SHOULD timeout after 120 seconds with graceful user notification
- **Database Queries**: MongoDB queries MUST use indexes; no full-collection scans in production

**Prohibited Practices (Frontend):**

- Inline styles in JSX (use Tailwind classes)
- Direct DOM manipulation from 3D rendering code (use React state/refs)
- Synchronous asset loading in render loop (preload assets, show loading states)
- Global CSS files (Tailwind + CSS modules for rare exceptions only)

**Prohibited Practices (Backend):**

- Hardcoded credentials or OAuth secrets in source files
- Exposing MongoDB URIs or tokens in frontend responses
- Returning raw stack traces or internal errors to clients
- Using `/api` as a proxy for Ollama/LLM calls
- Storing tokens in plain text without appropriate encryption/rotation

## Performance Standards

**Rendering Performance:**

- **CPU Budget**: Main thread operations (animation ticks, raycasting) MUST complete within 16ms (60 FPS budget)
- **GPU Budget**: Draw calls per frame SHOULD NOT exceed 200; prefer instanced meshes and geometry merging
- **Memory**: Texture memory MUST stay below 512MB on mobile; dispose of unused geometries, materials, and textures promptly

**Asset Loading:**

- Implement progressive loading: low-poly models → high-poly models → textures
- Use loading screens or progress indicators during initial asset fetch
- Lazy load non-critical 3D elements (background scenery, optional effects)

**Monitoring:**

- Use `Stats.js` or browser DevTools Performance tab during development
- Log render times and memory usage in development builds
- Establish performance budgets in CI (e.g., bundle size limits, Lighthouse scores)

## Vercel /api Architecture

**Directory Structure:**

```
api/
├── health.py              # GET /api/health
├── stories.py             # POST/GET story persistence
├── auth/
│   └── github.py          # GitHub OAuth callback/exchange
└── _shared/
  ├── db.py              # MongoDB client/connection helpers
  ├── models.py          # Request/response shapes
  ├── oauth.py           # OAuth helpers
  └── validation.py      # Input validation

requirements.txt           # Python dependencies (auto-generated)
.env.example               # Template for developers (NO SECRETS)
```

**Layer Responsibilities:**

- **`api/` handlers**: Stateless Vercel functions; handle HTTP requests and call shared utilities
- **`api/_shared/`**: Reusable logic for MongoDB, OAuth, validation, and data shaping
- **`requirements.txt`**: Captures Python dependencies for the Vercel Python runtime
- **`.env.example`**: Documents required backend environment variables (no secrets)

## Development Workflow

**Pre-Implementation:**

1. **User Request**: Clearly document what needs to be built in `.specify/specs/[feature]/spec.md`
2. **Constitution Check**: Verify new feature aligns with all 9 core principles before design phase
3. **Design Phase**: Create plan, research, data-model, and contracts in `.specify/specs/[feature]/` per plan-template.md
4. **Layer Assignment**: Identify which `/api` handlers and shared utilities will be affected

**Implementation:**

1. **File Organization**: Follow plan.md structure; create directories BEFORE writing code
2. **Incremental Commits**: Commit after each logical unit (e.g., "Add story creation endpoint" or "Add GitHub OAuth callback")
3. **Inline Documentation**: Write docstrings and comments AS you write code, not after
  - Backend: Include parameter types, return types, and side effect notes
4. **Modularity Enforcement**: If a file approaches 400 lines, refactor BEFORE adding more features
5. **Dependency Installation**: Use terminal commands only: `pip install <package>` or `pip install -r requirements.txt`

**Code Review Gates:**

- **Line Count**: No file exceeds 500 meaningful lines
- **Documentation**: 
  - Frontend: Every exported function/component has inline documentation
  - Backend: Every service and route handler has docstring with types and side effects
- **Dependencies**: 
  - Frontend: All package.json changes made via `npm i` commands (verify with git diff)
  - Backend: All pip installs made via terminal; `requirements.txt` auto-generated via `pip freeze`
- **UI Consistency**: All new UI components use Tailwind and match design theme
- **Backend Security**: No hardcoded credentials; secrets only in backend env vars; input validation on all user inputs
- **Backend Scope**: `/api` handles MongoDB and GitHub OAuth only (no LLM proxying)
- **Performance**: 
  - Frontend: No new console errors; framerate remains above target on test devices
  - Backend: API responses < 30 seconds; database queries indexed; no full-collection scans

**Refactoring Protocol:**

- When refactoring existing code, explain changes to user BEFORE executing
- Break large refactors into small, testable increments
- Update inline documentation to reflect new structure
- Verify no orphaned imports or unused variables remain after changes

## Governance

**Constitution Authority:**

- This constitution supersedes all other coding practices, style guides, and ad-hoc decisions
- When conflicting guidance arises, principles in this constitution take precedence
- Exceptions MUST be justified in writing and approved by project owner

**Amendment Process:**

- Proposed amendments MUST include: rationale, affected principles, migration plan for existing code
- Version increments follow semantic versioning:
  - **MAJOR**: Backward-incompatible governance changes (e.g., removing a NON-NEGOTIABLE principle)
  - **MINOR**: New principle added or material expansion of existing principle
  - **PATCH**: Clarifications, wording improvements, typo fixes
- Amendments update the **Last Amended** date and increment **Version**

**Compliance:**

- All PRs and code reviews MUST verify adherence to these principles
- Complexity that violates principles MUST be justified in `specs/[feature]/plan.md` under "Complexity Tracking"
- Use `AGENTS.md` for runtime development guidance that complements this constitution

**Enforcement:**

- Automated checks (pre-commit hooks, CI linters) SHOULD enforce:
  - Frontend: Line count limits, Tailwind-only styling
  - Backend: Type hints via mypy, async-only routes via flake8, secrets scanning via GitGuardian
- Manual review ensures documentation quality, user consent protocol adherence, and security posture
- Performance budgets monitored via Lighthouse CI (frontend) and response-time logs (backend)

**Version**: 1.2.0 | **Ratified**: 2026-02-28 | **Last Amended**: 2026-03-04
