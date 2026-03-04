/**
 * Validation helpers for StoryTeller Node API.
 */

/**
 * Validate required fields in a request payload.
 *
 * @param {object} data Request payload
 * @param {string[]} requiredFields Field names that must be present and non-empty
 * @returns {{ valid: boolean, message: string }} Validation result
 */
export function validateRequired(data, requiredFields) {
  if (!data || typeof data !== "object") {
    return { valid: false, message: "Invalid request payload" };
  }

  for (const field of requiredFields) {
    const value = data[field];
    if (value === undefined || value === null || value === "") {
      return { valid: false, message: `Missing required field: ${field}` };
    }
  }

  return { valid: true, message: "" };
}

/**
 * Validate story creation payload.
 *
 * @param {object} data Request payload
 * @returns {{ isValid: boolean, errors: object }} Validation result
 */
export function validateStoryCreation(data) {
  const errors = {};

  if (!data || typeof data !== "object") {
    return { isValid: false, errors: { _root: "Invalid payload type" } };
  }

  const title = String(data.title || "").trim();
  if (!title) {
    errors.title = "Book Name is required";
  } else if (title.length < 3) {
    errors.title = "Book Name must be at least 3 characters";
  } else if (title.length > 80) {
    errors.title = "Book Name must be at most 80 characters";
  }

  const visibility = String(data.visibility || "").toLowerCase();
  if (visibility !== "public" && visibility !== "private") {
    errors.visibility = "Visibility must be 'public' or 'private'";
  }

  const setupContext = data.setup_context;
  if (!setupContext || typeof setupContext !== "object") {
    errors.setup_context = "Setup context must be an object";
  } else {
    const requiredFields = ["model_id", "fandom", "character", "premise", "goals"];
    for (const field of requiredFields) {
      const value = String(setupContext[field] || "").trim();
      if (!value) {
        errors[`setup_context.${field}`] = `${field} is required`;
      }
    }
  }

  const initialPassage = data.initial_passage;
  if (!initialPassage || typeof initialPassage !== "object") {
    errors.initial_passage = "Initial passage must be an object";
  } else {
    const content = String(initialPassage.content || "").trim();
    if (!content) {
      errors["initial_passage.content"] = "Passage content is required";
    } else if (content.length > 5000) {
      errors["initial_passage.content"] = "Passage too long (max 5000 characters)";
    }
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}
