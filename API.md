# API Documentation

## Overview

Continuum's API is built using Next.js 16 Route Handlers with TypeScript strict mode. All endpoints follow RESTful conventions and return JSON responses.

**Base URL**: 
- Development: `http://localhost:3000`
- Production: `https://your-domain.vercel.app`

**Authentication**: Currently, all endpoints are public. Authentication will be added in future versions.

## 📋 Table of Contents

- [Endpoints](#endpoints)
  - [Waitlist](#waitlist)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Security](#security)

## 🔌 Endpoints

### Waitlist

#### POST /api/waitlist

Submit an email address to join the waitlist.

**Endpoint**: `POST /api/waitlist`

**Headers**:
```http
Content-Type: application/json
```

**Request Body**:
```typescript
{
  email: string;      // Required - Valid email address
  name?: string;      // Optional - User's full name (2-100 chars)
  company?: string;   // Optional - Company name (max 100 chars)
}
```

**Example Request**:
```bash
curl -X POST https://your-domain.vercel.app/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "company": "Acme Inc"
  }'
```

**Success Response** (201 Created):
```json
{
  "success": true,
  "message": "Thank you for joining our waitlist!"
}
```

**Error Responses**:

*Invalid Email* (400 Bad Request):
```json
{
  "error": "Please enter a valid email address"
}
```

*Duplicate Email* (400 Bad Request):
```json
{
  "error": "This email is already on the waitlist!"
}
```

*Rate Limit Exceeded* (429 Too Many Requests):
```json
{
  "error": "Too many requests. Please try again later.",
  "limit": 3,
  "reset": 1640000000,
  "remaining": 0
}
```

*Server Error* (500 Internal Server Error):
```json
{
  "error": "Unable to process your request. Please try again later."
}
```

**Validation Rules**:

| Field   | Type   | Required | Validation                                    |
|---------|--------|----------|-----------------------------------------------|
| email   | string | Yes      | Valid email format, max 255 chars             |
| name    | string | No       | 2-100 characters                              |
| company | string | No       | Max 100 characters                            |

**Side Effects**:
- Saves entry to `waitlist` table in database
- Sends confirmation email (if Resend is configured)
- Logs submission server-side

**Rate Limiting**:
- **Limit**: 3 requests per hour per IP address
- **Window**: 1 hour sliding window
- **Implementation**: Upstash Redis

#### GET /api/waitlist

Health check endpoint (for monitoring).

**Endpoint**: `GET /api/waitlist`

**Response** (200 OK):
```json
{
  "status": "ok",
  "message": "Waitlist API is running"
}
```

## ⚠️ Error Handling

### Error Response Format

All errors follow a consistent format:

```typescript
{
  error: string;  // Human-readable error message
  code?: string;  // Optional error code for client handling
}
```

### HTTP Status Codes

| Code | Meaning              | When Used                           |
|------|----------------------|-------------------------------------|
| 200  | OK                   | Successful GET request              |
| 201  | Created              | Resource successfully created       |
| 400  | Bad Request          | Invalid input or validation error   |
| 429  | Too Many Requests    | Rate limit exceeded                 |
| 500  | Internal Server Error| Unexpected server error             |

### Error Examples

**Validation Error**:
```json
{
  "error": "Please enter a valid email address"
}
```

**Database Error**:
```json
{
  "error": "Unable to process your request. Please try again later."
}
```

**Rate Limit Error**:
```json
{
  "error": "Too many requests. Please try again later.",
  "limit": 3,
  "reset": 1640000000,
  "remaining": 0
}
```

## 🚦 Rate Limiting

### Configuration

- **Provider**: Upstash Redis
- **Algorithm**: Sliding window
- **Limit**: 3 requests per hour per IP
- **Identifier**: X-Forwarded-For header (IP address)

### Rate Limit Headers

Rate limit information is included in error responses:

```json
{
  "error": "Too many requests. Please try again later.",
  "limit": 3,           // Maximum requests allowed
  "reset": 1640000000,  // Unix timestamp when limit resets
  "remaining": 0         // Requests remaining in current window
}
```

### Handling Rate Limits

**Client-side retry logic**:
```typescript
async function submitWaitlist(data: WaitlistData) {
  const response = await fetch('/api/waitlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (response.status === 429) {
    const error = await response.json();
    const resetDate = new Date(error.reset * 1000);
    throw new Error(`Rate limited. Try again at ${resetDate.toLocaleString()}`);
  }

  return response.json();
}
```

## 🔐 Security

### Request Validation

All requests are validated using Zod schemas:

```typescript
const waitlistSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().min(2).max(100).optional(),
  company: z.string().max(100).optional(),
});
```

### Input Sanitization

User input is sanitized before database insertion:
- Trimmed whitespace
- Email converted to lowercase
- HTML/XSS prevention (DOMPurify)

### Security Headers

All API responses include security headers:
- `Content-Type: application/json`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`

### CORS

Currently, CORS is not restricted. For production with a separate frontend:

```typescript
// future implementation
const allowedOrigins = ['https://yourdomain.com'];
if (allowedOrigins.includes(request.headers.get('origin'))) {
  headers.set('Access-Control-Allow-Origin', request.headers.get('origin'));
}
```

## 📝 Code Examples

### JavaScript/TypeScript

```typescript
async function joinWaitlist(email: string, name?: string, company?: string) {
  try {
    const response = await fetch('/api/waitlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, name, company }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    const data = await response.json();
    console.log('Success:', data.message);
    return data;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

// Usage
await joinWaitlist('user@example.com', 'John Doe', 'Acme Inc');
```

### cURL

```bash
# Submit to waitlist
curl -X POST https://your-domain.vercel.app/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","name":"John Doe","company":"Acme Inc"}'

# Health check
curl https://your-domain.vercel.app/api/waitlist
```

### Python

```python
import requests

def join_waitlist(email, name=None, company=None):
    url = "https://your-domain.vercel.app/api/waitlist"
    payload = {"email": email}
    
    if name:
        payload["name"] = name
    if company:
        payload["company"] = company
    
    response = requests.post(url, json=payload)
    
    if response.status_code == 201:
        print("Success:", response.json()["message"])
        return response.json()
    else:
        error = response.json()
        raise Exception(f"Error {response.status_code}: {error['error']}")

# Usage
join_waitlist("user@example.com", "John Doe", "Acme Inc")
```

## 🔮 Future Endpoints

The following endpoints are planned for future releases:

### Authentication
- `POST /api/auth/login` - Magic link login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### ICP Management
- `GET /api/icps` - List ICPs
- `POST /api/icps` - Create ICP
- `GET /api/icps/:id` - Get ICP details
- `PUT /api/icps/:id` - Update ICP
- `DELETE /api/icps/:id` - Delete ICP

### Opportunities
- `GET /api/opportunities` - List opportunities
- `GET /api/opportunities/:id` - Get opportunity details
- `POST /api/opportunities/:id/enrich` - Trigger enrichment

### Webhooks
- `POST /api/webhooks/n8n` - n8n workflow webhook

## 📊 Response Times

Typical response times (95th percentile):

| Endpoint          | Response Time |
|-------------------|---------------|
| POST /api/waitlist| < 200ms       |
| GET /api/waitlist | < 50ms        |

Times may vary based on:
- Database location
- Network latency
- Rate limiting checks
- Email sending (async, doesn't block response)

## 🐛 Troubleshooting

### Common Issues

**Issue**: "Invalid email address"
- **Cause**: Email doesn't match format
- **Solution**: Check email format matches RFC 5322 standard

**Issue**: "Already on waitlist"
- **Cause**: Email already exists in database
- **Solution**: Use a different email or contact support

**Issue**: "Too many requests"
- **Cause**: Rate limit exceeded (3 per hour)
- **Solution**: Wait 1 hour or contact support for help

**Issue**: "Service unavailable"
- **Cause**: Database connection issue or internal error
- **Solution**: Try again in a few minutes, contact support if persists

### Support

If you encounter persistent issues:
- Check [GitHub Issues](https://github.com/Krosebrook/continuum/issues)
- Email: hello@continuum.dev
- Include: Request details, error message, timestamp

---

**Last Updated**: January 2026  
**Version**: 1.0  
**API Version**: v1 (implicit, no versioning in URL yet)
