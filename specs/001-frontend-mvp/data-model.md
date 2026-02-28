# Data Model: StoryTeller Frontend MVP

**Phase 1 Output** | **Created**: 2026-02-28  
**Purpose**: Define entities, their relationships, validation rules, and state transitions

---

## Entity Definitions

### Entity 1: AppPhase (State Machine)

**Purpose**: Represents the current stage of the application flow

**Fields**:
- `current` (enum): One of `CHECKING_ENGINE`, `SELECTING_SOURCE`, `DASHBOARD`, `SETUP`, `PLAYING`
- `previous` (enum | null): Previous phase for back navigation
- `transitioningTo` (enum | null): Target phase during animation (locks UI)
- `isAnimating` (boolean): Whether a GSAP animation is currently in progress

**Valid Transitions** (State Machine):
```
CHECKING_ENGINE → SELECTING_SOURCE (on connection success)
CHECKING_ENGINE → CHECKING_ENGINE (on connection retry)
SELECTING_SOURCE → DASHBOARD (on model selection)
DASHBOARD → SETUP (on "Create New Story")
DASHBOARD → PLAYING (on "Resume Story")
SETUP → PLAYING (on story submission)
```

**Invalid Transitions** (must be rejected):
- Cannot skip phases (e.g., CHECKING_ENGINE → SETUP)
- Cannot transition while `isAnimating === true`
- Cannot transition back from PLAYING to any other phase in MVP

**Validation Rules**:
- Phase changes dispatched via Context reducer
- Reducer validates transition before updating state
- Invalid transitions log error and maintain current phase

**Related Entities**: None (root state entity)

---

### Entity 2: ConnectionStatus

**Purpose**: Tracks the backend service (Ollama) connection state

**Fields**:
- `status` (enum): One of `CHECKING`, `ONLINE`, `OFFLINE`, `ERROR`
- `lastChecked` (timestamp): ISO 8601 datetime of last connection attempt
- `retryCount` (number): Number of retry attempts for offline state
- `errorMessage` (string | null): User-facing mystical error message

**Validation Rules**:
- `status` must be one of the 4 enum values
- `lastChecked` required when `status !== 'CHECKING'`
- `retryCount` resets to 0 on successful connection
- `errorMessage` only present when `status === 'ERROR'`

**State Transitions**:
```
CHECKING → ONLINE (mock returns success)
CHECKING → OFFLINE (mock returns failure)
OFFLINE → CHECKING (on user retry click)
ERROR → CHECKING (on user retry click)
```

**UI Implications**:
- CHECKING: Show spinner with "Awakening the gateway..."
- ONLINE: Auto-proceed to model selection
- OFFLINE: Show mystical prompt with retry button
- ERROR: Show error message with retry button

**Related Entities**: Influences `AppPhase` transition from CHECKING_ENGINE to SELECTING_SOURCE

---

### Entity 3: AIModel

**Purpose**: Represents an available language model (LLM) for story generation

**Fields**:
- `id` (string): Unique identifier (e.g., "llama3-8b")
- `name` (string): Technical name (e.g., "Llama 3")
- `displayName` (string): Mystical UI name (e.g., "The Dreamer")
- `description` (string): Brief mystical description (e.g., "Weaves tales of adventure and wonder")
- `parameters` (object | null): Model metadata (size, context window) - not used in MVP UI

**Validation Rules**:
- `id` must be unique within model list
- `name` and `displayName` required (non-empty strings)
- `description` max 200 characters

**Mock Data Examples**:
```json
[
  {
    "id": "llama3-8b",
    "name": "Llama 3",
    "displayName": "The Dreamer",
    "description": "Weaves intricate tales of adventure, mystery, and wonder"
  },
  {
    "id": "mistral-7b",
    "name": "Mistral",
    "displayName": "The Weaver",
    "description": "Crafts stories with precision and poetic elegance"
  }
]
```

**UI Implications**:
- Displayed in dropdown on SELECTING_SOURCE phase
- Selection stored in `selectedModel` (see UserSession)
- Disabled if `ConnectionStatus.status !== 'ONLINE'`

**Related Entities**: Selected model stored in `UserSession`

---

### Entity 4: StorySetup

**Purpose**: User-defined parameters for creating a new story

**Fields**:
- `fandom` (string): Selected fictional universe (e.g., "Douluo Dalu")
- `character` (string): Character description (500 char max)
- `premise` (string): Story premise/starting situation (1000 char max)
- `goals` (string): Character goals and motivations (500 char max)
- `submittedAt` (timestamp | null): When setup was submitted

