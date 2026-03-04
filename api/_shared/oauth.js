/**
 * GitHub OAuth helpers for StoryTeller Node API.
 */

const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_API_URL = "https://api.github.com";

/**
 * Get GitHub OAuth Client ID.
 *
 * @returns {string} Client ID
 */
export function getGithubClientId() {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    throw new Error("GITHUB_CLIENT_ID environment variable not set");
  }
  return clientId;
}

/**
 * Get GitHub OAuth Client Secret.
 *
 * @returns {string} Client Secret
 */
export function getGithubClientSecret() {
  const secret = process.env.GITHUB_CLIENT_SECRET;
  if (!secret) {
    throw new Error("GITHUB_CLIENT_SECRET environment variable not set");
  }
  return secret;
}

/**
 * Get base URL for OAuth redirect.
 *
 * @returns {string} Base URL
 */
export function getBaseUrl() {
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";
  return baseUrl.replace(/\/$/, "");
}

/**
 * Generate a CSRF state token.
 *
 * @returns {string} Random state token
 */
export function generateStateToken() {
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 32; i += 1) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return result;
}

/**
 * Build GitHub authorization URL.
 *
 * @param {string} state CSRF state token
 * @returns {string} Authorization URL
 */
export function getGithubAuthUrl(state) {
  const clientId = getGithubClientId();
  const baseUrl = getBaseUrl();
  const redirectUri = `${baseUrl}/api/auth/callback/github`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: "user:email",
  });

  return `${GITHUB_AUTHORIZE_URL}?${params.toString()}`;
}

/**
 * Exchange auth code for access token.
 *
 * @param {string} code Authorization code
 * @returns {Promise<string>} Access token
 */
export async function exchangeCodeForToken(code) {
  if (!code) {
    throw new Error("Authorization code is required");
  }

  const response = await fetch(GITHUB_TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: getGithubClientId(),
      client_secret: getGithubClientSecret(),
      code,
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub token exchange failed: ${response.status}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(`GitHub error: ${data.error_description || data.error}`);
  }

  if (!data.access_token) {
    throw new Error("No access token in GitHub response");
  }

  return data.access_token;
}

/**
 * Fetch GitHub user profile.
 *
 * @param {string} accessToken OAuth access token
 * @returns {Promise<object>} GitHub user profile
 */
export async function fetchGithubUser(accessToken) {
  if (!accessToken) {
    throw new Error("Access token is required");
  }

  const response = await fetch(`${GITHUB_API_URL}/user`, {
    headers: {
      Authorization: `token ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub user fetch failed: ${response.status}`);
  }

  const data = await response.json();

  return {
    github_id: data.id,
    username: data.login,
    avatar_url: data.avatar_url,
    email: data.email || null,
  };
}
