/**
 * Ollama Client: Fetch wrapper for local Ollama LLM API.
 *
 * Handles:
 * - Connection check (ping)
 * - Model listing (tags)
 * - Streaming text generation (generate with streaming)
 * - CORS error detection and messaging
 *
 * Local Ollama runs at: http://localhost:11434
 *
 * Common CORS Issues:
 * - Error: CORS policy: No 'Access-Control-Allow-Origin' header
 *   Fix: Start Ollama with OLLAMA_ORIGINS="http://localhost:5173,http://localhost:3000" ollama serve
 *   (Vite dev default is localhost:5173, production may be localhost:3000 or custom)
 */

/**
 * Get Ollama base URL.
 * Uses dev tunnel URL from localStorage if set, otherwise defaults to localhost:11434.
 *
 * @returns {string} Ollama base URL
 */
export function getOllamaBaseUrl() {
  // Check for dev tunnel URL from localStorage
  if (typeof window !== 'undefined') {
    const devTunnelUrl = localStorage.getItem('devTunnelUrl');
    if (devTunnelUrl?.trim()) {
      return devTunnelUrl.replace(/\/$/, ''); // Remove trailing slash
    }
  }
  
  // Default to localhost Ollama
  return "http://localhost:11434";
}

/**
 * Detect if an error is a CORS error from Ollama.
 *
 * CORS errors typically include:
 * - "CORS policy"
 * - "Access-Control-Allow-Origin"
 * - "No 'Access-Control-Allow-Origin' header"
 *
 * @param {Error} error - Error object
 * @returns {boolean} True if likely CORS error
 */
export function isCorsError(error) {
  const message = error.message || "";
  return message.includes("CORS") || message.includes("Access-Control");
}

/**
 * Custom error class for Ollama Client.
 */
export class OllamaError extends Error {
  constructor(message, type = "OLLAMA_ERROR", originalError = null) {
    super(message);
    this.name = "OllamaError";
    this.type = type; // 'CONNECTION_ERROR', 'CORS_ERROR', 'MODEL_ERROR', 'GENERATION_ERROR'
    this.originalError = originalError;
  }
}

/**
 * Check if Ollama server is running and accessible.
 *
 * Sends a simple health check to the Ollama /api/tags endpoint.
 * This also verifies CORS is configured correctly.
 *
 * Success response: { "models": [...] } (even empty list means server is up)
 * CORS error: browser blocks request (will see CORS error in console)
 * Connection refused: server not running or wrong port
 *
 * @returns {Promise<object>} Result object:
 *   { status: "online" | "offline" | "cors_error", timestamp: ISO 8601 }
 *
 * @example
 *   const result = await ollamaPing();
 *   if (result.status === "online") {
 *     // Ollama is accessible
 *   } else if (result.status === "cors_error") {
 *     // Show CORS remediation instructions
 *   } else {
 *     // Show connection instructions
 *   }
 */
export async function ollamaPing() {
  const url = `${getOllamaBaseUrl()}/api/tags`;
  const timestamp = new Date().toISOString();

  try {
    const response = await fetch(url, {
      method: "GET",
      timeout: 5000, // 5 second timeout for health check
    });

    if (response.ok) {
      return { status: "online", timestamp };
    }

    // Non-ok but successful response (unlikely but handled)
    return { status: "offline", timestamp };

  } catch (error) {
    // Detect error type
    if (isCorsError(error)) {
      return { status: "cors_error", timestamp, error: error.message };
    }

    // Connection errors (ECONNREFUSED, timeout, network error)
    return { status: "offline", timestamp, error: error.message };
  }
}

/**
 * Fetch available LLM models from Ollama.
 *
 * Success response: { "models": [ { name: "llama2", ... }, ... ] }
 *
 * @returns {Promise<Array>} List of model names (e.g., ["llama2", "mistral"])
 *
 * @throws {OllamaError} On CORS, connection, or API error
 *
 * @example
 *   try {
 *     const models = await ollamaGetModels();
 *     console.log(models); // ["llama2", "mistral", "neural-chat"]
 *   } catch (error) {
 *     if (error.type === "CORS_ERROR") {
 *       // Show CORS instructions
 *     } else {
 *       // Show connection instructions
 *     }
 *   }
 */