**Validation Rules**:
- All fields required (non-empty) before submission
- `character` max 500 chars, min 10 chars
- `premise` max 1000 chars, min 20 chars
- `goals` max 500 chars, min 10 chars
- `fandom` must be one of available options (dropdown enforced)

**UI Implications**:
- Character count indicators for each text area
- Submit button disabled until all fields valid
- Validation errors shown on blur (thematic messages)

**Validation Error Messages (Mystical)**:
- Empty character: "The protagonist awaits definition..."
- Too short premise: "The tale needs more substance to begin..."
- Too long goals: "Focus your intentions; brevity brings clarity..."

**Related Entities**: Submitted setup creates `Story` entity

---

### Entity 5: Story

**Purpose**: A created text adventure with its narrative state

**Fields**:
- `id` (string): Unique identifier (UUID v4)
- `title` (string): Story title (auto-generated or user-provided)
- `setup` (StorySetup): Original creation parameters (denormalized)
- `currentPassage` (string): Current narrative text (mocked prologue in MVP)
- `passageHistory` (array of strings): All previous passages (empty in MVP)
- `createdAt` (timestamp): ISO 8601 creation date
- `lastModified` (timestamp): ISO 8601 last interaction date
- `wordCount` (number): Total words across all passages

**Validation Rules**:
- `id` must be unique
- `title` auto-generated if not provided: "{fandom} - {character name}"
- `setup` must be valid `StorySetup` (validated before submission)
- `currentPassage` required (non-empty)
- `createdAt` and `lastModified` required
- `wordCount` calculated, not user-input

**State Transitions** (Future - not MVP):
```
CREATED → IN_PROGRESS (user reads prologue)
IN_PROGRESS → IN_PROGRESS (user makes choices, story advances)
IN_PROGRESS → COMPLETED (user reaches ending)
```

**UI Implications**:
- Displayed as card on Dashboard (title, lastModified, wordCount)
- Full narrative shown in Story Interface (currentPassage)
- Future: Passage history accessible via scroll/pagination

**Related Entities**: Created from `StorySetup`; listed in `UserSession.stories`

---

### Entity 7: StoryPassage

**Purpose**: Represents a single section of narrative in the interactive story with player choices

**Fields**:
- `id` (string): Unique identifier (e.g., "passage-001", "passage-002")
- `text` (string): The narrative content (2-4 paragraphs, 200-400 words)
- `choices` (array of StoryChoice): Available decisions the player can make (2-4 choices)
- `displayedAt` (timestamp | null): When this passage was first shown to the user
- `selectedChoiceId` (string | null): ID of the choice the user selected (null for current passage)

**Validation Rules**:
- `id` must be unique within a story's passage array
- `text` required (non-empty), should be 200-1000 words for optimal reading
- `choices` array must have 2-4 elements (enforced by mock API)
- `displayedAt` set when passage first renders
- `selectedChoiceId` must match one of the choice IDs in `choices` array if not null

**UI Implications**:
- Text displays with streaming animation (typewriter effect at ~100ms per word)
- Choices fade in after text streaming completes
- Previous passages show as static text with selected choice highlighted
- Current passage is always the last in the array

**Mock Data Example**:
```json
{
  "id": "passage-001",
  "text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.\n\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  "choices": [
    {
      "id": "choice-001",
      "text": "Explore the mysterious forest path"
    },
    {
      "id": "choice-002",
      "text": "Return to the village for supplies"
    },
    {
      "id": "choice-003",
      "text": "Investigate the ancient ruins"
    }
  ],
  "displayedAt": "2026-02-28T14:30:00Z",
  "selectedChoiceId": "choice-001"
}
```

**Related Entities**: Part of `Story.passages` array; contains `StoryChoice` objects

---

### Entity 8: StoryChoice

**Purpose**: Represents a player decision point that links to the next passage

**Fields**:
- `id` (string): Unique identifier (e.g., "choice-001")
- `text` (string): The choice description shown to the player (max 100 chars)
- `nextPassageId` (string | null): ID of the passage this choice leads to (null = generated dynamically)

**Validation Rules**:
- `id` must be unique within a passage's choices array
- `text` required (non-empty), max 100 characters for button sizing
- `text` should be action-oriented (e.g., "Explore the forest" not "Forest")
- `nextPassageId` can be null in MVP (dynamically generated by mock API)

