# API Reference

**Base URL:** `https://continuum.vercel.app`  
**Content-Type:** `application/json` for all request/response bodies  
**Version:** 0.2.0

---

## Table of Contents

- [POST /api/waitlist](#post-apiwaitlist)
- [GET /api/waitlist](#get-apiwaitlist)
- [GET /api/cron/health](#get-apicronhealth)
- [POST /api/auth/signout](#post-apiauthsignout)
- [GET /auth/callback](#get-authcallback)

---

## POST /api/waitlist

Join the waitlist.

### Request

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `email` | `string` | **Yes** | Valid email address |
| `name` | `string` | No | 2–100 characters |
| `company` | `string` | No | Max 100 characters |

### Rate Limiting

3 requests per hour per IP address (when Upstash Redis is configured).  
Returns `429 Too Many Requests` when exceeded.

### Responses

#### `201 Created` — Successfully joined

```json
{
  "message": "Successfully joined the waitlist!",
  "email": "user@example.com"
}
```

#### `409 Conflict` — Already on waitlist

```json
{
  "message": "You're already on the waitlist!",
  "email": "user@example.com"
}
```

#### `400 Bad Request` — Validation error

```json
{
  "error": "Invalid email address"
}
```

#### `429 Too Many Requests` — Rate limit exceeded

```json
{
  "error": "Too many requests. Please try again later."
}
```

#### `500 Internal Server Error`

```json
{
  "error": "Internal server error"
}
```

### Example

```bash
curl -X POST https://continuum.vercel.app/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@example.com", "name": "Alice", "company": "Acme Corp"}'
```

---

## GET /api/waitlist

Health check for the waitlist route.

### Responses

#### `200 OK`

```json
{
  "status": "ok",
  "route": "waitlist"
}
```

### Example

```bash
curl https://continuum.vercel.app/api/waitlist
```

---

## GET /api/cron/health

Cron job health check endpoint. Called hourly by Vercel Cron (configured in `vercel.json`).

### Authentication

Requires `Authorization: Bearer <CRON_SECRET>` header.  
Returns `401` if the header is missing or the token does not match `CRON_SECRET`.

### Responses

#### `200 OK`

```json
{
  "status": "ok",
  "timestamp": "2026-03-12T14:00:00.000Z"
}
```

#### `401 Unauthorized`

```json
{
  "error": "Unauthorized"
}
```

### Example

```bash
curl https://continuum.vercel.app/api/cron/health \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## POST /api/auth/signout

Sign out the current user. Clears `sb-access-token` and `sb-refresh-token` cookies.

### Authentication

Requires a valid session cookie (`sb-access-token`).

### Request Body

No body required.

### Responses

#### `200 OK` (redirects to `/login`)

The response is a `302` redirect to `/login` with expired cookie headers.

### Example

```bash
curl -X POST https://continuum.vercel.app/api/auth/signout \
  -H "Cookie: sb-access-token=<token>"
```

---

## GET /auth/callback

Handles the OAuth / magic-link callback. Exchanges a short-lived `code` query parameter for a full session, sets cookies, and redirects to the dashboard.

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | `string` | **Yes** | One-time auth code from Supabase |

### Flow

1. Receives `?code=<code>` from Supabase redirect
2. Calls `supabase.auth.exchangeCodeForSession(code)`
3. Sets `sb-access-token` and `sb-refresh-token` cookies
4. Redirects `302` to `/dashboard/opportunities`

### Responses

#### Success → `302 Redirect` to `/dashboard/opportunities`

#### Error → `302 Redirect` to `/login?error=auth_callback_failed`

### Example

This endpoint is called automatically by Supabase after a magic link or OAuth flow:

```
GET /auth/callback?code=pkce_verifier_code_here
```

---

## Common Headers

### Security Headers (all responses)

Set via `vercel.json`:

| Header | Value |
|--------|-------|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline'; ...` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

### CORS

Configured in `vercel.json`. Only same-origin requests are permitted by default.
