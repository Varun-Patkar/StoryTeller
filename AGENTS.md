# StoryTeller - AI Agent Context

**Version**: 2.0.0 | **Last Updated**: 2026-03-06  
**Purpose**: AI agent guidance for working with the StoryTeller codebase

---

## Project Overview

**StoryTeller** is a cinematic 3D web application for creating AI-powered interactive text adventures. The frontend is Vite + React + 3D Canvas with direct Ollama connectivity, while a lightweight Express.js backend handles MongoDB persistence and GitHub OAuth.

**Core Experience**:
1. Mystical boot sequence checks Ollama connection (localhost or custom URL)
2. Optional: Configure custom Ollama URL (devtunnels, hosted VM, or any Ollama-compatible API)
3. User selects AI model ("energy source") from dropdown
4. Cinematic 3D camera animations zoom from space toward Earth
5. Story Dashboard presents Explore/Your Stories with Earth rotating in background
6. Optional GitHub sign-in for personal story management
7. Story Setup form collects book name, character, premise, goals, and visibility
8. Final zoom transition morphs into minimalist reading interface with AI-generated prologue
9. Fork public stories by responding to them (creates copy under your authorship)

---

## Technology Stack

### Core Framework
- **React 18+**: Component-based UI with hooks
- **Vite**: Build tool and dev server (fast HMR)
- **TypeScript/JavaScript**: JavaScript for MVP (TypeScript optional for future)

### 3D Rendering
- **Three.js**: WebGL 3D graphics engine
- **@react-three/fiber**: React renderer for Three.js (declarative 3D)
- **@react-three/drei**: Helper components (useGLTF, lighting utilities)

### Animation
- **GSAP**: Camera animations and scene transitions
- **Framer Motion** (optional): DOM element animations

### Styling
- **Tailwind CSS**: Utility-first styling for all UI overlays
- **@tailwindcss/typography** (optional): Enhanced text styling for story reader

### State Management
- **React Context + useReducer**: Global app phase state machine
- **Custom Hooks**: Encapsulate logic (usePhaseTransition, useCameraAnimation)

### Backend (Vercel /api)
- **Runtime**: Express.js (single serverless function on Vercel)
- **Database**: MongoDB Atlas for story/user persistence
- **Auth**: GitHub OAuth for optional sign-in
- **Purpose**: Authentication and persistence ONLY (no Ollama proxy)

### Ollama Integration (Frontend Direct)
- **Connection**: React frontend connects directly to Ollama API
- **Default URL**: `http://localhost:11434` (BYOE - Bring Your Own Engine)
- **Custom URLs**: Support for devtunnels, hosted VMs, or any Ollama-compatible API
- **CORS Handling**: Frontend detects CORS errors and provides exact fix commands
- **Configuration**: OllamaUrlConfig component for setting custom URLs
- **Persistence**: Custom URL stored in localStorage for future sessions

---

## Architecture Principles

### 1. Canvas + UI Layer Separation

```
┌─────────────────────────────────────┐
│  UI Overlays (z-10+)                │  ← React components
│  - BootSequence, Dashboard, etc.   │
├─────────────────────────────────────┤
│  3D Canvas (z-0)                    │  ← @react-three/fiber
│  - Earth model, camera, lights     │
└─────────────────────────────────────┘
```

- **Canvas**: Absolute positioned, covers viewport, non-interactive (no raycasting in MVP)
- **UI**: Absolute positioned, higher z-index, receives all user input
- **Communication**: UI dispatches state changes → Canvas reacts to state → GSAP animates camera

### 2. Linear State Machine

5 phases, no backward navigation in MVP:

```
CHECKING_ENGINE → SELECTING_SOURCE → DASHBOARD → SETUP → PLAYING
```

- Phase transitions trigger GSAP camera animations
- UI components conditionally render based on current phase
- State machine enforces valid transitions (no phase skipping)

### 2.5 Routing + Model Persistence

- URL changes drive phase transitions via `useRouteSync`
- Invalid story slugs redirect to `/` (RootRoute sends to `/dashboard` when model is saved)
- Selected model is persisted in localStorage and validated against `getAvailableModels()` on startup
- Route sync waits for model hydration to prevent premature redirects

### 3. Modular File Organization

Per constitution Principle I (Extreme Modularity):

