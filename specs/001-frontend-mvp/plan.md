# Implementation Plan: StoryTeller Frontend MVP

**Branch**: `001-frontend-mvp` | **Date**: 2026-02-28 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `specs/001-frontend-mvp/spec.md`

## Summary

Build a cinematic 3D web application for creating AI-powered interactive text adventures. The MVP delivers a complete frontend experience with 7 UX flow stages: (1) mystical boot sequence with connection check, (2) AI model selection, (3) camera zoom from space to Earth, (4) story dashboard with resume/create options, (5) closer zoom to surface on "Create New", (6) story setup form, and (7) final extreme zoom transitioning to a minimalist reading interface. All backend calls are mocked; focus is entirely on UI/UX excellence and cinematic animations.

**Technical Approach**: React + Vite for rapid development and HMR; @react-three/fiber for declarative 3D scene management; GSAP for precise camera animations; Tailwind CSS for consistent UI styling; React Context for linear state machine (5 phases). Architecture separates 3D canvas (absolute z-0 background) from UI overlays (absolute z-10+ foreground) per constitution's modularity principles.

## Technical Context

**Language/Version**: JavaScript (ES2022) with React 18+  
**Primary Dependencies**: 
- React 18+ (UI framework)
- Vite (build tool and dev server)
- @react-three/fiber + @react-three/drei (declarative Three.js with React)
- GSAP (camera/scene animations)
- Tailwind CSS (UI styling)
- Three.js (underlying 3D engine)

**Storage**: Browser session state (React Context); no persistence in MVP (localStorage deferred to Story Dashboard resume feature)  
**Testing**: No tests in MVP per constitution (constitution does not mandate TDD)  
**Target Platform**: Modern web browsers with WebGL support (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+); desktop and tablet (mobile optimization deferred)  
**Project Type**: Single-page application (SPA) - 3D web application with cinematic UI  
**Performance Goals**: 
- 60 FPS target, 30 FPS minimum for 3D rendering and animations
- First Contentful Paint (FCP) <2 seconds on 3G connection
- Smooth camera animations with no jank or frame drops
- Initial bundle <500KB (excluding 3D assets)

**Constraints**: 
- Frontend-only (no real backend; all API calls mocked)
- No file may exceed 500 meaningful lines of code (constitution Principle I)
- All UI must use Tailwind CSS (constitution Principle VI)
- Every function/component must have inline JSDoc documentation (constitution Principle II)
- No manual package.json edits; dependencies installed via terminal commands (constitution Principle IV)

**Scale/Scope**: 
- 5 distinct UI phases (screens)
- 3-4 major GSAP camera animations
- ~10-15 React UI components
- 1 Three.js scene with Earth model
- ~5 mock API functions
- Target: Single developer can implement in 3-5 days

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Phase 0 Evaluation

✅ **Principle I: Extreme Modularity (500-line limit)**
- Plan enforces separation: `src/canvas/`, `src/animations/`, `src/components/ui/`
- Each phase UI is separate component file
- Each camera animation is separate file
- **Status**: COMPLIANT - Structure designed for modularity

✅ **Principle II: Comprehensive Documentation**
- All design documents include JSDoc examples
- Research.md documents WHY for each technology choice
- Contracts define expected documentation patterns
- **Status**: COMPLIANT - Documentation required in all templates

✅ **Principle III: Markdown File Restrictions**
- Only README.md and AGENTS.md at project root
- All spec artifacts in `.specify/` directory
- **Status**: COMPLIANT - AGENTS.md created per plan

✅ **Principle IV: Safe Dependency Management**
- Research.md specifies exact `npm i` commands
- No version numbers hallucinated
- Quickstart.md provides full dependency installation guide
- **Status**: COMPLIANT - Terminal-based workflow documented

✅ **Principle V: Explicit User Consent**
- Plan workflow will generate ~15+ component files
- Each file estimated <200 lines (well under 50-line threshold for small files)
- Larger files (Scene, UIRouter) will be explained before creation
- **Status**: COMPLIANT - Will prompt for consent on large file creation