export async function ollamaGetModels() {
  const url = `${getOllamaBaseUrl()}/api/tags`;

  try {
    const response = await fetch(url, { method: "GET" });

    if (!response.ok) {
      throw new OllamaError(
        `Ollama API error: ${response.status}`,
        "API_ERROR"
      );
    }

    const data = await response.json();
    const models = data.models || [];

    // Extract model names from response objects
    return models.map((m) => m.name || m);

  } catch (error) {
    if (isCorsError(error)) {
      throw new OllamaError(
        "CORS policy blocks Ollama. See BootSequence for fix.",
        "CORS_ERROR",
        error
      );
    }

    if (error instanceof OllamaError) {
      throw error;
    }

    throw new OllamaError(
      `Failed to fetch models: ${error.message}`,
      "CONNECTION_ERROR",
      error
    );
  }
}

/**
 * Generate text from Ollama with streaming output (token by token).
 *
 * Streams tokens one at a time via callback. Each token is received
 * in a separate JSON object:
 *   { "response": "token", "done": false }
 *   ...
 *   { "response": "", "done": true, "total_duration": ... }
 *
 * CRITICAL: System prompts guide Ollama's behavior. Always provide system prompts for:
 * - Story prologue generation (establish tone, style, character perspective)
 * - Story progression (maintain consistency, respond to user actions)
 * - Any other Ollama interaction requiring specific guidance
 *
 * @param {string} model - Model name (e.g., "llama2", "mistral")
 * @param {string} prompt - Input text/instruction to generate from (can be empty if systemPrompt provides full context)
 * @param {function(string)} onToken - Callback fired for each token (param: token string)
 * @param {object} options - Generation options
 *   - temperature: float 0-1 (default 0.7). Higher = more creative, lower = more consistent
 *   - top_p: float 0-1 (nucleus sampling, default 0.9)
 *   - top_k: int (top k sampling, default 40)
 *   - num_predict: int (max tokens to generate, default 128)
 *   - stop: array of strings (stop sequences to halt generation)
 *   - system: string (CRITICAL: System prompt to guide generation. Use ollamaPrompts utility for story generation)
 *
 * @returns {Promise<string>} Full generated text accumulated from tokens
 *
 * @throws {OllamaError} On CORS, connection, or generation error
 *
 * @example
 *   import { getPrologueSystemPrompt } from '@/utils/ollamaPrompts';
 *   const tokens = [];
 *   try {
 *     const fullText = await ollamaGenerate(
 *       "llama2",
 *       "", // Empty prompt; full guidance in system prompt
 *       (token) => {
 *         tokens.push(token);
 *         setStreamingText(tokens.join(""));
 *       },
 *       {
 *         system: getPrologueSystemPrompt(setupContext),
 *         temperature: 0.8,
 *         num_predict: 400
 *       }
 *     );
 *   } catch (error) {
 *     setError(error.message);
 *   }
 */
export async function ollamaGenerate(
  model,
  prompt,
  onToken,
  options = {}
) {
  const url = `${getOllamaBaseUrl()}/api/generate`;

  const {
    temperature = 0.7,
    top_p = 0.9,
    top_k = 40,
    num_predict = 128,
    stop = [],
    system = '', // CRITICAL: System prompt for guiding generation
  } = options;

  const requestBody = {
    model,
    prompt,
    stream: true, // Enable streaming
    temperature,
    top_p,
    top_k,
    num_predict,
    ...(stop.length > 0 && { stop }),
    ...(system && { system }), // Include system prompt if provided
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new OllamaError(
        `Ollama API error: ${response.status}`,
        "API_ERROR"
      );
    }

    // Read streaming response line by line
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete lines (streaming API returns newline-delimited JSON)
        const lines = buffer.split("\n");
        buffer = lines.pop(); // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const chunk = JSON.parse(line);

            // Call token callback if provided
            if (chunk.response && onToken) {
              onToken(chunk.response);
            }

            fullText += chunk.response || "";

            // Stop when done
            if (chunk.done) {
              return fullText;
            }

          } catch (parseError) {
            // Skip malformed JSON lines
            console.warn("Skipped malformed JSON line:", line);
          }
        }
      }

      // Handle any remaining buffer
      if (buffer.trim()) {
        try {
          const chunk = JSON.parse(buffer);
          if (chunk.response && onToken) {
            onToken(chunk.response);
          }
          fullText += chunk.response || "";
        } catch (parseError) {
          // Ignore trailing parse error
        }
      }

      return fullText;

    } finally {
      reader.releaseLock();
    }

  } catch (error) {
    if (isCorsError(error)) {
      throw new OllamaError(
        "CORS policy blocks Ollama. See BootSequence for fix.",
        "CORS_ERROR",
        error
      );
    }

    if (error instanceof OllamaError) {
      throw error;
    }

    throw new OllamaError(
      `Generation failed: ${error.message}`,
      "GENERATION_ERROR",
      error
    );
  }
}