```
src/
├── canvas/           # Three.js scene setup (Scene.jsx, EarthModel.jsx)
├── animations/       # GSAP camera transitions (one file per transition)
├── components/
│   ├── ui/          # Phase-specific UI screens (BootSequence.jsx, etc.)
│   └── common/      # Reusable components (Button, Dropdown, TextArea)
├── services/
│   ├── appState.jsx       # Global state management (Context + useReducer)
│   ├── apiClient.js       # Backend API wrapper (/api/auth, /api/stories)
│   ├── ollamaClient.js    # Direct Ollama connection with streaming
│   ├── phaseTransition.js # Phase transition logic
│   ├── usePhaseTransition.js
│   └── useRouteSync.js    # URL/state synchronization
├── utils/           # Helpers (validation.js, animations.js, slugify.js)
└── styles/          # Tailwind imports + theme customization

api/
├── server.js        # Single Express.js serverless function (all routes)
├── _shared/         # Shared utilities (db, oauth, sessions, validation, http)
├── auth/            # Individual auth handlers (for reference/modularity)
└── stories/         # Individual story handlers (for reference/modularity)
```

**Rule**: No file exceeds 500 meaningful lines of code

---

## Coding Conventions

### File Naming
- **React Components**: PascalCase.jsx (e.g., `BootSequence.jsx`, `EarthModel.jsx`)
- **Utility Functions**: camelCase.js (e.g., `mockApi.js`, `validation.js`)
- **Animation Files**: camelCase.js (e.g., `spaceToEarth.js`, `earthToSurface.js`)
- **Constants**: UPPER_SNAKE_CASE in dedicated files (e.g., `PHASES.js`)

### Component Structure

```jsx
/**
 * ComponentName: Brief description of purpose
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.title - Example prop with type
 * @param {function} props.onAction - Callback for user action
 */
export default function ComponentName({ title, onAction }) {
  // 1. Hooks (state, context, effects)
  const [localState, setLocalState] = useState(null);
  const { state, dispatch } = useAppContext();
  
  useEffect(() => {
    // Side effects with cleanup
    return () => { /* cleanup */ };
  }, []);
  
  // 2. Event handlers
  const handleClick = () => {
    // Handler logic
  };
  
  // 3. Render logic
  return (
    <div className="tailwind-classes">
      {/* Content */}
    </div>
  );
}
```

### Documentation Requirements

Per constitution Principle II (Comprehensive Documentation):

1. **Every function/component**: JSDoc block comment
2. **Complex logic**: Inline comments explaining WHY, not WHAT
3. **GSAP animations**: Document duration, easing choice, target values
4. **Three.js setup**: Explain camera position, light intensity choices

Example:
```javascript
/**
 * Animate camera from deep space to medium Earth orbit
 * 
 * Uses power2.out easing for smooth deceleration (cinematic feel).
 * Duration: 4 seconds balances drama with user patience.
 * 
 * @param {THREE.Camera} camera - Three.js camera object to animate
 * @param {function} onComplete - Callback when animation finishes
 * @returns {gsap.core.Timeline} GSAP timeline (for cancellation support)
 */
export function animateSpaceToEarth(camera, onComplete) {
  return gsap.timeline({ onComplete })
    .to(camera.position, {
      z: 150,           // Medium orbit distance
      duration: 4,
      ease: 'power2.out'
    });
}
```

### Tailwind Usage

- **All UI styling via Tailwind utilities** (no inline styles, no CSS files)
- **Custom theme** in `tailwind.config.js`:
  ```javascript
  theme: {
    extend: {
      colors: {
        dreamGold: '#FFD700',    // Mystical accent color
        voidPurple: '#6B46C1',   // Primary theme color
        starSilver: '#E2E8F0'    // Text color
      }
    }
  }
  ```
- **Responsive design**: Use `sm:`, `md:`, `lg:` prefixes for breakpoints
- **Dark mode ready**: Use `dark:` prefix (MVP defaults to dark theme)

### State Management Pattern

```javascript
// In component
const { state, dispatch } = useAppContext();

// Dispatch action
dispatch({ 
  type: 'MODEL_SELECTED', 
  payload: { model: selectedModel } 
});

// Read state
if (state.phase === 'DASHBOARD' && !state.isTransitioning) {
  // Render dashboard UI
}
```

**Avoid**:
- Prop drilling (use Context for deep state)
- Direct state mutation (always dispatch actions)
- Synchronous transitions (wait for animations via `isTransitioning` flag)

---

## Common Patterns

### Pattern 1: Phase-Based Conditional Rendering

```jsx
export default function UIRouter() {
  const { state } = useAppContext();
  
  return (
    <>
      {state.phase === 'CHECKING_ENGINE' && <BootSequence />}
      {state.phase === 'SELECTING_SOURCE' && <ModelSelector />}
      {state.phase === 'DASHBOARD' && <Dashboard />}
      {state.phase === 'SETUP' && <StorySetup />}
      {state.phase === 'PLAYING' && <StoryReader />}
    </>
  );
}
```

### Pattern 2: Animation-Triggered Phase Transition

