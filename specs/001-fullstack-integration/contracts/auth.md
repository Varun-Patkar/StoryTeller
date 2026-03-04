# Contract: Auth API

**Version**: 1.0.0  
**Purpose**: Define authentication endpoints for optional GitHub OAuth

---

## POST /api/auth/github

**Purpose**: Exchange a GitHub OAuth code for a session cookie.

**Request Body**:
- `code` (string, required): OAuth authorization code from GitHub
- `state` (string, required): CSRF protection state

**Response**:
- **200 OK** (or **302 Redirect** based on implementation strategy)
- **Set-Cookie**: `session` httpOnly JWT

**Cookie Settings**:
- `httpOnly`: true
- `secure`: true in production
- `sameSite`: lax
- `path`: `/`

**Error Responses**:
- `400` if `code` or `state` is missing or invalid
- `500` for GitHub exchange failures

---

## GET /api/auth/me

**Purpose**: Fetch the currently authenticated user

**Auth**: Requires valid `session` cookie

**Response**: `200 OK`
```json
{
  "user": {
    "id": "user_123",
    "github_id": "123456",
    "username": "octocat",
    "avatar_url": "https://avatars.githubusercontent.com/u/123456",
    "created_at": "2026-03-04T12:00:00Z"
  }
}
```

Logged-out response can be:

```json
{
  "user": null
}
```

**Error Responses**:
- `401` if no session or invalid token
