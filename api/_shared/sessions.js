/**
 * Session helpers for JWT-based auth in Node serverless.
 *
 * Handles JWT creation/verification and httpOnly session cookies.
 */

import jwt from "jsonwebtoken";
import cookie from "cookie";

/**
 * Get JWT secret.
 *
 * @returns {string} Secret key
 */
export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable not set");
  }
  return secret;
}

/**
 * Get session expiration in seconds.
 *
 * @returns {number} Expiration seconds
 */
export function getJwtExpirationSeconds() {
  return Number(process.env.JWT_EXPIRATION_SECONDS || "604800");
}

/**
 * Create a JWT session token for a user.
 *
 * @param {string} userId MongoDB ObjectId as string
 * @returns {string} JWT token
 */
export function createSessionToken(userId) {
  const secret = getJwtSecret();
  const expirationSeconds = getJwtExpirationSeconds();
  const nowSeconds = Math.floor(Date.now() / 1000);

  return jwt.sign(
    {
      user_id: String(userId),
      iat: nowSeconds,
      exp: nowSeconds + expirationSeconds,
    },
    secret,
    { algorithm: "HS256" }
  );
}

/**
 * Verify a JWT session token.
 *
 * @param {string} token JWT token
 * @returns {object} Decoded payload
 */
export function verifySessionToken(token) {
  const secret = getJwtSecret();
  return jwt.verify(token, secret, { algorithms: ["HS256"] });
}

/**
 * Attach an httpOnly session cookie to the response.
 *
 * @param {import("http").ServerResponse} res HTTP response
 * @param {string} token JWT token
 */
export function setSessionCookie(res, token) {
  const expirationSeconds = getJwtExpirationSeconds();
  const isProduction = process.env.NODE_ENV === "production";

  const cookieValue = cookie.serialize("session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    maxAge: expirationSeconds,
  });

  res.setHeader("Set-Cookie", cookieValue);
}

/**
 * Clear the session cookie.
 *
 * @param {import("http").ServerResponse} res HTTP response
 */
export function clearSessionCookie(res) {
  const cookieValue = cookie.serialize("session", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  res.setHeader("Set-Cookie", cookieValue);
}

/**
 * Extract and verify user from session cookie.
 *
 * @param {import("http").IncomingMessage} req HTTP request
 * @returns {object|null} Decoded user payload or null
 */
export function getUserFromSession(req) {
  const cookieHeader = req.headers.cookie || "";
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookie.parse(cookieHeader);
  const token = cookies.session;
  if (!token) {
    return null;
  }

  try {
    return verifySessionToken(token);
  } catch (error) {
    return null;
  }
}

/**
 * Enforce authentication on a request.
 *
 * @param {import("http").IncomingMessage} req HTTP request
 * @param {import("http").ServerResponse} res HTTP response
 * @returns {object|null} User payload if authenticated
 */
export function requireAuth(req, res) {
  const user = getUserFromSession(req);
  if (!user) {
    res.statusCode = 401;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Unauthorized" }));
    return null;
  }
  return user;
}
