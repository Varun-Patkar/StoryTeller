/**
 * Slug generation utilities for story URLs
 * 
 * Converts story titles into URL-safe slugs with collision handling.
 * Ensures slugs are:
 * - Lowercase
 * - Hyphenated (no spaces)
 * - Alphanumeric only (special chars removed)
 * - Limited to 60 characters
 * - Unique (with numeric suffix if needed)
 * 
 * Examples:
 * - "The Dragon's Quest" → "the-dragons-quest"
 * - "My Amazing Story!!!" → "my-amazing-story"
 * - "Journey to the Center of the Earth" → "journey-to-the-center-of-the-earth"
 * 
 * @module slugify
 */

/**
 * Convert a string to a URL-safe slug
 * 
 * Process:
 * 1. Convert to lowercase
 * 2. Remove special characters (keep alphanumeric and spaces)
 * 3. Replace spaces with hyphens
 * 4. Remove consecutive hyphens
 * 5. Trim hyphens from start/end
 * 6. Truncate to 60 characters
 * 
 * @param {string} text - Input text to slugify
 * @returns {string} URL-safe slug
 */
export function slugify(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .toLowerCase() // Convert to lowercase
    .trim() // Remove leading/trailing whitespace
    .replace(/[^\w\s-]/g, '') // Remove special characters (keep alphanumeric, spaces, hyphens)
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace consecutive hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove hyphens from start/end
    .substring(0, 60); // Limit to 60 characters
}

/**
 * Generate a unique slug with collision handling
 * 
 * If the base slug already exists, appends a numeric suffix (-2, -3, etc.)
 * until a unique slug is found.
 * 
 * Examples:
 * - "my-story" exists → returns "my-story-2"
 * - "my-story" and "my-story-2" exist → returns "my-story-3"
 * 
 * @param {string} text - Input text to slugify
 * @param {Array<string>} existingSlugs - Array of slugs that already exist
 * @returns {string} Unique URL-safe slug
 */
export function generateUniqueSlug(text, existingSlugs = []) {
  const baseSlug = slugify(text);
  
  if (!baseSlug) {
    // Fallback if slug is empty after processing
    return `story-${Date.now()}`;
  }

  // Check if base slug is unique
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  // Find unique suffix
  let suffix = 2;
  let candidateSlug = `${baseSlug}-${suffix}`;
  
  while (existingSlugs.includes(candidateSlug)) {
    suffix++;
    candidateSlug = `${baseSlug}-${suffix}`;
    
    // Safety limit to prevent infinite loop
    if (suffix > 1000) {
      // Extremely unlikely, but use timestamp as fallback
      return `${baseSlug}-${Date.now()}`;
    }
  }

  return candidateSlug;
}

/**
 * Validate if a string is a valid slug
 * 
 * Valid slug rules:
 * - Only lowercase letters, numbers, and hyphens
 * - No spaces or special characters
 * - Not empty
 * - Max 60 characters
 * - No leading/trailing hyphens
 * - No consecutive hyphens
 * 
 * @param {string} slug - Slug to validate
 * @returns {boolean} True if valid slug format
 */
export function isValidSlug(slug) {
  if (!slug || typeof slug !== 'string') {
    return false;
  }

  // Check length
  if (slug.length === 0 || slug.length > 60) {
    return false;
  }

  // Check format (only lowercase alphanumeric and hyphens)
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return false;
  }

  // Check for leading/trailing hyphens
  if (slug.startsWith('-') || slug.endsWith('-')) {
    return false;
  }

  // Check for consecutive hyphens
  if (slug.includes('--')) {
    return false;
  }

  return true;
}

/**
 * Extract story ID from a slug
 * 
 * If slug format is "title-{id}", extracts the numeric ID.
 * Otherwise returns null.
 * 
 * Note: This is a helper for future use if we decide to embed
 * story IDs in slugs for faster lookup.
 * 
 * @param {string} slug - Slug to parse
 * @returns {string|null} Extracted ID or null
 */
export function extractIdFromSlug(slug) {
  if (!isValidSlug(slug)) {
    return null;
  }

  // Check if slug ends with -{numeric}
  const match = slug.match(/-(\d+)$/);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}
