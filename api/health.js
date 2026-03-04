/**
 * Health check endpoint for StoryTeller Node API.
 */

import { handleCors, sendJson } from "./_shared/http.js";

/**
 * Handle GET /api/health.
 *
 * @param {import("http").IncomingMessage} req HTTP request
 * @param {import("http").ServerResponse} res HTTP response
 */
export default function handler(req, res) {
  if (handleCors(req, res)) {
    return;
  }

  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method Not Allowed" });
    return;
  }

  sendJson(res, 200, {
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "StoryTeller API",
  });
}
