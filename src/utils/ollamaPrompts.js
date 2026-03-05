/**
 * System Prompts for Ollama Story Generation
 *
 * Defines all system prompts used to guide Ollama's behavior for different story tasks.
 * System prompts are crucial for:
 * - Establishing tone and style (mystical, immersive, interactive)
 * - Constraining output format (length, structure, language)
 * - Providing context about the story universe (fandom, character, setup)
 * - Ensuring consistency across generated passages
 *
 * Each prompt is optimized for streaming generation and token efficiency.
 * Fandom context is injected as raw TOON format for minimal token overhead.
 */

import { getFandomToonContext } from '@/utils/fandomTones';

/**
 * Generate system prompt for story prologue creation
 *
 * Called once when user submits StorySetup form to generate the opening passage.
 * Sets the narrative tone, establishes character perspective, and hooks the user
 * with an engaging opening that respects the user's fandom/character/premise setup.
 * 
 * TOON fandom context is injected directly to minimize tokens while providing rich guidance.
 *
 * @param {Object} setupContext - User-provided story context
 * @param {string} setupContext.fandomId - Fandom identifier (e.g., 'douluo-dalu')
 * @param {string} setupContext.character - Protagonist name/description
 * @param {string} setupContext.premise - Starting situation (e.g., "awakens in Hogwarts")
 * @param {string} setupContext.goals - Character's initial objectives
 * @returns {string} System prompt for Ollama to generate prologue
 */
export function getPrologueSystemPrompt(setupContext) {
  const { fandomId, character, premise, goals } = setupContext || {};

  // Load raw TOON context for the fandom
  let fandomContext = '';
  if (fandomId) {
    try {
      fandomContext = `\nFANDOM CONTEXT (TOON format):\n${getFandomToonContext(fandomId)}\n`;
    } catch (error) {
      console.warn(`Could not load fandom context for ${fandomId}:`, error.message);
    }
  }

  return `You are a master storyteller creating an immersive interactive fiction experience.

PROTAGONIST: ${character || 'A brave adventurer'}
SETTING: ${premise || 'An ordinary day transforms into something extraordinary'}
INITIAL GOAL: ${goals || 'Survive and understand what\'s happening'}
${fandomContext}
YOUR TASK:
Generate the opening passage (prologue) of an interactive story. This is the FIRST passage the reader will experience.

REQUIREMENTS:
1. TONE: Mystical, immersive, poetic yet accessible. Create atmosphere and intrigue.
2. LENGTH: 200-300 words (2-3 paragraphs). Engaging but not overwhelming.
3. PERSPECTIVE: Second-person ("You...") to immerse reader as the protagonist.
4. HOOK: End with a cliffhanger or decision point that makes the reader want to respond.
5. UNIVERSE RESPECT: Stay true to the fandom's tone and rules. Avoid contradictions.
6. NO CHOICES: Don't list multiple options. This is free-text interactive fiction.

STRUCTURE:
- Paragraph 1: Establish immediate sensory perception (sight, sound, feeling)
- Paragraph 2: Reveal the situation and why it matters
- Paragraph 3: Present the challenge or decision (leave reader wanting to act)

OUTPUT:
- ONLY the story text. No meta-commentary, no "**Prologue**" headers, no stage directions.
- Use vivid, precise language. Avoid clichés and filler.
- Engage reader directly: "You feel...", "You see...", "You notice..."`;
}

/**
 * Generate system prompt for story passage progression
 *
 * Called when user submits free-text response to generate the next passage.
 * Continues the narrative based on user input while maintaining consistency,
 * tone, and world-building.
 * 
 * TOON fandom context is re-injected for every passage to ensure consistency.
 *
 * @param {Object} context - Story context for generation
 * @param {string} context.fandomId - Fandom identifier
 * @param {string} context.character - Protagonist (from setup)
 * @param {string} context.storyTitle - The story's title
 * @param {Array<string>} context.passageHistory - Previous passage texts (most recent first)
 * @param {string} context.userResponse - What the user just did/said
 * @returns {string} System prompt for Ollama to generate next passage
 */
