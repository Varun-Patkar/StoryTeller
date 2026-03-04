/**
 * Logout endpoint.
 * 
 * Clears the session cookie to log out the user.
 */

import { handleCors, sendJson, sendError } from "../_shared/http.js";
import { clearSessionCookie } from "../_shared/sessions.js";

/**
 * Handle POST /api/auth/logout.
 * 
 * Clears the session cookie and returns success.
 * 
 * Response:
 *   - 200 OK with logout confirmation
 *   - 405 for non-POST methods
 *
 * @param {import("http").IncomingMessage} req HTTP request
 * @param {import("http").ServerResponse} res HTTP response
 */
export default function handler(req, res) {
  if (handleCors(req, res)) {
    return;
  }

  if (req.method !== "POST") {
    sendError(res, 405, "Method Not Allowed", "METHOD_NOT_ALLOWED");
    return;
  }

  // Clear session cookie
  clearSessionCookie(res);

  sendJson(res, 200, { message: "Logged out successfully" });
}
