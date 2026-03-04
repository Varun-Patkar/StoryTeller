/**
 * HTTP helpers for Node serverless handlers.
 */

/**
 * Apply CORS headers and handle preflight.
 *
 * @param {import("http").IncomingMessage} req HTTP request
 * @param {import("http").ServerResponse} res HTTP response
 * @returns {boolean} True if preflight was handled
 */
export function handleCors(req, res) {
  const requestOrigin = req.headers.origin;
  const configuredOrigins = (process.env.CORS_ALLOWED_ORIGINS || "http://localhost:5173,http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const fallbackOrigin = configuredOrigins[0] || "http://localhost:5173";
  const origin = requestOrigin && configuredOrigins.includes(requestOrigin)
    ? requestOrigin
    : fallbackOrigin;

  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return true;
  }

  return false;
}

/**
 * Send a JSON response.
 *
 * @param {import("http").ServerResponse} res HTTP response
 * @param {number} status HTTP status
 * @param {object} payload JSON payload
 */
export function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

/**
 * Send a standardized error response.
 *
 * @param {import("http").ServerResponse} res HTTP response
 * @param {number} status HTTP status
 * @param {string} message Error message
 * @param {string} code Error code
 * @param {object} details Optional error details
 */
export function sendError(res, status, message, code = "UNKNOWN_ERROR", details = null) {
  const payload = { error: message, code };
  if (details) {
    payload.details = details;
  }
  sendJson(res, status, payload);
}

/**
 * Read and parse JSON request body.
 *
 * @param {import("http").IncomingMessage} req HTTP request
 * @returns {Promise<object>} Parsed JSON body
 */
export function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("Invalid JSON in request body"));
      }
    });
    req.on("error", (error) => {
      reject(error);
    });
  });
}
