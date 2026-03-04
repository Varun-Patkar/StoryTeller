/**
 * Fetch a story by slug or ObjectId string.
 */
import { ObjectId } from "mongodb";
import { getStoriesCollection } from "../_shared/db.js";
import { handleCors, sendError, sendJson } from "../_shared/http.js";

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
 * Handle GET /api/stories/by-slug.
 *
 * @param {import("http").IncomingMessage} req HTTP request
 * @param {import("http").ServerResponse} res HTTP response
 */
export default async function handler(req, res) {
  if (handleCors(req, res)) {
    return;
  }

  if (req.method !== "GET") {
    sendError(res, 405, "Method Not Allowed", "METHOD_NOT_ALLOWED");
    return;
  }

  const url = new URL(req.url, "http://localhost");
  const slug = String(url.searchParams.get("slug") || "").trim();
  if (!slug) {
    sendError(res, 400, "Slug is required", "VALIDATION_ERROR");
    return;
  }

  try {
    const storiesCol = await getStoriesCollection();
    let story = null;

    if (ObjectId.isValid(slug)) {
      story = await storiesCol.findOne({ _id: new ObjectId(slug) });
    }

    if (!story) {
      story = await storiesCol.findOne({ slug });
    }

    if (!story) {
      sendError(res, 404, "Story not found", "NOT_FOUND");
      return;
    }

    const passages = (story.passages || []).map((passage, index) => ({
      id: passage.id || `${story._id}-${index}`,
      text: passage.content || "",
      choices: [],
      selectedChoiceId: null,
      selectedResponseText: null,
      displayedAt: passage.created_at || story.created_at,
    }));

    const storedWordCount = Number(story.word_count || 0);
    const wordCount = storedWordCount || passages.reduce((sum, passage) => {
      return sum + countWords(passage.text);
    }, 0);

    sendJson(res, 200, {
      id: String(story._id),
      slug: story.slug || String(story._id),
      title: story.title,
      author_id: story.author_id,
      visibility: story.visibility,
      setup_context: story.setup_context,
      fandom: story.setup_context?.fandom || "Unknown",
      passages,
      wordCount,
      created_at: story.created_at,
      updated_at: story.updated_at,
    });
  } catch (error) {
    sendError(res, 500, "Failed to fetch story", "DB_ERROR");
  }
}
