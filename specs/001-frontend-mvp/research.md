# Research: StoryTeller Frontend MVP

**Phase 0 Output** | **Created**: 2026-02-28  
**Purpose**: Document technical decisions, alternatives considered, and best practices for the 3D web application

---

## Technology Decisions

### Decision 1: React + Vite

**What was chosen**: React 18+ with Vite as the build tool and development server

**Rationale**:
- **Vite**: Instant HMR (Hot Module Replacement) essential for rapid UI iteration; native ES modules eliminate bundle overhead during development; optimized production builds with code splitting
- **React**: Component-based architecture aligns perfectly with constitution's modularity principles; hooks enable clean separation of concerns (useContext for state, custom hooks for 3D/animation logic); mature ecosystem with @react-three/fiber integration

**Alternatives considered**:
- **Vue + Vite**: Rejected because React has better Three.js integration via @react-three/fiber and larger ecosystem for 3D web apps
- **Vanilla JS + Three.js**: Rejected because managing UI state, transitions, and component lifecycle manually would violate modularity principles and increase complexity
- **Next.js**: Rejected because SSR/SSG features unnecessary for frontend-only MVP; Vite offers faster dev experience for SPA

---

### Decision 2: @react-three/fiber + @react-three/drei

**What was chosen**: @react-three/fiber as the React renderer for Three.js, with @react-three/drei for helper components

**Rationale**:
- **Declarative 3D**: Aligns with React's declarative philosophy; scene graph represented as JSX components rather than imperative Three.js API calls
- **Automatic Cleanup**: React lifecycle handles Three.js resource disposal (geometries, materials, textures), preventing memory leaks
- **Integration with React State**: Camera animations and scene transitions can react to UI state changes seamlessly
- **drei Utilities**: `useGLTF` for efficient model loading with caching; `OrbitControls` for debugging; `Environment` for lighting setups

**Alternatives considered**:
- **Vanilla Three.js**: Rejected because manual resource management conflicts with React patterns; imperative API would mix poorly with declarative UI components
- **React-Three-Rapier** (physics): Deferred to future phases; no physics requirements in MVP spec

**Best Practices**:
- Keep Three.js logic in `src/canvas/` components; never mix Three.js imperative calls into UI components
- Use `useFrame` hook for animation loop updates (rotation, camera tweaks)
- Preload 3D assets with `useGLTF.preload()` to avoid loading flicker

---

### Decision 3: GSAP for Camera Animations

**What was chosen**: GSAP (GreenSock Animation Platform) for controlling camera position/rotation during state transitions

**Rationale**:
- **Precise Control**: GSAP provides sub-frame precision and easing control required for cinematic camera movements (spec: "smooth easing over 2-3 seconds")
- **Timeline Management**: Complex multi-stage animations (zoom + fade + rotation) manageable via GSAP timelines
- **Performance**: GSAP optimizes RAF (requestAnimationFrame) calls; won't conflict with Three.js render loop
- **Separation from Three.js**: GSAP animates camera.position/rotation values; @react-three/fiber reacts to changes automatically

**Alternatives considered**:
- **React-Spring**: Rejected because physics-based springs inappropriate for intentional cinematic timing; harder to control exact durations
- **Framer Motion**: Rejected for 3D camera control (better for DOM/SVG); GSAP has better Three.js community patterns
- **Three.js Tween.js**: Rejected because GSAP offers richer easing library and timeline features

**Best Practices**:
- Store GSAP timelines in `src/animations/` modules (e.g., `cameraTransitions.js`)
- Use `gsap.context()` to scope animations to React component lifecycle
- Document easing choices: `power2.out` for zoom-in (deceleration), `power1.inOut` for rotations
- Cancel timelines on component unmount to prevent orphaned animations

---

### Decision 4: Tailwind CSS for UI Styling

**What was chosen**: Tailwind CSS utility-first framework for all UI overlay styling

**Rationale**:
- **Constitution Requirement**: Principle VI explicitly mandates Tailwind for consistency and rapid iteration
- **Utility-First**: Avoids CSS file sprawl; styles co-located with components align with constitution's "inline documentation" philosophy
- **Theming**: Tailwind config centralizes mystical/thematic color palette, typography scales, and spacing
- **No Conflicts with Canvas**: Tailwind styles DOM overlays; doesn't interfere with WebGL canvas rendering

**Alternatives considered**:
- **CSS Modules**: Rejected because separate CSS files violate constitution's preference for co-location
- **Styled-Components**: Rejected due to runtime CSS-in-JS overhead that could impact 3D rendering performance
- **Plain CSS**: Rejected because no centralized theming and harder to maintain consistency

**Best Practices**:
- Define mystical theme in `tailwind.config.js`: custom colors (`dreamGold`, `voidPurple`), font families (serif for story text)
- Use Tailwind's `backdrop-blur` for glassmorphic UI overlays atop 3D canvas
- Leverage `@apply` only for complex repeated patterns (per Tailwind guidelines)

---

### Decision 5: React Context for State Management

**What was chosen**: React Context API with `useReducer` for managing application phase state

