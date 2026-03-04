/**
 * GitHub OAuth callback handler.
 * 
 * Exchanges a GitHub OAuth code for a session cookie.
 * Stores or updates user in MongoDB and returns session JWT.
 */

import { handleCors, sendJson, sendError } from "../_shared/http.js";
import { exchangeCodeForToken, fetchGithubUser } from "../_shared/oauth.js";
import { createSessionToken, setSessionCookie } from "../_shared/sessions.js";
import { getUsersCollection } from "../_shared/db.js";
import { validateRequired } from "../_shared/validation.js";

/**
 * Handle POST /api/auth/github.
 * 
 * Request body:
 *   - code (string, required): GitHub authorization code
 *   - state (string, required): CSRF state token
 * 
 * Response:
 *   - 200 OK with user object and session cookie
 *   - 400 if code/state missing
 *   - 500 if GitHub exchange or database error
 *
 * @param {import("http").IncomingMessage} req HTTP request
 * @param {import("http").ServerResponse} res HTTP response
 */
export default async function handler(req, res) {
  if (handleCors(req, res)) {
    return;
  }

  if (req.method !== "POST") {
    sendError(res, 405, "Method Not Allowed", "METHOD_NOT_ALLOWED");
    return;
  }

  try {
    // Parse request body
    let body = "";
    for await (const chunk of req) {
      body += chunk;
    }
    const data = JSON.parse(body);

    // Validate required fields
    const validation = validateRequired(data, ["code", "state"]);
    if (!validation.valid) {
      sendError(res, 400, validation.message, "VALIDATION_ERROR");
      return;
    }

    const { code, state } = data;

    // Exchange code for GitHub access token
    const accessToken = await exchangeCodeForToken(code);

    // Fetch GitHub user profile
    const githubUser = await fetchGithubUser(accessToken);

    // Get or create user in database
    const usersCollection = await getUsersCollection();
    const existingUser = await usersCollection.findOne({
      github_id: githubUser.github_id,
    });

    let user;
    if (existingUser) {
      // Update existing user
      const result = await usersCollection.updateOne(
        { github_id: githubUser.github_id },
        {
          $set: {
            username: githubUser.username,
            avatar_url: githubUser.avatar_url,
            email: githubUser.email,
            updated_at: new Date().toISOString(),
          },
        }
      );
      user = await usersCollection.findOne({ github_id: githubUser.github_id });
    } else {
      // Create new user
      const result = await usersCollection.insertOne({
        github_id: githubUser.github_id,
        username: githubUser.username,
        avatar_url: githubUser.avatar_url,
        email: githubUser.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      user = await usersCollection.findOne({ _id: result.insertedId });
    }

    // Create JWT session token
    const token = createSessionToken(user._id.toString());

    // Set session cookie
    setSessionCookie(res, token);

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
    console.error("GitHub auth error:", error);
    sendError(
      res,
      500,
      "Authentication failed. Please try again.",
      "AUTH_ERROR"
    );
  }
}