**UI Implications**:
- Rendered as button with mystical styling (blue-600 background, hover effects)
- Disabled during passage streaming
- Fades out with siblings when one is selected
- Selected choice shows checkmark/highlight in passage history

**Mock Data Example**:
```json
{
  "id": "choice-002",
  "text": "Return to the village for supplies",
  "nextPassageId": null
}
```

**Related Entities**: Part of `StoryPassage.choices` array; links to next `StoryPassage`

---

### Entity 5: Story (Updated for Interactive Reading)

**Purpose**: A created text adventure with its narrative state and passage history

**Fields**:
- `id` (string): Unique identifier (UUID v4)
- `slug` (string): URL-friendly identifier (e.g., "douluo-dalu-soul-forge")
- `title` (string): Story title (auto-generated or user-provided)
- `setup` (StorySetup): Original creation parameters (denormalized)
- `passages` (array of StoryPassage): All passages in chronological order (first is prologue)
- `currentPassageIndex` (number): Index of the passage user is currently reading (initially 0)
- `createdAt` (timestamp): ISO 8601 creation date
- `lastModified` (timestamp): ISO 8601 last interaction date
- `wordCount` (number): Total words across all passages

**Validation Rules**:
- `id` must be unique (UUID v4)
- `slug` must be unique, URL-safe (lowercase, hyphens, alphanumeric only), max 60 characters
- `slug` auto-generated from title: lowercase, spaces→hyphens, remove special chars, truncate to 60
- `slug` collision handling: append `-2`, `-3`, etc. to ensure uniqueness
- `title` auto-generated if not provided: "{fandom} - {character name}"
- `setup` must be valid `StorySetup` (validated before submission)
- `passages` array must have at least 1 element (the prologue)
- `currentPassageIndex` must be valid index in `passages` array
- `createdAt` and `lastModified` required
- `wordCount` calculated from all passage texts, not user-input

**State Transitions**:
```
CREATED → IN_PROGRESS (user reads prologue, index = 0)
IN_PROGRESS → IN_PROGRESS (user makes choice, new passage added, index increments)
IN_PROGRESS → COMPLETED (user reaches final passage with no choices - future)
```

**UI Implications**:
- Displayed as card on Dashboard (title, lastModified, wordCount)
- Story Interface shows all passages in scrollable view
- Current passage (at currentPassageIndex) uses streaming text animation
- Previous passages (index < currentPassageIndex) show as static text
- When user makes choice, currentPassageIndex increments and new passage added

**Updated Mock Data Example**:
```json
{
  "id": "story-001",
  "slug": "douluo-dalu-soul-forge",
  "title": "Douluo Dalu - The Soul Forge",
  "setup": { /* StorySetup fields */ },
  "passages": [
    {
      "id": "passage-000",
      "text": "[Prologue lorem ipsum...]",
      "choices": [ /* 3 choices */ ],
      "displayedAt": "2026-02-28T14:30:00Z",
      "selectedChoiceId": "choice-001"
    },
    {
      "id": "passage-001",
      "text": "[Next passage lorem ipsum...]",
      "choices": [ /* 3 choices */ ],
      "displayedAt": "2026-02-28T14:32:00Z",
      "selectedChoiceId": null
    }
  ],
  "currentPassageIndex": 1,
  "createdAt": "2026-02-28T14:30:00Z",
  "lastModified": "2026-02-28T14:32:00Z",
  "wordCount": 487
}
```

**Related Entities**: Created from `StorySetup`; listed in `UserSession.stories`; contains `StoryPassage` array

---

### Entity 6: UserSession

**Purpose**: Tracks user's current session state (not persisted in MVP)

**Fields**:
- `selectedModel` (AIModel | null): Currently selected AI model
- `stories` (array of Story): User's created stories (mocked data in MVP)
- `currentStoryId` (string | null): ID of story being viewed in PLAYING phase
- `preferences` (object): UI preferences (future: theme, text size)

**Validation Rules**:
- `selectedModel` required before transitioning to DASHBOARD
- `currentStoryId` must match a story in `stories` array or be null
- `stories` array can be empty on first visit

**Persistence Strategy (MVP)**:
- Session state stored in React Context (lost on refresh)
- Future: `localStorage` for stories array
- Future: Backend API for cloud sync

**UI Implications**:
- Model selection persisted across phase transitions
- Stories array populates Dashboard cards
- `currentStoryId` determines which story loads in Story Interface