**Rationale**:
- **Simplicity**: Spec defines 5 clear states (CHECKING_ENGINE → SELECTING_SOURCE → DASHBOARD → SETUP → PLAYING); no complex async state trees requiring Redux
- **Constitution Alignment**: Avoids introducing heavyweight dependencies for simple state; keeps `src/services/` lean
- **Collocated State**: Phase transitions trigger both UI changes and GSAP animations; Context makes state accessible to both UI and canvas components

**Alternatives considered**:
- **Redux Toolkit**: Rejected because overkill for linear state machine with no async middleware needs
- **Zustand**: Rejected because Context + useReducer built-in and sufficient for MVP scope
- **Component State (useState)**: Rejected because phase state must be shared between UI overlays and canvas component

**Best Practices**:
- Define state machine in `src/services/appState.js`: reducer handles valid phase transitions only
- Context provides `dispatch` for actions: `CONNECT_SUCCESS`, `MODEL_SELECTED`, `STORY_CREATED`, etc.
- Custom hooks (`useAppPhase`, `usePhaseTransition`) wrap Context to prevent prop drilling

---

### Decision 6: Mock API Strategy

**What was chosen**: `src/services/mockApi.js` exporting async functions that simulate backend calls with setTimeout delays

**Rationale**:
- **Spec Requirement**: "Backend and LLM are mocked for this MVP phase"
- **Realistic Async**: setTimeout(500-1500ms) simulates network latency; ensures UI handles loading states correctly
- **Easy Swap**: Mock functions match future API contract shape; can replace with `fetch()` calls without changing consumers

**Mock Functions**:
- `checkOllamaConnection()`: Returns `{ status: 'online' | 'offline' }` after 1s delay
- `getAvailableModels()`: Returns array of `{ id, name, displayName }` after 800ms delay
- `createStory(setup)`: Returns `{ storyId, prologueText }` after 1.2s delay
- `getUserStories()`: Returns array of `{ id, title, lastModified }` for dashboard

**Best Practices**:
- JSDoc comments document expected request/response shapes
- Use `Promise.reject()` for offline scenarios to test error handling
- Hardcode mystical flavor text in mock responses (e.g., prologue paragraphs)

---

## Architecture Decisions

### Decision 7: Canvas + UI Layer Separation

**What was chosen**: Absolute-positioned `<Canvas>` (react-three/fiber) behind z-indexed UI components

**Rationale**:
- **Constitution Principle I**: Strict separation maintains modularity; 3D and UI can be developed independently
- **Performance**: Canvas renders at 60 FPS; UI overlays use CSS transitions/GSAP, don't trigger canvas re-renders
- **Accessibility**: UI overlays remain in DOM for screen readers; canvas is `aria-hidden`

**Implementation Pattern**:
```jsx
<div className="relative w-full h-screen">
  <Canvas className="absolute inset-0 z-0">
    {/* 3D scene */}
  </Canvas>
  <div className="absolute inset-0 z-10 pointer-events-none">
    <UIComponent className="pointer-events-auto" />
  </div>
</div>
```

**Best Practices**:
- Canvas never receives user input (no raycasting in MVP); all interaction via UI overlays
- Use `pointer-events-none` on overlay container; `pointer-events-auto` on interactive children
- Test z-index stacking with browser DevTools 3D view

---

### Decision 8: Asset Loading Strategy

**What was chosen**: Preload 3D model and textures before initial render; show mystical loading screen during asset fetch

**Rationale**:
- **Spec Requirement**: "3D model at `/earth-like/source/Untitled.glb` with textures from `/earth-like/textures/`"
- **First Contentful Paint**: Delaying canvas render until assets loaded prevents flickering/pop-in
- **User Experience**: Thematic loading message ("Awakening the realm...") sets mystical tone

**Implementation**:
- Use `useGLTF.preload('/earth-like/source/Untitled.glb')` in top-level component before render
- Suspend rendering with React Suspense boundary; fallback shows boot sequence UI
- Textures applied via drei's `useTexture` hook with same Suspense pattern

**Best Practices**:
- Optimize GLB file: Draco compression, texture atlasing (handled outside code, noted for future)
- Monitor loading with `useProgress` hook from drei; show progress bar if load exceeds 3s
- Clear `useGLTF` cache on navigation away (future multi-scene optimization)

---

## Routing Architecture (URL + State Machine Sync)

**Goal**: Keep URL navigation, cinematic transitions, and state machine in sync without loops or invalid transitions.

**Pattern**:
- **URL is the source of truth for navigation intent**; `useRouteSync` listens to `location.pathname` and dispatches state transitions.
- **State machine drives animations** via `transitionTarget`, with `usePhaseTransition` completing transitions on animation end.
- **Redirects avoid animations** when the user is bounced to model selection due to missing prerequisites.

**Key Behaviors**:
- Direct URL access to `/story/:slug` triggers PLAYING transitions when the slug is valid.
- Malformed slugs redirect to `/`; if a model is already persisted and valid, RootRoute sends the user to `/dashboard`.
- Model selection is persisted in localStorage and validated against `getAvailableModels()` before allowing route transitions.
- URL sync is paused until model hydration completes to avoid premature redirects.

