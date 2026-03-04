/**
 * Delete a story by ID or slug.
 * 
 * Only story owners can delete their stories.
 * Once deleted, the story cannot be recovered.
 */

import { ObjectId } from "mongodb";
import { getStoriesCollection } from "../_shared/db.js";
import { handleCors, sendError, sendJson } from "../_shared/http.js";
import { requireAuth } from "../_shared/sessions.js";

/**
 * Handle DELETE /api/stories/:id.
 *
 * @param {import("http").IncomingMessage} req HTTP request
 * @param {import("http").ServerResponse} res HTTP response
 */
export default async function handler(req, res) {
  if (handleCors(req, res)) {
    return;
  }

  if (req.method !== "DELETE") {
    sendError(res, 405, "Method Not Allowed", "METHOD_NOT_ALLOWED");
    return;
  }

  const user = requireAuth(req, res);
  if (!user) {
    return;
  }

  // Extract story ID from URL
  const url = new URL(req.url, "http://localhost");
  const pathMatch = url.pathname.match(/\/api\/stories\/([^/]+)$/);
  if (!pathMatch || !pathMatch[1]) {
    sendError(res, 400, "Story ID is required", "VALIDATION_ERROR");
    return;
  }

  const storyIdParam = pathMatch[1];

  try {
    const storiesCol = await getStoriesCollection();

    // Find story by ID or slug
    let story;
    if (ObjectId.isValid(storyIdParam)) {
      story = await storiesCol.findOne({ _id: new ObjectId(storyIdParam) });
    }
    if (!story) {
      story = await storiesCol.findOne({ slug: storyIdParam });
    }

    if (!story) {
      sendError(res, 404, "Story not found", "NOT_FOUND");
      return;
    }

    // Verify user owns the story
    if (story.author_id !== user.user_id) {
      sendError(res, 403, "You can only delete your own stories", "FORBIDDEN");
      return;
    }

    // Delete the story
    const deleteResult = await storiesCol.deleteOne({ _id: story._id });

    if (deleteResult.deletedCount === 0) {
      sendError(res, 500, "Failed to delete story", "DELETE_FAILED");
      return;
    }

    sendJson(res, 200, {
      id: String(story._id),
      slug: story.slug,
      title: story.title,
      deleted_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Delete story error:", error);
    sendError(res, 500, "Failed to delete story", "DB_ERROR");
  }
}
