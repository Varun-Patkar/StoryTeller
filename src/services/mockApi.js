/**
 * Mock API Service
 * 
 * PHASE 3 UPDATE: Functions that interact with BYOE Ollama have been
 * replaced with real calls to ollamaClient.
 * 
 * PHASE 4 UPDATE: Story persistence functions now use real API calls
 * instead of mocking.
 * 
 * Real functions:
 * - checkOllamaConnection() → ollamaPing()
 * - getAvailableModels() → ollamaGetModels()
 * - getUserStories() → GET /api/stories/mine
 * - createStory() → POST /api/stories/create
 */

import { apiGet, apiPost, apiPut, apiDelete } from '@/services/apiClient';
import { generateUniqueSlug, isValidSlug } from '@/utils/slugify';
import { ollamaPing, ollamaGetModels, generateStoryPrologue, generateStoryPassage } from '@/services/ollamaClient';
import { getMysticalLoadingMessage } from '@/utils/ollamaPrompts';

/**
 * Default simulated network delay (ms)
 * Realistic for local/LAN environments
 */
const DEFAULT_DELAY = 1000;

/**
 * In-memory story store for session persistence in MVP.
 * Stores stories created during current browser session so StoryReader
 * can load the actual generated content instead of fallback mock data.
 * Maps both story IDs and slugs to story objects.
 */
const storyStore = new Map();
const slugToIdMap = new Map();

/**
 * Normalize a story API response into the StoryReader format.
 *
 * @param {Object} story - Story payload from API.
 * @returns {Object} Normalized story for StoryReader.
 */
function normalizeStoryFromApi(story) {
  const passages = Array.isArray(story.passages) ? story.passages : [];
  const normalizedPassages = passages.map((passage, index) => ({
    id: passage.id || `${story.id || 'story'}-${index}`,
    text: passage.text || passage.content || '',
    content: passage.content || passage.text || '', // Keep both for compatibility
    displayedAt: passage.displayedAt || passage.created_at || story.created_at,
  }));

  const wordCount = Number(story.wordCount || story.word_count || 0) || normalizedPassages.reduce((sum, passage) => {
    return sum + (passage.text?.split(/\s+/).length || 0);
  }, 0);

  return {
    id: story.id,
    slug: story.slug,
    title: story.title,
    author_id: story.author_id,
    visibility: story.visibility,
    fandom: story.fandom || story.setup_context?.fandom || 'Unknown',
    setup_context: story.setup_context || null,
    prologue: story.prologue || normalizedPassages[0]?.text || '',
    createdAt: story.created_at,
    lastModified: story.updated_at || story.lastModified || story.created_at,
    passages: normalizedPassages,
    currentPassageIndex: Math.max(0, normalizedPassages.length - 1),
    wordCount,
  };
}

/**
 * Helper: Add realistic network delay
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Helper: Generate random delay within range
 * @param {number} min - Minimum ms
 * @param {number} max - Maximum ms
 * @returns {number} Random ms in range
 */
function randomDelay(min = 800, max = 1500) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Helper: Generate lorem ipsum text paragraphs
 * @param {number} minParagraphs - Minimum number of paragraphs
 * @param {number} maxParagraphs - Maximum number of paragraphs
 * @returns {string} Lorem ipsum text with \n\n between paragraphs
 */
function generateLoremIpsum(minParagraphs = 4, maxParagraphs = 6) {
  const loremParagraphs = [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum vel magna nec nisi molestie congue. Proin auctor risus eu est consequat, vel dictum justo faucibus. Sed euismod eros sit amet mi varius, in fringilla turpis consectetur. Integer pharetra lectus at nulla fermentum, sit amet ullamcorper dolor vehicula.",
    "Donec scelerisque augue vitae sapien venenatis, id tempor nisl scelerisque. Mauris dictum diam in turpis facilisis, ac mollis lectus gravida. Suspendisse potenti. Vivamus ac lacus quis odio hendrerit tincidunt. Nullam tristique velit ut magna ultricies, vel cursus erat pharetra.",
    "Fusce dignissim tortor in justo iaculis, vel vehicula nisi fermentum. Aenean imperdiet ante vel magna hendrerit, non venenatis velit tincidunt. Sed vitae mi ac nibh cursus lacinia. In hac habitasse platea dictumst. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.",
    "Curabitur euismod felis at magna consectetur, in eleifend neque bibendum. Aliquam erat volutpat. Etiam sollicitudin, nunc id consectetur tincidunt, elit nisi fermentum elit, sed venenatis orci massa vel turpis. Nam rhoncus justo quis augue sollicitudin, vitae interdum leo tempus.",
    "Phasellus sit amet dui vel justo cursus fermentum. Morbi vehicula sapien in ligula consequat, at fermentum massa facilisis. Quisque tincidunt nunc id ex ultricies, nec finibus diam tincidunt. Sed tempor, magna ac consectetur fermentum, nisl eros ultrices purus, at fringilla magna nisl at dolor.",
    "Integer convallis est vel nisi varius, sed volutpat mauris hendrerit. Praesent facilisis urna et ante ornare, non vulputate mi hendrerit. Vivamus bibendum leo at dolor venenatis, id commodo nulla pharetra. Donec efficitur arcu non arcu consequat, sed feugiat eros varius.",
  ];

  const numParagraphs = Math.floor(Math.random() * (maxParagraphs - minParagraphs + 1)) + minParagraphs;
  const selectedParagraphs = [];

  for (let i = 0; i < numParagraphs; i++) {
    const randomIndex = Math.floor(Math.random() * loremParagraphs.length);
    selectedParagraphs.push(loremParagraphs[randomIndex]);
  }

  return selectedParagraphs.join('\n\n');
}

