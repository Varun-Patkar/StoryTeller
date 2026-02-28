# StoryTeller - AI Agent Context

**Version**: 1.0.0 | **Last Updated**: 2026-02-28  
**Purpose**: AI agent guidance for working with the StoryTeller codebase

---

## Project Overview

**StoryTeller** is a cinematic 3D web application for creating AI-powered interactive text adventures. The MVP focuses entirely on frontend UI/UX with mocked backend integration.

**Core Experience**:
1. Mystical boot sequence checks backend service connection
2. User selects AI model ("energy source") from dropdown
3. Cinematic 3D camera animations zoom from space toward Earth
4. Story Dashboard presents Resume/Create options with Earth rotating in background
5. Story Setup form collects character, premise, and goals
6. Final zoom transition morphs into minimalist reading interface with generated prologue

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

### 3. Modular File Organization

Per constitution Principle I (Extreme Modularity):

```
src/
├── canvas/           # Three.js scene setup (Scene.jsx, EarthModel.jsx)
├── animations/       # GSAP camera transitions (one file per transition)
├── components/
│   ├── ui/          # Phase-specific UI screens (BootSequence.jsx, etc.)
│   └── common/      # Reusable components (Button, Dropdown, TextArea)
├── services/        # State management (appState.js) + API (mockApi.js)
├── utils/           # Helpers (validation.js, animations.js)
└── styles/          # Tailwind imports + theme customization
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

## Mock API Contract

All backend calls simulated in `src/services/mockApi.js`:

### Available Functions

1. **`checkOllamaConnection()`** → `{ status: 'online' | 'offline', timestamp }`
2. **`getAvailableModels()`** → `AIModel[]`
3. **`getUserStories()`** → `StorySummary[]`
4. **`createStory(setup)`** → `Story` (with generated prologue)
5. **`getStoryById(id)`** → `Story`

### Realistic Delays
- Connection check: ~1000ms
- Model fetch: ~800ms
- Story creation: ~1200ms (simulates LLM generation)

### Error Simulation
- 20% offline rate for connection check
- 5% generation failure for story creation
- All errors return mystical messages (not technical jargon)

See `specs/001-frontend-mvp/contracts/mockApi.md` for full contract details.

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

## Deployment (Future)

MVP is local development only. Future deployment:

- **Static Host**: Vercel, Netlify, Cloudflare Pages
- **Build Command**: `npm run build`
- **Output Directory**: `dist/`
- **Environment Variables**: `VITE_API_URL` for real backend

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

- **Architecture**: `specs/001-frontend-mvp/research.md`
- **Data Entities**: `specs/001-frontend-mvp/data-model.md`
- **API Contract**: `specs/001-frontend-mvp/contracts/mockApi.md`
- **State Machine**: `specs/001-frontend-mvp/contracts/stateMachine.md`
- **Quick Start**: `specs/001-frontend-mvp/quickstart.md`
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
- **1.0.0** (2026-02-28): Initial version with React + Three.js + GSAP + Tailwind stack
