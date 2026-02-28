# Contract: App Phase State Machine

**Version**: 1.0.0  
**Purpose**: Define the state machine for application phase transitions  
**Implementation**: `src/services/appState.js` (Context + useReducer)

---

## Overview

The application follows a **linear state machine** with 5 distinct phases. Each phase corresponds to a UI screen and can trigger GSAP camera animations during transitions. The state machine enforces valid transitions and prevents users from skipping phases or navigating back (in MVP).

---

## State Definition

```typescript
interface AppState {
  phase: AppPhase;
  previousPhase: AppPhase | null;
  isTransitioning: boolean;
  transitionTarget: AppPhase | null;
  connectionStatus: ConnectionStatus;
  selectedModel: AIModel | null;
  currentStoryId: string | null;
  error: AppError | null;
}

enum AppPhase {
  CHECKING_ENGINE = 'CHECKING_ENGINE',
  SELECTING_SOURCE = 'SELECTING_SOURCE',
  DASHBOARD = 'DASHBOARD',
  SETUP = 'SETUP',
  PLAYING = 'PLAYING'
}

type ConnectionStatus = 'CHECKING' | 'ONLINE' | 'OFFLINE' | 'ERROR';

interface AppError {
  code: string;
  message: string;
  phase: AppPhase;
  timestamp: string;
}
```

**Initial State**:
```javascript
{
  phase: 'CHECKING_ENGINE',
  previousPhase: null,
  isTransitioning: false,
  transitionTarget: null,
  connectionStatus: 'CHECKING',
  selectedModel: null,
  currentStoryId: null,
  error: null
}
```

---

## Phase Definitions

### Phase 1: CHECKING_ENGINE

**Purpose**: Boot sequence; checks backend service connection

**UI Elements**:
- Mystical loading animation
- Text: "Awakening the gateway..."
- Retry button (if offline)

**Entry Conditions**: None (initial phase)

**Exit Conditions**:
- Connection status becomes `'ONLINE'` → transition to SELECTING_SOURCE
- User clicks retry → re-check connection (stay in phase)

**Valid Actions**:
- `CONNECTION_CHECK_START`
- `CONNECTION_CHECK_SUCCESS`
- `CONNECTION_CHECK_FAILURE`
- `CONNECTION_RETRY`

**3D Canvas State**: No canvas rendered (or starfield background)

---

### Phase 2: SELECTING_SOURCE

**Purpose**: User selects AI model for story generation

**UI Elements**:
- Dropdown with available models
- Model descriptions (mystical names)
- Confirm button

**Entry Conditions**:
- `connectionStatus === 'ONLINE'`
- Transitioned from CHECKING_ENGINE

**Exit Conditions**:
- User selects model and confirms → transition to DASHBOARD

**Valid Actions**:
- `MODEL_SELECTED`
- `TRANSITION_TO_DASHBOARD`

**3D Canvas State**: No canvas yet (canvas initializes on transition)

**Validation**:
- Must select a model before confirming
- Model ID must exist in available models list

---

### Phase 3: DASHBOARD

**Purpose**: Display user's stories; options to Resume or Create New

**UI Elements**:
- Story cards (title, last modified, word count)
- "Create New Story" button
- "Resume" buttons on story cards

**Entry Conditions**:
- `selectedModel !== null`
- Transitioned from SELECTING_SOURCE or returned from SETUP (future)

**Exit Conditions**:
- User clicks "Create New" → transition to SETUP
- User clicks "Resume" on story → transition to PLAYING

**Valid Actions**:
- `TRANSITION_TO_SETUP`
- `TRANSITION_TO_PLAYING` (with story ID)
- `STORIES_LOADED` (from API call)

**3D Canvas State**: Earth model visible at medium distance, slowly rotating

**Animation Trigger**: First transition to DASHBOARD plays "space to Earth" zoom

---

### Phase 4: SETUP

**Purpose**: User defines story parameters (fandom, character, premise, goals)

**UI Elements**:
- Fandom dropdown
- Character text area (500 char max, counter)
- Premise text area (1000 char max, counter)
- Goals text area (500 char max, counter)
- "Begin Story" submit button

**Entry Conditions**:
- Transitioned from DASHBOARD via "Create New"

**Exit Conditions**:
- User submits valid setup → transition to PLAYING

**Valid Actions**:
- `SETUP_FIELD_CHANGED` (updates form state)
- `SETUP_SUBMITTED`
- `STORY_CREATION_SUCCESS`
- `STORY_CREATION_FAILURE`

**3D Canvas State**: Earth model visible, zoomed closer to surface

**Animation Trigger**: Transition from DASHBOARD plays "Earth to surface" zoom

