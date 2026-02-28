# Contract: Story Progression & Free-Text Response System

**Phase 1 Output** | **Created**: 2026-02-28  
**Purpose**: Define the contract for interactive story reading with streaming text and free-text user-driven narrative progression

---

## Overview

This contract specifies how the StoryReader interface progresses through story passages, captures user free-text responses, and manages the interactive reading experience. It serves as the bridge between UI components and the mock API (and future real API).

---

## Data Structures

### StoryPassage

Represents a single narrative section with optional metadata about user response.

```typescript
interface StoryPassage {
  id: string;                    // Unique identifier (e.g., "passage-001")
  text: string;                  // Narrative content (2-4 paragraphs, 200-400 words)
  choices: StoryChoice[];        // Deprecated in current UI flow (kept for compatibility)
  displayedAt: string | null;    // ISO 8601 timestamp when first shown
  selectedChoiceId: string | null; // Deprecated in free-text flow
  selectedResponseText: string | null; // User response submitted after this passage
}
```

**Constraints**:
- `id` must be unique within a story
- `text` should be 200-1000 words (optimal reading length)
- `choices` may be empty in free-text mode
- `displayedAt` set by UI when passage first renders
- `selectedResponseText` stores user text for history and context

---

### StoryChoice (Deprecated in current UI)

Represents a legacy player decision point from the earlier button-choice design.

```typescript
interface StoryChoice {
  id: string;              // Unique identifier (e.g., "choice-001")
  text: string;            // Choice description (max 100 chars, action-oriented)
  nextPassageId?: string;  // ID of next passage (optional, null = generate dynamically)
}
```

**Constraints**:
- `id` must be unique within a passage's choices
- `text` max 100 characters, should be imperative (e.g., "Explore the forest")
- `nextPassageId` optional in MVP (mock API generates next passage on-demand)

---

### Story (with Passages)

Updated Story entity with interactive reading support.

```typescript
interface Story {
  id: string;                    // Unique identifier (UUID v4)
  title: string;                 // Story title
  setup: StorySetup;             // Original creation parameters
  passages: StoryPassage[];      // All passages in chronological order
  currentPassageIndex: number;   // Index of current passage (0 = prologue)
  createdAt: string;             // ISO 8601 creation timestamp
  lastModified: string;          // ISO 8601 last interaction timestamp
  wordCount: number;             // Total words across all passages
}
```

**Constraints**:
- `passages` array must have at least 1 element (prologue)
- `currentPassageIndex` must be a valid index (0 <= index < passages.length)
- `lastModified` updates when new passage is added
- `wordCount` recalculated when passages added

---

## API Contract: getNextPassage()

### Function Signature

```typescript
async function getNextPassage(
  storyId: string,
  userResponse: string
): Promise<StoryPassage>
```

### Purpose

Generates the next story passage based on the user's free-text response. In MVP, returns lorem ipsum content. In production, this will consume streamed LLM chunks and incrementally render text.

### Parameters

- **storyId** (string, required): ID of the story being continued
- **userResponse** (string, required): Free-text input submitted by the user

### Returns

A `StoryPassage` object with:
- New unique `id` (e.g., incremented: "passage-002", "passage-003")
- Lorem ipsum `text` (2-4 paragraphs, 200-400 words)
- `choices` empty in free-text mode
- `displayedAt`: null (set by UI when rendered)
- `selectedChoiceId`: null
- `selectedResponseText`: null (set on previous passage by UI when submitting)

### Error Responses

```typescript
// Simulated error (5% chance in mock)
{
  error: 'GENERATION_FAILED',
  message: 'The threads of fate are tangled. Try again?',
  retryable: true
}

// Invalid story ID
{
  error: 'STORY_NOT_FOUND',
  message: 'This tale has been lost to the void.',
  retryable: false
}

// Invalid response payload
{
  error: 'INVALID_RESPONSE',
  message: 'Your intent must be spoken clearly.',
  retryable: false
}
```

### Mock Implementation Example

