/**
 * User stories listing handler.
 */

import { getStoriesCollection } from "../_shared/db.js";
import { handleCors, sendError, sendJson } from "../_shared/http.js";
import { requireAuth } from "../_shared/sessions.js";

/**
 * Handle GET /api/stories/mine.
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

  const user = requireAuth(req, res);
  if (!user) {
    return;
  }

  try {
    const url = new URL(req.url, "http://localhost");
    const limit = Math.min(Number(url.searchParams.get("limit") || "10"), 50);
    const offset = Number(url.searchParams.get("offset") || "0");

    const storiesCol = await getStoriesCollection();
    const stories = await storiesCol
      .find(
        { author_id: user.user_id },
        {
          projection: {
            _id: 1,
            slug: 1,
            title: 1,
            visibility: 1,
            setup_context: 1,
            word_count: 1,
            created_at: 1,
            updated_at: 1,
          },
        }
      )
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    const result = stories.map((story) => ({
      id: String(story._id),
      slug: story.slug || String(story._id),
      title: story.title,
      visibility: story.visibility,
      fandom: story.setup_context?.fandom || "Unknown",
      wordCount: Number(story.word_count || 0),
      lastModified: story.updated_at,
      created_at: story.created_at,
      updated_at: story.updated_at,
    }));

    sendJson(res, 200, { stories: result });
  } catch (error) {
    sendError(res, 500, "Failed to fetch your stories", "DB_ERROR");
  }
}