// ============ API Functions ============

/**
 * checkOllamaConnection: Check if Ollama is running and accessible.
 *
 * PHASE 3: Replaced mock implementation with real ollamaPing() call.
 * Now actually tests connection to localhost:11434 and detects CORS errors.
 *
 * Returns:
 * - { status: "online" }: Ollama is running and accessible
 * - { status: "offline" }: Ollama not responding (not running, wrong port, etc)
 * - { status: "cors_error" }: CORS policy blocks access (show remediation in BootSequence)
 *
 * @returns {Promise<{status: string, timestamp: string}>}
 *
 * @example
 *   const result = await checkOllamaConnection();
 *   if (result.status === "online") {
 *     // Proceed to model selection
 *   } else if (result.status === "cors_error") {
 *     // Show CORS fix instructions in BootSequence
 *   } else {
 *     // Show "start Ollama" instructions
 *   }
 */
export async function checkOllamaConnection() {
  // Call real Ollama health check instead of mock
  const result = await ollamaPing();
  
  return {
    status: result.status, // "online" | "offline" | "cors_error"
    timestamp: result.timestamp,
    // Include error message if available for debugging
    ...(result.error && { error: result.error })
  };
}

/**
 * getAvailableModels: Fetch list of AI models from Ollama.
 *
 * PHASE 3: Replaced mock implementation with real ollamaGetModels() call.
 * Now actually queries localhost:11434/api/tags for installed models.
 *
 * If a custom model is not listed but was previously selected, it's still available
 * (user may have a model loaded but not yet pulled in the current Ollama session).
 *
 * @returns {Promise<Array>} Array of model name strings (e.g., ["llama2", "mistral"])
 *
 * @throws {OllamaError} If connection fails or CORS blocks access
 *
 * @example
 *   try {
 *     const models = await getAvailableModels();
 *     console.log(models); // ["llama3.1:8b", "mistral:latest"]
 *   } catch (error) {
 *     // Handle connection or CORS error
 *   }
 */
export async function getAvailableModels() {
  // Call real Ollama API instead of mock
  const modelNames = await ollamaGetModels();
  
  // Return as array of model objects matching expected format
  // (frontend can handle both string[] and object[] via polymorphism)
  return modelNames.map(name => ({
    id: name,
    name: name,
    displayName: name,
    description: 'Ollama model',
    parameters: {
      // These are extracted from Ollama API if available
      size: 'Unknown',
      contextWindow: 4096,
    },
  }));
}

/**
 * getUserStories: Fetch user's saved stories for Dashboard
 * 
 * PHASE 4: Now calls real API endpoint /api/stories/mine
 * Requires authentication (user must be logged in).
 * 
 * @returns {Promise<Array>} Array of user's stories
 * @throws {Error} If user is not authenticated or API fails
 */
