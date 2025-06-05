# PatchlineAI API Documentation

**Last Updated:** January 2025  
**Version:** 1.0.0  

---

## 🌐 API Overview

PatchlineAI provides two API layers:

1. **Frontend API Routes** (Next.js) - Port 3000
2. **Backend API Server** (Fastify) - Port 3001

The frontend API routes handle most of the application logic, while the backend API server provides additional services and can be scaled independently.

---

## 🔗 Frontend API Routes (Next.js)

Base URL: `http://localhost:3000/api` (development)

### Health Check

#### GET `/api/health`

Returns system health and AWS connectivity status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-XX T XX:XX:XX.XXXZ",
  "environment": {
    "region": "us-east-1",
    "nodeEnv": "development",
    "hasCredentials": true,
    "amplifyAppId": "d40rmftf5h7p7"
  },
  "services": {
    "dynamodb": {
      "status": "connected",
      "tables": ["Users-staging", "Embeds-staging", "BlogPosts-staging", "ContentDrafts-staging"]
    },
    "bedrock": {
      "status": "available",
      "model": "amazon.nova-micro-v1:0"
    }
  }
}
```

### User Management

#### GET `/api/user?userId={userId}`

Retrieve user information.

**Parameters:**
- `userId` (string, required): User ID

**Response:**
```json
{
  "userId": "14287408-6011-70b3-5ac6-089f0cafdc10",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2025-01-XX T XX:XX:XX.XXXZ",
  "updatedAt": "2025-01-XX T XX:XX:XX.XXXZ",
  "profile": {
    "bio": "Music producer and artist",
    "website": "https://example.com",
    "socialLinks": {
      "instagram": "@johndoe",
      "soundcloud": "johndoe"
    }
  }
}
```

#### POST `/api/user`

Create a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "profile": {
    "bio": "Music producer and artist",
    "website": "https://example.com"
  }
}
```

#### PUT `/api/user`

Update user information.

**Request Body:**
```json
{
  "userId": "14287408-6011-70b3-5ac6-089f0cafdc10",
  "name": "John Doe Updated",
  "profile": {
    "bio": "Updated bio"
  }
}
```

### Platform Embeds

#### GET `/api/embed?userId={userId}`

Retrieve all embeds for a user.

**Parameters:**
- `userId` (string, required): User ID

**Response:**
```json
{
  "embeds": [
    {
      "userId": "14287408-6011-70b3-5ac6-089f0cafdc10",
      "embedId": "embed-123",
      "platform": "soundcloud",
      "url": "https://soundcloud.com/user/track",
      "title": "My Track",
      "description": "A great track",
      "thumbnailUrl": "https://example.com/thumb.jpg",
      "createdAt": "2025-01-XX T XX:XX:XX.XXXZ",
      "metadata": {
        "duration": "3:45",
        "genre": "Electronic"
      }
    }
  ]
}
```

#### POST `/api/embed`

Create a new embed.

**Request Body:**
```json
{
  "userId": "14287408-6011-70b3-5ac6-089f0cafdc10",
  "platform": "soundcloud",
  "url": "https://soundcloud.com/user/track",
  "title": "My Track",
  "description": "A great track"
}
```

### Blog Posts

#### GET `/api/blog?userId={userId}`

Retrieve blog posts for a user.

**Parameters:**
- `userId` (string, required): User ID
- `status` (string, optional): Filter by status (`draft`, `published`)

**Response:**
```json
{
  "posts": [
    {
      "id": "post-123",
      "userId": "14287408-6011-70b3-5ac6-089f0cafdc10",
      "title": "My Blog Post",
      "content": "# Heading\n\nContent here...",
      "status": "published",
      "createdAt": "2025-01-XX T XX:XX:XX.XXXZ",
      "updatedAt": "2025-01-XX T XX:XX:XX.XXXZ",
      "tags": ["music", "production"]
    }
  ]
}
```

#### POST `/api/blog`

Create a new blog post.

**Request Body:**
```json
{
  "userId": "14287408-6011-70b3-5ac6-089f0cafdc10",
  "title": "My Blog Post",
  "content": "# Heading\n\nContent here...",
  "status": "draft",
  "tags": ["music", "production"]
}
```

### Content Generation

#### GET `/api/content?userId={userId}`

Retrieve content drafts for a user.

**Parameters:**
- `userId` (string, required): User ID
- `status` (string, optional): Filter by status (`generating`, `ready`, `published`)

**Response:**
```json
{
  "drafts": [
    {
      "id": "draft-123",
      "userId": "14287408-6011-70b3-5ac6-089f0cafdc10",
      "title": "AI Generated Content",
      "content": "Generated content here...",
      "type": "blog",
      "status": "ready",
      "prompt": "Write about music production",
      "createdAt": "2025-01-XX T XX:XX:XX.XXXZ",
      "updatedAt": "2025-01-XX T XX:XX:XX.XXXZ"
    }
  ]
}
```

#### POST `/api/content`

Generate new content using AI.

**Request Body:**
```json
{
  "userId": "14287408-6011-70b3-5ac6-089f0cafdc10",
  "prompt": "Write a blog post about music production techniques",
  "type": "blog",
  "options": {
    "tone": "professional",
    "length": "medium",
    "keywords": ["music", "production", "mixing"]
  }
}
```