✅ **Principle VI: UI/UX Excellence**
- Tailwind CSS mandated throughout
- Theme defined in tailwind.config.js
- Mystical/cinematic language enforced in all UI text
- GSAP easing choices documented for cinematic feel
- **Status**: COMPLIANT - Design prioritizes thematic consistency

### Post-Phase 1 Re-Evaluation

✅ **All Principles** remain compliant after Phase 1 design:
- Data model entities align with modular architecture
- Mock API contract specifies realistic delays for UX polish
- State machine enforces linear flow without complexity bloat
- Contracts document expected inline comment patterns

**GATE RESULT**: ✅ **PASS** - No constitution violations; proceed to implementation

## Project Structure

### Documentation (this feature)

```text
specs/001-frontend-mvp/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output - Technology decisions and best practices
├── data-model.md        # Phase 1 output - Entity definitions and relationships
├── quickstart.md        # Phase 1 output - Fast reference guide for developers
├── contracts/           # Phase 1 output - Interface contracts
│   ├── mockApi.md      # Mock backend API contract
│   └── stateMachine.md # App phase state machine contract
└── checklists/
    └── requirements.md  # Specification quality validation checklist
```

### Source Code (repository root)

```text
src/
├── canvas/                     # Three.js scene components (3D logic only)
│   ├── Scene.jsx              # Main canvas: camera, lights, environment
│   ├── EarthModel.jsx         # GLB loader and Earth rendering
│   └── Background.jsx         # Starfield or space background
│
├── animations/                 # GSAP camera transitions (one file per animation)
│   ├── spaceToEarth.js        # SELECTING_SOURCE → DASHBOARD animation
│   ├── earthToSurface.js      # DASHBOARD → SETUP animation
│   └── surfaceToStory.js      # SETUP → PLAYING animation
│
├── components/
│   ├── ui/                    # Phase-specific UI screens (React overlays)
│   │   ├── BootSequence.jsx   # CHECKING_ENGINE phase UI
│   │   ├── ModelSelector.jsx  # SELECTING_SOURCE phase UI
│   │   ├── Dashboard.jsx      # DASHBOARD phase UI
│   │   ├── StorySetup.jsx     # SETUP phase UI
│   │   └── StoryReader.jsx    # PLAYING phase UI
│   │
│   ├── common/                # Reusable UI components
│   │   ├── Button.jsx         # Thematic button with Tailwind styles
│   │   ├── Dropdown.jsx       # Dropdown component for model/fandom selection
│   │   └── TextArea.jsx       # Text area with character counter
│   │
│   └── UIRouter.jsx           # Phase-based conditional rendering of UI screens
│
├── services/                   # State management and backend integration
│   ├── appState.js            # React Context + useReducer for phase state machine
│   └── mockApi.js             # Mocked backend functions (async with delays)
│
├── utils/                      # Helper functions and utilities
│   ├── validation.js          # Form validation with mystical error messages
│   └── constants.js           # Shared constants (phases, error codes)
│
├── styles/
│   └── index.css              # Tailwind imports + custom theme extensions
│
├── App.jsx                     # Root component: Canvas + UI layer structure
└── main.jsx                    # Vite entry point

public/
├── earth-like/                 # 3D assets (existing in repo)
│   ├── source/
│   │   └── Untitled.glb       # Earth 3D model
│   └── textures/
│       └── [texture files]    # Earth textures to be applied
│
└── index.html                  # HTML entry point

Configuration Files (root):
├── package.json                # Dependencies (created via npm i commands)
├── vite.config.js              # Vite configuration
├── tailwind.config.js          # Tailwind theme customization
├── postcss.config.js           # PostCSS for Tailwind
└── .gitignore                  # Ignore node_modules, dist, etc.

Documentation (root):
├── README.md                   # Human-facing: setup, features, deployment
└── AGENTS.md                   # AI agent context (created in Phase 1)
```

