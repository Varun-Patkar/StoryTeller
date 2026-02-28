# Quickstart: StoryTeller Frontend MVP

**Phase 1 Output** | **Created**: 2026-02-28  
**Purpose**: Fast reference guide for developers working on the StoryTeller frontend

---

## 30-Second Overview

**What**: Cinematic 3D web app for AI-powered text adventures  
**Stack**: React + Vite + Three.js (@react-three/fiber) + GSAP + Tailwind  
**Architecture**: 3D canvas background + UI overlay layers  
**State**: Linear phase machine (Boot → Model Select → Dashboard → Setup → Story)  
**Backend**: Fully mocked (no real API calls in MVP)

---

## Installation & Setup

### Prerequisites

- Node.js 18+ (20+ recommended)
- npm 9+ or pnpm 8+
- Modern browser with WebGL support

### Install Dependencies

```bash
# From project root
npm install

# Expected packages (do NOT manually add versions to package.json)
npm i react react-dom
npm i vite
npm i @vitejs/plugin-react
npm i tailwindcss postcss autoprefixer
npm i gsap
npm i three @types/three
npm i @react-three/fiber @react-three/drei
npm i -D @tailwindcss/typography
```

### Project Structure

```
src/
├── canvas/              # Three.js scene components
│   ├── Scene.jsx       # Main canvas setup (lights, camera)
│   ├── EarthModel.jsx  # GLB loader + Earth rendering
│   └── Environment.jsx # Background (stars, space)
├── animations/          # GSAP camera transitions
│   ├── spaceToEarth.js
│   ├── earthToSurface.js
│   └── surfaceToStory.js
├── components/
│   ├── ui/             # React UI overlays
│   │   ├── BootSequence.jsx
│   │   ├── ModelSelector.jsx
│   │   ├── Dashboard.jsx
│   │   ├── StorySetup.jsx
│   │   └── StoryReader.jsx
│   └── common/         # Reusable UI components
│       ├── Button.jsx
│       ├── Dropdown.jsx
│       └── TextArea.jsx
├── services/            # State + API
│   ├── appState.js     # Context + reducer
│   └── mockApi.js      # Mocked backend calls
├── utils/               # Helpers
│   ├── validation.js   # Form validation
│   └── animations.js   # GSAP utils
├── styles/
│   └── index.css       # Tailwind imports + custom styles
├── App.jsx              # Root component
└── main.jsx             # Vite entry point

public/
└── earth-like/
    ├── source/
    │   └── Untitled.glb  # 3D Earth model
    └── textures/
        └── [texture files]
```

---

## Running the App

### Development Server

```bash
npm run dev
# Opens http://localhost:5173
# Hot reload enabled for rapid iteration
```

### Build for Production

```bash
npm run build
# Output: dist/
# Generates optimized bundle with code splitting
```

### Preview Production Build

```bash
npm run preview
# Tests production build locally
```

---

## Key Files to Start With

### 1. `src/App.jsx` - Main Entry Point

```jsx
/**
 * Root component: Sets up canvas + UI layers
 * Canvas (z-0) renders behind UI overlays (z-10+)
 */
import { Canvas } from '@react-three/fiber';
import { AppProvider } from './services/appState';
import Scene from './canvas/Scene';
import UIRouter from './components/UIRouter';

export default function App() {
  return (
    <AppProvider>
      <div className="relative w-full h-screen overflow-hidden">
        {/* 3D Canvas Background */}
        <Canvas className="absolute inset-0 z-0">
          <Scene />
        </Canvas>
        
        {/* UI Overlay Layer */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          <UIRouter />
        </div>
      </div>
    </AppProvider>
  );
}
```

### 2. `src/services/appState.js` - State Management

```javascript
/**
 * Global app state using Context + useReducer
 * Manages phase transitions and UI state
 */
import { createContext, useReducer, useContext } from 'react';

const AppContext = createContext();

const initialState = {
  phase: 'CHECKING_ENGINE',
  isTransitioning: false,
  connectionStatus: 'CHECKING',
  selectedModel: null,
  currentStoryId: null,
  error: null
};

function appReducer(state, action) {
  // See contracts/stateMachine.md for full action definitions
  switch (action.type) {
    case 'CONNECTION_CHECK_SUCCESS':
      return { ...state, phase: 'SELECTING_SOURCE', connectionStatus: 'ONLINE' };
    // ... other actions
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
```

### 3. `src/services/mockApi.js` - Backend Simulation