```javascript
// In component
const handleCreateNew = () => {
  dispatch({ type: 'TRANSITION_TO_SETUP' }); // Sets isTransitioning = true
};

// In custom hook usePhaseTransition
useEffect(() => {
  if (state.transitionTarget === 'SETUP') {
    animateEarthToSurface(cameraRef.current, () => {
      dispatch({ type: 'TRANSITION_COMPLETE', payload: { targetPhase: 'SETUP' } });
    });
  }
}, [state.transitionTarget]);
```

### Pattern 3: Form Validation with Mystical Errors

```javascript
// In validation.js
export function validateCharacter(text) {
  if (text.length < 10) {
    return { valid: false, message: 'The protagonist awaits definition...' };
  }
  if (text.length > 500) {
    return { valid: false, message: 'Brevity sharpens the vision...' };
  }
  return { valid: true };
}

// In component
const [errors, setErrors] = useState({});

const handleBlur = (field, value) => {
  const result = validateCharacter(value);
  setErrors(prev => ({ ...prev, character: result.message }));
};
```

### Pattern 4: 3D Model Loading with Suspense

```jsx
import { Suspense } from 'react';
import { useGLTF } from '@react-three/drei';

function EarthModel() {
  const { scene } = useGLTF('/earth-like/source/Untitled.glb');
  return <primitive object={scene} />;
}

export default function Scene() {
  return (
    <Suspense fallback={null}>
      <EarthModel />
    </Suspense>
  );
}

// Preload in App.jsx
useGLTF.preload('/earth-like/source/Untitled.glb');
```

---

## API Architecture

### Ollama API (Frontend Direct Connection)

Frontend connects directly to Ollama using `src/services/ollamaClient.js`:

1. **`checkOllamaConnection()`** → `{ status: 'online' | 'offline' | 'cors_error', timestamp }`
2. **`getAvailableModels()`** → `AIModel[]` from `/api/tags`
3. **`generatePrologue(setup)`** → Streaming response from `/api/generate`
4. **`generatePassage(context)`** → Streaming response with choices

**Custom URL Support**:
- Default: `http://localhost:11434`
- Custom: Any URL (devtunnels, hosted VM, Ollama-compatible API)
- Stored in: `localStorage.getItem('devTunnelUrl')` or `localStorage.getItem('ollamaBaseUrl')`
- Configured via: OllamaUrlConfig component

**CORS Handling**:
- Detects CORS errors and shows fix command
- PowerShell: `$env:OLLAMA_ORIGINS="http://localhost:5173;https://*"; ollama serve`
- Unix/Mac: `OLLAMA_ORIGINS="http://localhost:5173,https://*" ollama serve`

### Backend API (Express.js on Vercel)

Backend at `api/server.js` handles auth + persistence via `src/services/apiClient.js`:

**Authentication Routes**:
- `POST /api/auth/github` - Initiate GitHub OAuth
- `GET /api/auth/callback` - Complete OAuth and set session cookie
- `POST /api/auth/logout` - Clear session
- `GET /api/auth/me` - Get current user

**Story Routes**:
- `POST /api/stories/create` - Create new story
- `GET /api/stories/mine` - Get user's stories (auth required)
- `GET /api/stories/explore` - Get public stories
- `GET /api/stories/by-slug?slug=...` - Get story by slug
- `POST /api/stories/fork` - Fork public story (requires auth)
- `PUT /api/stories/:id` - Update story passage
- `DELETE /api/stories/:id` - Delete story

**Shared Utilities** (`api/_shared/`):
- `db.js` - MongoDB client with connection pooling
- `oauth.js` - GitHub OAuth helpers
- `sessions.js` - JWT session management
- `validation.js` - Request validation
- `http.js` - Response helpers

See `specs/001-fullstack-integration/contracts/` for full API contracts.

---

## Performance Guidelines

### Target Metrics (from spec)
- **Frame Rate**: 30 FPS minimum, 60 FPS target
- **Initial Load**: First Contentful Paint <2 seconds
- **Animation Smoothness**: No jank; use GPU-accelerated transforms
- **Bundle Size**: <500KB initial JS (excluding 3D assets)

### Optimization Strategies

1. **Code Splitting**:
   ```javascript
   const StoryReader = React.lazy(() => import('./components/ui/StoryReader'));
   ```

2. **React Optimization**:
   ```javascript
   const MemoizedCard = React.memo(StoryCard);
   const expensiveValue = useMemo(() => computeValue(data), [data]);
   ```

3. **GSAP Performance**:
   - Animate `transform` properties (GPU-accelerated)
   - Use `will-change: transform` on animating elements
   - Kill timelines on component unmount

