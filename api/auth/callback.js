/**
 * GitHub OAuth callback handler.
 * 
 * Receives authorization code from GitHub and exchanges it for a session.
 * Sets session cookie and redirects to frontend callback page.
 */

import { handleCors, sendError } from "../_shared/http.js";
import { exchangeCodeForToken, fetchGithubUser } from "../_shared/oauth.js";
import { createSessionToken, setSessionCookie } from "../_shared/sessions.js";
import { getUsersCollection } from "../_shared/db.js";

/**
 * Handle GET /api/auth/callback?code=xxx&state=xxx
 * 
 * GitHub redirects here after user authorizes.
 * Exchanges code for token, creates session, redirects to frontend.
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
    // Parse query parameters from URL
    const url = new URL(req.url, `http://${req.headers.host}`);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");

    // Handle OAuth errors (user denied, etc)
    if (error) {
      const errorDescription = url.searchParams.get("error_description") || error;
      console.error("GitHub OAuth error:", errorDescription);
      // Redirect to frontend dashboard with error
      const baseUrl = process.env.BASE_URL || "http://localhost:5173";
      res.statusCode = 302;
      res.setHeader(
        "Location",
        `${baseUrl}/dashboard?auth_error=${encodeURIComponent(errorDescription)}`
      );
      res.end();
      return;
    }

    if (!code) {
      sendError(res, 400, "Missing authorization code", "MISSING_CODE");
      return;
    }

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
      await usersCollection.updateOne(
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

    // Redirect to frontend callback handler to finalize auth
    const baseUrl = process.env.BASE_URL || "http://localhost:5173";
    res.statusCode = 302;
    res.setHeader("Location", `${baseUrl}/auth/callback?auth=success`);
    res.end();
  } catch (error) {
    console.error("GitHub callback error:", error);
    const baseUrl = process.env.BASE_URL || "http://localhost:5173";
    res.statusCode = 302;
    res.setHeader(
      "Location",
      `${baseUrl}/dashboard?auth_error=${encodeURIComponent("Authentication failed")}`
    );
    res.end();
  }
}
