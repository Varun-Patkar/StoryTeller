/**
 * Public stories listing handler.
 */

import { ObjectId } from "mongodb";
import { getStoriesCollection, getUsersCollection } from "../_shared/db.js";
import { handleCors, sendError, sendJson } from "../_shared/http.js";

/**
 * Handle GET /api/stories/explore.
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

  try {
    const url = new URL(req.url, "http://localhost");
    const limit = Math.min(Number(url.searchParams.get("limit") || "10"), 50);
    const offset = Number(url.searchParams.get("offset") || "0");

    const storiesCol = await getStoriesCollection();
    const usersCol = await getUsersCollection();
    
    const stories = await storiesCol
      .find(
        { visibility: "public" },
        {
          projection: {
            _id: 1,
            slug: 1,
            title: 1,
            author_id: 1,
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

    // Fetch author information for all stories
    const authorIds = [...new Set(stories.map(s => s.author_id))];
    
    // Convert string IDs to ObjectIds for querying
    const authorObjectIds = authorIds
      .map(id => {
        try {
          return new ObjectId(id);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    
    const authors = await usersCol
      .find(
        { _id: { $in: authorObjectIds } },
        { projection: { _id: 1, username: 1, avatar_url: 1 } }
      )
      .toArray();

    // Map using stringified _id to match author_id strings in stories
    const authorMap = new Map(authors.map(a => [a._id.toString(), a]));

    const result = stories.map((story) => {
      const author = authorMap.get(story.author_id);
      return {
        id: String(story._id),
        slug: story.slug || String(story._id),
        title: story.title,
        author_id: story.author_id,
        author_name: author?.username || "Unknown",
        author_avatar: author?.avatar_url || null,
        fandom: story.setup_context?.fandom || "Unknown",
        wordCount: Number(story.word_count || 0),
        lastModified: story.updated_at,
        created_at: story.created_at,
        updated_at: story.updated_at,
      };
    });

    sendJson(res, 200, { stories: result });
  } catch (error) {
    sendError(
      res,
      500,
      "Failed to fetch stories",
      "DB_ERROR",
      { message: error instanceof Error ? error.message : String(error) }
    );
  }
}