```javascript
export async function getNextPassage(storyId, userResponse) {
  await delay(1200); // Simulate AI generation time
  
  // 5% failure rate for testing error handling
  if (Math.random() < 0.05) {
    throw {
      error: 'GENERATION_FAILED',
      message: 'The threads of fate are tangled. Try again?',
      retryable: true
    };
  }
  
  // Generate lorem ipsum passage for free-text progression
  return {
    id: `passage-${Date.now()}`,
    text: generateLoremIpsum(2, 4), // 2-4 paragraphs
    choices: [],
    displayedAt: null,
    selectedChoiceId: null,
    selectedResponseText: null,
  };
}
```

---

## UI Workflow: Interactive Reading

### Initial Story Load

1. User enters PLAYING phase (from Dashboard resume or StorySetup submission)
2. StoryReader loads story by `state.currentStoryId` using `getStoryById()`
3. Display first passage (index 0, the prologue):
   - Stream text with typewriter effect (~100ms per word)
   - After streaming completes, fade in choice buttons

### Submitting a Response

1. User enters free-text response in textarea and submits
2. UI immediately:
  - Disables input and submit action
   - Shows loading indicator ("Weaving fate...")
3. Call `getNextPassage(storyId, userResponse)`
4. On success:
  - Mark selected response: `passages[currentPassageIndex].selectedResponseText = userResponse`
   - Append new passage to `story.passages` array
   - Increment `story.currentPassageIndex`
   - Update `story.lastModified` timestamp
   - Update `story.wordCount` (add new passage words)
  - Auto-scroll only if user is near bottom
  - If user scrolled up, show "Go to latest passage" button
   - Stream new passage text
  - After streaming, auto-focus response textbox
5. On error:
   - Display error message (mystical language)
  - Show "Retry" button (calls `getNextPassage()` again with same response)
   - Or show "Continue with fallback" (uses hardcoded lorem ipsum)

### Passage History Display

- **Previous passages** (index < currentPassageIndex):
  - Render as static text (no streaming animation)
  - Show selected response with highlight/checkmark
  - Dim slightly to emphasize current passage
  
- **Current passage** (index === currentPassageIndex):
  - Stream text with typewriter effect
  - After streaming, show free-text input + submit
  - Bright, full-opacity display

### Streaming Completion Rules

- No skip interaction is available in current UI.
- Passage text must complete naturally through streaming.
- This aligns with future real API streaming where full text is unavailable upfront.

---

## Streaming Text Behavior

### Animation Parameters

```javascript
{
  speed: 100,          // Milliseconds per word (configurable: 50-150ms)
  pauseAfterParagraph: 300, // Extra delay after paragraph (ms)
  pauseAfterSentence: 150   // Extra delay after sentence (ms)
}
```

### Streaming Algorithm

```javascript
function streamText(text, onComplete) {
  const words = text.split(' ');
  let currentIndex = 0;
  
  const interval = setInterval(() => {
    if (currentIndex >= words.length) {
      clearInterval(interval);
      onComplete();
      return;
    }
    
    // Add next word to display
    displayWord(words[currentIndex]);
    currentIndex++;
    
    // Add pauses for punctuation
    const word = words[currentIndex - 1];
    if (word.includes('.') || word.includes('!') || word.includes('?')) {
      // Add extra delay after sentence
    }
    if (word === '\n\n') {
      // Add extra delay after paragraph
    }
  }, speed);
  
  return interval; // Return for cleanup/cancellation
}
```

### Performance Considerations

- Use `requestAnimationFrame` for smoother animations
- Batch DOM updates (update text in chunks, not per-word)
- Cleanup intervals on component unmount
- Disable streaming on mobile (instant display) if performance issues

---

## State Management: Passage Progression

### React State Structure

```javascript
const [story, setStory] = useState({
  id: 'story-001',
  title: 'My Adventure',
  passages: [
    { id: 'passage-000', text: '...', choices: [...], selectedChoiceId: null }
  ],
  currentPassageIndex: 0,
  // ... other fields
});

const [isStreaming, setIsStreaming] = useState(false);
const [isLoadingNext, setIsLoadingNext] = useState(false);
```

