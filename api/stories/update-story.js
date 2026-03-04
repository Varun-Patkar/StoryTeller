/**
 * Update a story by ID or slug.
 * 
 * Supports updating passages, visibility, title, and other story fields.
 * Used for cleanup of incomplete passages, changing visibility, etc.
 * 
 * Requires authentication and story ownership.
 */

import { ObjectId } from "mongodb";
import { getStoriesCollection } from "../_shared/db.js";
import { handleCors, readJsonBody, sendError, sendJson } from "../_shared/http.js";
import { requireAuth } from "../_shared/sessions.js";

/**
 * Handle PUT /api/stories/:id.
 *
 * @param {import("http").IncomingMessage} req HTTP request
 * @param {import("http").ServerResponse} res HTTP response
 */
export default async function handler(req, res) {
  if (handleCors(req, res)) {
    return;
  }

  if (req.method !== "PUT") {
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

  let body;
  try {
    body = await readJsonBody(req);
  } catch (error) {
    sendError(res, 400, error.message, "INVALID_JSON");
    return;
  }

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
      sendError(res, 403, "You can only update your own stories", "FORBIDDEN");
      return;
    }

    // Build update object with provided fields
    const updateData = {
      updated_at: new Date().toISOString(),
    };

    // Update passages if provided
    if (body.passages && Array.isArray(body.passages)) {
      updateData.passages = body.passages;
      // Recalculate word count
      updateData.word_count = body.passages.reduce((total, p) => {
        const words = (p.content || p.text || "").trim().split(/\s+/).filter(Boolean).length;
        return total + words;
      }, 0);
    }

    // Update visibility if provided
    if (body.visibility && ['public', 'private'].includes(body.visibility)) {
      updateData.visibility = body.visibility;
    }

    // Update title if provided
    if (body.title && typeof body.title === 'string' && body.title.trim()) {
      updateData.title = body.title.trim();
    }

    // Perform the update
    const updateResult = await storiesCol.updateOne(
      { _id: story._id },
      { $set: updateData }
    );

    if (updateResult.modifiedCount === 0) {
      sendError(res, 500, "Failed to update story", "UPDATE_FAILED");
      return;
    }

    // Fetch updated story
    const updatedStory = await storiesCol.findOne({ _id: story._id });

    sendJson(res, 200, {
      id: String(updatedStory._id),
      slug: updatedStory.slug,
      title: updatedStory.title,
      visibility: updatedStory.visibility,
      passages: updatedStory.passages || [],
      updated_at: updatedStory.updated_at,
    });
  } catch (error) {
    console.error("Update story error:", error);
    sendError(res, 500, "Failed to update story", "DB_ERROR");
  }
}
