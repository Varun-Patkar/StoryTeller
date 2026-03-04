/**
 * Story creation handler.
 */

import { ObjectId } from "mongodb";
import { getStoriesCollection } from "../_shared/db.js";
import { handleCors, readJsonBody, sendError, sendJson } from "../_shared/http.js";
import { requireAuth } from "../_shared/sessions.js";
import { validateStoryCreation } from "../_shared/validation.js";

/**
 * Convert a story title into a URL-safe slug base.
 *
 * @param {string} title - Story title string.
 * @returns {string} URL-safe slug base.
 */
function slugifyTitle(title) {
  if (!title || typeof title !== "string") {
    return "";
  }

  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

/**
 * Count words in a text string.
 *
 * @param {string} text - Text to count words from.
 * @returns {number} Word count.
 */
function countWords(text) {
  if (!text || typeof text !== "string") {
    return 0;
  }

  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Handle POST /api/stories/create.
 *
 * @param {import("http").IncomingMessage} req HTTP request
 * @param {import("http").ServerResponse} res HTTP response
 */
export default async function handler(req, res) {
  if (handleCors(req, res)) {
    return;
  }

  if (req.method !== "POST") {
    sendError(res, 405, "Method Not Allowed", "METHOD_NOT_ALLOWED");
    return;
  }

  const user = requireAuth(req, res);
  if (!user) {
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (error) {
    sendError(res, 400, error.message, "INVALID_JSON");
    return;
  }

  const { isValid, errors } = validateStoryCreation(body);
  if (!isValid) {
    sendError(res, 400, "Validation failed", "VALIDATION_ERROR", errors);
    return;
  }

  try {
    const now = new Date().toISOString();
    const storyId = new ObjectId();
    const slugBase = slugifyTitle(body.title);
    const slugSuffix = storyId.toString().slice(-6);
    const slug = slugBase ? `${slugBase}-${slugSuffix}` : `story-${slugSuffix}`;
    const initialWordCount = countWords(body.initial_passage.content);
    const storyDoc = {
      _id: storyId,
      storyId: String(storyId),
      slug,
      title: body.title,
      author_id: user.user_id,
      visibility: body.visibility,
      setup_context: body.setup_context,
      passages: [
        {
          id: String(new ObjectId()),
          content: body.initial_passage.content,
          created_at: now,
        },
      ],
      word_count: initialWordCount,
      original_fork_id: null,
      created_at: now,
      updated_at: now,
    };

    const storiesCol = await getStoriesCollection();
    const result = await storiesCol.insertOne(storyDoc);

    sendJson(res, 201, {
      id: String(result.insertedId),
      slug: storyDoc.slug,
      title: storyDoc.title,
      author_id: storyDoc.author_id,
      visibility: storyDoc.visibility,
      word_count: storyDoc.word_count,
      created_at: storyDoc.created_at,
      updated_at: storyDoc.updated_at,
    });
  } catch (error) {
    sendError(res, 500, "Failed to save story", "DB_ERROR");
  }
}