export async function getUserStories() {
  try {
    const response = await apiGet('/stories/mine');
    if (response.stories) {
      return response.stories;
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch user stories:', error);
    // Return empty array on failure so UI doesn't break
    return [];
  }
}

/**
 * generatePrologue: Generate story opening via Ollama with system prompt
 *
 * PHASE 4+: Calls local Ollama with specialized story prologue system prompt.
 * Injects TOON fandom context directly into the system prompt for rich guidance.
 * This MUST be called BEFORE createStory() to generate initial_passage content.
 *
 * @param {string} modelId - Model to use for generation (e.g., "llama2")
 * @param {Object} setupContext - Story setup parameters
 *   - fandomId: string (fandom identifier for TOON lookup, e.g., 'douluo-dalu-1')
 *   - character: string (protagonist name/description)
 *   - premise: string (starting situation)
 *   - goals: string (character's objectives)
 * @param {function} onToken - Optional callback for streaming tokens (for UI updates)
 *
 * @returns {Promise<string>} Generated prologue text (200-300 words)
 * @throws {Error} If Ollama not available, fandom not found, or generation fails
 *
 * @example
 *   const prologue = await generatePrologue(
 *     'llama2',
 *     { fandomId: 'douluo-dalu-1', character: 'Tang San', premise: 'Discovers a hidden spirit ring', goals: 'Master the spirit arts' },
 *     (token) => setStreamingText(prev => prev + token)
 *   );
 *
 * IMPORTANT: This function is called from StorySetup on form submission, BEFORE createStory().
 * The generated prologue is then passed to createStory as the initial_passage content.
 */
export async function generatePrologue(modelId, setupContext, onToken) {
  if (!modelId) {
    throw new Error('Model ID required for prologue generation');
  }

  if (!setupContext || !setupContext.fandomId || !setupContext.character) {
    throw new Error('Missing required setup context for prologue generation');
  }

  try {
    // Call Ollama with story prologue system prompt
    const prologue = await generateStoryPrologue(modelId, setupContext, onToken);

    if (!prologue || prologue.trim().length === 0) {
      throw new Error('Ollama generated empty prologue. Try again?');
    }

    return prologue;
  } catch (error) {
    console.error('Failed to generate prologue:', error);
    throw error;
  }
}

/**
 * createStory: Create new story with pre-generated prologue
 * 
 * PHASE 4: Calls real API endpoint POST /api/stories/create
 * IMPORTANT: Prologue MUST be generated via generatePrologue() BEFORE calling this.
 * 
 * Generates a unique story ID and persists to database with prologue content.
 * Requires authentication (user must be logged in).
 * 
 * @param {Object} setup - Story setup parameters  
 * @param {string} setup.title - Story title (Book Name)
 * @param {string} setup.visibility - 'public' or 'private'
 * @param {Object} setup.setup_context - Story context (model_id, fandom, character, premise, goals)
 * @param {Object} setup.initial_passage - Already-generated passage: { content: prologue_text }
 * 
 * FLOW (from StorySetup.jsx):
 * 1. User fills form and clicks "Begin Story"
 * 2. Validate form fields
 * 3. Show loading: "✨ Weaving your tale..."
 * 4. Call generatePrologue() with setup_context to generate prologue via Ollama
 * 5. Call createStory() with generated prologue in initial_passage.content
 * 6. API persists story with prologue to MongoDB
 * 7. Navigate to StoryReader to display the generated story
 *
 * @returns {Promise<Object>} Created story object with ID
 * @throws {Error} If validation fails, not authenticated, or API fails
 */
export async function createStory(setup) {
  // Validate required fields
  if (!setup.title || !setup.visibility || !setup.setup_context) {
    throw new Error('Missing required story setup fields: title, visibility, setup_context');
  }

  if (!setup.initial_passage || !setup.initial_passage.content) {
    throw new Error('Prologue not generated. Call generatePrologue() before createStory()');
  }

  try {
    // Call real API to create story with pre-generated prologue
    const response = await apiPost('/stories/create', {
      title: setup.title,
      visibility: setup.visibility,
      setup_context: setup.setup_context,
      initial_passage: {
        content: setup.initial_passage.content, // Pre-generated prologue from Ollama
      },
    });

    // Use API slug if provided, otherwise generate one locally
    const slug = response.slug || generateUniqueSlug(setup.title);

    // Return created story with ID and slug for navigation
    if (response.id) {
      return {
        id: response.id,
        slug: slug, // Use generated slug for URL navigation
        title: response.title,
        visibility: response.visibility,
        created_at: response.created_at,
        updated_at: response.updated_at,
      };
    }

    throw new Error('No story ID returned from API');
  } catch (error) {
    console.error('Failed to create story:', error);
    throw error;
  }
}

/**
 * forkStory: Create a forked copy of a public story with user response
 * 
 * Called when a user responds to another user's public story.
 * Creates a new story with copied passages plus the new response.
 * Title format: "{Original Title} - {Username}" (server-generated).
 * Visibility defaults to "private" for forks.
 * 
 * @param {string} storyId - Original story ID or slug
 * @param {string} [userResponseText] - Optional user's response text
 * @returns {Promise<Object>} Created fork with id, slug, title, etc.
 * @throws {Error} If not authenticated, story not public, or validation fails
 */
export async function forkStory(storyId, userResponseText = '') {
  if (!storyId || typeof storyId !== 'string') {
    throw new Error('Story ID is required to fork a story');
  }

  try {
    console.log('forkStory: Making API call with story_id:', storyId);
    const payload = { story_id: storyId };
    if (typeof userResponseText === 'string' && userResponseText.trim().length > 0) {
      payload.response = {
        content: userResponseText.trim(),
      };
    }

    const response = await apiPost('/stories/fork', payload);

    console.log('forkStory: API response:', response);

    const fork = {
      id: response.id,
      slug: response.slug,
      title: response.title,
      author_id: response.author_id,
      visibility: response.visibility,
      original_fork_id: response.original_fork_id,
      created_at: response.created_at,
      updated_at: response.updated_at,
    };
    
    console.log('forkStory: Returning fork object:', fork);
    return fork;
  } catch (error) {
    console.error('Failed to fork story:', error);
    throw error;
  }
}

/**
 * getStoryById: Retrieve previously saved story by ID
 * 
 * Fetches full story content including current passage.
 * Future: Load from database using story ID.
 * 
 * @param {string} storyId - Story identifier
 * @returns {Promise<Object>} Full Story object
 */
export async function getStoryById(storyId) {
  await delay(randomDelay(300, 600));

  const response = await apiGet(`/stories/by-slug?slug=${encodeURIComponent(storyId)}`);
  return normalizeStoryFromApi(response);
}

/**
 * getStoryBySlug: Retrieve previously saved story by URL slug
 * 
 * Fetches full story content using slug instead of ID.
 * Used for URL-based story access (/story/:slug).
 * 
 * @param {string} slug - Story URL slug
 * @returns {Promise<Object>} Full Story object
 * @throws {Error} If slug is invalid or story not found
 */
export async function getStoryBySlug(slug) {
  if (!isValidSlug(slug)) {
    throw new Error('Invalid story slug format');
  }
  await delay(randomDelay(300, 600));

  const response = await apiGet(`/stories/by-slug?slug=${encodeURIComponent(slug)}`);
  return normalizeStoryFromApi(response);
}

/**
 * getNextPassage: Generate next story passage based on user text input
 * 
 * PHASE 4+: Streams real Ollama output with system prompts.
 * Caller provides generation context and a token callback for streaming UI updates.
 * 
 * @param {string} storyId - Story identifier
 * @param {string} userResponse - Free-text response from user
 * @param {Object} options - Generation options
 * @param {string} options.modelId - Ollama model ID to use
 * @param {Object} options.context - Story context for system prompt
 * @param {function} [options.onToken] - Token callback for streaming UI updates
 * @returns {Promise<Object>} New StoryPassage object
 * @throws {Error} If generation fails
 */
export async function getNextPassage(storyId, userResponse, options = {}) {
  const { modelId, context, onToken } = options;

  if (!storyId) {
    throw new Error('Story ID required for passage generation');
  }

  if (!modelId) {
    throw new Error('Model ID required for passage generation');
  }

  if (!context) {
    throw new Error('Story context required for passage generation');
  }

  try {
    const text = await generateStoryPassage(modelId, context, onToken);

    if (!text || text.trim().length === 0) {
      throw new Error('Ollama generated empty passage. Try again?');
    }

    return {
      id: `passage-${Date.now()}`,
      text,
      displayedAt: null,
    };
  } catch (error) {
    console.error('Failed to generate next passage:', error);
    throw error;
  }
}

/**
 * Update a story (passages, visibility, title, etc.)
 *
 * @param {string} storyIdOrSlug - Story ID or slug
 * @param {Object} updates - Fields to update (passages, visibility, title)
 * @returns {Promise<Object>} Updated story
 */
export async function updateStory(storyIdOrSlug, updates) {
  try {
    const response = await apiPut(`/api/stories/${storyIdOrSlug}`, updates);
    return normalizeStoryFromApi(response);
  } catch (error) {
    console.error('Failed to update story:', error);
    throw error;
  }
}

/**
 * Delete a story
 *
 * @param {string} storyIdOrSlug - Story ID or slug
 * @returns {Promise<Object>} Deletion confirmation
 */
export async function deleteStory(storyIdOrSlug) {
  try {
    const response = await apiDelete(`/api/stories/${storyIdOrSlug}`);
    return response;
  } catch (error) {
    console.error('Failed to delete story:', error);
    throw error;
  }
}

/**
 * Export all functions as default object for easier mocking in tests
 */
export default {
  checkOllamaConnection,
  getAvailableModels,
  generatePrologue,
  getUserStories,
  createStory,
  getStoryById,
  getStoryBySlug,
  getNextPassage,
  updateStory,
  deleteStory,
};
