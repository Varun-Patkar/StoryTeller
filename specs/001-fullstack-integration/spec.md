# Feature Specification: Fullstack Integration

**Feature Branch**: `001-fullstack-integration`  
**Created**: 2026-03-04  
**Status**: Draft  
**Input**: User description: "Extend the existing StoryTeller frontend to replace mocks with real BYOE Ollama connections and a Vercel Serverless backend. New Features: 1. Engine Connection (BYOE): Replace mocked connections. The React app must ping http://localhost:11434 directly. Add UI handling for CORS errors, instructing the user to run: OLLAMA_ORIGINS=\"...\" ollama serve. 2. Auth & Identity: Add optional GitHub OAuth. If logged out, users only see an Explore tab on the dashboard (public stories). If logged in, they see Your Stories and Explore. 3. Updated Story Creation: Update the existing setup form. Add a Book Name input and a Visibility toggle (Public/Private). 4. The Forking Engine: If User B reads User A's public story and submits a new text response, the system automatically forks it. It duplicates the story history to User B, names it {Original Book Name} - {User B}, and assigns User B as the new author. 5. Backend Persistence: Replace frontend in-memory/mock storage. Use Python Vercel Serverless functions in an /api folder connecting to MongoDB Atlas to save users, stories, and passages."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Connect Local Engine (Priority: P1)

As a reader, I want the app to verify my local engine connection so I can proceed only when the engine is reachable, with clear guidance when it is not.

**Why this priority**: The experience cannot start without a working local engine, so this is the primary gate to all other value.

**Independent Test**: Can be fully tested by loading the app with the local engine running or blocked and observing the connection state and guidance.

**Acceptance Scenarios**:

1. **Given** the local engine is running, **When** the app checks connectivity, **Then** the user is allowed to continue to model selection without errors.
2. **Given** the local engine is blocked by CORS, **When** the app checks connectivity, **Then** a clear error state appears with the exact command to run to enable allowed origins.
3. **Given** the local engine is offline, **When** the app checks connectivity, **Then** the user sees an offline state with a retry option.

---

### User Story 2 - Create and Persist Stories (Priority: P2)

As a creator, I want to add a book name and choose story visibility so my stories are saved with the right identity and privacy.

**Why this priority**: Story creation is the core interaction and must include the new metadata and persistence requirements.

**Independent Test**: Can be fully tested by creating a story and confirming it appears in the appropriate list with its book name and visibility.

**Acceptance Scenarios**:

1. **Given** I complete the setup form with a book name and visibility, **When** I submit, **Then** the story is created and appears in the correct list.
2. **Given** the book name is missing, **When** I submit the form, **Then** I see a validation error and the story is not created.

---

### User Story 3 - Optional GitHub Sign-In (Priority: P3)

As a user, I want to optionally sign in so I can see my own stories, while still exploring public stories when logged out.

**Why this priority**: Personal story access depends on identity, but the product must remain usable without login.

**Independent Test**: Can be fully tested by toggling logged-in/logged-out states and verifying the dashboard tabs and accessible story lists.

**Acceptance Scenarios**:

1. **Given** I am logged out, **When** I open the dashboard, **Then** I only see the Explore tab with public stories.
2. **Given** I am logged in, **When** I open the dashboard, **Then** I see both Your Stories and Explore.
3. **Given** I am logged out, **When** I attempt to access a private story, **Then** access is denied and I am guided to sign in.

---

### User Story 4 - Fork Public Stories (Priority: P4)

As a reader, I want my response to a public story to fork it into my own version so I can continue the narrative under my authorship.

**Why this priority**: Forking enables community-driven narratives while keeping ownership and history intact.

**Independent Test**: Can be tested by responding to a public story and verifying a new story appears under the responding user with duplicated history.

**Acceptance Scenarios**:

1. **Given** I read another user’s public story, **When** I submit a new response, **Then** a new story is created under my account with the original history copied.
2. **Given** the fork is created, **When** I view its details, **Then** the title follows the format "{Original Book Name} - {User B}" and I am the author.
3. **Given** I respond to my own story, **When** I submit a new response, **Then** the story continues without creating a fork.

---

### Edge Cases

- Local engine responds slowly or intermittently; user sees a clear retry state without crashing the UI.
- CORS errors mask network errors; the UI still provides a concrete command to enable origins.
- OAuth flow is canceled or denied; user remains logged out with no broken session state.
- Two users fork the same public story concurrently; each receives an independent fork.
- Forked story name collides with an existing title; system still preserves the fork with a deterministic unique suffix.
- A private story is requested by a non-owner; access is denied and no private content is exposed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST check connectivity to the local engine at `http://localhost:11434` from the frontend during startup.
- **FR-002**: System MUST display a clear online/offline state for the local engine and allow retry when offline.
- **FR-003**: System MUST detect CORS-related connection failures and display instructions that include the exact `OLLAMA_ORIGINS="..." ollama serve` command.
- **FR-004**: Users MUST be able to proceed to model selection only when the local engine is reachable.
- **FR-005**: System MUST support optional GitHub sign-in; logged-out users can still browse public stories.
- **FR-006**: Dashboard MUST show only Explore when logged out and show both Your Stories and Explore when logged in.
- **FR-007**: System MUST restrict private stories to their authors and prevent logged-out access.
- **FR-008**: Story setup MUST include a Book Name input and a Visibility toggle (Public/Private).
- **FR-009**: System MUST validate that Book Name is provided before story creation.
- **FR-010**: System MUST persist users, stories, and passages to backend storage and retrieve them on demand.
- **FR-011**: When a user responds to another user’s public story, system MUST create a fork that duplicates the story history under the responding user.
- **FR-012**: Forked stories MUST be titled "{Original Book Name} - {User B}" and assign User B as author.
- **FR-013**: Responding to one’s own story MUST continue the story without creating a fork.
- **FR-014**: Logged-out users MUST be prompted to sign in before creating stories or forking public stories.
- **FR-015**: Backend endpoints MUST be limited to authentication and persistence operations, not local engine calls.

### Key Entities *(include if feature involves data)*

- **User**: Represents a person using the app; includes identity status and authored stories.
- **Story**: Represents a narrative with book name, visibility, author, and story history; may reference an original story when forked.
- **Passage**: Represents a single segment of a story, including user responses and generated text.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of users with a running local engine reach model selection within 10 seconds of app load.
- **SC-002**: 100% of CORS failures show actionable guidance within 2 seconds of detection.
- **SC-003**: 90% of logged-in users can view their own stories without error on the first attempt.
- **SC-004**: 90% of users complete story creation with a book name in under 2 minutes.
- **SC-005**: 95% of public-story responses create a visible fork for the responding user within 5 seconds.

## Assumptions

- Default visibility for new stories is Private unless the user explicitly selects Public.
- Book Name length is constrained to a reasonable UI-friendly limit while preserving user intent.
- Backend persistence is provided by serverless endpoints and a managed database, aligned with project constraints.
- Story creation and forking require an authenticated user to establish authorship.
