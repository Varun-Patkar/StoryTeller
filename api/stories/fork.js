/**
 * Story forking handler.
 * 
 * Creates a forked copy of a public story when a different user responds.
 * Preserves original passage history and adds the new user response.
 */

import { ObjectId } from "mongodb";
import { getStoriesCollection, getUsersCollection } from "../_shared/db.js";
import { handleCors, readJsonBody, sendError, sendJson } from "../_shared/http.js";
import { requireAuth } from "../_shared/sessions.js";

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
 * Count total words in all passage contents.
 *
 * @param {Array} passages - Array of passage objects.
 * @returns {number} Total word count.
 */
function countTotalWords(passages) {
  if (!Array.isArray(passages)) {
    return 0;
  }

  return passages.reduce((total, passage) => {
    if (!passage.content || typeof passage.content !== "string") {
      return total;
    }
    const words = passage.content.trim().split(/\s+/).filter(Boolean).length;
    return total + words;
  }, 0);
}

/**
 * Handle POST /api/stories/fork.
 * 
 * Validates that:
 * - Story exists and is public
 * - Requester is not the original author
 * - Response content is valid
 * 
 * Creates forked story with:
 * - Title: "{Original Title} - {Username}"
 * - Visibility: private
 * - Copied passage history + new user response
 * - Reference to original via original_fork_id
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

  // Validate request body
  if (!body.story_id || typeof body.story_id !== "string") {
    sendError(res, 400, "story_id is required", "VALIDATION_ERROR");
    return;
  }

  const hasResponseContent =
    body.response &&
    typeof body.response === "object" &&
    typeof body.response.content === "string" &&
    body.response.content.trim().length > 0;


  try {
    const storiesCol = await getStoriesCollection();
    const usersCol = await getUsersCollection();

    // Fetch original story
    let originalStory;
    try {
      if (ObjectId.isValid(body.story_id)) {
        originalStory = await storiesCol.findOne({ _id: new ObjectId(body.story_id) });
      }
      if (!originalStory) {
        originalStory = await storiesCol.findOne({ slug: body.story_id });
      }
    } catch (err) {
      console.error("Story lookup error:", err);
    }

    if (!originalStory) {
      sendError(res, 404, "Story not found", "NOT_FOUND");
      return;
    }

    // Validate story is public
    if (originalStory.visibility !== "public") {
      sendError(res, 400, "Cannot fork a private story", "STORY_NOT_PUBLIC");
      return;
    }

    // Validate requester is not the original author
    if (originalStory.author_id === user.user_id) {
      sendError(res, 400, "Cannot fork your own story", "CANNOT_FORK_OWN_STORY");
      return;
    }

    // Fetch user information for fork title
    const currentUser = await usersCol.findOne({ _id: new ObjectId(user.user_id) });
    if (!currentUser) {
      sendError(res, 500, "User not found", "USER_NOT_FOUND");
      return;
    }

    const now = new Date().toISOString();
    const forkId = new ObjectId();
    
    // Generate fork title: "{Original Title} - {Username}"
    const forkTitle = `${originalStory.title} - ${currentUser.username}`;
    const slugBase = slugifyTitle(forkTitle);
    const slugSuffix = forkId.toString().slice(-6);
    const slug = slugBase ? `${slugBase}-${slugSuffix}` : `story-${slugSuffix}`;

    // Copy all passages and add new user response
    const copiedPassages = (originalStory.passages || []).map(p => ({
      id: String(new ObjectId()),
      content: p.content,
      created_at: p.created_at,
    }));

    const forkedPassages = hasResponseContent
      ? [
          ...copiedPassages,
          {
            id: String(new ObjectId()),
            content: body.response.content.trim(),
            created_at: now,
          },
        ]
      : copiedPassages;
    const totalWordCount = countTotalWords(forkedPassages);

    // Create forked story document
    const forkDoc = {
      _id: forkId,
      storyId: String(forkId),
      slug,
      title: forkTitle,
      author_id: user.user_id,
      visibility: "private", // Forks are always private initially
      setup_context: originalStory.setup_context,
      passages: forkedPassages,
      word_count: totalWordCount,
      original_fork_id: String(originalStory._id),
      created_at: now,
      updated_at: now,
    };

    const result = await storiesCol.insertOne(forkDoc);

    sendJson(res, 201, {
      id: String(result.insertedId),
      slug: forkDoc.slug,
      title: forkDoc.title,
      author_id: forkDoc.author_id,
      visibility: forkDoc.visibility,
      original_fork_id: forkDoc.original_fork_id,
      word_count: forkDoc.word_count,
      created_at: forkDoc.created_at,
      updated_at: forkDoc.updated_at,
    });
  } catch (error) {
    console.error("Fork creation error:", error);
    sendError(res, 500, "Failed to fork story", "DB_ERROR");
  }
}
