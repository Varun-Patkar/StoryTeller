/**
 * Current user endpoint.
 * 
 * Returns the authenticated user from session cookie,
 * or null if not authenticated.
 */

import { handleCors, sendJson, sendError } from "../_shared/http.js";
import { getUserFromSession } from "../_shared/sessions.js";
import { getUsersCollection } from "../_shared/db.js";
import { ObjectId } from "mongodb";

/**
 * Handle GET /api/auth/me.
 * 
 * Returns the currently authenticated user from session cookie.
 * 
 * Response:
 *   - 200 OK with user object (or null if not authenticated)
 *   - 500 if database error
 *
 * @param {import("http").IncomingMessage} req HTTP request
 * @param {import("http").ServerResponse} res HTTP response
 */
export default async function handler(req, res) {
  if (handleCors(req, res)) {
    return;
  }

  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method Not Allowed" });
    return;
  }

  try {
    // Extract user from session cookie
    const sessionUser = getUserFromSession(req);

    if (!sessionUser) {
      // Not authenticated - return null user
      sendJson(res, 200, { user: null });
      return;
    }

    // Fetch full user data from database
    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne({
      _id: new ObjectId(sessionUser.user_id),
    });

    if (!user) {
      // Session exists but user not found - return null
      sendJson(res, 200, { user: null });
      return;
    }

    // Return user data (excluding sensitive fields)
    sendJson(res, 200, {
      user: {
        id: user._id.toString(),
        github_id: user.github_id,
        username: user.username,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error("Auth me error:", error);
    sendError(res, 500, "Failed to fetch user", "DB_ERROR");
  }
}