**Validation**:
- All fields required (non-empty)
- Character: 10-500 chars
- Premise: 20-1000 chars
- Goals: 10-500 chars
- Submit button disabled until validation passes

---

### Phase 5: PLAYING

**Purpose**: Display story text (prologue in MVP); user reads narrative

**UI Elements**:
- Clean, minimalist reading interface
- Story title
- Current passage text (2-4 paragraphs)
- [Future]: Choice buttons, continue button

**Entry Conditions**:
- Valid story created (from SETUP) OR
- Valid story loaded (from DASHBOARD resume)

**Exit Conditions**: None in MVP (terminal phase)

**Valid Actions**:
- `STORY_LOADED` (passage text received)
- [Future]: `CHOICE_SELECTED`, `NEXT_PASSAGE`

**3D Canvas State**: Earth model faded out; canvas hidden or shows subtle background

**Animation Trigger**: Transition from SETUP plays "surface to story" extreme zoom + fade

**Validation**:
- `currentStoryId` must be non-null
- Story text must be loaded before displaying interface

---

## Actions (Reducer)

### Action: CONNECTION_CHECK_START

**Dispatched**: On app mount, or user clicks retry

**Payload**: None

**State Changes**:
```javascript
{
  connectionStatus: 'CHECKING',
  error: null
}
```

**Side Effects**: Calls `mockApi.checkOllamaConnection()`

---

### Action: CONNECTION_CHECK_SUCCESS

**Dispatched**: Mock API returns `status: 'online'`

**Payload**: `{ timestamp: string }`

**State Changes**:
```javascript
{
  connectionStatus: 'ONLINE',
  phase: 'SELECTING_SOURCE',  // Auto-transition
  previousPhase: 'CHECKING_ENGINE'
}
```

**Validation**: Must be in CHECKING_ENGINE phase

---

### Action: CONNECTION_CHECK_FAILURE

**Dispatched**: Mock API returns `status: 'offline'`

**Payload**: `{ message: string }`

**State Changes**:
```javascript
{
  connectionStatus: 'OFFLINE',
  error: {
    code: 'CONNECTION_OFFLINE',
    message: payload.message,
    phase: 'CHECKING_ENGINE',
    timestamp: new Date().toISOString()
  }
}
```

**Validation**: Must be in CHECKING_ENGINE phase

---

### Action: MODEL_SELECTED

**Dispatched**: User picks model from dropdown

**Payload**: `{ model: AIModel }`

**State Changes**:
```javascript
{
  selectedModel: payload.model
}
```

**Validation**:
- Must be in SELECTING_SOURCE phase
- `model.id` must exist in available models

---

### Action: TRANSITION_TO_DASHBOARD

**Dispatched**: User confirms model selection

**Payload**: None

**State Changes**:
```javascript
{
  isTransitioning: true,
  transitionTarget: 'DASHBOARD'
}
```

**Side Effects**:
1. Triggers GSAP animation (space to Earth zoom)
2. Loads user stories via `mockApi.getUserStories()`
3. On animation complete, dispatches `TRANSITION_COMPLETE`

**Validation**:
- `selectedModel !== null`
- Must be in SELECTING_SOURCE phase

---

### Action: TRANSITION_COMPLETE

**Dispatched**: GSAP animation finishes

**Payload**: `{ targetPhase: AppPhase }`

**State Changes**:
```javascript
{
  phase: payload.targetPhase,
  previousPhase: state.phase,
  isTransitioning: false,
  transitionTarget: null
}
```

**Validation**: `isTransitioning` must be true

---

### Action: TRANSITION_TO_SETUP

**Dispatched**: User clicks "Create New Story" on Dashboard

**Payload**: None

**State Changes**:
```javascript
{
  isTransitioning: true,
  transitionTarget: 'SETUP',
  currentStoryId: null  // Clear any previously loaded story
}
```

**Side Effects**: Triggers GSAP animation (Earth to surface zoom)

**Validation**: Must be in DASHBOARD phase

---

### Action: TRANSITION_TO_PLAYING

**Dispatched**: User clicks "Resume" on story card OR story creation succeeds

**Payload**: `{ storyId: string }`

**State Changes**:
```javascript
{
  isTransitioning: true,
  transitionTarget: 'PLAYING',
  currentStoryId: payload.storyId
}
```

**Side Effects**:
1. Loads story via `mockApi.getStoryById(storyId)`
2. Triggers GSAP animation (surface to story zoom + fade)
3. On animation complete, dispatches `TRANSITION_COMPLETE`

**Validation**:
- Must be in DASHBOARD or SETUP phase
- `storyId` must be non-empty string

---

### Action: SETUP_SUBMITTED

**Dispatched**: User clicks "Begin Story" button

**Payload**: `{ setup: StorySetup }`

**State Changes**: (None immediately; waits for API response)

