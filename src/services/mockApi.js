/**
 * Mock API Service
 * 
 * Provides simulated backend API calls for the MVP phase.
 * All functions return Promises with realistic network delays (800-1500ms).
 * These interfaces will be replaced with real fetch() calls in production.
 * 
 * Mock behavior can be overridden via environment variables:
 * - VITE_MOCK_OLLAMA_STATUS=online|offline (forces connection status)
 * - MOCK_API_DELAY=number (custom delay in ms)
 */

import { generateUniqueSlug, isValidSlug } from '@/utils/slugify';

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
 * checkOllamaConnection: Check backend service status
 * 
 * Simulates connection check to Ollama backend (mocked).
 * Returns online 80% of the time for realistic testing.
 * 
 * @returns {Promise<{status: string, timestamp: string, message?: string}>}
 */
export async function checkOllamaConnection() {
  await delay(randomDelay(1000, 1500));

  // Check override via env var
  const envStatus = import.meta.env.VITE_MOCK_OLLAMA_STATUS;
  if (envStatus === 'online' || envStatus === 'offline') {
    return {
      status: envStatus,
      timestamp: new Date().toISOString(),
      message:
        envStatus === 'online'
          ? 'The gateway awakens...'
          : 'The gateway sleeps. Awaken it to begin your journey.',
    };
  }

  // 80% online, 20% offline
  const isOnline = Math.random() < 0.8;

  return {
    status: isOnline ? 'online' : 'offline',
    timestamp: new Date().toISOString(),
    message: isOnline
      ? 'The gateway awakens...'
      : 'The gateway sleeps. Awaken it to begin your journey.',
  };
}

/**
 * getAvailableModels: Fetch list of AI models
 * 
 * Returns hardcoded list of available language models.
 * Future: Load from configuration file or real backend.
 * 
 * @returns {Promise<Array>} Array of AIModel objects
 */
export async function getAvailableModels() {
  await delay(randomDelay(800, 1200));

  return [
    {
      id: 'llama3:8b',
      name: 'llama3:8b',
      displayName: 'llama3:8b',
      description: 'General-purpose Ollama model tag.',
      parameters: {
        size: '8B',
        contextWindow: 8192,
      },
    },
    {
      id: 'mistral:7b',
      name: 'mistral:7b',
      displayName: 'mistral:7b',
      description: 'Fast and lightweight Ollama model tag.',
      parameters: {
        size: '7B',
        contextWindow: 32768,
      },
    },
  ];
}

/**
 * getUserStories: Fetch user's saved stories for Dashboard
 * 
 * Returns mock story list for MVP.
 * Future: Fetch from database with user authentication.
 * 
 * @returns {Promise<Array>} Array of StorySummary objects
 */
export async function getUserStories() {
  await delay(randomDelay(800, 1200));

  return [
    {
      id: 'story-001',
      slug: 'douluo-dalu-the-soul-forge',
      title: 'Douluo Dalu - The Soul Forge',
      fandom: 'Douluo Dalu',
      createdAt: '2026-02-27T14:30:00Z',
      lastModified: '2026-02-27T15:45:00Z',
      wordCount: 1247,
    },
    {
      id: 'story-002',
      slug: 'mystical-encounters',
      title: 'Mystical Encounters',
      fandom: 'Original',
      createdAt: '2026-02-26T10:15:00Z',
      lastModified: '2026-02-26T11:20:00Z',
      wordCount: 892,
    },
  ];
}

/**
 * createStory: Generate story prologue from setup parameters
 * 
 * Accepts story setup (character, premise, goals) and returns
 * mocked generated prologue text.
 * Future: Call real LLM backend to generate unique content.
 * 
 * @param {Object} setup - Story setup parameters
 * @param {string} setup.fandom - Selected fandom/universe
 * @param {string} setup.character - Character description
 * @param {string} setup.premise - Story premise
 * @param {string} setup.goals - Character goals
 * @param {string} setup.model - Selected AI model ID
 * 
 * @returns {Promise<Object>} Story object with generated prologue
 * @throws {Error} If validation fails
 */
