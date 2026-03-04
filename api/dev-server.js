/**
 * Local development server for StoryTeller Node API handlers.
 *
 * Routes requests to handler functions without Vercel infrastructure.
 * Usage: node api/dev-server.js
 */

import http from "http";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import healthHandler from "./health.js";
import exploreHandler from "./stories/explore.js";
import mineHandler from "./stories/mine.js";
import createHandler from "./stories/create.js";
import bySlugHandler from "./stories/by-slug.js";
import forkHandler from "./stories/fork.js";
import updateStoryHandler from "./stories/update-story.js";
import deleteStoryHandler from "./stories/delete-story.js";
import githubHandler from "./auth/github.js";
import meHandler from "./auth/me.js";
import callbackHandler from "./auth/callback.js";
import logoutHandler from "./auth/logout.js";

/**
 * Load environment variables from the project .env file for local development.
 *
 * Only sets variables that are not already defined in process.env,
 * allowing shell-provided values to take precedence.
 */
function loadLocalEnvFile() {
  const filename = fileURLToPath(import.meta.url);
  const dirname = path.dirname(filename);
  const envPath = path.resolve(dirname, "..", ".env");

  if (!fs.existsSync(envPath)) {
    return;
  }

  const envContent = fs.readFileSync(envPath, "utf8");
  const envLines = envContent.split(/\r?\n/);

  for (const rawLine of envLines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadLocalEnvFile();

const PORT = process.env.API_PORT || 8000;

// Route handlers map (exact paths only)
const routes = {
  "/api/health": { GET: healthHandler },
  "/api/stories/explore": { GET: exploreHandler },
  "/api/stories/mine": { GET: mineHandler },
  "/api/stories/create": { POST: createHandler },
  "/api/stories/by-slug": { GET: bySlugHandler },
  "/api/stories/fork": { POST: forkHandler },
  "/api/auth/github": { POST: githubHandler },
  "/api/auth/me": { GET: meHandler },
  "/api/auth/callback": { GET: callbackHandler },
  "/api/auth/logout": { POST: logoutHandler },
};

/**
 * Handle dynamic routes like /api/stories/:id (PUT, DELETE)
 * 
 * @param {string} urlPath - Request path
 * @param {string} method - HTTP method
 * @returns {function|null} Handler function or null if no match
 */
function getDynamicRouteHandler(urlPath, method) {
  // Pattern: /api/stories/:id with PUT or DELETE
  const storyIdMatch = urlPath.match(/^\/api\/stories\/([^/]+)$/);
  if (storyIdMatch) {
    if (method === "PUT") {
      return updateStoryHandler;
    }
    if (method === "DELETE") {
      return deleteStoryHandler;
    }
  }
  
  return null;
}

/**
 * Create and start the development HTTP server.
 */
const server = http.createServer(async (req, res) => {
  // Parse URL path (remove query string)
  const urlPath = req.url.split("?")[0];

  // Try exact path routes first
  let handler = null;
  const route = routes[urlPath];
  
  if (route) {
    // Found exact match - get handler for method
    handler = route[req.method] || (req.method === "OPTIONS" ? Object.values(route)[0] : null);
  } else {
    // Try dynamic routes (e.g., /api/stories/:id)
    handler = getDynamicRouteHandler(urlPath, req.method) ||
              (req.method === "OPTIONS" ? getDynamicRouteHandler(urlPath, "GET") : null);
  }
  
  if (!handler) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Not Found" }));
    return;
  }

  try {
    await handler(req, res);
  } catch (error) {
    console.error(`Error handling ${req.method} ${urlPath}:`, error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Internal Server Error" }));
  }
});

server.listen(PORT, () => {
  console.log(`✓ StoryTeller API running at http://localhost:${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/api/health`);
  console.log(`  Stories: http://localhost:${PORT}/api/stories/explore`);
});