### Handlers

```javascript
// Handle choice selection
async function handleChoiceSelect(choiceId) {
  setIsLoadingNext(true);
  
  try {
    // Get next passage from API
    const nextPassage = await getNextPassage(story.id, choiceId);
    
    // Update story state
    setStory(prev => {
      const updatedPassages = [...prev.passages];
      updatedPassages[prev.currentPassageIndex].selectedChoiceId = choiceId;
      updatedPassages.push(nextPassage);
      
      return {
        ...prev,
        passages: updatedPassages,
        currentPassageIndex: prev.currentPassageIndex + 1,
        lastModified: new Date().toISOString(),
        wordCount: calculateTotalWords(updatedPassages)
      };
    });
    
    // Auto-scroll to new passage
    scrollToCurrentPassage();
    
  } catch (error) {
    // Handle error (show retry UI)
    showError(error.message);
  } finally {
    setIsLoadingNext(false);
  }
}

// Handle streaming complete
function handleStreamingComplete() {
  setIsStreaming(false);
  // Fade in choice buttons
}

// Handle skip streaming
function handleSkipStreaming() {
  // Cancel streaming interval
  // Show full text instantly
  setIsStreaming(false);
}
```

---

## Visual Design Specifications

### Choice Button Styling

```jsx
<button className="
  px-6 py-3 
  bg-blue-600 hover:bg-blue-700 
  text-white font-medium 
  rounded-lg 
  transform transition-all duration-200 
  hover:scale-105 hover:shadow-lg
  disabled:opacity-50 disabled:cursor-not-allowed
  border border-blue-500
">
  {choiceText}
</button>
```

### Passage Container

```jsx
<div className="
  max-w-3xl mx-auto 
  space-y-8 
  animate-[fadeUp_0.6s_ease-out]
">
  {/* Previous passages (static) */}
  <div className="opacity-70">
    <p className="text-gray-300">{previousPassage.text}</p>
    <div className="mt-4 flex items-center gap-2">
      <CheckCircleIcon className="text-blue-400 w-5 h-5" />
      <span className="text-blue-300">{selectedChoice.text}</span>
    </div>
  </div>
  
  {/* Current passage (streaming) */}
  <div className="opacity-100">
    <StreamingText text={currentPassage.text} onComplete={handleComplete} />
    {!isStreaming && (
      <div className="mt-6 flex flex-col gap-3 animate-[fadeIn_0.4s_ease-in]">
        {currentPassage.choices.map(choice => (
          <ChoiceButton key={choice.id} choice={choice} onClick={handleChoiceSelect} />
        ))}
      </div>
    )}
  </div>
</div>
```

---

## Testing Scenarios

### Happy Path

1. Load story → first passage streams → choices fade in
2. Click choice → loading indicator → new passage streams → new choices fade in
3. Repeat 3-4 times → verify smooth scrolling and history display
4. All previous passages visible with selected choices highlighted

### Edge Cases

1. **Click during streaming**: Text completes instantly, choices appear
2. **Rapid choice clicks**: First click locks UI, subsequent clicks ignored
3. **API failure**: Error message displays, retry button works
4. **Very long passage**: Auto-scroll keeps current passage visible
5. **Browser back button**: Stay on story (prevent navigation during streaming)

### Performance

1. Stream 10+ passages without lag or memory leaks
2. Smooth 60 FPS scrolling through 20+ passages
3. Streaming animation cancels cleanly on unmount
4. No event listener leaks when choices are destroyed

---

## Future Enhancements (Post-MVP)

- **Rich text formatting**: Bold, italics, inline images in passages
- **Character portraits**: Show character image next to their dialogue
- **Sound effects**: Ambient audio during reading, click sounds for choices
- **Save/load**: Resume mid-story, not just from last passage
- **Branching visualization**: Show decision tree map
- **Speed controls**: Let user adjust streaming speed (slider)
- **Voice narration**: Text-to-speech option for accessibility
- **Animation variety**: Different streaming styles (fade, slide, pulse)

---

**Next**: Implement StreamingText component and integrate into StoryReader
