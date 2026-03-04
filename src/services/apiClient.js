/**
 * API Client: Fetch wrapper for backend endpoint calls.
 *
 * Handles:
 * - HTTP requests with credentials (cookies)
 * - Error handling and status code interpretation
 * - Loading state management
 * - Base URL configuration
 *
 * Environment Variables (via Vite):
 *   VITE_API_BASE_URL: Backend API base URL (default http://localhost:3000/api)
 */

/**
 * Get the API base URL from environment or use relative path.
 *
 * In development with Vite proxy:
 * - Browser requests to /api are proxied to http://localhost:8000/api
 * - So we can use relative /api path and let Vite handle routing
 *
 * In production:
 * - Deployed to same origin (Vercel) with /api endpoints
 * - Use /api path
 *
 * @returns {string} Base URL for all API calls
 */
export function getApiBaseUrl() {
  // Allow explicit override via environment variable
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // Default: use relative path (Vite proxy in dev, same-origin in prod)
  return "/api";
}

/**
 * Fetch API error with structured response.
 * Allows callers to distinguish between network errors and API errors.
 */
export class ApiError extends Error {
  /**
   * @param {string} message - Error message
   * @param {number} status - HTTP status code
   * @param {any} data - Response body (may include error details)
   */
  constructor(message, status = 0, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * Check whether an error is an authentication/authorization API error.
 *
 * @param {unknown} error - Error instance to inspect.
 * @returns {boolean} True when status is 401 or 403.
 */
export function isAuthError(error) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

/**
 * Convert API errors into consistent user-facing text.
 *
 * @param {unknown} error - Error instance from apiCall.
 * @returns {string} Readable message safe for UI display.
 */
export function getApiErrorMessage(error) {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return "Please sign in to continue.";
    }

    if (error.status === 403) {
      return "You do not have permission to perform this action.";
    }

    return error.message || "Request failed. Please try again.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error. Please try again.";
}

/**
 * Parse error response from API.
 *
 * API error format:
 *   { "error": "User message", "code": "ERROR_CODE", "details": {...} }
 *
 * @param {Response} response - Fetch response object
 * @returns {Promise<object>} Parsed error data
 */
async function parseErrorResponse(response) {
  try {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }
  } catch (e) {
    // Fall through to generic error
  }
  return {
    error: response.status === 401
      ? "Authentication required"
      : response.status === 403
        ? "Forbidden"
        : `HTTP ${response.status}`,
    code: `HTTP_${response.status}`,
  };
}

/**
 * Make an authenticated API request with credentials.
 *
 * Features:
 * - Includes session cookie automatically (credentials: include)
 * - Parses JSON responses
 * - Throws ApiError on non-2xx status
 * - Handles network timeouts (30s default)
 *
 * @param {string} endpoint - API endpoint path (e.g., "/stories/explore")
 * @param {object} options - Fetch options
 *   - method: GET/POST/PUT/DELETE (default GET)
 *   - body: Request body object (auto JSON stringified)
 *   - headers: Additional headers to merge
 *   - timeout: Request timeout in ms (default 30000)
 *
 * @returns {Promise<any>} Parsed response JSON
 *
 * @throws {ApiError} On HTTP error (non-2xx status)
 * @throws {Error} On network error or timeout
 *
 * @example
 *   const stories = await apiCall("/stories/explore?limit=10");
 *   const newStory = await apiCall("/stories/create", {
 *     method: "POST",
 *     body: { title: "...", visibility: "..." }
 *   });
 */
export async function apiCall(endpoint, options = {}) {
  const {
    method = "GET",
    body = null,
    headers = {},
    timeout = 30000,
  } = options;

  const baseUrl = getApiBaseUrl().replace(/\/+$/, "");
  const normalizedEndpoint = normalizeApiEndpoint(endpoint, baseUrl);
  const url = `${baseUrl}${normalizedEndpoint}`;

  // Prepare fetch options
  const fetchOptions = {
    method,
    // Include cookies for session authentication
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  // Add body if provided
  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }

  // Apply timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Check for HTTP errors
    if (!response.ok) {
      const errorData = await parseErrorResponse(response);
      const message =
        errorData?.error ||
        errorData?.message ||
        (response.status === 401
          ? "Authentication required"
          : response.status === 403
            ? "Forbidden"
            : `API Error: ${response.status}`);
      throw new ApiError(message, response.status, errorData);
    }

    // Parse success response
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }

    // Return empty object for non-JSON responses (e.g., 204 No Content)
    return {};

  } catch (error) {
    clearTimeout(timeoutId);

    // Handle abort (timeout)
    if (error.name === "AbortError") {
      throw new Error(`Request timeout after ${timeout}ms`);
    }

    // Re-throw ApiError as-is
    if (error instanceof ApiError) {
      throw error;
    }

    // Wrap other errors
    throw new Error(`API request failed: ${error.message}`);
  }
}

/**
 * Normalize endpoint to avoid duplicate "/api" segments.
 *
 * @param {string} endpoint - Requested endpoint path
 * @param {string} baseUrl - API base URL
 * @returns {string} Normalized endpoint path with leading slash
 */
function normalizeApiEndpoint(endpoint, baseUrl) {
  const rawEndpoint = String(endpoint || "");
  const withSlash = rawEndpoint.startsWith("/") ? rawEndpoint : `/${rawEndpoint}`;

  if (baseUrl.endsWith("/api") && withSlash.startsWith("/api/")) {
    return withSlash.slice(4);
  }

  if (baseUrl.endsWith("/api") && withSlash === "/api") {
    return "";
  }

  return withSlash;
}

/**
 * Convenience wrappers for common HTTP methods.
 */

/**
 * @param {string} endpoint - API endpoint path
 * @param {object} options - Additional fetch options
 * @returns {Promise<any>} Response data
 */
export function apiGet(endpoint, options = {}) {
  return apiCall(endpoint, { ...options, method: "GET" });
}

/**
 * @param {string} endpoint - API endpoint path
 * @param {any} body - Request body
 * @param {object} options - Additional fetch options
 * @returns {Promise<any>} Response data
 */
export function apiPost(endpoint, body, options = {}) {
  return apiCall(endpoint, { ...options, method: "POST", body });
}

/**
 * @param {string} endpoint - API endpoint path
 * @param {any} body - Request body
 * @param {object} options - Additional fetch options
 * @returns {Promise<any>} Response data
 */
export function apiPut(endpoint, body, options = {}) {
  return apiCall(endpoint, { ...options, method: "PUT", body });
}

/**
 * @param {string} endpoint - API endpoint path
 * @param {object} options - Additional fetch options
 * @returns {Promise<any>} Response data
 */
export function apiDelete(endpoint, options = {}) {
  return apiCall(endpoint, { ...options, method: "DELETE" });
}
