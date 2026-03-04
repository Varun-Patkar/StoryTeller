# Contract: Stories API

**Version**: 1.0.0  
**Purpose**: Define endpoints for story persistence and forking

---

## GET /api/stories/explore

**Purpose**: Fetch public stories for browsing

**Response**: `200 OK`
```json
{
  "stories": [
    {
      "id": "story_123",
      "title": "Starlit Voyage",
      "author_id": "user_001",
      "created_at": "2026-03-04T12:00:00Z",
      "updated_at": "2026-03-04T12:05:00Z"
    }
  ]
}
```

---

## GET /api/stories/mine

**Purpose**: Fetch stories for the current user

**Auth**: Requires valid `session` cookie

**Response**: `200 OK`
```json
{
  "stories": [
    {
      "id": "story_456",
      "title": "Forged in Dawn",
      "author_id": "user_001",
      "created_at": "2026-03-04T12:00:00Z",
      "updated_at": "2026-03-04T12:05:00Z"
    }
  ]
}
```

**Error Responses**:
- `401` if not authenticated

---

## POST /api/stories/create

**Purpose**: Create a new story with setup context

**Auth**: Requires valid `session` cookie

**Request Body**:
```json
{
  "title": "My Book Name",
  "visibility": "public",
  "setup_context": {
    "model_id": "llama3.1:8b",
    "fandom": "Douluo Dalu",
    "character": "A blacksmith's apprentice...",
    "premise": "Awakened a legendary forge spirit...",
    "goals": "Become the greatest..."
  },
  "initial_passage": {
    "role": "assistant",
    "content": "[Generated prologue text]"
  }
}
```

**Response**: `201 Created`
```json
{
  "id": "story_789",
  "title": "My Book Name",
  "author_id": "user_001",
  "visibility": "public",
  "created_at": "2026-03-04T12:00:00Z",
  "updated_at": "2026-03-04T12:00:00Z"
}
```

**Error Responses**:
- `400` for validation errors
- `401` if not authenticated

---

## POST /api/stories/fork

**Purpose**: Fork a public story when a different user submits a response

**Auth**: Requires valid `session` cookie

**Request Body**:
```json
{
  "story_id": "story_123",
  "response": {
    "role": "user",
    "content": "[User response text]"
  }
}
```

**Response**: `201 Created`
```json
{
  "id": "story_999",
  "title": "Original Book Name - UserB",
  "author_id": "user_002",
  "visibility": "private",
  "original_fork_id": "story_123",
  "created_at": "2026-03-04T12:10:00Z",
  "updated_at": "2026-03-04T12:10:00Z"
}
```

**Error Responses**:
- `400` if the story is not public or response invalid
- `401` if not authenticated
**Error Responses**:
- `400` if the story is not public or response invalid
- `401` if not authenticated
- `404` if `story_id` not found

---

## PUT /api/stories/:id/passages

**Purpose**: Update passages in a story (cleanup incomplete responses)

**Auth**: Requires valid `session` cookie; user must own the story

**URL Parameters**:
- `:id` - Story ID or slug

**Request Body**:
```json
{
  "passages": [
    {
      "role": "assistant",
      "content": "The journey begins...",
      "text": "The journey begins..."
    },
    {
      "role": "user",
      "content": "I step forward cautiously...",
      "text": "I step forward cautiously..."
    }
  ]
}
```

**Response**: `200 OK`
```json
{
  "id": "story_123",
  "slug": "starlit-voyage",
  "title": "Starlit Voyage",
  "passages": [
    {
      "role": "assistant",
      "content": "The journey begins...",
      "text": "The journey begins..."
    },
    {
      "role": "user",
      "content": "I step forward cautiously...",
      "text": "I step forward cautiously..."
    }
  ],
  "updated_at": "2026-03-04T12:15:00Z"
}
```

## PUT /api/stories/:id

**Purpose**: Update a story (passages, visibility, title, etc.)

**Auth**: Requires valid `session` cookie; user must own the story

**URL Parameters**:
- `:id` - Story ID or slug

**Request Body**:
```json
{
  "passages": [
    {
      "role": "assistant",
      "content": "The journey begins...",
      "text": "The journey begins..."
    },
    {
      "role": "user",
      "content": "I step forward cautiously...",
      "text": "I step forward cautiously..."
    }
  ],
  "visibility": "public",
  "title": "New Title (optional)"
}
```

**Response**: `200 OK`
```json
{
  "id": "story_123",
  "slug": "starlit-voyage",
  "title": "Starlit Voyage",
  "visibility": "public",
  "passages": [
    {
      "role": "assistant",
      "content": "The journey begins...",
      "text": "The journey begins..."
    },
    {
      "role": "user",
      "content": "I step forward cautiously...",
      "text": "I step forward cautiously..."
    }
  ],
  "updated_at": "2026-03-04T12:15:00Z"
}
```

**Error Responses**:
- `400` if request body is invalid
- `403` if user doesn't own the story
- `404` if story not found
- `405` if HTTP method is not PUT

---

## DELETE /api/stories/:id

**Purpose**: Permanently delete a story

**Auth**: Requires valid `session` cookie; user must own the story

**URL Parameters**:
- `:id` - Story ID or slug

**Response**: `200 OK`
```json
{
  "id": "story_123",
  "slug": "starlit-voyage",
  "title": "Starlit Voyage",
  "deleted_at": "2026-03-04T12:20:00Z"
}
```

**Error Responses**:
- `403` if user doesn't own the story
- `404` if story not found
- `405` if HTTP method is not DELETE

