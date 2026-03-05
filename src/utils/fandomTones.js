/**
 * Fandom Context & Tone Configuration
 * 
 * Loads TOON format fandom files for efficient LLM context injection.
 * TOON files are passed directly to LLM without parsing—ultra-compact format saves tokens.
 * 
 * Each fandom has a corresponding .toon file in @/utils/fandoms/
 */

// Import TOON files as raw text (Vite raw import)
import douluoToon from '@/utils/fandoms/douluo-dalu.toon?raw';

/**
 * Fandom registry with TOON content for direct LLM injection
 * Maps fandom ID to metadata and raw TOON context
 */
const FANDOM_REGISTRY = {
  'douluo-dalu-1': {
    id: 'douluo-dalu-1',
    label: 'Douluo Dalu 1',
    description: 'The first era where humans bond with spirit beasts through martial souls and spirit rings (10,000 years before sequels)',
    toonContext: douluoToon,
  },
};

/**
 * Get fandom context by ID
 * 
 * @param {string} fandomId - Fandom identifier (e.g., 'douluo-dalu')
 * @returns {Object} Fandom object with id, label, description, and raw toonContext
 * @throws {Error} If fandom not found
 */
export function getFandomContext(fandomId) {
  const fandom = FANDOM_REGISTRY[fandomId];
  if (!fandom) {
    throw new Error(`Unknown fandom: ${fandomId}`);
  }
  return fandom;
}

/**
 * Get raw TOON context for LLM injection
 * Returns the raw TOON format content—pass directly into system prompt
 * 
 * @param {string} fandomId - Fandom identifier
 * @returns {string} Raw TOON context for LLM
 * @throws {Error} If fandom not found
 */
export function getFandomToonContext(fandomId) {
  const fandom = getFandomContext(fandomId);
  return fandom.toonContext;
}

/**
 * Get all available fandoms for UI dropdowns
 * 
 * @returns {Array<{value: string, label: string}>} List of fandom options
 */
export function getAvailableFandoms() {
  return Object.entries(FANDOM_REGISTRY).map(([id, fandom]) => ({
    value: id,
    label: fandom.label,
  }));
}

export default {
  FANDOM_REGISTRY,
  getFandomContext,
  getFandomToonContext,
  getAvailableFandoms,
};
