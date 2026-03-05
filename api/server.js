/**
 * Consolidated Express server for StoryTeller API.
 * 
 * Consolidates all endpoint handlers into a single serverless function.
 * Routes:
 * - GET  /api/health
 * - POST /api/auth/github
 * - GET  /api/auth/callback
 * - POST /api/auth/logout
 * - GET  /api/auth/me
 * - POST /api/stories/create
 * - GET  /api/stories/mine
 * - GET  /api/stories/explore
 * - GET  /api/stories/by-slug
 * - POST /api/stories/fork
 * - PUT  /api/stories/:id
 * - DELETE /api/stories/:id
 */

import express from "express";
import { ObjectId } from "mongodb";
import { handleCors, readJsonBody, sendJson, sendError } from "./_shared/http.js";
import { exchangeCodeForToken, fetchGithubUser } from "./_shared/oauth.js";
import { createSessionToken, setSessionCookie, clearSessionCookie, getUserFromSession, requireAuth } from "./_shared/sessions.js";
import { getStoriesCollection, getUsersCollection } from "./_shared/db.js";
import { validateStoryCreation, validateRequired } from "./_shared/validation.js";

const app = express();

// Middleware to parse JSON
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;
  
  // Build array of allowed origins
  let configuredOrigins = (process.env.CORS_ALLOWED_ORIGINS || "http://localhost:5173,http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  
  // Add BASE_URL if configured (for Vercel frontend)
  if (process.env.BASE_URL) {
    const baseUrl = process.env.BASE_URL.replace(/\/$/, ""); // Remove trailing slash
    if (!configuredOrigins.includes(baseUrl)) {
      configuredOrigins.push(baseUrl);
    }
  }

  const fallbackOrigin = configuredOrigins[0] || "http://localhost:5173";
  const origin = requestOrigin && configuredOrigins.includes(requestOrigin)
    ? requestOrigin
    : fallbackOrigin;

  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  next();
});

// Utility functions
/**
 * Convert a story title into a URL-safe slug base.
 */
function slugifyTitle(title) {
  if (!title || typeof title !== "string") {
    return "";
  }

  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

/**
 * Count words in a text string.
 */
function countWords(text) {
  if (!text || typeof text !== "string") {
    return 0;
  }

  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Count total words in all passage contents.
 */
function countTotalWords(passages) {
  if (!Array.isArray(passages)) {
    return 0;
  }

  return passages.reduce((total, passage) => {
    if (!passage.content || typeof passage.content !== "string") {
      return total;
    }
    const words = passage.content.trim().split(/\s+/).filter(Boolean).length;
    return total + words;
  }, 0);
}

/**
 * Auth middleware wrapper for Express.
 */
function authMiddleware(req, res, next) {
  const user = getUserFromSession(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
  }
  req.user = user;
  next();
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * GET /api/health
 */
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "StoryTeller API",
  });
});

// ============================================================================
// AUTH ROUTES
// ============================================================================

/**
 * POST /api/auth/github
 * Exchanges GitHub code for session token
 */
app.post("/api/auth/github", async (req, res) => {
  try {
    const { code, state } = req.body;

    const validation = validateRequired({ code, state }, ["code", "state"]);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.message, code: "VALIDATION_ERROR" });
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

    // Return user data
    res.json({
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
    res.status(500).json({ error: "Authentication failed. Please try again.", code: "AUTH_ERROR" });
  }
});

/**
 * GET /api/auth/callback?code=xxx&state=xxx
 * Receives authorization code from GitHub and redirects
 */
