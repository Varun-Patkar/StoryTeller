# Data Model: Fullstack Integration

**Phase 1 Output** | **Created**: 2026-03-04  
**Purpose**: Define entities, relationships, validation rules, and key behaviors for persistence

---

## Entity Definitions

### Entity 1: User

**Purpose**: Represents a signed-in user authenticated via GitHub OAuth

**Fields**:
- `id` (string): Internal user identifier (MongoDB ObjectId as string)
- `github_id` (string): GitHub user ID
- `username` (string): GitHub login/handle
- `avatar_url` (string): GitHub avatar image URL
- `created_at` (timestamp): ISO 8601 creation timestamp

**Validation Rules**:
- `github_id`, `username`, and `avatar_url` are required for authenticated users
- `github_id` must be unique

**Related Entities**:
- One `User` can author many `Story` records

---

### Entity 2: Story

**Purpose**: Represents a narrative with metadata, visibility, and a passage history

**Fields**:
- `id` (string): Story identifier (MongoDB ObjectId as string)
- `title` (string): Book Name shown to users
- `author_id` (string): References `User.id`
- `visibility` (enum): `public` or `private`
- `setup_context` (object): Story setup inputs
  - `model_id` (string)
  - `fandom` (string)
  - `character` (string)
  - `premise` (string)
  - `goals` (string)
- `passages` (array): Ordered list of `Passage` entries
- `original_fork_id` (string | null): Story ID this fork originated from
- `created_at` (timestamp): ISO 8601 creation timestamp
- `updated_at` (timestamp): ISO 8601 last update timestamp

**Validation Rules**:
- `title` required, 3-80 characters
- `author_id` required for story creation and forking
- `visibility` must be `public` or `private`
- `setup_context` fields required on creation
- `original_fork_id` required only when the story is a fork

**Related Entities**:
- `Story` belongs to one `User` (author)
- `Story` has many `Passage` records
- `Story` may reference another `Story` via `original_fork_id`

---

### Entity 3: Passage

**Purpose**: Represents a single narrative segment or user response in a story

**Fields**:
- `id` (string): Passage identifier
- `story_id` (string): References `Story.id`
- `role` (enum): `assistant` or `user`
- `content` (string): Passage text
- `created_at` (timestamp): ISO 8601 creation timestamp

**Validation Rules**:
- `role` must be `assistant` or `user`
- `content` must be non-empty

**Related Entities**:
- Each `Passage` belongs to exactly one `Story`

---

## Relationships

- **User 1..N Story**: A user authors many stories
- **Story 1..N Passage**: A story contains an ordered passage history
- **Story 0..1 Story (Fork)**: A story may reference its original via `original_fork_id`

---

## State Transitions

### Story Forking

```
Public Story (User A) + User B response
  -> New Story (User B)
  -> original_fork_id = Story A
  -> title = "{Original Book Name} - {User B}"
  -> passages = copied history + new user response
```

### Visibility Access

```
public story -> visible in Explore
private story -> visible only to author
```