/**
 * Utility: Test Ollama connection and report diagnostics.
 *
 * Useful for BootSequence debugging.
 * Returns detailed status for UI to display.
 *
 * @returns {Promise<object>} Diagnostic report:
 *   {
 *     connected: boolean,
 *     status: "online" | "offline" | "cors_error",
 *     models_available: number,
 *     model_list: string[],
 *     url: string,
 *     error: string (if any)
 *   }
 */
export async function ollamaDiagnostics() {
  const url = getOllamaBaseUrl();
  const report = {
    connected: false,
    status: "offline",
    models_available: 0,
    model_list: [],
    url,
    error: null,
  };

  try {
    // Test connection
    const pingResult = await ollamaPing();
    report.status = pingResult.status;

    if (pingResult.status === "offline") {
      report.error = `Cannot reach Ollama at ${url}. Is it running?`;
      return report;
    }

    if (pingResult.status === "cors_error") {
      report.error = "CORS policy blocks Ollama. Check BootSequence instructions.";
      return report;
    }

    // Fetch model list
    const models = await ollamaGetModels();
    report.connected = true;
    report.models_available = models.length;
    report.model_list = models;

    return report;

  } catch (error) {
    report.error = error.message;
    if (error.type === "CORS_ERROR") {
      report.status = "cors_error";
    }
    return report;
  }
}

/**
 * Generate story prologue with automatic system prompt
 *
 * Convenience wrapper around ollamaGenerate() that automatically includes
 * the story prologue system prompt. Use this when generating the initial passage.
 *
 * @param {string} model - Model name (e.g., "llama2")
 * @param {Object} setupContext - User-provided story setup
 *   - fandom: string (universe/franchise)
 *   - character: string (protagonist name/description)
 *   - premise: string (starting situation)
 *   - goals: string (character's objectives)
 * @param {function(string)} onToken - Callback for each token
 * @returns {Promise<string>} Generated prologue text
 * @throws {OllamaError} On generation or connection error
 *
 * @example
 *   try {
 *     await generateStoryPrologue(
 *       "llama2",
 *       {
 *         fandom: "Harry Potter",
 *         character: "Harry",
 *         premise: "Awakens in Hogwarts",
 *         goals: "Survive and learn magic"
 *       },
 *       (token) => setStreamingText(prev => prev + token)
 *     );
 *   } catch (error) {
 *     console.error('Prologue generation failed:', error);
 *   }
 */
export async function generateStoryPrologue(model, setupContext, onToken) {
  const { getPrologueSystemPrompt, getStoryGenerationOptions } = await import('@/utils/ollamaPrompts');
  
  return ollamaGenerate(
    model,
    'Begin the story now:', // Trigger phrase to kick off generation
    onToken,
    {
      system: getPrologueSystemPrompt(setupContext),
      ...getStoryGenerationOptions(),
    }
  );
}

/**
 * Generate next story passage based on user response
 *
 * Convenience wrapper around ollamaGenerate() that automatically includes
 * the story progression system prompt. Use this when user submits free-text action.
 *
 * @param {string} model - Model name (e.g., "llama2")
 * @param {Object} context - Story context for generation
 *   - fandom: string (universe)
 *   - character: string (protagonist from setup)
 *   - storyTitle: string (title of the story)
 *   - passageHistory: array of strings (recent passages, most recent first)
 *   - userResponse: string (what user just did/said)
 * @param {function(string)} onToken - Callback for each token
 * @returns {Promise<string>} Generated passage text
 * @throws {OllamaError} On generation or connection error
 *
 * @example
 *   try {
 *     await generateStoryPassage(
 *       "llama2",
 *       {
 *         fandom: "Harry Potter",
 *         character: "Harry",
 *         storyTitle: "The Forgotten Prophecy",
 *         passageHistory: [previousPassageText],
 *         userResponse: "I cast Expelliarmus at the dark figure"
 *       },
 *       (token) => setStreamingText(prev => prev + token)
 *     );
 *   } catch (error) {
 *     console.error('Passage generation failed:', error);
 *   }
 */
export async function generateStoryPassage(model, context, onToken) {
  const { getProgressionSystemPrompt, getStoryGenerationOptions } = await import('@/utils/ollamaPrompts');
  
  return ollamaGenerate(
    model,
    'Continue the story:', // Trigger phrase to generate next passage
    onToken,
    {
      system: getProgressionSystemPrompt(context),
      ...getStoryGenerationOptions(),
    }
  );
}
