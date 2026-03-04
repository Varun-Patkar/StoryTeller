/**
 * Validation Utilities for StoryTeller
 * 
 * Provides validation functions for story setup fields.
 * All validators return { valid: boolean, message: string }.
 * Messages are mystical and user-friendly (not technical).
 */

/**
 * Validate character description field
 * 
 * Character must be 10-500 characters (enough detail, not too long).
 * Returns mystical error messages for validation failure.
 * 
 * @param {string} text - Character description text
 * @returns {Object} { valid: boolean, message: string }
 */
export function validateCharacter(text) {
  if (!text || text.trim().length === 0) {
    return {
      valid: false,
      message: 'The protagonist awaits definition...',
    };
  }

  if (text.length < 10) {
    return {
      valid: false,
      message: 'A hero requires more detail to come alive.',
    };
  }

  if (text.length > 500) {
    return {
      valid: false,
      message: 'Brevity sharpens the vision. Consider condensing.',
    };
  }

  return {
    valid: true,
    message: 'Character accepted.',
  };
}

/**
 * Validate story premise field
 * 
 * Premise must be 20-1000 characters (meaningful scope).
 * Should convey the central conflict or challenge.
 * 
 * @param {string} text - Story premise text
 * @returns {Object} { valid: boolean, message: string }
 */
export function validatePremise(text) {
  if (!text || text.trim().length === 0) {
    return {
      valid: false,
      message: 'The story awaits its cause...',
    };
  }

  if (text.length < 20) {
    return {
      valid: false,
      message: 'A premise demands clarity and substance.',
    };
  }

  if (text.length > 1000) {
    return {
      valid: false,
      message: 'The premise grows too complex. Simplify the essence.',
    };
  }

  return {
    valid: true,
    message: 'Premise accepted.',
  };
}

/**
 * Validate character goals field
 * 
 * Goals must be 10-500 characters.
 * Should define what the character is trying to achieve.
 * 
 * @param {string} text - Character goals text
 * @returns {Object} { valid: boolean, message: string }
 */
export function validateGoals(text) {
  if (!text || text.trim().length === 0) {
    return {
      valid: false,
      message: 'Without goals, the journey has no direction...',
    };
  }

  if (text.length < 10) {
    return {
      valid: false,
      message: 'Ambitions must be clearly stated.',
    };
  }

  if (text.length > 500) {
    return {
      valid: false,
      message: 'Too many ambitions cloud the vision.',
    };
  }

  return {
    valid: true,
    message: 'Goals accepted.',
  };
}

/**
 * Validate entire story setup object
 * 
 * Validates all three fields together.
 * Returns first validation error encountered.
 * 
 * @param {Object} setup - Story setup object
 * @param {string} setup.character - Character description
 * @param {string} setup.premise - Story premise
 * @param {string} setup.goals - Character goals
 * 
 * @returns {Object} { valid: boolean, errors: {character?, premise?, goals?} }
 */
export function validateStorySetup(setup) {
  const errors = {};

  const charValidation = validateCharacter(setup.character);
  if (!charValidation.valid) {
    errors.character = charValidation.message;
  }

  const premiseValidation = validatePremise(setup.premise);
  if (!premiseValidation.valid) {
    errors.premise = premiseValidation.message;
  }

  const goalsValidation = validateGoals(setup.goals);
  if (!goalsValidation.valid) {
    errors.goals = goalsValidation.message;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate story title (Book Name) field
 * 
 * Title must be 3-80 characters (meaningful but concise).
 * 
 * @param {string} text - Story title text
 * @returns {Object} { valid: boolean, message: string }
 */
export function validateTitle(text) {
  if (!text || text.trim().length === 0) {
    return {
      valid: false,
      message: 'Every story deserves a name...',
    };
  }

  if (text.length < 3) {
    return {
      valid: false,
      message: 'A title requires at least 3 characters.',
    };
  }

  if (text.length > 80) {
    return {
      valid: false,
      message: 'Keep the title concise—under 80 characters.',
    };
  }

  return {
    valid: true,
    message: 'Title accepted.',
  };
}

/**
 * Validate story visibility setting
 * 
 * Visibility must be either 'public' or 'private'.
 * 
 * @param {string} visibility - Visibility mode ('public' or 'private')
 * @returns {Object} { valid: boolean, message: string }
 */
export function validateVisibility(visibility) {
  if (!visibility) {
    return {
      valid: false,
      message: 'Choose whether your story is shared or kept private.',
    };
  }

  if (!['public', 'private'].includes(visibility)) {
    return {
      valid: false,
      message: 'Visibility must be public or private.',
    };
  }

  return {
    valid: true,
    message: 'Visibility set.',
  };
}

/**
 * Utility: Get character count with max limit
 * For use in TextArea component character counters
 * 
 * @param {string} text - Current text
 * @param {number} max - Maximum allowed characters
 * @returns {Object} { current: number, max: number, remaining: number, percentage: number }
 */
export function getCharacterCount(text, max = 500) {
  const current = text.length;
  const remaining = max - current;
  const percentage = Math.round((current / max) * 100);

  return {
    current,
    max,
    remaining,
    percentage,
  };
}

export default {
  validateCharacter,
  validatePremise,
  validateGoals,
  validateTitle,
  validateVisibility,
  validateStorySetup,
  getCharacterCount,
};