**Why This Works**:
- Prevents transition loops caused by bidirectional URL/state updates.
- Keeps cinematic animations aligned with real navigation intent.
- Allows one-time model selection while still handling model removal scenarios.

---

## Performance Considerations

### Research 9: 60 FPS Target on Mid-Tier Hardware

**Goal**: Maintain 30 FPS minimum, 60 FPS target per spec success criteria (SC-002)

**Strategies**:
1. **Limit Draw Calls**: Single Earth model with merged geometry; avoid transparent overlays in 3D scene
2. **LOD (Level of Detail)**: Start with medium-poly Earth model; defer high-poly for zoom if needed
3. **React Optimization**:
   - `React.memo()` on UI components to prevent re-renders during canvas updates
   - `useMemo()` for expensive calculations (e.g., parsing story text)
   - Lazy load Story Interface component with `React.lazy()`
4. **GSAP Performance**: Use `will-change: transform` on animating UI elements; GSAP optimizes CSS transforms automatically
5. **Frame Rate Monitoring**: Use `@react-three/drei`'s `<Stats>` component in dev mode; log frame times

**Edge Case Handling** (from spec):
- Detect low FPS with `useFrame` hook tracking delta times
- If average FPS < 24 for 2 seconds, dispatch `PERFORMANCE_MODE` action
- Performance mode: Skip GSAP animations, use instant transitions, reduce Earth model quality

---

### Research 10: Code Splitting for Initial Load

**Goal**: FCP (First Contentful Paint) under 2 seconds per spec SC-007

**Strategies**:
1. **Route-Based Splitting**: Use `React.lazy()` for Story Interface (only loads after setup submission)
2. **Vendor Splitting**: Vite automatically splits Three.js and GSAP into separate chunks
3. **Asset Optimizations**:
   - Serve GLB and textures from CDN (future; local for MVP)
   - Use `<link rel="preload">` for critical assets in index.html
4. **Tailwind Purging**: Configure Tailwind to purge unused utilities in production build

**Measurement**:
- Use Lighthouse CI to enforce FCP budget (2s on throttled 3G)
- Bundle size budget: `<500KB` initial JS (excluding 3D assets)

---

## File Organization (Constitution Compliance)

### Research 11: 500-Line Limit Enforcement

**Challenge**: 3D setup, animations, and UI logic could easily exceed limit

**Strategies**:
1. **Canvas Setup**: Split into `src/canvas/Scene.jsx` (lights, camera), `src/canvas/EarthModel.jsx` (GLB loading), `src/canvas/Environment.jsx` (background)
2. **Animations**: One file per transition: `src/animations/spaceToEarth.js`, `src/animations/earthToSurface.js`, `src/animations/surfaceToStory.js`
3. **UI Components**: Atomic components: `BootSequence.jsx`, `ModelSelector.jsx`, `Dashboard.jsx`, `StorySetup.jsx`, `StoryReader.jsx`
4. **Custom Hooks**: Extract logic: `usePhaseTransition.js`, `useCameraAnimation.js`, `useModelLoader.js`

**Monitoring**:
- Pre-commit hook (future): Fail if any file >500 meaningful lines
- Manual review during PR: Flag files approaching 400 lines for refactor

---

## Testing Strategy (Deferred to Implementation)

**Note**: Spec does not mandate tests; constitution does not include test-first principles

**Recommended Approach** (for future phases):
- **Unit Tests**: Mock functions in `mockApi.js` (validate response shapes)
- **Integration Tests**: State machine transitions (valid phase flows)
- **Visual Regression**: Screenshot tests for UI overlays (Percy or Chromatic)
- **Performance Tests**: Automated FPS monitoring in headless browser

---

## Security & Accessibility Notes

**Security**: No authentication, no real backend; no XSS/CSRF concerns in MVP

**Accessibility**:
- Spec requirement (SC-005): "WCAG AA readability standards" for Story Interface
- Focus management: Trap focus in modal overlays (Setup form)
- Keyboard navigation: Tab order, Enter to submit, Escape to cancel
- ARIA labels on interactive elements (buttons, dropdowns)
- Canvas `aria-hidden="true"` (decorative 3D background)

**Future Work**:
- Screen reader announcements for phase transitions
- Prefers-reduced-motion media query to disable animations

---

## Summary of Research Findings

All technical decisions resolved. No `NEEDS CLARIFICATION` markers remain.

**Technology Stack Confirmed**:
- React 18 + Vite
- @react-three/fiber + @react-three/drei
- GSAP for camera animations
- Tailwind CSS for UI styling
- React Context for state management
- Mock API strategy (async functions with setTimeout)

**Architecture Confirmed**:
- Canvas (absolute, z-0) + UI overlays (absolute, z-10+)
- Asset preloading with Suspense
- 5-phase state machine (CHECKING_ENGINE → PLAYING)

**Performance Strategy Confirmed**:
- 60 FPS target with graceful degradation
- Code splitting with React.lazy()
- FCP <2s via Tailwind purging and vendor splitting

**Next Step**: Phase 1 - Design (data-model.md, contracts/, quickstart.md)