app.get("/api/auth/callback", async (req, res) => {
  try {
    const { code, error, error_description } = req.query;

    // Handle OAuth errors
    if (error) {
      const errorMsg = error_description || error;
      console.error("GitHub OAuth error:", errorMsg);
      const baseUrl = process.env.BASE_URL || "http://localhost:5173";
      return res.redirect(`${baseUrl}/dashboard?auth_error=${encodeURIComponent(errorMsg)}`);
    }

    if (!code) {
      return res.status(400).json({ error: "Missing authorization code", code: "MISSING_CODE" });
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

    // Redirect to frontend callback handler
    const baseUrl = process.env.BASE_URL || "http://localhost:5173";
    res.redirect(`${baseUrl}/auth/callback?auth=success`);
  } catch (error) {
    console.error("GitHub callback error:", error);
    const baseUrl = process.env.BASE_URL || "http://localhost:5173";
    res.redirect(`${baseUrl}/dashboard?auth_error=${encodeURIComponent("Authentication failed")}`);
  }
});

/**
 * POST /api/auth/logout
 */
app.post("/api/auth/logout", (req, res) => {
  clearSessionCookie(res);
  res.json({ message: "Logged out successfully" });
});

/**
 * GET /api/auth/me
 */
app.get("/api/auth/me", async (req, res) => {
  try {
    const sessionUser = getUserFromSession(req);

    if (!sessionUser) {
      return res.json({ user: null });
    }

    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne({
      _id: new ObjectId(sessionUser.user_id),
    });

    if (!user) {
      return res.json({ user: null });
    }

    res.json({
      user: {
        id: user._id.toString(),
        github_id: user.github_id,
        username: user.username,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ error: "Failed to fetch user", code: "DB_ERROR" });
  }
});

// ============================================================================
// STORY ROUTES
// ============================================================================

/**
 * POST /api/stories/create
 */
app.post("/api/stories/create", authMiddleware, async (req, res) => {
  try {
    const { isValid, errors } = validateStoryCreation(req.body);
    if (!isValid) {
      return res.status(400).json({ error: "Validation failed", code: "VALIDATION_ERROR", details: errors });
    }

    const now = new Date().toISOString();
    const storyId = new ObjectId();
    const slugBase = slugifyTitle(req.body.title);
    const slugSuffix = storyId.toString().slice(-6);
    const slug = slugBase ? `${slugBase}-${slugSuffix}` : `story-${slugSuffix}`;
    const initialWordCount = countWords(req.body.initial_passage.content);

    const storyDoc = {
      _id: storyId,
      storyId: String(storyId),
      slug,
      title: req.body.title,
      author_id: req.user.user_id,
      visibility: req.body.visibility,
      setup_context: req.body.setup_context,
      passages: [
        {
          id: String(new ObjectId()),
          content: req.body.initial_passage.content,
          created_at: now,
        },
      ],
      word_count: initialWordCount,
      original_fork_id: null,
      created_at: now,
      updated_at: now,
    };

    const storiesCol = await getStoriesCollection();
    const result = await storiesCol.insertOne(storyDoc);

    res.status(201).json({
      id: String(result.insertedId),
      slug: storyDoc.slug,
      title: storyDoc.title,
      author_id: storyDoc.author_id,
      visibility: storyDoc.visibility,
      word_count: storyDoc.word_count,
      created_at: storyDoc.created_at,
      updated_at: storyDoc.updated_at,
    });
  } catch (error) {
    console.error("Create story error:", error);
    res.status(500).json({ error: "Failed to save story", code: "DB_ERROR" });
  }
});

/**
 * GET /api/stories/mine?limit=10&offset=0
 */
app.get("/api/stories/mine", authMiddleware, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || "10"), 50);
    const offset = Number(req.query.offset || "0");

    const storiesCol = await getStoriesCollection();
    const stories = await storiesCol
      .find(
        { author_id: req.user.user_id },
        {
          projection: {
            _id: 1,
            slug: 1,
            title: 1,
            visibility: 1,
            setup_context: 1,
            word_count: 1,
            created_at: 1,
            updated_at: 1,
          },
        }
      )
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    const result = stories.map((story) => ({
      id: String(story._id),
      slug: story.slug || String(story._id),
      title: story.title,
      visibility: story.visibility,
      fandom: story.setup_context?.fandom || "Unknown",
      wordCount: Number(story.word_count || 0),
      lastModified: story.updated_at,
      created_at: story.created_at,
      updated_at: story.updated_at,
    }));

    res.json({ stories: result });
  } catch (error) {
    console.error("Fetch user stories error:", error);
    res.status(500).json({ error: "Failed to fetch your stories", code: "DB_ERROR" });
  }
});

/**
 * GET /api/stories/explore?limit=10&offset=0
 */
