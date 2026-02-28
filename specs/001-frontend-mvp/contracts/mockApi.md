# Contract: Mock API

**Version**: 1.0.0  
**Purpose**: Define the interface contract for mocked backend API calls  
**Implementation**: `src/services/mockApi.js`

---

## Overview

This contract defines the async functions that simulate backend API calls during the MVP phase. All functions return Promises that resolve after simulated network delays (500-1500ms). These contracts will be replaced with real `fetch()` calls in future phases while maintaining the same interface shape.

---

## Function: `checkOllamaConnection()`

**Purpose**: Check if the backend service (Ollama) is running and accessible

**Parameters**: None

**Returns**: `Promise<ConnectionResult>`

```typescript
interface ConnectionResult {
  status: 'online' | 'offline';
  timestamp: string; // ISO 8601 datetime
  message?: string;  // Optional mystical status message
}
```

**Success Response Example**:
```json
{
  "status": "online",
  "timestamp": "2026-02-28T14:30:00Z",
  "message": "The gateway awakens..."
}
```

**Offline Response Example**:
```json
{
  "status": "offline",
  "timestamp": "2026-02-28T14:30:05Z",
  "message": "The gateway sleeps. Awaken it to begin your journey."
}
```

**Error Handling**:
- Rejects promise with `{ error: 'CONNECTION_ERROR', message: '...' }` if simulated error occurs
- Timeout: Resolves after max 1500ms (simulated network delay)

**Mock Behavior**:
- 80% probability returns `'online'`
- 20% probability returns `'offline'`
- Can be overridden via environment variable `MOCK_OLLAMA_STATUS=online|offline`

---

## Function: `getAvailableModels()`

**Purpose**: Fetch the list of available AI models for story generation

**Parameters**: None

**Returns**: `Promise<AIModel[]>`

```typescript
interface AIModel {
  id: string;           // Unique identifier (e.g., "llama3-8b")
  name: string;         // Technical name (e.g., "Llama 3")
  displayName: string;  // Mystical UI name (e.g., "The Dreamer")
  description: string;  // Brief mystical description
  parameters?: {        // Optional metadata (not used in MVP UI)
    size: string;       // e.g., "8B", "7B"
    contextWindow: number;
  };
}
```

**Success Response Example**:
```json
[
  {
    "id": "llama3-8b",
    "name": "Llama 3",
    "displayName": "The Dreamer",
    "description": "Weaves intricate tales of adventure, mystery, and wonder",
    "parameters": {
      "size": "8B",
      "contextWindow": 8192
    }
  },
  {
    "id": "mistral-7b",
    "name": "Mistral",
    "displayName": "The Weaver",
    "description": "Crafts stories with precision and poetic elegance",
    "parameters": {
      "size": "7B",
      "contextWindow": 32768
    }
  }
]
```

**Error Handling**:
- Rejects with `{ error: 'MODELS_UNAVAILABLE', message: '...' }` if connection fails
- Returns empty array `[]` if no models installed (should not occur in mock)

**Mock Behavior**:
- Always returns 2 hardcoded models (Llama 3, Mistral)
- Resolves after 800ms simulated delay
- Future: Load from JSON file or environment config

---

## Function: `getUserStories()`

**Purpose**: Fetch the list of stories created by the current user (for Dashboard)

**Parameters**: None (uses session context in future; mock returns hardcoded list)

**Returns**: `Promise<StorySummary[]>`

```typescript
interface StorySummary {
  id: string;           // Unique story identifier
  title: string;        // Story title
  fandom: string;       // Associated fictional universe
  createdAt: string;    // ISO 8601 creation date
  lastModified: string; // ISO 8601 last interaction date
  wordCount: number;    // Total words across all passages
  thumbnail?: string;   // Optional thumbnail URL (not used in MVP)
}
```

**Success Response Example**:
```json
[
  {
    "id": "story-001",
    "title": "Douluo Dalu - The Soul Forge",
    "fandom": "Douluo Dalu",
    "createdAt": "2026-02-27T14:30:00Z",
    "lastModified": "2026-02-27T15:45:00Z",
    "wordCount": 1247
  },
  {
    "id": "story-002",
    "title": "Douluo Dalu - Spirit Hall Infiltrator",
    "fandom": "Douluo Dalu",
    "createdAt": "2026-02-26T10:15:00Z",
    "lastModified": "2026-02-26T11:20:00Z",
    "wordCount": 892
  }
]
```

**Empty Response** (first-time user):
```json
[]
```

**Error Handling**:
- Rejects with `{ error: 'FETCH_FAILED', message: '...' }` on simulated error

**Mock Behavior**:
- Returns 2 hardcoded stories for testing Dashboard UI
- First call returns populated array; can toggle via state
- Resolves after 600ms delay

---

## Function: `createStory(setup)`

**Purpose**: Submit story setup parameters and receive the generated prologue

**Parameters**: `StorySetup`