**Side Effects**: Calls `mockApi.createStory(setup)`

**Validation**:
- Must be in SETUP phase
- All setup fields must pass validation

---

### Action: STORY_CREATION_SUCCESS

**Dispatched**: Mock API returns created story

**Payload**: `{ story: Story }`

**State Changes**:
```javascript
{
  currentStoryId: payload.story.id
}
// Then triggers TRANSITION_TO_PLAYING
```

**Validation**: Must have dispatched SETUP_SUBMITTED before this

---

### Action: STORY_CREATION_FAILURE

**Dispatched**: Mock API rejects story creation

**Payload**: `{ error: APIError }`

**State Changes**:
```javascript
{
  error: {
    code: payload.error.error,
    message: payload.error.message,
    phase: 'SETUP',
    timestamp: new Date().toISOString()
  }
}
```

**UI Behavior**: Show error message, stay in SETUP phase, allow retry

---

### Action: STORIES_LOADED

**Dispatched**: Mock API returns user stories list

**Payload**: `{ stories: StorySummary[] }`

**State Changes**: (Stored in separate context; not in AppState)

**Validation**: Must be in DASHBOARD phase or transitioning to it

---

## Transition Rules

### Valid Transitions Matrix

| From Phase       | To Phase         | Trigger                          | Animation          |
|------------------|------------------|----------------------------------|--------------------|
| CHECKING_ENGINE  | SELECTING_SOURCE | Connection success               | None               |
| SELECTING_SOURCE | DASHBOARD        | Model confirmed                  | Space → Earth      |
| DASHBOARD        | SETUP            | "Create New" clicked             | Earth → Surface    |
| DASHBOARD        | PLAYING          | "Resume" clicked                 | (Brief fade)       |
| SETUP            | PLAYING          | Story submitted                  | Surface → Story    |

### Invalid Transitions (Rejected)

- Skipping phases (e.g., SELECTING_SOURCE → SETUP)
- Backward navigation (e.g., DASHBOARD → SELECTING_SOURCE)
- Transitioning while `isTransitioning === true`
- Transitioning without meeting entry conditions

**Error Handling**:
```javascript
// In reducer
if (invalidTransition) {
  console.error(`Invalid transition: ${state.phase} → ${action.targetPhase}`);
  return state;  // No state change
}
```

---

## Animation Integration

### Animation Lifecycle

1. **User triggers transition** (button click, form submit)
2. **Dispatch action** (e.g., `TRANSITION_TO_DASHBOARD`)
3. **Reducer sets `isTransitioning: true`** and **locks UI** (disable buttons)
4. **GSAP animation starts** (camera zoom, fades)
5. **Animation onComplete callback** dispatches `TRANSITION_COMPLETE`
6. **Reducer updates `phase`** and **unlocks UI** (`isTransitioning: false`)

### GSAP Hook Integration

Custom hook `usePhaseTransition` listens for state changes and triggers animations:

```javascript
// Pseudocode
useEffect(() => {
  if (state.transitionTarget === 'DASHBOARD') {
    cameraAnimations.spaceToEarth({
      onComplete: () => dispatch({ type: 'TRANSITION_COMPLETE', targetPhase: 'DASHBOARD' })
    });
  }
}, [state.transitionTarget]);
```

---

## Context Provider Shape

```typescript
interface AppContext {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  // Derived state helpers
  canTransition: (targetPhase: AppPhase) => boolean;
  currentPhaseUI: React.ComponentType;
}
```

**Usage in Components**:
```javascript
const { state, dispatch } = useAppContext();

// Check connection
dispatch({ type: 'CONNECTION_CHECK_START' });

// Select model
dispatch({ type: 'MODEL_SELECTED', payload: { model } });

// Transition to dashboard
if (state.selectedModel) {
  dispatch({ type: 'TRANSITION_TO_DASHBOARD' });
}
```

---

## Error States

### Connection Errors

- Stay in CHECKING_ENGINE phase
- Show retry button
- Allow unlimited retries

### Story Creation Errors

- Stay in SETUP phase
- Display error message below form
- Highlight invalid field (if validation error)
- Allow user to correct and resubmit

### Story Load Errors (Resume)

- Show error modal on DASHBOARD
- Allow user to dismiss and try different story
- Log error for debugging

---

## Future Enhancements (Out of MVP Scope)

- **Back Navigation**: Allow SETUP → DASHBOARD, PLAYING → DASHBOARD
- **Deep Linking**: URL params to resume specific phase/story
- **Phase History Stack**: Breadcrumb navigation
- **Persistent Phase**: Save current phase to localStorage, restore on reload
- **Multi-Story Mode**: Switch between stories without leaving PLAYING phase

---

**Next**: Quickstart Guide