**Related Entities**: Contains references to `AIModel` and `Story`

---

## Relationships

```
AppPhase (1) ←→ (1) UserSession
  └─ Controls which UI phase is active
  
ConnectionStatus (1) ←→ (1) AppPhase
  └─ ONLINE status required for CHECKING_ENGINE → SELECTING_SOURCE

UserSession (1) ←→ (0..*) Story
  └─ User has zero or more stories

UserSession (1) ←→ (0..1) AIModel
  └─ User selects one model per session

Story (1) ←→ (1) StorySetup
  └─ Each story created from one setup (denormalized)

Story (1) ←→ (1..*) StoryPassage
  └─ Story contains one or more passages (array, ordered chronologically)

StoryPassage (1) ←→ (2..4) StoryChoice
  └─ Each passage has 2-4 choices (enforced by mock API)

StoryChoice (1) ←→ (0..1) StoryPassage
  └─ Choice links to next passage (null = dynamically generated)
```

**Cardinality Key**:
- `(1)` = exactly one
- `(0..1)` = zero or one
- `(0..*)` = zero or many

---

## Validation Summary

**Client-Side Validation** (all validation in MVP is client-side):

1. **Phase Transitions**: State machine enforces valid flow
2. **Form Inputs**: Character limits, required fields on StorySetup
3. **Model Selection**: Must select model before proceeding
4. **Connection Status**: Must be ONLINE to access features

**No Server-Side Validation** (MVP uses mocks):
- All mock API responses return success
- Future: Backend validates StorySetup before generation
- Future: Rate limiting on story creation

---

## Mocked Data

### Mock Stories for Dashboard

```json
[
  {
    "id": "story-001",
    "title": "Douluo Dalu - The Soul Forge",
    "setup": {
      "fandom": "Douluo Dalu",
      "character": "A blacksmith's apprentice with a rare martial soul",
      "premise": "Awakened a legendary forge spirit, must master soul forging",
      "goals": "Become the greatest soul master blacksmith, forge legendary weapons"
    },
    "currentPassage": "[Mocked passage text...]",
    "passageHistory": [],
    "createdAt": "2026-02-27T14:30:00Z",
    "lastModified": "2026-02-27T15:45:00Z",
    "wordCount": 1247
  },
  {
    "id": "story-002",
    "title": "Douluo Dalu - Spirit Hall Infiltrator",
    "setup": { /* ... */ },
    "currentPassage": "[Mocked passage text...]",
    "passageHistory": [],
    "createdAt": "2026-02-26T10:15:00Z",
    "lastModified": "2026-02-26T11:20:00Z",
    "wordCount": 892
  }
]
```

### Mock Prologue Text

```
The first wisps of spiritual energy coalesced around you, drawn by the awakening 
of your martial soul. In the dim forge, the air shimmered with unseen potential.

Your master's voice echoed from the past: "A blacksmith shapes more than metal. 
We shape destiny." The words felt prophetic now, as the ancient forge spirit 
materialized before you—a being of fire and iron, its presence both terrible 
and magnificent.

"You carry the spark of creation," it rumbled. "But creation demands sacrifice. 
Steel is forged through fire. Are you prepared to be tempered?"

The choice that had seemed distant suddenly pressed close. The path of the Soul 
Forge stretched ahead, promising power beyond imagination... and trials beyond 
reckUser Accounts**: Add `User` entity with authentication
- **Cloud Storage**: Persist stories to backend database
- **Story Sharing**: Add `visibility` (private/public) and sharing URLs
- **Themes**: Expand `preferences` with custom Tailwind themes
- **Rich Text**: Add formatting support (bold, italics, images) in passage text
- **Save Points**: Allow saving mid-story and resuming from specific passages
- **Branching Analytics**: Track which choices are most popular, story completion rates
- **Dynamic Difficulty**: Adjust passage complexity based on user reading speed and choic

## Future Enhancements (Out of MVP Scope)

- **Choice System**: Add `choices` array to Story entity (user-selectable actions)
- **Branching Narratives**: Track decision tree in `passageHistory`
- **User Accounts**: Add `User` entity with authentication
- **Cloud Storage**: Persist stories to backend database
- **Story Sharing**: Add `visibility` (private/public) and sharing URLs
- **Themes**: Expand `preferences` with custom Tailwind themes

---

**Next**: Define contracts for Mock API and Phase State Machine