```javascript
/**
 * Mocked API calls with realistic delays
 * See contracts/mockApi.md for full contract
 */

// Simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function checkOllamaConnection() {
  await delay(1000);
  return { 
    status: Math.random() > 0.2 ? 'online' : 'offline',
    timestamp: new Date().toISOString()
  };
}

export async function getAvailableModels() {
  await delay(800);
  return [
    { id: 'llama3-8b', name: 'Llama 3', displayName: 'The Dreamer', description: '...' },
    { id: 'mistral-7b', name: 'Mistral', displayName: 'The Weaver', description: '...' }
  ];
}

export async function createStory(setup) {
  await delay(1200);
  // Validate setup fields
  if (setup.character.length < 10) {
    throw { error: 'VALIDATION_ERROR', message: 'Character too short', field: 'character' };
  }
  return {
    id: crypto.randomUUID(),
    title: `${setup.fandom} - ${setup.character.split(' ').slice(0, 3).join(' ')}`,
    setup,
    currentPassage: '[Mocked prologue text...]',
    createdAt: new Date().toISOString(),
    wordCount: 287
  };
}
```

### 4. `src/animations/spaceToEarth.js` - Camera Animation

```javascript
/**
 * GSAP animation: Zoom from deep space to Earth
 * Triggered on SELECTING_SOURCE → DASHBOARD transition
 */
import gsap from 'gsap';

export function animateSpaceToEarth(camera, onComplete) {
  const timeline = gsap.timeline({ onComplete });
  
  // Start: Camera far from Earth (z=1000)
  camera.position.set(0, 0, 1000);
  
  // Animate: Zoom toward Earth over 4 seconds
  timeline.to(camera.position, {
    z: 150,           // Medium distance
    duration: 4,
    ease: 'power2.out' // Smooth deceleration
  });
  
  return timeline; // Return for cancellation if needed
}
```

### 5. `src/components/ui/BootSequence.jsx` - First UI Screen

```jsx
/**
 * Boot sequence: Check connection, show mystical loading
 * Active during CHECKING_ENGINE phase
 */
import { useEffect } from 'react';
import { useAppContext } from '../../services/appState';
import { checkOllamaConnection } from '../../services/mockApi';

export default function BootSequence() {
  const { state, dispatch } = useAppContext();
  
  useEffect(() => {
    // Start connection check on mount
    dispatch({ type: 'CONNECTION_CHECK_START' });
    
    checkOllamaConnection()
      .then(result => {
        if (result.status === 'online') {
          dispatch({ type: 'CONNECTION_CHECK_SUCCESS', payload: result });
        } else {
          dispatch({ type: 'CONNECTION_CHECK_FAILURE', payload: result });
        }
      })
      .catch(error => {
        dispatch({ type: 'CONNECTION_CHECK_FAILURE', payload: { message: error.message } });
      });
  }, []);
  
  return (
    <div className="flex items-center justify-center h-screen pointer-events-auto">
      <div className="text-center">
        {state.connectionStatus === 'CHECKING' && (
          <>
            <div className="animate-pulse text-4xl mb-4">✨</div>
            <p className="text-xl text-purple-300">Awakening the gateway...</p>
          </>
        )}
        
        {state.connectionStatus === 'OFFLINE' && (
          <>
            <p className="text-xl text-amber-300 mb-4">
              The gateway sleeps. Awaken it to begin your journey.
            </p>
            <button 
              onClick={() => /* retry logic */}
              className="px-6 py-3 bg-purple-600 rounded-lg"
            >
              Retry Connection
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

---

## Common Tasks

### Add a New UI Component

1. Create component in `src/components/ui/ComponentName.jsx`
2. Follow constitution: max 500 lines, add JSDoc comments
3. Use Tailwind classes for styling (no inline styles)
4. Import and use in `UIRouter.jsx` based on phase

```jsx
/**
 * ComponentName: [Brief description]
 * 
 * @component
 * @param {Object} props - Component props
 * @param {function} props.onAction - Callback for user action
 */
export default function ComponentName({ onAction }) {
  return (
    <div className="pointer-events-auto">
      {/* Content */}
    </div>
  );
}
```

### Add a GSAP Animation

1. Create animation file in `src/animations/animationName.js`
2. Export function that accepts camera/object refs and onComplete callback
3. Document animation parameters (duration, easing, target values)
4. Return timeline for cancellation support

```javascript
/**
 * Animate camera from position A to position B
 * 
 * @param {THREE.Camera} camera - Three.js camera object
 * @param {function} onComplete - Callback when animation finishes
 * @returns {gsap.core.Timeline} GSAP timeline (for cancellation)
 */
export function animateExample(camera, onComplete) {
  return gsap.timeline({ onComplete })
    .to(camera.position, { x: 10, duration: 2, ease: 'power2.inOut' });
}
```

### Add a State Action

1. Define action type in `src/services/appState.js` reducer
2. Document in `contracts/stateMachine.md`
3. Add validation logic (check current phase, required fields)
4. Update state immutably

```javascript
case 'NEW_ACTION':
  // Validate
  if (state.phase !== 'EXPECTED_PHASE') {
    console.error('Invalid phase for this action');
    return state;
  }
  // Update state
  return {
    ...state,
    someField: action.payload.value
  };