export function getProgressionSystemPrompt(context) {
  const {
    fandomId,
    character = 'The protagonist',
    storyTitle = 'An Untold Tale',
    passageHistory = [],
    userResponse = 'continue',
  } = context || {};

  // Get the most recent passage for immediate context (prevents token explosion)
  const recentPassage = passageHistory[0] || '[The story begins...]';

  // Load raw TOON context for the fandom
  let fandomContext = '';
  if (fandomId) {
    try {
      fandomContext = `\nFANDOM CONTEXT (TOON format):\n${getFandomToonContext(fandomId)}\n`;
    } catch (error) {
      console.warn(`Could not load fandom context for ${fandomId}:`, error.message);
    }
  }

  return `You are a master storyteller continuing an interactive narrative.

STORY TITLE: "${storyTitle}"
PROTAGONIST: ${character}
${fandomContext}
NARRATIVE SO FAR (most recent passage):
${recentPassage}

USER'S ACTION/RESPONSE:
"${userResponse}"

YOUR TASK:
Generate the next passage that directly responds to what the user just did/said. This continues their interactive journey.

REQUIREMENTS:
1. TONE: Maintain the story's voice. Match previously established atmosphere and character depth.
2. LENGTH: 200-300 words (2-3 paragraphs). Consistent with prior passages.
3. PERSPECTIVE: Second-person ("You...") to keep reader immersed.
4. CONSEQUENCE: The passage should clearly respond to and incorporate the user's action/words.
5. PROGRESSION: Advance the plot. Don't repeat prior events or merely describe the same scene.
6. WORLD CONSISTENCY: Respect established rules, characters, and locations.
7. HOOK: End with something that invites further user response or creates tension.
8. NO CHOICES: Don't offer multiple buttons. This is free-text interactive fiction.

STRUCTURE:
- Show the IMMEDIATE consequence of the user's action
- Introduce a NEW complication, NPC interaction, or story beat
- Leave the reader with a reason to respond again (unresolved tension or opportunity)

OUTPUT:
- ONLY the story text. No meta-commentary, no "**Passage 2**" headers, no stage directions.
- Use vivid, precise language. Avoid clichés and filler.
- If the user's action is nonsensical/inappropriate, gently redirect: "The universe resists your attempt. Instead, you find yourself..."`;
}

/**
 * Get realistic generation parameters for story passages
 *
 * Returns options optimized for story generation streaming.
 * Balances creativity (higher temperature) with consistency (constraints).
 *
 * @returns {Object} Generation options for ollamaGenerate()
 */
export function getStoryGenerationOptions() {
  return {
    temperature: 0.8,  // Balanced: creative but not chaotic
    top_p: 0.85,      // Nucleus sampling for coherence
    top_k: 40,        // Limit vocabulary choices
    num_predict: 400, // Max 400 tokens (~300 words for prose)
    stop: [
  '\n\n---',          // Stop at section breaks
      '\n**User\'s Choice**', // Stop at choice headers
      '\n[[',         // Stop at metadata
    ],
  };
}

/**
 * Format a prologue request payload for Ollama
 *
 * Prepares the complete request object to send to ollamaClient.ollamaGenerate()
 * for prologue generation.
 *
 * @param {string} model - Model name (e.g., "llama2", "mistral")
 * @param {Object} setupContext - Story setup parameters
 * @returns {Object} Request object: { model, prompt, systemPrompt, options }
 */
export function buildPrologueRequest(model, setupContext) {
  return {
    model,
    prompt: '', // Empty prompt; all guidance in system prompt
    systemPrompt: getPrologueSystemPrompt(setupContext),
    options: getStoryGenerationOptions(),
  };
}

/**
 * Format a progression request payload for Ollama
 *
 * Prepares the complete request object to send to ollamaClient.ollamaGenerate()
 * for next-passage generation.
 *
 * @param {string} model - Model name
 * @param {Object} context - Story context (fandom, character, history, user response)
 * @returns {Object} Request object: { model, prompt, systemPrompt, options }
 */
export function buildProgressionRequest(model, context) {
  return {
    model,
    prompt: '', // Empty prompt; all guidance in system prompt
    systemPrompt: getProgressionSystemPrompt(context),
    options: getStoryGenerationOptions(),
  };
}

/**
 * Get mystical loading message for UI during generation
 *
 * Returns a random encouraging message to show user while Ollama is generating.
 *
 * @param {string} type - 'prologue' or 'progression'
 * @returns {string} Mystical loading message
 */
export function getMysticalLoadingMessage(type = 'prologue') {
  const messages = {
    prologue: [
      '✨ Weaving your tale from the threads of fate...',
      '🌙 The library of worlds is opening...',
      '🔮 Focusing the narrative lens...',
      '✍️ The quill writes itself...',
      '🌟 Summoning your story into being...',
    ],
    progression: [
      '✨ The story unfolds...',
      '🌙 Fate pivots on your choice...',
      '🔮 The next thread reveals itself...',
      '✍️ Writing your next moment...',
      '🌟 Reality responds to your action...',
    ],
  };

  const typeMessages = messages[type] || messages.progression;
  return typeMessages[Math.floor(Math.random() * typeMessages.length)];
}

export default {
  getPrologueSystemPrompt,
  getProgressionSystemPrompt,
  getStoryGenerationOptions,
  buildPrologueRequest,
  buildProgressionRequest,
  getMysticalLoadingMessage,
};