```typescript
interface StorySetup {
  modelId: string;    // Selected AI model ID (e.g., "llama3-8b")
  fandom: string;     // Selected fictional universe
  character: string;  // Character description (10-500 chars)
  premise: string;    // Story premise (20-1000 chars)
  goals: string;      // Character goals (10-500 chars)
}
```

**Request Example**:
```json
{
  "modelId": "llama3-8b",
  "fandom": "Douluo Dalu",
  "character": "A blacksmith's apprentice with a rare martial soul",
  "premise": "Awakened a legendary forge spirit, must master soul forging",
  "goals": "Become the greatest soul master blacksmith"
}
```

**Returns**: `Promise<Story>`

```typescript
interface Story {
  id: string;           // Generated story ID (UUID v4)
  title: string;        // Auto-generated title
  setup: StorySetup;    // Echoed back (denormalized)
  currentPassage: string; // Generated prologue text (2-4 paragraphs)
  createdAt: string;    // ISO 8601 creation timestamp
  wordCount: number;    // Word count of prologue
}
```

**Success Response Example**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Douluo Dalu - The Soul Forge",
  "setup": { /* echoed request */ },
  "currentPassage": "The first wisps of spiritual energy coalesced around you...\n\n[2-3 more paragraphs]",
  "createdAt": "2026-02-28T14:35:22Z",
  "wordCount": 287
}
```

**Validation Errors**:
```typescript
// 400 Bad Request equivalent (rejected promise)
{
  "error": "VALIDATION_ERROR",
  "message": "Character description too short (minimum 10 characters)",
  "field": "character"
}
```

**Error Handling**:
- Rejects if any field fails validation (length requirements)
- Rejects with `{ error: 'GENERATION_FAILED', message: '...' }` on simulated LLM error (5% probability)

**Mock Behavior**:
- Validates input fields (lengths, required)
- Generates UUID for story ID
- Returns hardcoded prologue text (varies by fandom)
- Auto-generates title: `"{fandom} - {first 3 words of character}"`
- Resolves after 1200ms delay (simulates LLM generation time)

---

## Function: `getStoryById(storyId)`

**Purpose**: Fetch full story details including passage history (for Resume functionality)

**Parameters**: `storyId` (string)

**Returns**: `Promise<Story>`

```typescript
interface Story {
  id: string;
  title: string;
  setup: StorySetup;
  currentPassage: string;
  passageHistory: string[];  // All previous passages (empty in MVP)
  createdAt: string;
  lastModified: string;
  wordCount: number;
}
```

**Success Response Example**:
```json
{
  "id": "story-001",
  "title": "Douluo Dalu - The Soul Forge",
  "setup": { /* ... */ },
  "currentPassage": "[Current passage text...]",
  "passageHistory": [],
  "createdAt": "2026-02-27T14:30:00Z",
  "lastModified": "2026-02-27T15:45:00Z",
  "wordCount": 1247
}
```

**Error Handling**:
- Rejects with `{ error: 'STORY_NOT_FOUND', message: '...' }` if `storyId` invalid or doesn't exist

**Mock Behavior**:
- Looks up story from hardcoded list by ID
- Resolves after 500ms delay
- Future: Fetch from backend database

---

## Error Response Format

All rejected promises use a consistent error shape:

```typescript
interface APIError {
  error: string;    // Error code (e.g., 'CONNECTION_ERROR', 'VALIDATION_ERROR')
  message: string;  // User-facing mystical error message
  field?: string;   // Optional field name for validation errors
  timestamp: string; // ISO 8601 error timestamp
}
```

**Example**:
```json
{
  "error": "VALIDATION_ERROR",
  "message": "The protagonist awaits definition...",
  "field": "character",
  "timestamp": "2026-02-28T14:35:22Z"
}
```

---

## Network Delay Simulation

All mock functions include realistic delays to simulate network latency:

| Function | Min Delay | Max Delay | Avg Delay |
|----------|-----------|-----------|-----------|
| `checkOllamaConnection()` | 800ms | 1500ms | 1000ms |
| `getAvailableModels()` | 500ms | 1000ms | 800ms |
| `getUserStories()` | 400ms | 800ms | 600ms |
| `createStory()` | 1000ms | 1800ms | 1200ms |
| `getStoryById()` | 300ms | 700ms | 500ms |

**Implementation**:
```javascript
const delay = (min, max) => 
  new Promise(resolve => setTimeout(resolve, min + Math.random() * (max - min)));
```

---

## Future Migration Path

When replacing mocks with real API calls:

1. **Keep function signatures identical** (no consumer code changes)
2. **Replace setTimeout with fetch()**:
   ```javascript
   // Mock
   return delay(800, 1000).then(() => ({ status: 'online' }));
   
   // Real API
   return fetch('/api/connection/status')
     .then(res => res.json());
   ```
3. **Add authentication headers** (JWT token from session)
4. **Handle real HTTP errors** (network failures, 500 errors)
5. **Add retry logic** (exponential backoff)
6. **Update error messages** (from mystical to actionable for real errors)

---

**Next**: State Machine Contract (app phase transitions)