```

### Modify Mock API Response

1. Edit function in `src/services/mockApi.js`
2. Update response shape (must match contract in `contracts/mockApi.md`)
3. Adjust delay if needed (realistic network timing)
4. Update consumers if response shape changes

---

## Debugging Tips

### Check Current Phase

```javascript
const { state } = useAppContext();
console.log('Current phase:', state.phase);
console.log('Is transitioning:', state.isTransitioning);
```

### Monitor Frame Rate

```jsx
// Add to Scene.jsx during development
import { Stats } from '@react-three/drei';

export default function Scene() {
  return (
    <>
      <Stats />  {/* Shows FPS, MS, MB */}
      {/* rest of scene */}
    </>
  );
}
```

### Test Offline Mode

```javascript
// In mockApi.js, force offline
export async function checkOllamaConnection() {
  await delay(1000);
  return { status: 'offline', timestamp: new Date().toISOString() };
}
```

### Skip Phases for Testing

```javascript
// In appState.js, change initialState
const initialState = {
  phase: 'SETUP',  // Start directly in setup phase
  selectedModel: { id: 'llama3-8b', name: 'Llama 3' }, // Mock selected model
  // ...
};
```

### Disable Animations

```javascript
// In animation files, skip GSAP and call onComplete immediately
export function animateSpaceToEarth(camera, onComplete) {
  onComplete(); // Skip animation for fast testing
  return { kill: () => {} }; // Return dummy timeline
}
```

---

## Constitution Compliance Checklist

Before committing code, verify:

- [ ] **No file exceeds 500 meaningful lines** (check with `wc -l` or editor status)
- [ ] **All functions have JSDoc comments** explaining purpose, params, returns
- [ ] **All GSAP animations documented** with duration, easing, and WHY
- [ ] **No manual package.json edits** (only via `npm i` commands)
- [ ] **All UI uses Tailwind classes** (no inline styles, no CSS files)
- [ ] **3D logic separated from UI logic** (canvas/ vs components/)
- [ ] **State machine transitions validated** (no invalid phase jumps)
- [ ] **No hardcoded implementation details in spec files** (keep plan/, research/, contracts/ tech-agnostic where possible)

---

## Performance Targets

From spec (SC-002, SC-007):

- **Frame Rate**: 30 FPS minimum, 60 FPS target
- **Initial Load**: FCP <2 seconds on 3G
- **Animation Smoothness**: No jank; use `will-change: transform` on animating elements
- **Bundle Size**: <500KB initial JS (excluding 3D assets)

**Monitoring**:
```bash
# Check bundle size
npm run build
ls -lh dist/assets/*.js

# Test performance
npm run preview
# Open DevTools → Lighthouse → Run audit
```

---

## Troubleshooting

### Canvas Not Rendering

- Check browser WebGL support: Visit https://get.webgl.org/
- Verify `/earth-like/source/Untitled.glb` exists in `public/`
- Check console for Three.js errors

### UI Not Visible

- Verify `z-index` layering (Canvas z-0, UI z-10+)
- Add `pointer-events-auto` to interactive elements
- Check if phase state allows current UI to render

### Animations Not Playing

- Verify phase transition dispatched (check `isTransitioning` state)
- Ensure `onComplete` callback dispatches `TRANSITION_COMPLETE`
- Check GSAP timeline not killed prematurely

### Mock API Delays Too Long

- Reduce delay values in `mockApi.js` (e.g., 1000ms → 200ms for dev)
- Remember to restore realistic delays before committing

---

## Next Steps After Quickstart

1. **Read `research.md`** for detailed technology decisions
2. **Study `data-model.md`** to understand entity relationships
3. **Review `contracts/`** for API and state machine contracts
4. **Start implementation** following task list (will be in `tasks.md` after `/speckit.tasks`)

---

## Useful Commands Reference

```bash
# Development
npm run dev                  # Start dev server (http://localhost:5173)

# Build
npm run build                # Production build → dist/
npm run preview              # Preview production build

# Linting (if configured)
npm run lint                 # Check code style
npm run lint:fix             # Auto-fix issues

# Dependencies
npm i <package>              # Add runtime dependency
npm i -D <package>           # Add dev dependency
npm ls <package>             # Check installed version
npm outdated                 # Check for updates

# Git
git status                   # Check current branch and changes
git add .                    # Stage all changes
git commit -m "message"      # Commit with message
git push origin 001-frontend-mvp  # Push to feature branch
```

---

## Resources

- **React Docs**: https://react.dev/
- **Vite Docs**: https://vitejs.dev/
- **Three.js Docs**: https://threejs.org/docs/
- **@react-three/fiber**: https://docs.pmnd.rs/react-three-fiber/
- **@react-three/drei**: https://github.com/pmndrs/drei
- **GSAP Docs**: https://gsap.com/docs/v3/
- **Tailwind Docs**: https://tailwindcss.com/docs

---

**Ready to code!** Start with `src/App.jsx` and `src/services/appState.js`, then build out UI components phase by phase.