app.get("/api/stories/explore", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || "10"), 50);
    const offset = Number(req.query.offset || "0");

    const storiesCol = await getStoriesCollection();
    const usersCol = await getUsersCollection();

    const stories = await storiesCol
      .find(
        { visibility: "public" },
        {
          projection: {
            _id: 1,
            slug: 1,
            title: 1,
            author_id: 1,
            setup_context: 1,
            word_count: 1,
            created_at: 1,
            updated_at: 1,
          },
        }
      )
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    // Fetch author information for all stories
    const authorIds = [...new Set(stories.map((s) => s.author_id))];

    // Convert string IDs to ObjectIds for querying
    const authorObjectIds = authorIds
      .map((id) => {
        try {
          return new ObjectId(id);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    const authors = await usersCol
      .find(
        { _id: { $in: authorObjectIds } },
        { projection: { _id: 1, username: 1, avatar_url: 1 } }
      )
      .toArray();

    // Map using stringified _id to match author_id strings in stories
    const authorMap = new Map(authors.map((a) => [a._id.toString(), a]));

    const result = stories.map((story) => {
      const author = authorMap.get(story.author_id);
      return {
        id: String(story._id),
        slug: story.slug || String(story._id),
        title: story.title,
        author_id: story.author_id,
        author_name: author?.username || "Unknown",
        author_avatar: author?.avatar_url || null,
        fandom: story.setup_context?.fandom || "Unknown",
        wordCount: Number(story.word_count || 0),
        lastModified: story.updated_at,
        created_at: story.created_at,
        updated_at: story.updated_at,
      };
    });

    res.json({ stories: result });
  } catch (error) {
    console.error("Explore stories error:", error);
    res.status(500).json({ error: "Failed to fetch stories", code: "DB_ERROR" });
  }
});

/**
 * GET /api/stories/by-slug?slug=xxx
 */
app.get("/api/stories/by-slug", async (req, res) => {
  try {
    const slug = String(req.query.slug || "").trim();
    if (!slug) {
      return res.status(400).json({ error: "Slug is required", code: "VALIDATION_ERROR" });
    }

    const storiesCol = await getStoriesCollection();
    let story = null;

    if (ObjectId.isValid(slug)) {
      story = await storiesCol.findOne({ _id: new ObjectId(slug) });
    }

    if (!story) {
      story = await storiesCol.findOne({ slug });
    }

    if (!story) {
      return res.status(404).json({ error: "Story not found", code: "NOT_FOUND" });
    }

    const passages = (story.passages || []).map((passage, index) => ({
      id: passage.id || `${story._id}-${index}`,
      text: passage.content || "",
      choices: [],
      selectedChoiceId: null,
      selectedResponseText: null,
      displayedAt: passage.created_at || story.created_at,
    }));

    const storedWordCount = Number(story.word_count || 0);
    const wordCount = storedWordCount || passages.reduce((sum, passage) => {
      return sum + countWords(passage.text);
    }, 0);

    res.json({
      id: String(story._id),
      slug: story.slug || String(story._id),
      title: story.title,
      author_id: story.author_id,
      visibility: story.visibility,
      setup_context: story.setup_context,
      fandom: story.setup_context?.fandom || "Unknown",
      passages,
      wordCount,
      created_at: story.created_at,
      updated_at: story.updated_at,
    });
  } catch (error) {
    console.error("Fetch story error:", error);
    res.status(500).json({ error: "Failed to fetch story", code: "DB_ERROR" });
  }
});

/**
 * POST /api/stories/fork
 * Forks a public story with optional user response
 */
app.post("/api/stories/fork", authMiddleware, async (req, res) => {
  try {
    if (!req.body.story_id || typeof req.body.story_id !== "string") {
      return res.status(400).json({ error: "story_id is required", code: "VALIDATION_ERROR" });
    }

    const hasResponseContent =
      req.body.response &&
      typeof req.body.response === "object" &&
      typeof req.body.response.content === "string" &&
      req.body.response.content.trim().length > 0;

    const storiesCol = await getStoriesCollection();
    const usersCol = await getUsersCollection();

    // Fetch original story
    let originalStory;
    try {
      if (ObjectId.isValid(req.body.story_id)) {
        originalStory = await storiesCol.findOne({ _id: new ObjectId(req.body.story_id) });
      }
      if (!originalStory) {
        originalStory = await storiesCol.findOne({ slug: req.body.story_id });
      }
    } catch (err) {
      console.error("Story lookup error:", err);
    }

    if (!originalStory) {
      return res.status(404).json({ error: "Story not found", code: "NOT_FOUND" });
    }

    // Validate story is public
    if (originalStory.visibility !== "public") {
      return res.status(400).json({ error: "Cannot fork a private story", code: "STORY_NOT_PUBLIC" });
    }

    // Validate requester is not the original author
    if (originalStory.author_id === req.user.user_id) {
      return res.status(400).json({ error: "Cannot fork your own story", code: "CANNOT_FORK_OWN_STORY" });
    }

    // Fetch user information for fork title
    const currentUser = await usersCol.findOne({ _id: new ObjectId(req.user.user_id) });
    if (!currentUser) {
      return res.status(500).json({ error: "User not found", code: "USER_NOT_FOUND" });
    }

    const now = new Date().toISOString();
    const forkId = new ObjectId();

    // Build forked passages: copy original + optionally add user response
    const forkedPassages = [...(originalStory.passages || [])];
    if (hasResponseContent) {
      forkedPassages.push({
        id: String(new ObjectId()),
        content: req.body.response.content.trim(),
        created_at: now,
      });
    }

    const slugBase = slugifyTitle(originalStory.title);
    const slugSuffix = forkId.toString().slice(-6);
    const forkSlug = slugBase ? `${slugBase}-${slugSuffix}` : `story-${slugSuffix}`;

    const forkedDoc = {
      _id: forkId,
      storyId: String(forkId),
      slug: forkSlug,
      title: `${originalStory.title} - ${currentUser.username}`,
      author_id: req.user.user_id,
      visibility: "private",
      setup_context: originalStory.setup_context,
      passages: forkedPassages,
      word_count: countTotalWords(forkedPassages),
      original_fork_id: String(originalStory._id),
      created_at: now,
      updated_at: now,
    };

    const result = await storiesCol.insertOne(forkedDoc);

    res.status(201).json({
      id: String(result.insertedId),
      slug: forkedDoc.slug,
      title: forkedDoc.title,
      author_id: forkedDoc.author_id,
      visibility: forkedDoc.visibility,
      word_count: forkedDoc.word_count,
      created_at: forkedDoc.created_at,
    });
  } catch (error) {
    console.error("Fork story error:", error);
    res.status(500).json({ error: "Failed to fork story", code: "DB_ERROR" });
  }
});