export async function createStory(setup) {
  // Validate input
  if (!setup.character || !setup.premise || !setup.goals) {
    throw new Error('Missing required story setup fields');
  }

  await delay(randomDelay(1000, 1500));

  const storyId = `story-${Date.now()}`;
  const storyTitle = `Journey in ${setup.fandom}`;
  
  // Generate unique slug from title
  const existingSlugs = Array.from(slugToIdMap.keys());
  const storySlug = generateUniqueSlug(storyTitle, existingSlugs);

  // MVP interactive reader uses lorem ipsum placeholders for all passages.
  const prologue = generateLoremIpsum(2, 4);

  const createdStory = {
    id: storyId,
    slug: storySlug,
    title: storyTitle,
    fandom: setup.fandom,
    prologue,
    characterSetup: setup,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    passages: [
      {
        id: 'passage-0',
        text: prologue,
        choices: [],
        displayedAt: null,
        selectedChoiceId: null,
        selectedResponseText: null,
      },
    ],
    currentPassageIndex: 0,
    wordCount: prologue.split(/\s+/).length,
  };

  storyStore.set(storyId, createdStory);
  slugToIdMap.set(storySlug, storyId);

  return createdStory;
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
  await delay(randomDelay(800, 1200));

  const storedStory = storyStore.get(storyId);
  if (storedStory) {
    return structuredClone(storedStory);
  }

  // Return mock story for MVP
  return {
    id: storyId,
    slug: 'your-adventure-continues',
    title: 'Your Adventure Continues',
    fandom: 'Douluo Dalu',
    prologue: generateLoremIpsum(2, 4),
    createdAt: '2026-02-27T14:30:00Z',
    lastModified: new Date().toISOString(),
    passages: [
      {
        id: 'passage-0',
        text: generateLoremIpsum(2, 4),
        choices: [],
        selectedChoiceId: null,
        selectedResponseText: null,
      },
    ],
    currentPassageIndex: 0,
    wordCount: 12,
  };
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

  await delay(randomDelay(800, 1200));

  // Check if slug exists in map
  const storyId = slugToIdMap.get(slug);
  if (storyId) {
    const storedStory = storyStore.get(storyId);
    if (storedStory) {
      return structuredClone(storedStory);
    }
  }

  // Fallback for mock stories from getUserStories
  if (slug === 'douluo-dalu-the-soul-forge') {
    return {
      id: 'story-001',
      slug: 'douluo-dalu-the-soul-forge',
      title: 'Douluo Dalu - The Soul Forge',
      fandom: 'Douluo Dalu',
      prologue: generateLoremIpsum(2, 4),
      createdAt: '2026-02-27T14:30:00Z',
      lastModified: '2026-02-27T15:45:00Z',
      passages: [
        {
          id: 'passage-0',
          text: generateLoremIpsum(2, 4),
          choices: [],
          selectedChoiceId: null,
          selectedResponseText: null,
        },
      ],
      currentPassageIndex: 0,
      wordCount: 1247,
    };
  }

  if (slug === 'mystical-encounters') {
    return {
      id: 'story-002',
      slug: 'mystical-encounters',
      title: 'Mystical Encounters',
      fandom: 'Original',
      prologue: generateLoremIpsum(2, 4),
      createdAt: '2026-02-26T10:15:00Z',
      lastModified: '2026-02-26T11:20:00Z',
      passages: [
        {
          id: 'passage-0',
          text: generateLoremIpsum(2, 4),
          choices: [],
          selectedChoiceId: null,
          selectedResponseText: null,
        },
      ],
      currentPassageIndex: 0,
      wordCount: 892,
    };
  }

  // Story not found
  throw new Error(`Story with slug "${slug}" not found`);
}

/**
 * getNextPassage: Generate next story passage based on user text input
 * 
 * Simulates AI-powered story continuation. Returns lorem ipsum passage
 * with 2-4 new choices for MVP. In production, this calls the real LLM backend.
 * 
 * @param {string} storyId - Story identifier
 * @param {string} userResponse - Free-text response from user
 * @returns {Promise<Object>} New StoryPassage object
 * @throws {Error} If story not found or generation fails (5% chance)
 */
export async function getNextPassage(storyId, userResponse) {
  // Simulate AI generation time
  await delay(randomDelay(1200, 2000));

  // 5% failure rate for testing error handling
  if (Math.random() < 0.05) {
    throw {
      error: 'GENERATION_FAILED',
      message: 'The threads of fate are tangled. Try again?',
      retryable: true,
    };
  }

  const text = generateLoremIpsum(2, 4);

  // Generate new passage
  return {
    id: `passage-${Date.now()}`,
    text,
    choices: [],
    displayedAt: null, // Set by UI when rendered
    selectedChoiceId: null, // Will be set when user makes next choice
    selectedResponseText: null,
  };
}

/**
 * Export all functions as default object for easier mocking in tests
 */
export default {
  checkOllamaConnection,
  getAvailableModels,
  getUserStories,
  createStory,
  getStoryById,
  getStoryBySlug,
  getNextPassage,
};