**Structure Decision**: Selected **Option 4: 3D Web Application** from plan template. This structure enforces constitution's Extreme Modularity principle by strictly separating:
- 3D rendering logic (`src/canvas/`) from UI logic (`src/components/`)
- Animation definitions (`src/animations/`) from both 3D and UI
- State management (`src/services/`) as centralized concern
- Domain utilities (`src/utils/`) for cross-cutting logic

No tests directory included (MVP scope; tests deferred per constitution).

## Complexity Tracking

> **No constitution violations** - This section intentionally left empty per template instructions ("Fill ONLY if Constitution Check has violations")

All design decisions align with constitution principles; no complexity justifications required.

## Phase 0: Research

**Status**: ✅ **COMPLETED**

All unknowns from Technical Context resolved. Key findings documented in [research.md](research.md):

1. **React + Vite**: Instant HMR for rapid UI iteration; mature ecosystem
2. **@react-three/fiber**: Declarative Three.js integration; automatic resource cleanup
3. **GSAP for Cameras**: Sub-frame precision; timeline management for multi-stage animations
4. **Tailwind CSS**: Constitution-mandated; utility-first prevents CSS sprawl
5. **React Context State**: Simple 5-phase state machine; no Redux complexity needed
6. **Mock API Strategy**: Async functions with setTimeout; realistic network delays

**Alternatives Considered**: Vue + Vite (rejected: weaker Three.js integration), Vanilla Three.js (rejected: violates modularity), Framer Motion for 3D (rejected: GSAP better for camera control).

**Best Practices Consolidated**:
- Preload 3D assets with `useGLTF.preload()` to avoid flicker
- Use `gsap.context()` to scope animations to component lifecycle
- Separate canvas (z-0) from UI overlays (z-10+) with pointer-events handling
- Monitor FPS with `@react-three/drei` Stats component in dev mode

**No NEEDS CLARIFICATION markers remain** - all technical decisions finalized.

## Phase 1: Design & Contracts

**Status**: ✅ **COMPLETED**

### Data Model

[data-model.md](data-model.md) defines 6 core entities:

1. **AppPhase**: State machine (5 phases: CHECKING_ENGINE → SELECTING_SOURCE → DASHBOARD → SETUP → PLAYING)
2. **ConnectionStatus**: Backend connection state (CHECKING | ONLINE | OFFLINE | ERROR)
3. **AIModel**: Available language models (id, name, displayName, description)
4. **StorySetup**: User-defined story parameters (fandom, character, premise, goals)
5. **Story**: Created text adventure with narrative state (id, title, setup, currentPassage, metadata)
6. **UserSession**: Session-scoped state (selectedModel, stories array, currentStoryId)

**Relationships**: Linear dependencies (AppPhase → UserSession → Story); no circular references.

**Validation Rules**: Character limits on text fields (10-500 chars for character/goals, 20-1000 for premise); state machine enforces valid phase transitions only.

### Contracts

#### [contracts/mockApi.md](contracts/mockApi.md)

Defines 5 async functions simulating backend API:

- `checkOllamaConnection()` - Returns status after ~1000ms delay
- `getAvailableModels()` - Returns 2 hardcoded models after ~800ms
- `getUserStories()` - Returns mock story list after ~600ms
- `createStory(setup)` - Validates and returns story with prologue after ~1200ms
- `getStoryById(id)` - Fetches story details after ~500ms

**Error Handling**: Consistent `{ error, message, field?, timestamp }` shape for all rejections.

**Mystical Language**: All error messages use thematic tone (e.g., "The protagonist awaits definition..." instead of "Character field required").

#### [contracts/stateMachine.md](contracts/stateMachine.md)

Defines 5 phases, 10+ actions, and valid transition matrix:

- Each phase has entry conditions, exit conditions, valid actions
- Transitions trigger GSAP animations via `isTransitioning` flag
- Invalid transitions rejected by reducer (maintains current state)

**Animation Lifecycle**: Dispatch action → Reducer sets `isTransitioning: true` → GSAP plays → `onComplete` dispatches `TRANSITION_COMPLETE` → Reducer updates phase and unlocks UI.

### Quickstart Guide

[quickstart.md](quickstart.md) provides:

- 30-second overview of stack and architecture
- Installation commands (`npm i` for all dependencies)
- Key file walkthroughs (App.jsx, appState.js, mockApi.js, animation examples)
- Common tasks (add component, add animation, add state action)
- Debugging tips (phase logging, FPS monitoring, skip animations for testing)
- Constitution compliance checklist

### Agent Context Update

✅ **AGENTS.md created** at project root with:

- Technology stack summary (React, Three.js, GSAP, Tailwind)
- Architecture principles (canvas+UI separation, linear state machine, modularity)
- Coding conventions (file naming, component structure, documentation patterns)
- Common patterns (phase-based rendering, animation-triggered transitions, form validation)
- Mock API contract summary
- Performance guidelines and monitoring tools
- AI agent guidelines (enforce constitution, validate transitions, provide terminal commands)

## Phase 2: Tasks

**Status**: ⏭️ **DEFERRED to `/speckit.tasks` command**

This plan concludes after Phase 1 (design + contracts). Task breakdown will be generated by running:

```bash
# Next command to execute
/speckit.tasks
```

Expected task organization (per tasks-template.md):

- **Phase 1: Setup** (project initialization, Vite + React scaffold, Tailwind config)
- **Phase 2: Foundational** (Canvas setup, Context provider, mock API)
- **Phase 3: User Story 1** (Story Setup form + Story Reader interface) - P1 MVP core
- **Phase 4: User Story 2** (GSAP animations + Earth model rendering) - P2 cinematic polish
- **Phase 5: User Story 3** (Boot sequence + Model selector) - P3 thematic onboarding
- **Phase 6: User Story 4** (Dashboard + Resume functionality) - P4 persistence layer

Tasks will be independently testable and prioritized for incremental delivery.

## Dependencies & Prerequisites

### External Dependencies (NPM Packages)

Install via terminal commands (do NOT edit package.json manually):

```bash
# Core framework
npm i react react-dom

# Build tool
npm i vite @vitejs/plugin-react

# Styling
npm i tailwindcss postcss autoprefixer
npm i -D @tailwindcss/typography

# 3D rendering
npm i three @types/three
npm i @react-three/fiber @react-three/drei

# Animation
npm i gsap
```

**Estimated Total Bundle**: ~350KB initial JS (minified + gzipped, excluding 3D assets)

### Asset Dependencies

- **3D Model**: `/public/earth-like/source/Untitled.glb` (already exists in repo)
- **Textures**: `/public/earth-like/textures/` (already exists in repo)
- Three.js will load GLB via @react-three/drei's `useGLTF` hook
- Apply textures from `/textures` folder to model (implementation detail in EarthModel.jsx)

### System Requirements

- Node.js 18+ (20+ recommended for optimal Vite performance)
- npm 9+ or pnpm 8+
- Git for version control
- Modern browser with WebGL 2 support for development testing
- ~100MB disk space for node_modules

## Risks & Mitigations

### Risk 1: 3D Performance on Low-End Hardware

**Likelihood**: Medium | **Impact**: High (violates SC-002: 30 FPS minimum)

**Mitigation**:
- Use frame rate monitoring (`useFrame` hook tracking delta times)
- Implement performance mode: Skip GSAP animations, reduce Earth model quality
- Test on throttled device simulations (Chrome DevTools)
- Optimize Earth model: Use Draco compression, reduce poly count if needed

**Contingency**: If Earth model too heavy, replace with procedural sphere + texture map (simpler geometry, same visual effect).

### Risk 2: GSAP Animation Timing Feels Off

