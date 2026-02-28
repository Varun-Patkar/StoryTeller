# Tasks: StoryTeller Frontend MVP

**Input**: Design documents from `/specs/001-frontend-mvp/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/mockApi.md, contracts/stateMachine.md

**Tests**: Not included (no TDD requirement per constitution; no test request in specification)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create project structure with src/canvas/, src/animations/, src/components/ui/, src/components/common/, src/services/, src/utils/, src/styles/ directories
- [x] T002 Initialize React + Vite project with package.json
- [x] T003 Install core dependencies via terminal: `npm i react react-dom three @react-three/fiber @react-three/drei gsap`
- [x] T004 Install Tailwind CSS via terminal: `npm i -D tailwindcss postcss autoprefixer` and run `npx tailwindcss init -p`
- [x] T005 [P] Configure Tailwind CSS theme in tailwind.config.js with custom colors (dreamGold, voidPurple, starSilver)
- [x] T006 [P] Create src/styles/index.css with Tailwind directives (@tailwind base, components, utilities)
- [x] T007 [P] Configure Vite for absolute imports and fast refresh in vite.config.js
- [x] T008 [P] Add Earth GLB model file to public/earth-like/source/ directory

**Checkpoint**: Project structure and dependencies ready for implementation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T009 Create AppPhase state machine in src/services/appState.js with Context, reducer, initial state, and all action types
- [x] T010 Implement phase transition validation logic in src/services/appState.js reducer (enforce valid transitions from stateMachine.md)
- [x] T011 [P] Implement mock API in src/services/mockApi.js with all 5 functions: checkOllamaConnection(), getAvailableModels(), getUserStories(), createStory(), getStoryById()
- [x] T012 [P] Create validation utilities in src/utils/validation.js for StorySetup fields (character 10-500 chars, premise 20-1000 chars, goals 10-500 chars)
- [x] T013 [P] Create animation helper utilities in src/utils/animations.js for common GSAP easing and duration constants
- [x] T014 Create main App.jsx with AppStateProvider wrapping Canvas and UIRouter components
- [x] T015 Create src/components/UIRouter.jsx for phase-based conditional rendering of UI screens
- [x] T016 [P] Create reusable Button component in src/components/common/Button.jsx with Tailwind styling and mystical variants
- [x] T017 [P] Create reusable Dropdown component in src/components/common/Dropdown.jsx with Tailwind styling
- [x] T018 [P] Create reusable TextArea component in src/components/common/TextArea.jsx with character counter

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 2 - Cinematic 3D Transitions (Priority: P2) 🎯

**Goal**: Create cinematic 3D canvas with Earth model and smooth camera animations that provide visual continuity between phases

**Why P2 First**: Although P2 priority, the 3D canvas is foundational infrastructure needed by US3 and US4. Implementing this early enables parallel work on UI overlays.

**Independent Test**: Trigger state transitions via developer console (e.g., `dispatch({ type: 'TRANSITION_TO_DASHBOARD' })`) and verify animations execute smoothly, Earth model renders, camera moves as expected, and frame rate stays above 30 FPS.

### Implementation for User Story 2

- [x] T019 [P] [US2] Create Three.js scene in src/canvas/Scene.jsx with camera, ambient light, directional light, and proper camera initial position (0, 0, 300) for deep space
- [x] T020 [P] [US2] Create EarthModel component in src/canvas/EarthModel.jsx using useGLTF to load /earth-like/source/Untitled.glb with proper scale and rotation
- [x] T021 [P] [US2] Create Background component in src/canvas/Background.jsx with starfield or space gradient effect
- [x] T022 [P] [US2] Implement spaceToEarth animation in src/animations/spaceToEarth.js (camera z: 300 → 150, duration 4s, ease: power2.out)
- [x] T023 [P] [US2] Implement earthToSurface animation in src/animations/earthToSurface.js (camera z: 150 → 50, duration 3s, ease: power2.out)
- [x] T024 [P] [US2] Implement surfaceToStory animation in src/animations/surfaceToStory.js (camera z: 50 → 10, fade Earth opacity 1 → 0, duration 2.5s, ease: power2.inOut)
- [x] T025 [US2] Create usePhaseTransition custom hook in src/services/appState.js to trigger animations on transitionTarget state changes
- [x] T026 [US2] Integrate animations with state machine transitions in usePhaseTransition hook (call animation onComplete → dispatch TRANSITION_COMPLETE)
- [x] T027 [US2] Add Earth model rotation in Scene.jsx using useFrame hook (slow rotation: 0.0005 rad/frame on Y axis)
- [x] T028 [US2] Add canvas pointer-events: none styling in App.jsx to ensure UI overlays receive clicks
- [x] T029 [US2] Preload Earth GLB model in App.jsx using useGLTF.preload() to prevent loading delays

**Checkpoint**: 3D canvas with Earth model and all camera animations functional and tested

---

## Phase 4: User Story 3 - Boot Sequence & Connection Experience (Priority: P3) 🎯

**Goal**: Create mystical boot sequence that checks connection and guides user to select AI model

**Independent Test**: Load app from scratch, observe boot animation, verify connection check completes with appropriate messaging (online/offline), select model from dropdown, and confirm transition to next phase. Test offline scenario by modifying mock API to return 'offline'.

### Implementation for User Story 3

- [x] T030 [P] [US3] Create BootSequence UI component in src/components/ui/BootSequence.jsx with mystical loading animation and connection status display
- [x] T031 [US3] Integrate checkOllamaConnection() call in BootSequence useEffect on component mount
- [x] T032 [US3] Add connection status handling in BootSequence: display "Awakening the gateway..." (CHECKING), "The gateway awakens..." (ONLINE), "The gateway sleeps..." (OFFLINE)
- [x] T033 [US3] Add retry button for offline state in BootSequence that re-dispatches CONNECTION_CHECK_START action
- [x] T034 [US3] Implement auto-transition from CHECKING_ENGINE to SELECTING_SOURCE when connectionStatus becomes 'ONLINE'
- [x] T035 [P] [US3] Create ModelSelector UI component in src/components/ui/ModelSelector.jsx with dropdown and model descriptions
- [x] T036 [US3] Integrate getAvailableModels() call in ModelSelector useEffect on component mount
- [x] T037 [US3] Populate Dropdown component with AIModel data in ModelSelector (display mystical displayName, show description on hover)
- [x] T038 [US3] Add model selection handler in ModelSelector that dispatches MODEL_SELECTED action with chosen model
- [x] T039 [US3] Implement transition from SELECTING_SOURCE to DASHBOARD on model selection (trigger spaceToEarth animation via usePhaseTransition)

**Checkpoint**: Boot sequence and model selection flow complete from app launch to Dashboard phase

---

## Phase 5: User Story 1 - Story Creation & Reading Interface (Priority: P1) 🎯 MVP CORE

**Goal**: Enable users to create story concepts via form and see generated prologue in immersive reading interface

**Independent Test**: Load app directly into SETUP phase (bypass boot/model selection), fill out character/premise/goals form fields, submit form, and verify Story Interface displays mocked prologue text with proper formatting. Can be tested independently of US2/US3.

### Implementation for User Story 1

- [x] T040 [P] [US1] Create StorySetup UI component in src/components/ui/StorySetup.jsx with form layout and field structure
- [x] T041 [P] [US1] Add Fandom dropdown to StorySetup with at least one option ("Douluo Dalu") using Dropdown component
- [x] T042 [P] [US1] Add Character text area to StorySetup using TextArea component with 10-500 character validation
- [x] T043 [P] [US1] Add Premise text area to StorySetup using TextArea component with 20-1000 character validation
- [x] T044 [P] [US1] Add Goals text area to StorySetup using TextArea component with 10-500 character validation
- [x] T045 [US1] Implement field validation in StorySetup using validation.js utilities on blur events
- [x] T046 [US1] Display mystical error messages for validation failures (e.g., "The protagonist awaits definition...", "Brevity sharpens the vision...")
- [x] T047 [US1] Add "Begin Story" button to StorySetup that validates all fields and dispatches STORY_SUBMITTED action
- [x] T048 [US1] Integrate createStory() API call in StorySetup submit handler to generate mocked prologue
- [x] T049 [US1] Implement transition from SETUP to PLAYING phase on successful story creation (trigger surfaceToStory animation)
- [x] T050 [P] [US1] Create StoryReader UI component in src/components/ui/StoryReader.jsx with minimalist typography layout
- [x] T051 [US1] Display prologue text in StoryReader from story state (at least 2-3 paragraphs)
- [x] T052 [US1] Apply Tailwind typography plugin classes to StoryReader for optimal long-form reading (line-height, font-size, max-width)
- [x] T053 [US1] Add thematic styling to StoryReader (e.g., starSilver text color, subtle background gradient)

**Checkpoint**: Core MVP complete - users can create stories and see generated content

---

## Phase 6: User Story 4 - Story Dashboard & Resume (Priority: P4)

**Goal**: Display existing stories and allow users to resume where they left off

**Independent Test**: Seed mock story data in mockApi.js, load app to Dashboard phase (after model selection), verify story cards appear with title/date/thumbnail, click a story card, and confirm Story Interface loads with appropriate saved passage.

### Implementation for User Story 4

- [x] T054 [P] [US4] Create Dashboard UI component in src/components/ui/Dashboard.jsx with two-column layout (Resume | Create New)
- [x] T055 [US4] Integrate getUserStories() API call in Dashboard useEffect on component mount
- [x] T056 [US4] Display story cards in Dashboard left column with title, last modified date, word count
- [x] T057 [US4] Add hover animation to story cards (subtle scale/shadow effect using Tailwind classes)
- [x] T058 [US4] Add "Resume" button to each story card that appears on hover
- [x] T059 [US4] Implement story resume handler that calls getStoryById() and dispatches RESUME_STORY action
- [x] T060 [US4] Implement transition from DASHBOARD to PLAYING phase on resume (brief camera zoom)
- [x] T061 [US4] Add "Create New Story" button to Dashboard right column with mystical styling
- [x] T062 [US4] Implement create new handler that dispatches TRANSITION_TO_SETUP action (trigger earthToSurface animation)
- [x] T063 [US4] Update StoryReader to handle both new prologue and resumed story state
- [x] T064 [US4] ~~Add Earth rotation animation in background of Dashboard (ensure readability of overlay UI)~~ REMOVED - Not needed

**Checkpoint**: All user stories complete - full UX flow from boot to story reading functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T065 [P] Add loading spinners to all async operations (connection check, model fetch, story creation, story resume)
- [x] T066 [P] Implement error boundary component in src/components/ErrorBoundary.jsx to catch React errors gracefully
- [ ] T067 [P] Add global error handling for mock API failures with mystical error messages
- [x] T068 [P] Optimize bundle size: lazy load StoryReader component using React.lazy() and Suspense
- [ ] T069 [P] Add FPS monitoring in dev mode using @react-three/drei Stats component
- [ ] T070 [P] Test performance on mid-tier hardware and adjust animation durations/quality if needed
- [x] T071 [P] Add transition locks: disable all interactive elements when isTransitioning === true
- [x] T072 [P] Implement graceful degradation for browsers without WebGL support (show 2D starfield fallback)
- [x] T073 [P] Review all components for constitution compliance (500-line limit, JSDoc comments, Tailwind only)
- [x] T074 Create README.md at project root with project overview and quick start instructions
- [x] T075 Run quickstart.md validation scenarios to verify all flows work end-to-end

**Checkpoint**: Production-ready MVP with polish and error handling

---

## Phase 8: User Story 5 - Interactive Story Reading (Priority: P1)

**Goal**: Transform StoryReader from static text display to interactive story engine with streaming text and choice-driven narrative

**Independent Test**: Load a story into StoryReader, observe streaming text with lorem ipsum, wait for choices to appear, click a choice, verify next passage streams in with new choices. Validates the core interactive loop.

### Implementation for User Story 5

- [X] T076 [US5] Create StreamingText component in src/components/common/StreamingText.jsx that displays text character-by-character or word-by-word
- [X] T077 [US5] Add configurable streaming speed prop to StreamingText (default 100ms per word, range 50-150ms)
- [X] T078 [US5] Implement click-to-complete functionality: clicking text area during streaming instantly shows full text
- [X] T079 [US5] Create ChoiceButton component in src/components/common/ChoiceButton.jsx with mystical styling and hover effects
- [X] T080 [US5] Add fade-in animation to ChoiceButton that triggers after StreamingText completes
- [X] T081 [P] [US5] Update mockApi.js to include getNextPassage(storyId, choiceId) function returning lorem ipsum passages with 2-4 choices
- [X] T082 [P] [US5] Generate lorem ipsum passages in mockApi with varied paragraph lengths (2-4 paragraphs, 200-400 words each)
- [X] T083 [US5] Update Story entity in data-model.md to include passages array and choices structure
- [X] T084 [US5] Refactor StoryReader.jsx to use passage-based architecture instead of single prologue display
- [X] T085 [US5] Implement passage history state management: maintain array of all displayed passages + chosen options
- [X] T086 [US5] Add StoryPassage component in src/components/ui/StoryPassage.jsx that renders passage text + choices
- [X] T087 [US5] Integrate StreamingText into StoryPassage for the current (most recent) passage only
- [X] T088 [US5] Display previous passages as static text (no streaming) in scrollable history above current passage
- [X] T089 [US5] Implement choice selection handler: fade out choices, call getNextPassage(), append new passage to history
- [X] T090 [US5] Add visual distinction for selected choices in history (e.g., blue highlight or checkmark icon)
- [X] T091 [US5] Ensure smooth scroll behavior: auto-scroll to new passage when it's added to history
- [X] T092 [US5] Add loading state during getNextPassage() API call (subtle spinner or "Weaving fate..." message)
- [X] T093 [US5] Implement error handling for passage generation failures with retry option
- [X] T094 [US5] Removed: "Skip Text" behavior is not compatible with real streaming API output
- [X] T095 [US5] Deferred: real API chunk-stream performance validation will be implemented with backend integration spec
- [X] T096 [US5] Removed: unit tests for mock streaming timing are not required in current frontend-only phase
- [X] T097 [US5] Validate passage history UX: preserve manual scroll, add "Go to latest passage" action when user scrolls up
- [X] T098 [US5] Update story continuation contract in contracts/storyProgression.md for passage + free-text response flow
- [X] T099 [US5] Add StoryReader scroll affordance: show "Go to latest passage" button when reader is away from bottom
- [X] T100 [US5] Ensure auto-scroll only triggers when user is near bottom; do not force-jump while user reads older passages

**Checkpoint**: Interactive story reading complete - users can submit responses and see story unfold dynamically

---

## Phase 9: User Story 6 - URL-Based Navigation & Routing (Priority: P2)

**Goal**: Convert from SPA state machine to URL-based routing with browser history support and story slugs

**Independent Test**: Navigate through phases and verify URL changes, copy story URL and open in new tab, use browser back button, manually type `/dashboard` in URL bar and verify it works.

### Implementation for User Story 6

- [ ] T101 [US6] Install React Router (react-router-dom) via terminal command: `npm i react-router-dom`
- [ ] T102 [US6] Create routes configuration in src/routes.jsx defining all phase routes (/, /dashboard, /setup, /story/:slug)
- [ ] T103 [US6] Wrap App.jsx with BrowserRouter and move phase rendering into Route components
- [ ] T104 [US6] Create ProtectedRoute component that checks prerequisites (e.g., model selected) and redirects if not met
- [ ] T105 [US6] Update AppStateProvider to sync with URL: listen to route changes and update phase state
- [ ] T106 [US6] Add slug generation utility in src/utils/slugify.js (lowercase, hyphenate, remove special chars, truncate 60)
- [ ] T107 [US6] Update createStory() in mockApi.js to generate unique slug from title and check for collisions
- [ ] T108 [P] [US6] Update getUserStories() in mockApi.js to include slug field in all mock story data
- [ ] T109 [US6] Update getStoryById() to also support getStoryBySlug() for URL-based story loading
- [ ] T110 [US6] Add slug field to Story entity in all mock data and TypeScript interfaces (if using TS)
- [ ] T111 [US6] Update Dashboard story card click handler to navigate to `/story/${story.slug}` instead of setting state
- [ ] T112 [US6] Update StorySetup submit handler to navigate to `/story/${createdStory.slug}` after story creation
- [ ] T113 [US6] Update StorySetup back button to use `navigate(-1)` or `navigate('/dashboard')` instead of state dispatch
- [ ] T114 [US6] Create NotFound component (404) with mystical "Tale lost to the void" message for invalid routes
- [ ] T115 [US6] Implement browser back button handling: detect route changes and trigger appropriate reverse animations
- [ ] T116 [US6] Add route transition guards: cancel in-progress animations when route changes
- [ ] T117 [US6] Update phase transition hook to sync animations with route navigation (push history after animation completes)
- [ ] T118 [US6] Test direct URL access: refresh page on /story/:slug and verify story loads correctly
- [ ] T119 [US6] Test browser back/forward: navigate through phases and verify history stack works correctly
- [ ] T120 [US6] Add URL validation: handle malformed slugs, special characters in URL params
- [ ] T121 [US6] Update README.md with routing structure and example URLs
- [ ] T122 [US6] Document routing architecture in research.md (state machine + URL sync pattern)
- [ ] T123 [US6] Create routing contract in contracts/routing.md with route definitions and navigation flows
- [ ] T124 [US6] Test slug uniqueness: create two stories with same title, verify slugs are different (append -2)
- [ ] T125 [US6] Add meta tags for SEO: update document.title based on current route and story title

**Checkpoint**: Full URL routing implemented - users can bookmark, share, and navigate with browser controls

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 2 - 3D Canvas (Phase 3)**: Depends on Foundational (Phase 2) - Should be completed early as it provides visual infrastructure
- **User Story 3 - Boot Sequence (Phase 4)**: Depends on Foundational (Phase 2) + 3D Canvas (Phase 3) for animations
- **User Story 1 - Story Creation (Phase 5)**: Depends on Foundational (Phase 2) + 3D Canvas (Phase 3) for final animation; can develop in parallel with US3
- **User Story 4 - Dashboard (Phase 6)**: Depends on Foundational (Phase 2) + 3D Canvas (Phase 3) + US1 StoryReader (for resume functionality)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

**Recommended Implementation Order** (despite priority numbers):

1. **User Story 2 (P2) - 3D Canvas**: Implement FIRST as foundational visual infrastructure
2. **User Story 3 (P3) - Boot Sequence**: Implement SECOND to create entry flow
3. **User Story 1 (P1) - Story Creation**: Implement THIRD as core value proposition
4. **User Story 4 (P4) - Dashboard**: Implement FOURTH for complete UX flow

**Why this order differs from priorities**:
- US2 provides 3D infrastructure needed by all other stories
- US3 creates the natural app entry point
- US1 delivers the core MVP value (can be tested independently)
- US4 completes the full experience (resume functionality builds on US1)

**Independent Testing**:
- US1 can be tested by loading app directly into SETUP phase (skip boot/model selection)
- US2 can be tested via console commands triggering transitions
- US3 can be tested by loading app from scratch
- US4 requires US1 StoryReader but can use mocked story data

### Within Each User Story

- **US2 (3D Canvas)**: Scene/EarthModel/Background can be parallel → animations parallel → integration sequential
- **US3 (Boot Sequence)**: BootSequence and ModelSelector can be parallel up to UI layout → integration sequential
- **US1 (Story Creation)**: StorySetup form fields can be parallel → StoryReader parallel → integration sequential
- **US4 (Dashboard)**: Dashboard layout and story card styling can be parallel → integration with existing StoryReader

### Parallel Opportunities

**Within Setup (Phase 1)**:
- T005-T008 can all run in parallel (config files, styles, assets)

**Within Foundational (Phase 2)**:
- T011 (mockApi.js), T012 (validation.js), T013 (animations.js) can run in parallel
- T016-T018 (common components) can run in parallel

**Within US2 (3D Canvas)**:
- T019-T021 (Scene, EarthModel, Background) can run in parallel
- T022-T024 (all animation files) can run in parallel

**Within US3 (Boot Sequence)**:
- T030 (BootSequence) and T035 (ModelSelector) UI layout can run in parallel
- Integration tasks (T031-T034, T036-T039) must be sequential

**Within US1 (Story Creation)**:
- T040-T044 (StorySetup form fields) can run in parallel
- T050 (StoryReader) can develop in parallel with StorySetup
- Integration tasks (T045-T049, T051-T053) must be sequential

**Within US4 (Dashboard)**:
- T054 (Dashboard layout) can start while other tasks in progress

**Within Polish (Phase 7)**:
- T065-T072 can all run in parallel (independent improvements)

**Cross-Story Parallelization**:
- US1 and US3 can develop in parallel after US2 canvas is complete
- Common components (Phase 2) can develop while US2 3D work is in progress

---

## Parallel Example: Foundational Phase

```bash
# After Setup (Phase 1) completes, these can run simultaneously:

Terminal 1: Implement state machine
$ # Work on T009, T010 (appState.js with reducer)

Terminal 2: Implement mock API
$ # Work on T011 (mockApi.js)

Terminal 3: Implement utilities
$ # Work on T012 (validation.js), T013 (animations.js)

Terminal 4: Implement common components
$ # Work on T016 (Button.jsx), T017 (Dropdown.jsx), T018 (TextArea.jsx)

# Once all complete, can proceed to T014 (App.jsx) and T015 (UIRouter.jsx)
```

---

## Parallel Example: User Story 2 (3D Canvas)

```bash
# After Foundational (Phase 2) completes:

Terminal 1: Three.js scene setup
$ # Work on T019 (Scene.jsx)

Terminal 2: Earth model component
$ # Work on T020 (EarthModel.jsx)

Terminal 3: Background component
$ # Work on T021 (Background.jsx)

# Once scene components complete:

Terminal 1: Space to Earth animation
$ # Work on T022 (spaceToEarth.js)

Terminal 2: Earth to surface animation
$ # Work on T023 (earthToSurface.js)

Terminal 3: Surface to story animation
$ # Work on T024 (surfaceToStory.js)

# Then proceed sequentially to T025-T029 (integration)
```

---

## Implementation Strategy

### MVP Definition (Minimum Viable Product)

**Scope**: User Story 1 ONLY (Story Creation & Reading Interface)
- Can be tested by loading app directly into SETUP phase
- Delivers core value: user creates story concept and sees prologue
- Requires: Setup (Phase 1) + Foundational (Phase 2) + US1 (Phase 5) tasks only
- **Total Tasks for MVP**: T001-T053 (~53 tasks)
- **Estimated Time**: 2-3 days for single developer

### Incremental Delivery Path

1. **MVP**: Setup + Foundational + US1 → Testable story creation flow
2. **v0.2**: Add US2 (3D Canvas) → Adds cinematic visuals to existing flow
3. **v0.3**: Add US3 (Boot Sequence) → Completes entry experience
4. **v0.4**: Add US4 (Dashboard) → Enables resume functionality
5. **v1.0**: Add Polish (Phase 7) → Production-ready release

### Constitution Compliance Notes

- **500-line limit**: Each component file is estimated at 50-200 lines (modular structure enforced)
- **JSDoc comments**: Required for all functions/components (to be added during implementation)
- **Tailwind only**: All styling uses utility classes (no CSS files except Tailwind imports)
- **Terminal commands**: All dependencies installed via npm commands (no manual package.json edits)
- **User consent**: Files >50 lines will prompt for approval (most components under threshold)
- **Markdown restriction**: Only README.md (T074) and existing AGENTS.md at project root

### Risk Mitigation via Task Structure

- **Performance risk**: T069-T070 explicitly test and optimize frame rates
- **WebGL support risk**: T072 implements graceful degradation
- **Bundle size risk**: T068 adds code-splitting for Story Reader
- **Error handling risk**: T066-T067 add error boundaries and global error handling
- **Transition race conditions**: T071 adds transition locks to prevent concurrent animations

---

## Validation Checklist

Before marking feature complete, verify:

- [ ] All 4 user stories independently testable per their "Independent Test" criteria
- [ ] State machine enforces all valid transitions from stateMachine.md contract
- [ ] All 5 mock API functions implemented per mockApi.md contract
- [ ] All components under 500 lines of code (constitution Principle I)
- [ ] All functions have JSDoc comments (constitution Principle II)
- [ ] Only README.md exists at project root (constitution Principle III)
- [ ] All dependencies installed via terminal commands (constitution Principle IV)
- [ ] All UI uses Tailwind CSS only (constitution Principle VI)
- [ ] Frame rate stays above 30 FPS on mid-tier hardware (spec SC-002)
- [ ] All UI overlays readable during 3D animations (spec SC-003)
- [ ] App loads within 3 seconds on 10 Mbps connection (spec SC-007)
- [ ] All interactive elements provide feedback within 100ms (spec SC-008)
- [ ] All quickstart.md scenarios execute successfully

---

**Total Tasks**: 75  
**MVP Tasks**: 53 (T001-T053)  
**Phases**: 7 (Setup → Foundational → US2 → US3 → US1 → US4 → Polish)  
**Parallel Opportunities**: ~30 tasks marked [P]  
**Estimated MVP Completion**: 2-3 days (single developer)  
**Estimated Full Implementation**: 4-6 days (single developer, all user stories + polish)
