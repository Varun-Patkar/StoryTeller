# Tasks: Fullstack Integration

**Input**: Design documents from `/specs/001-fullstack-integration/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not requested for this feature.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create Vercel `/api` folder structure with base files in api/_shared/, api/auth/, and api/stories/
- [x] T002 Add backend env template in .env.example with MongoDB, GitHub OAuth, JWT, and base URL keys

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

- [x] T003 Implement MongoDB client helper with timeouts in api/_shared/db.js
- [x] T004 [P] Implement JWT session helpers and cookie config in api/_shared/sessions.js
- [x] T005 [P] Implement GitHub OAuth helpers (auth URL + token exchange + user fetch) in api/_shared/oauth.js
- [x] T006 [P] Implement request validation helpers in api/_shared/validation.js
- [x] T007 [P] Implement shared HTTP/response helpers in api/_shared/http.js
- [x] T008 Implement API fetch wrapper with credentials in src/services/apiClient.js
- [x] T009 Implement Ollama fetch + streaming client in src/services/ollamaClient.js

---

## Phase 3: User Story 1 - Connect Local Engine (Priority: P1) 🎯 MVP

**Goal**: Replace mocked engine checks with real BYOE connectivity and actionable CORS guidance.

**Independent Test**: Launch app with Ollama running and blocked; verify online/offline/CORS states and retry behavior.

### Implementation for User Story 1

- [x] T010 [US1] Replace `checkOllamaConnection` in src/services/mockApi.js to call ollamaClient ping
- [x] T011 [US1] Replace `getAvailableModels` in src/services/mockApi.js to call Ollama tags endpoint
- [x] T012 [US1] Update connection error handling in src/services/appState.jsx to surface CORS guidance state
- [x] T013 [US1] Update BootSequence UI in src/components/ui/BootSequence.jsx with exact `OLLAMA_ORIGINS="..." ollama serve` instructions

**Checkpoint**: Local engine connectivity gates model selection with clear remediation.

---

## Phase 4: User Story 2 - Create and Persist Stories (Priority: P2)

**Goal**: Add Book Name + Visibility and persist new stories with initial passages.

**Independent Test**: Create a story with Book Name + Visibility and confirm it appears in the correct list.

### Implementation for User Story 2

- [x] T014 [US2] Implement POST /api/stories/create handler in api/stories/create.js
- [x] T015 [P] [US2] Implement GET /api/stories/explore handler in api/stories/explore.js
- [x] T016 [P] [US2] Implement GET /api/stories/mine handler in api/stories/mine.js
- [x] T017 [US2] Add Book Name input and Visibility toggle in src/components/ui/StorySetup.jsx
- [x] T018 [US2] Extend story validation for Book Name + Visibility in src/utils/validation.js
- [x] T019 [US2] Replace createStory + getUserStories in src/services/mockApi.js with apiClient calls
- [x] T020 [US2] Update Dashboard data loading for Explore list in src/components/ui/Dashboard.jsx
- [x] T021 [US2] Generate story prologue via Ollama with streaming and system prompts in src/utils/ollamaPrompts.js

**Checkpoint**: Story creation persists to backend with LLM-generated prologue, public stories show in Explore, streaming UI shows generation in real-time.

---

## Phase 5: User Story 3 - Optional GitHub Sign-In (Priority: P3)

**Goal**: Add optional GitHub OAuth with authenticated access to "Your Stories".

**Independent Test**: Toggle logged-in/logged-out states and verify dashboard tabs and access rules.

### Implementation for User Story 3

- [x] T022 [US3] Implement GitHub OAuth callback in api/auth/github.js with session cookie
- [x] T023 [US3] Implement current-user endpoint in api/auth/me.js
- [x] T024 [US3] Add auth hydration + user state in src/services/appState.jsx using /api/auth/me
- [x] T025 [US3] Gate Dashboard tabs and add sign-in CTA in src/components/ui/Dashboard.jsx
- [x] T026 [US3] Require auth before story creation in src/components/ui/StorySetup.jsx

**Checkpoint**: Logged-in users see Your Stories; logged-out users see Explore only.

---

## Phase 6: User Story 4 - Fork Public Stories (Priority: P4)

**Goal**: Fork public stories when a different user responds, preserving history.

**Independent Test**: Respond to a public story by another user and verify a fork appears under the responder.

### Implementation for User Story 4

- [x] T027 [US4] Implement POST /api/stories/fork handler in api/stories/fork.js
- [x] T028 [US4] Add fork decision logic in src/components/ui/StoryReader.jsx
- [x] T029 [US4] Trigger fork creation from user response flow in src/components/ui/StoryPassage.jsx

**Checkpoint**: Public story responses create forked stories for the responder.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T030 [P] Harmonize API error messaging and auth handling in src/services/apiClient.js
- [x] T031 [P] Review CORS/offline copy for clarity in src/components/ui/BootSequence.jsx
- [x] T032 Run quickstart validation steps from specs/001-fullstack-integration/quickstart.md

---

## Phase 8: Story Slug + Metadata Fixes

**Purpose**: Ensure dashboard and story reader use real slugs and display metadata correctly

- [x] T033 Add slug + word count storage on story creation and return slug in responses
- [x] T034 Include slug, fandom, word count, and last modified in story list endpoints
- [x] T035 Add story lookup by slug/id and normalize frontend story loading

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2)
- **User Story 2 (P2)**: Can start after Foundational (Phase 2)
- **User Story 3 (P3)**: Can start after Foundational (Phase 2)
- **User Story 4 (P4)**: Depends on User Story 2 for persisted stories and User Story 3 for authenticated authorship

### Parallel Opportunities

- Foundational tasks T004, T005, T006, T007 can run in parallel
- User Story 2 tasks T015 and T016 can run in parallel
- Polish tasks T029 and T030 can run in parallel

---

## Parallel Example: User Story 2

- [ ] T015 [P] [US2] Implement GET /api/stories/explore handler in api/stories/explore.js
- [ ] T016 [P] [US2] Implement GET /api/stories/mine handler in api/stories/mine.js

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate local engine connectivity

### Incremental Delivery

1. Add User Story 2 for persisted story creation
2. Add User Story 3 for optional sign-in
3. Add User Story 4 for forking behavior
4. Finish with cross-cutting polish