**Likelihood**: Medium | **Impact**: Medium (affects cinematic feel, SC-006)

**Mitigation**:
- Document easing rationale in animation files (e.g., "power2.out feels most natural for deceleration")
- Make animation durations configurable constants for easy tweaking
- User-test with 5+ people; iterate on timing based on feedback

**Contingency**: Provide multiple easing presets; let user choose (future enhancement).

### Risk 3: GLB Model Doesn't Load or Has Missing Textures

**Likelihood**: Low | **Impact**: High (3D scene breaks)

**Mitigation**:
- Verify GLB path in Step 1 of implementation: `console.log(useGLTF('/earth-like/source/Untitled.glb'))`
- Use `<Suspense>` fallback to catch loading errors gracefully
- Inspect GLB in online viewer (e.g., gltf.report) to confirm embedded textures

**Contingency**: Use procedural sphere with image texture as fallback; Earth model is aesthetic, not functional requirement.

### Risk 4: State Machine Complexity Grows Beyond 5 Phases

**Likelihood**: Low (spec defines 5 phases explicitly) | **Impact**: Medium (violates simplicity)

**Mitigation**:
- Strictly adhere to spec's 5-phase flow; reject feature creep
- If new phases needed in future, create a NEW feature spec and plan

**Contingency**: Refactor to nested state machines if complexity justified (requires constitution amendment approval).

### Risk 5: File Size Exceeds 500-Line Limit

**Likelihood**: Medium (Scene.jsx or UIRouter.jsx could grow) | **Impact**: High (violates constitution)

**Mitigation**:
- Monitor file sizes during implementation (editor status bar, `wc -l`)
- Preemptively extract sub-components at ~300 lines
- Use custom hooks to extract complex logic (e.g., `useCameraAnimation`, `usePhaseTransition`)

**Contingency**: Pause implementation, refactor oversized file before proceeding.

## Success Metrics (from Spec)

**Pre-Implementation Planning Metrics** (this document):

- ✅ All research unknowns resolved (no NEEDS CLARIFICATION)
- ✅ Contracts define clear interfaces (mockApi, stateMachine)
- ✅ Data model complete with validation rules
- ✅ Constitution check passed (no violations)

**Implementation Success Metrics** (to be validated during implementation):

- **SC-001**: Navigate 7 UX stages in <45 seconds (timed user test)
- **SC-002**: 30 FPS minimum on mid-tier hardware (Stats.js monitoring)
- **SC-003**: UI readable during 3D animations (z-index + contrast testing)
- **SC-004**: 90% complete Story Setup form on first try (5-person user test)
- **SC-005**: Story Interface meets WCAG AA readability (contrast checker, line-height validation)
- **SC-006**: 8/10 users rate animations as "smooth and intentional" (subjective survey)
- **SC-007**: FCP <2 seconds on 3G (Lighthouse audit with throttling)
- **SC-008**: Interactive elements respond <100ms (DevTools performance profiling)

**Code Quality Metrics**:

- Zero files exceed 500 meaningful lines (automated `wc -l` check)
- 100% of functions have JSDoc comments (manual review)
- All UI uses Tailwind classes (grep search for `style=` returns zero results)
- Zero manual package.json edits (git diff verification)

## Next Steps

1. **Review this plan** with stakeholders (ensure alignment with vision)
2. **Run `/speckit.tasks`** to generate Phase 2: Task breakdown for implementation
3. **Begin implementation** following task priorities (P1 stories first)
4. **Iterate on UX** during development (animation timing, mystical language refinement)
5. **Validate success criteria** as each user story completes
6. **Prepare for demo** once P1 + P2 stories complete (core value + cinematic polish)

---

**Plan Version**: 1.0.0  
**Status**: ✅ **PHASE 0 & 1 COMPLETE** - Ready for Task Generation  
**Branch**: `001-frontend-mvp`  
**Next Command**: `/speckit.tasks`