/**
 * PUT /api/stories/:id
 */
app.put("/api/stories/:id", authMiddleware, async (req, res) => {
  try {
    const storyIdParam = req.params.id;

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
      return res.status(404).json({ error: "Story not found", code: "NOT_FOUND" });
    }

    // Verify user owns the story
    if (story.author_id !== req.user.user_id) {
      return res.status(403).json({ error: "You can only update your own stories", code: "FORBIDDEN" });
    }

    // Build update object with provided fields
    const updateData = {
      updated_at: new Date().toISOString(),
    };

    // Update passages if provided
    if (req.body.passages && Array.isArray(req.body.passages)) {
      updateData.passages = req.body.passages;
      // Recalculate word count
      updateData.word_count = req.body.passages.reduce((total, p) => {
        const words = (p.content || p.text || "").trim().split(/\s+/).filter(Boolean).length;
        return total + words;
      }, 0);
    }

    // Update visibility if provided
    if (req.body.visibility && ["public", "private"].includes(req.body.visibility)) {
      updateData.visibility = req.body.visibility;
    }

    // Update title if provided
    if (req.body.title && typeof req.body.title === "string" && req.body.title.trim()) {
      updateData.title = req.body.title.trim();
    }

    // Perform the update
    const updateResult = await storiesCol.updateOne(
      { _id: story._id },
      { $set: updateData }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(500).json({ error: "Failed to update story", code: "UPDATE_FAILED" });
    }

    // Fetch updated story
    const updatedStory = await storiesCol.findOne({ _id: story._id });

    res.json({
      id: String(updatedStory._id),
      slug: updatedStory.slug,
      title: updatedStory.title,
      visibility: updatedStory.visibility,
      passages: updatedStory.passages || [],
      updated_at: updatedStory.updated_at,
    });
  } catch (error) {
    console.error("Update story error:", error);
    res.status(500).json({ error: "Failed to update story", code: "DB_ERROR" });
  }
});

/**
 * DELETE /api/stories/:id
 */
app.delete("/api/stories/:id", authMiddleware, async (req, res) => {
  try {
    const storyIdParam = req.params.id;

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
      return res.status(404).json({ error: "Story not found", code: "NOT_FOUND" });
    }

    // Verify user owns the story
    if (story.author_id !== req.user.user_id) {
      return res.status(403).json({ error: "You can only delete your own stories", code: "FORBIDDEN" });
    }

    // Delete the story
    const deleteResult = await storiesCol.deleteOne({ _id: story._id });

    if (deleteResult.deletedCount === 0) {
      return res.status(500).json({ error: "Failed to delete story", code: "DELETE_FAILED" });
    }

    res.json({
      id: String(story._id),
      slug: story.slug,
      title: story.title,
      deleted_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Delete story error:", error);
    res.status(500).json({ error: "Failed to delete story", code: "DB_ERROR" });
  }
});

// ============================================================================
// 404 handler
// ============================================================================

app.use((req, res) => {
  res.status(404).json({ error: "Not found", code: "NOT_FOUND" });
});

// ============================================================================
// Export for Vercel serverless
// ============================================================================

export default app;
