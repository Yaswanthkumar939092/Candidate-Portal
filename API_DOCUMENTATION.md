# Job Candidate Portal - API Documentation

This document provides comprehensive documentation for all API routes in the Job Candidate Portal application.

## Base URL

- Development: `http://localhost:3000/api`
- Production: `https://your-domain.com/api`

## Authentication

The API uses JWT-based authentication with Supabase. Authentication tokens can be provided in two ways:

1. **Authorization Header**: `Authorization: Bearer <token>`
2. **HTTP-only Cookie**: `supabase-access-token` (set automatically on login)

### Authentication States

- **Public**: No authentication required
- **Authenticated**: Valid user token required
- **Admin**: Admin privileges required

## Response Format

All API responses follow a consistent format:

```json
{
  "success": boolean,
  "data": any,
  "message": string,
  "error": string,
  "errors": Array<{
    "field": string,
    "message": string,
    "code": string
  }>,
  "meta": {
    "timestamp": string,
    "requestId": string
  },
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number,
    "hasNext": boolean,
    "hasPrev": boolean
  }
}
```

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 429 | Rate Limit Exceeded |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

## Authentication Endpoints

### POST /api/auth/signup

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "location": "New York, NY",
  "experienceLevel": "mid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "profile": { ... }
    }
  }
}
```

### POST /api/auth/signin

Authenticate user and create session.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sign in successful",
  "data": {
    "user": { ... },
    "session": {
      "access_token": "jwt-token",
      "refresh_token": "refresh-token",
      "expires_at": 1234567890
    }
  }
}
```

### POST /api/auth/signout

**Authentication:** Authenticated

Sign out user and invalidate session.

**Response:**
```json
{
  "success": true,
  "message": "Sign out successful"
}
```

### GET /api/auth/profile

**Authentication:** Authenticated

Get current user profile and statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "profile": { ... },
      "stats": {
        "totalApplications": 5,
        "savedJobs": 3,
        "applicationsByStatus": {
          "pending": 2,
          "reviewing": 1,
          "interviewing": 1,
          "offered": 1
        }
      }
    }
  }
}
```

### PUT /api/auth/profile

**Authentication:** Authenticated

Update user profile information.

**Request Body:**
```json
{
  "full_name": "John Doe",
  "phone": "+1234567890",
  "location": "San Francisco, CA",
  "bio": "Software engineer with 5 years experience",
  "skills": ["JavaScript", "React", "Node.js"],
  "experience_level": "senior",
  "preferred_salary_min": 80000,
  "preferred_salary_max": 120000
}
```

## Job Endpoints

### GET /api/jobs

Get list of jobs with filtering and pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 50)
- `search` (string): Search in title, company, description
- `location` (string): Filter by location
- `job_type` (string): full-time, part-time, contract, freelance, internship
- `experience_level` (string): entry, junior, mid, senior, lead
- `skills` (string): Comma-separated list of skills
- `salary_min` (number): Minimum salary filter
- `salary_max` (number): Maximum salary filter
- `company` (string): Filter by company name
- `sort_by` (string): created_at, title, company, salary_min
- `sort_order` (string): asc, desc

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "uuid",
        "title": "Senior Software Engineer",
        "company": "TechCorp",
        "location": "Remote",
        "salary_min": 90000,
        "salary_max": 130000,
        "job_type": "full-time",
        "experience_level": "senior",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ]
  },
  "pagination": { ... }
}
```

### POST /api/jobs

**Authentication:** Authenticated

Create a new job posting.

**Request Body:**
```json
{
  "title": "Software Engineer",
  "company": "TechCorp",
  "description": "We are looking for a talented software engineer...",
  "requirements": ["JavaScript", "React", "3+ years experience"],
  "benefits": ["Health insurance", "401k", "Remote work"],
  "salary_min": 80000,
  "salary_max": 120000,
  "location": "San Francisco, CA",
  "job_type": "full-time",
  "experience_level": "mid",
  "skills_required": ["JavaScript", "React", "Node.js"],
  "application_deadline": "2024-12-31T23:59:59Z"
}
```

### GET /api/jobs/[id]

Get detailed information about a specific job.

**Response:**
```json
{
  "success": true,
  "data": {
    "job": { ... },
    "relatedJobs": [ ... ],
    "userJobStatus": {
      "hasApplied": true,
      "applicationStatus": "pending",
      "isSaved": false
    }
  }
}
```

### PUT /api/jobs/[id]

**Authentication:** Authenticated (Owner only)

Update job information.

### DELETE /api/jobs/[id]

**Authentication:** Authenticated (Owner only)

Soft delete job (sets is_active to false).

### POST /api/jobs/[id]/save

**Authentication:** Authenticated

Save a job to user's saved jobs list.

**Response:**
```json
{
  "success": true,
  "message": "Job saved successfully",
  "data": {
    "saved": true
  }
}
```

### DELETE /api/jobs/[id]/save

**Authentication:** Authenticated

Remove job from user's saved jobs list.

### GET /api/jobs/saved

**Authentication:** Authenticated

Get user's saved jobs with pagination.

**Query Parameters:**
- `page`, `limit`: Pagination
- `sort_by`: saved_at, title, company
- `sort_order`: asc, desc

## Application Endpoints