4. **Three.js Optimization**:
   - Single Earth model (no duplicates)
   - Dispose geometries/materials on unmount
   - Use LOD (Level of Detail) for high-poly models (future)

### Monitoring Tools

- **Dev Mode**: `<Stats />` from @react-three/drei (shows FPS, MS, MB)
- **Production**: Lighthouse CI, Web Vitals library
- **Frame Timing**: `useFrame` hook to track delta times

---

## Testing Strategy (Future)

MVP does not include tests per constitution (no test-first principle), but when adding tests:

- **Unit**: Mock API response shapes, validation functions
- **Integration**: Phase transitions, form submissions
- **Visual Regression**: UI screenshots (Percy, Chromatic)
- **Performance**: Automated FPS monitoring

---

## Deployment

**Current Status**: Deployed to Vercel with Express.js backend

### Vercel Configuration

- **Frontend**: Vite build (`npm run build` → `dist/`)
- **Backend**: Single Express.js serverless function at `/api/server.js`
- **Rewrites**: All `/api/*` routes to `server.js`, all other routes to SPA
- **See**: `vercel.json` for routing configuration

### Environment Variables (Backend)

**Required**:
- `MONGODB_URI` - MongoDB Atlas connection string
- `GITHUB_CLIENT_ID` - GitHub OAuth App ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth secret
- `JWT_SECRET` - Session token signing key
- `BASE_URL` - Deployed app URL (e.g., `https://storyteller.vercel.app`)

**Optional**:
- `CORS_ALLOWED_ORIGINS` - Comma-separated origins (default: `http://localhost:5173,http://localhost:3000`)

**Frontend** (no env vars required):
- Ollama URL configurable via UI (OllamaUrlConfig component)
- Backend API detected automatically (`/api` relative paths)

### Ollama Access from Deployed App

**Option 1: VS Code Dev Tunnels**
```bash
# In VS Code, forward port 11434 with public access
# Copy the tunnel URL (e.g., https://xyz-123.devtunnels.ms)
```

**Option 2: PowerShell Dev Tunnels**
```powershell
devtunnel create --allow-anonymous
devtunnel port create -p 11434
devtunnel host
# Copy the public URL
```

**Option 3: Hosted VM**
- Deploy Ollama to cloud VM (Azure, AWS, GCP)
- Expose port 11434 with reverse proxy (Nginx)
- Configure SSL/TLS
- Enter public URL in OllamaUrlConfig

**Option 4: Any Ollama-Compatible API**
- Enter API endpoint URL in OllamaUrlConfig
- Must support Ollama API contract (`/api/tags`, `/api/generate`)

---

## Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| Canvas not rendering | Check WebGL support, verify GLB path in `public/` |
| UI not clickable | Add `pointer-events-auto` to interactive elements |
| Animation stuck | Check `isTransitioning` state, ensure `onComplete` dispatches |
| Slow dev server | Clear Vite cache: `rm -rf node_modules/.vite` |
| Type errors (if using TS) | Install types: `npm i -D @types/three` |

---

## Key Reference Files

- **Fullstack Spec**: `specs/001-fullstack-integration/spec.md`
- **Data Model**: `specs/001-fullstack-integration/data-model.md`
- **Implementation Plan**: `specs/001-fullstack-integration/plan.md`
- **Tasks**: `specs/001-fullstack-integration/tasks.md`
- **API Contracts**: `specs/001-fullstack-integration/contracts/`
  - `auth.md` - GitHub OAuth flow
  - `ollama.md` - Ollama API integration
  - `stories.md` - Story persistence endpoints
- **Quick Start**: `specs/001-fullstack-integration/quickstart.md`
- **Constitution**: `.specify/memory/constitution.md`

---

## AI Agent Guidelines

When assisting with this codebase:

1. **Always check constitution** before suggesting code patterns
2. **Enforce 500-line limit** - suggest refactoring if files grow large
3. **Add inline documentation** - never generate undocumented code
4. **Use Tailwind only** - reject CSS file or inline style suggestions
5. **Respect state machine** - validate phase transitions before implementation
6. **Provide terminal commands** for dependencies (never edit package.json manually)
7. **Ask for user consent** before creating/replacing files >50 lines
8. **Keep spec files tech-agnostic** - implementation details belong in code, not specs

---

**Version History**:
- **2.0.0** (2026-03-06): Fullstack integration complete
  - Express.js single serverless backend (auth + persistence only)
  - Direct frontend Ollama connection with custom URL support
  - GitHub OAuth integration
  - Story forking, visibility controls, fandom support
  - MongoDB persistence for users and stories
- **1.0.0** (2026-02-28): Initial MVP with React + Three.js + GSAP + Tailwind stack