**Response:**
```json
{
  "id": "draft-123",
  "status": "generating",
  "message": "Content generation started"
}
```

---

## 🚀 Backend API Server (Fastify)

Base URL: `http://localhost:3001` (development)

### Health Check

#### GET `/health`

Returns backend server health status.

**Response:**
```json
{
  "status": "ok",
  "time": "2025-01-XX T XX:XX:XX.XXXZ"
}
```

### Dashboard Data

#### GET `/dashboard/overview`

Returns dashboard overview metrics.

**Headers:**
- `Authorization: Bearer {jwt_token}` (if JWT_SECRET is set)

**Response:**
```json
{
  "revenue": 45231.89,
  "listeners": 2350412,
  "engagement": 3827
}
```

---

## 🔐 Authentication

### Development Mode

When `AUTH_ENABLED=false` (default for development):
- No authentication required
- Mock user data is used
- All endpoints are accessible

### Production Mode

When `AUTH_ENABLED=true`:
- AWS Cognito authentication required
- JWT tokens validated
- User context from Cognito

### JWT Authentication (Backend)

If `JWT_SECRET` environment variable is set:

**Login Request:**
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "user", "password": "pass"}'
```

**Authenticated Request:**
```bash
curl -X GET http://localhost:3001/dashboard/overview \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🔄 Frontend-Backend Integration

### Connecting v0 Frontend to Backend

1. **Environment Configuration**
   ```bash
   # In .env.local
   API_BASE_URL=http://localhost:3001
   ```

2. **API Client Setup**
   ```typescript
   // lib/api-client.ts
   const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001'
   
   export async function fetchDashboardData() {
     const response = await fetch(`${API_BASE_URL}/dashboard/overview`)
     return response.json()
   }
   ```

3. **React Component Integration**
   ```typescript
   // components/DashboardOverview.tsx
   import { useEffect, useState } from 'react'
   import { fetchDashboardData } from '@/lib/api-client'
   
   export function DashboardOverview() {
     const [data, setData] = useState(null)
     
     useEffect(() => {
       fetchDashboardData().then(setData)
     }, [])
     
     return (
       <div>
         <h2>Revenue: ${data?.revenue}</h2>
         <h2>Listeners: {data?.listeners}</h2>
       </div>
     )
   }
   ```

### Data Flow

```
v0 Frontend (Port 3000)
    ↓
Next.js API Routes (/api/*)
    ↓
DynamoDB / AWS Bedrock
    ↓
Backend API Server (Port 3001)
    ↓
Additional Services
```

---

## 🛠️ Development Workflow

### Starting Both Servers

```bash
# Terminal 1: Frontend + API Routes
pnpm dev

# Terminal 2: Backend API Server
cd backend/app
pnpm dev
```

### Testing API Endpoints

```bash
# Test frontend API
curl http://localhost:3000/api/health

# Test backend API
curl http://localhost:3001/health

# Test with authentication
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3001/dashboard/overview
```

### Mock Data vs Real Data

The application automatically switches between mock and real data based on:

- `ENABLE_MOCK_SERVICES=true` - Use mock data
- AWS credentials availability
- DynamoDB table existence

---

## 📊 Error Handling

### Standard Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid user ID format",
    "details": {
      "field": "userId",
      "expected": "UUID format"
    }
  },
  "timestamp": "2025-01-XX T XX:XX:XX.XXXZ"
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Invalid request data
- `NOT_FOUND` - Resource not found
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `AWS_ERROR` - AWS service error
- `INTERNAL_ERROR` - Server error

---

## 🔧 Configuration

### Environment Variables for API

```bash
# API Configuration
API_BASE_URL=http://localhost:3001
JWT_SECRET=your_jwt_secret_here
PORT=3001

# Feature Flags
AUTH_ENABLED=false
ENABLE_MOCK_SERVICES=true

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
```

### CORS Configuration

The backend API is configured to accept requests from:
- `http://localhost:3000` (frontend)
- `https://your-amplify-domain.com` (production)

---

## 📝 API Testing

### Using curl

```bash
# Health check
curl -X GET http://localhost:3000/api/health

# Get user data
curl -X GET "http://localhost:3000/api/user?userId=test-user-id"

# Create embed
curl -X POST http://localhost:3000/api/embed \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-id",
    "platform": "soundcloud",
    "url": "https://soundcloud.com/test/track",
    "title": "Test Track"
  }'
```

### Using Postman

Import the following collection:

```json
{
  "info": {
    "name": "PatchlineAI API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/api/health",
          "host": ["{{baseUrl}}"],
          "path": ["api", "health"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    }
  ]
}
```

---

## 🚀 Deployment Considerations

### Production API URLs

```bash
# Frontend API (Amplify)
https://your-app.amplifyapp.com/api/*

# Backend API (ALB/ECS)
https://api.your-domain.com/*
```

### Environment-Specific Configuration

```bash
# Development
API_BASE_URL=http://localhost:3001

# Staging
API_BASE_URL=https://api-staging.your-domain.com

# Production
API_BASE_URL=https://api.your-domain.com
```

---

*This documentation provides everything needed to understand and integrate with the PatchlineAI API. Keep it updated as new endpoints are added.* 