### GET /api/applications

**Authentication:** Authenticated

Get user's job applications.

**Query Parameters:**
- `page`, `limit`: Pagination
- `status`: pending, reviewing, interviewing, offered, rejected, withdrawn
- `job_id`: Filter by specific job
- `sort_by`: applied_at, updated_at, status
- `sort_order`: asc, desc

**Response:**
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": "uuid",
        "job_id": "uuid",
        "status": "pending",
        "cover_letter": "Dear hiring manager...",
        "applied_at": "2024-01-01T00:00:00Z",
        "job": {
          "title": "Software Engineer",
          "company": "TechCorp"
        }
      }
    ]
  },
  "pagination": { ... }
}
```

### POST /api/applications

**Authentication:** Authenticated

Submit a job application.

**Request Body:**
```json
{
  "job_id": "uuid",
  "cover_letter": "Dear hiring manager...",
  "resume_url": "https://example.com/resume.pdf",
  "notes": "Additional information..."
}
```

### GET /api/applications/[id]

**Authentication:** Authenticated (Owner only)

Get detailed application information.

### PUT /api/applications/[id]

**Authentication:** Authenticated (Owner only)

Update application (candidates can only withdraw).

**Request Body:**
```json
{
  "status": "withdrawn",
  "notes": "Updated notes..."
}
```

### DELETE /api/applications/[id]

**Authentication:** Authenticated (Owner only)

Delete application (only if pending or withdrawn).

## Admin Endpoints

### GET /api/admin/dashboard

**Authentication:** Admin

Get admin dashboard statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalUsers": 150,
      "totalJobs": 75,
      "totalApplications": 450,
      "activeJobs": 68,
      "recentApplications": 25,
      "applicationStatusDistribution": {
        "pending": 100,
        "reviewing": 80,
        "interviewing": 30,
        "offered": 20,
        "rejected": 200,
        "withdrawn": 20
      }
    },
    "recentActivity": [ ... ],
    "systemHealth": {
      "status": "healthy",
      "uptime": 86400,
      "timestamp": "2024-01-01T00:00:00Z"
    }
  }
}
```

### GET /api/admin/users

**Authentication:** Admin

Get list of all users with statistics.

**Query Parameters:**
- `page`, `limit`: Pagination
- `search`: Search by email or name
- `sort_by`: created_at, email, full_name, updated_at
- `sort_order`: asc, desc

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "user@example.com",
        "full_name": "John Doe",
        "created_at": "2024-01-01T00:00:00Z",
        "stats": {
          "totalApplications": 5,
          "savedJobs": 3,
          "applicationsByStatus": { ... }
        }
      }
    ]
  },
  "pagination": { ... }
}
```

### GET /api/admin/sync/jobs

**Authentication:** Admin

Get job synchronization status.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalJobs": 75,
    "activeJobs": 68,
    "recentJobs": [ ... ],
    "lastSyncTime": "2024-01-01T00:00:00Z",
    "frappeConnection": {
      "status": "connected",
      "lastCheck": "2024-01-01T00:00:00Z"
    }
  }
}
```

### POST /api/admin/sync/jobs

**Authentication:** Admin

Trigger job synchronization from Frappe ERPNext.

**Query Parameters:**
- `force` (boolean): Force update existing jobs
- `company` (string): Filter by company name

**Response:**
```json
{
  "success": true,
  "message": "Job sync completed. 5 new jobs created, 3 jobs updated.",
  "data": {
    "synced": 5,
    "updated": 3,
    "errors": [],
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

## Rate Limits

| Endpoint Type | Limit | Window |
|---------------|--------|---------|
| Authentication | 5 requests | 15 minutes |
| General API | 100 requests | 15 minutes |
| Admin | 200 requests | 15 minutes |

## Pagination

All list endpoints support pagination with the following parameters:

- `page`: Page number (starts at 1)
- `limit`: Items per page (default varies by endpoint, max 100)

Pagination metadata is included in the response:

```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Sorting

List endpoints support sorting with:

- `sort_by`: Field to sort by (varies by endpoint)
- `sort_order`: `asc` or `desc` (default: `desc`)

## Filtering

Most list endpoints support filtering through query parameters. Available filters vary by endpoint and are documented in each endpoint section.

## Error Handling

The API provides detailed error information:

```json
{
  "success": false,
  "error": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address",
      "code": "invalid_email"
    }
  ],
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

## Security Features

- JWT-based authentication
- HTTP-only cookies for session management
- Rate limiting per IP address
- Input validation and sanitization
- CORS protection
- Security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- SQL injection protection via Supabase RLS

## Development

### Environment Variables

Required environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Testing

Use tools like Postman, curl, or JavaScript fetch to test the API:

```javascript
// Example: Get jobs
fetch('/api/jobs?page=1&limit=10&job_type=full-time', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data))
```

### Error Monitoring

The API includes comprehensive error logging and monitoring capabilities. In production, integrate with services like Sentry for error tracking.

## Migration from Legacy API

If migrating from a previous API version:

1. Update authentication to use JWT tokens
2. Update response format handling to use the new standard format
3. Update pagination parameter names if needed
4. Update error handling to use the new error response format

## Support

For API support or questions, please refer to the development team or check the project repository for issues and documentation updates.