# Zerko Platform API Documentation

## 📋 Overview

This comprehensive API documentation covers all endpoints, authentication methods, request/response formats, and integration patterns for the Zerko AI-powered interview platform. The API is built with Next.js 15 API routes, providing RESTful endpoints for interview management, resume analysis, user profiles, and AI-powered features.

## 🔐 Authentication & Authorization

### Authentication Methods

Zerko supports multiple authentication methods through NextAuth 5.0:

1. **Credentials Authentication**: Email/password login
2. **OAuth Providers**: Google and GitHub
3. **Session-based Authentication**: JWT tokens with HTTP-only cookies

### Authentication Flow

```typescript
// Client-side authentication
import { signIn, signOut, useSession } from 'next-auth/react';

// Sign in with credentials
await signIn('credentials', {
  email: 'user@example.com',
  password: 'password123',
  redirect: false
});

// Sign in with OAuth
await signIn('google', { callbackUrl: '/dashboard' });

// Get current session
const { data: session, status } = useSession();

// Sign out
await signOut({ callbackUrl: '/' });
```

### Protected Routes

All API routes under `/api/` (except authentication routes) require valid session authentication:

```typescript
// Middleware protection
export async function middleware(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return NextResponse.next();
}
```

## 🎤 Interview Management API

### Create New Interview

**Endpoint:** `POST /api/interview/new`

Creates a new interview session with resume upload and job details.

**Request Format:**
- Content-Type: `multipart/form-data`
- Authentication: Required (Session)

**Request Body:**
```typescript
interface InterviewCreationRequest {
  post: string;                    // Job title
  jobDescription: string;          // Detailed job requirements
  resume: File;                    // PDF, DOC, or DOCX file
  interviewType: 'TECHNICAL' | 'BEHAVIORAL' | 'HR' | 'SYSTEM_DESIGN';
  duration: string;                // Duration in minutes (5, 15, 30, 60)
}
```

**Example Request:**
```javascript
const formData = new FormData();
formData.append('post', 'Senior Software Engineer');
formData.append('jobDescription', 'Full-stack developer with React and Node.js experience...');
formData.append('resume', resumeFile);
formData.append('interviewType', 'TECHNICAL');
formData.append('duration', '30');

const response = await fetch('/api/interview/new', {
  method: 'POST',
  body: formData
});
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Interview created successfully",
  "interviewDets": {
    "id": "uuid-string",
    "userId": "user-uuid",
    "post": "Senior Software Engineer",
    "jobDescription": "Full-stack developer...",
    "interviewType": "TECHNICAL",
    "duration": 30,
    "resume": "https://res.cloudinary.com/...",
    "status": "STARTED",
    "startedAt": "2024-12-18T14:22:00Z",
    "createdAt": "2024-12-18T14:22:00Z",
    "updatedAt": "2024-12-18T14:22:00Z"
  }
}
```

**Error Responses:**
```json
// Validation Error (400)
{
  "error": "All fields are required"
}

// File Size Error (400)
{
  "error": "File size must be less than 5MB"
}

// Invalid File Type (400)
{
  "error": "Only PDF, DOC, or DOCX files are allowed"
}

// Unauthorized (401)
{
  "error": "Unauthorized - Please sign in"
}
```

### Get Interview Details

**Endpoint:** `GET /api/interview/[id]`

Retrieves detailed information about a specific interview.

**Parameters:**
- `id`: Interview UUID (path parameter)

**Success Response (200):**
```json
{
  "success": true,
  "interview": {
    "id": "uuid-string",
    "userId": "user-uuid",
    "post": "Senior Software Engineer",
    "jobDescription": "Full-stack developer...",
    "interviewType": "TECHNICAL",
    "duration": 30,
    "resume": "https://res.cloudinary.com/...",
    "status": "COMPLETED",
    "startedAt": "2024-12-18T14:22:00Z",
    "endedAt": "2024-12-18T14:52:00Z",
    "questions": [
      {
        "id": 1,
        "question": "Explain the difference between REST and GraphQL APIs",
        "type": "TECHNICAL"
      }
    ],
    "transcript": [
      {
        "role": "interviewer",
        "content": "Welcome to your interview...",
        "timestamp": "2024-12-18T14:22:00Z"
      },
      {
        "role": "candidate",
        "content": "Thank you for having me...",
        "timestamp": "2024-12-18T14:22:30Z"
      }
    ],
    "feedbackGenerated": true,
    "feedbackStr": "The candidate demonstrated strong technical knowledge...",
    "overall_rating": 8,
    "strengths": [
      "Strong technical communication",
      "Good problem-solving approach"
    ],
    "improvements": [
      "Could provide more specific examples",
      "Consider discussing edge cases"
    ],
    "createdAt": "2024-12-18T14:22:00Z",
    "updatedAt": "2024-12-18T14:52:00Z"
  }
}
```

### Generate Interview Feedback

**Endpoint:** `POST /api/feedback/[interview_id]`

Generates AI-powered feedback for a completed interview.

**Request Body:**
```json
{
  "post": "Senior Software Engineer",
  "jobDescription": "Full-stack developer with React and Node.js...",
  "resume_data": "Experienced software engineer with 5+ years...",
  "transcript": [
    {
      "role": "interviewer",
      "content": "Can you explain REST APIs?",
      "question_id": 1
    },
    {
      "role": "candidate", 
      "content": "REST APIs are architectural principles..."
    }
  ],
  "question_list": [
    {
      "id": 1,
      "question": "Can you explain REST APIs?"
    }
  ],
  "interview_type": "TECHNICAL"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Feedback generated successfully",
  "interview_id": "uuid-string",
  "feedback": {
    "feedBackStr": "The candidate demonstrated strong technical knowledge of REST APIs and provided clear explanations. Communication was effective and showed good understanding of web development concepts.",
    "overall_rating": 8,
    "strengths": [
      "Clear technical communication",
      "Strong understanding of REST principles",
      "Good use of examples"
    ],
    "improvements": [
      "Could discuss more advanced topics like caching",
      "Consider mentioning security best practices"
    ]
  },
  "meta": {
    "model": "gemini-3-pro",
    "temperature": 0.5,
    "attempts": 1,
    "processingTime": 2.3
  }
}
```

## 📄 Resume Analysis API

### Create Resume Analysis

**Endpoint:** `POST /api/resume/create`

Uploads and analyzes a resume against a job description.

**Request Format:**
- Content-Type: `multipart/form-data`
- Authentication: Required (Session)

**Request Body:**
```typescript
interface ResumeAnalysisRequest {
  title: string;           // Analysis title/name
  resume: File;           // PDF, DOC, or DOCX file
  jobDescription: string; // Target job description
}
```

**Success Response (200):**
```json
{
  "success": true,
  "resumeId": "uuid-string"
}
```

**Processing Flow:**
1. File upload to Cloudinary
2. Database record creation with `PROCESSING` status
3. Background AI analysis initiation
4. Automatic status updates via polling

### Get Resume Analysis

**Endpoint:** `GET /api/resume/[id]`

Retrieves detailed resume analysis results.

**Success Response (200):**
```json
{
  "success": true,
  "resume": {
    "id": "uuid-string",
    "userId": "user-uuid",
    "title": "Software Engineer Resume Analysis",
    "cloudinaryUrl": "https://res.cloudinary.com/...",
    "jobDescription": "We are looking for a skilled software engineer...",
    "resumeText": "John Doe\nSoftware Engineer\n...",
    "totalScore": 85,
    "status": "COMPLETED",
    "analysisResult": {
      "summary": "Strong technical resume with relevant experience in full-stack development...",
      "total_score": 85,
      "relevance": {
        "score": 18,
        "matched": ["JavaScript", "React", "Node.js", "Python"],
        "missing": ["Docker", "Kubernetes"],
        "suggestion": "Consider adding containerization technologies to strengthen your profile"
      },
      "impact": {
        "quantification_score": 12,
        "action_verbs_score": 8,
        "suggestion": "Add more quantifiable achievements with specific metrics"
      },
      "ats_compatibility": {
        "score": 16,
        "detected_sections": ["Experience", "Education", "Skills", "Contact"],
        "formatting_issues": ["Missing LinkedIn profile"],
        "suggestion": "Add professional social media links"
      },
      "jd_alignment": {
        "score": 22,
        "match_status": "High",
        "suggestion": "Excellent alignment with job requirements"
      },
      "recommendations": [
        "Add Docker and Kubernetes experience",
        "Include more quantified achievements",
        "Add LinkedIn profile URL"
      ],
      "strengths": [
        "Strong technical skill set",
        "Relevant work experience",
        "Clear project descriptions"
      ],
      "weaknesses": [
        "Missing some modern DevOps tools",
        "Could use more metrics in achievements"
      ]
    },
    "createdAt": "2024-12-18T14:22:00Z",
    "updatedAt": "2024-12-18T14:25:00Z"
  }
}
```

### Get All Resume Analyses

**Endpoint:** `GET /api/resume/all`

Retrieves all resume analyses for the authenticated user.

**Success Response (200):**
```json
{
  "success": true,
  "resumes": [
    {
      "id": "uuid-string",
      "title": "Software Engineer Resume",
      "totalScore": 85,
      "status": "COMPLETED",
      "createdAt": "2024-12-18T14:22:00Z",
      "jobDescription": "We are looking for...",
      "analysisResult": { /* analysis object */ }
    }
  ]
}
```

### Delete Resume Analysis

**Endpoint:** `DELETE /api/resume/delete/[id]`

Deletes a resume analysis and associated files.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Resume analysis deleted successfully"
}
```

## 👤 Profile Management API

### Get User Profile

**Endpoint:** `GET /api/profile`

Retrieves comprehensive user profile information.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-string",
      "email": "user@example.com",
      "name": "John Doe",
      "image": "https://res.cloudinary.com/...",
      "emailVerified": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "lastLoginAt": "2024-12-18T14:22:00Z"
    },
    "accountStatus": {
      "status": "active",
      "profileCompleteness": 85,
      "missingFields": ["phone", "bio"]
    },
    "authMethods": {
      "hasPassword": true,
      "providers": ["credentials", "google"],
      "twoFactorEnabled": false
    },
    "security": {
      "lastPasswordChange": "2024-11-15T09:15:00Z",
      "recentLoginAttempts": 0,
      "activeSessions": 2
    }
  }
}
```

### Update Display Name

**Endpoint:** `POST /api/profile/update-name`

Updates the user's display name with validation.

**Request Body:**
```json
{
  "name": "John Smith",
  "validateUniqueness": false
}
```

**Validation Rules:**
- Length: 2-50 characters
- Allowed characters: Letters, numbers, spaces, hyphens, underscores, periods
- Prohibited words: admin, root, system, null, undefined

**Success Response (200):**
```json
{
  "success": true,
  "message": "Display name updated successfully",
  "data": {
    "user": {
      "id": "uuid-string",
      "name": "John Smith",
      "email": "user@example.com",
      "image": "https://res.cloudinary.com/...",
      "updatedAt": "2024-12-18T14:22:00Z"
    },
    "changes": {
      "previousName": "John Doe",
      "newName": "John Smith",
      "changedAt": "2024-12-18T14:22:00Z"
    }
  }
}
```

### Update Password

**Endpoint:** `POST /api/profile/update-password`

Updates user password with security validation.

**Request Body:**
```json
{
  "currentPassword": "current_password",
  "newPassword": "new_secure_password",
  "confirmPassword": "new_secure_password"
}
```

**Password Policy:**
- Minimum 8 characters, maximum 128 characters
- Must contain: uppercase, lowercase, number, special character
- Cannot be a common password
- Cannot reuse last 5 passwords

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password updated successfully",
  "data": {
    "passwordChanged": true,
    "securityActions": {
      "sessionsInvalidated": 3,
      "notificationSent": true,
      "auditLogCreated": true
    },
    "passwordStrength": {
      "score": 4,
      "strength": "Strong"
    }
  }
}
```

### Upload Profile Image

**Endpoint:** `POST /api/profile/upload-image`

Uploads and optimizes profile image.

**Request Format:**
- Content-Type: `multipart/form-data`
- Field: `image` (File)

**File Validation:**
- Max size: 5MB
- Allowed formats: JPEG, PNG, WebP, GIF
- Automatic optimization and face detection

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile image updated successfully",
  "data": {
    "imageUrl": "https://res.cloudinary.com/zerko/image/upload/v1234567890/profiles/user_abc123.jpg",
    "publicId": "profiles/user_abc123",
    "user": {
      "id": "uuid-string",
      "name": "John Doe",
      "email": "user@example.com",
      "image": "https://res.cloudinary.com/...",
      "updatedAt": "2024-12-18T14:22:00Z"
    },
    "imageMetadata": {
      "width": 400,
      "height": 400,
      "format": "jpg",
      "bytes": 45678,
      "transformation": "c_fill,g_face,h_400,w_400"
    }
  }
}
```

## 🔐 Authentication API

### Sign Up

**Endpoint:** `POST /api/auth/sign-up`

Creates a new user account with email verification.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure_password123",
  "name": "John Doe"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "name": "John Doe",
    "emailVerified": false,
    "createdAt": "2024-12-18T14:22:00Z"
  }
}
```

### Sign In

**Endpoint:** `POST /api/auth/sign-in`

Authenticates user with credentials.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure_password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Authentication successful",
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "name": "John Doe",
    "image": "https://res.cloudinary.com/...",
    "lastLoginAt": "2024-12-18T14:22:00Z"
  },
  "session": {
    "expires": "2024-12-19T14:22:00Z"
  }
}
```

## 🤖 AI Backend API (Python FastAPI)

### Parse Resume

**Endpoint:** `POST /api/parse`

Extracts text content from uploaded resume files.

**Request Body:**
```json
{
  "resumeUrl": "https://res.cloudinary.com/..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "resumeData": "John Doe\nSoftware Engineer\n5+ years experience in full-stack development..."
}
```

### Generate Questions

**Endpoint:** `POST /api/generate/questions`

Generates interview questions based on resume and job description.

**Request Body:**
```json
{
  "post": "Senior Software Engineer",
  "job_description": "We are looking for an experienced full-stack developer...",
  "resumeData": "John Doe\nSoftware Engineer...",
  "interview_type": "TECHNICAL",
  "duration": "30m"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "question": "Can you explain the difference between REST and GraphQL APIs?",
      "type": "TECHNICAL",
      "difficulty": "intermediate"
    },
    {
      "id": 2,
      "question": "How would you optimize a slow database query?",
      "type": "TECHNICAL", 
      "difficulty": "advanced"
    }
  ]
}
```

### Interview Next Question

**Endpoint:** `POST /api/interview/next`

Generates the next interview question based on conversation context.

**Request Body:**
```json
{
  "post": "Senior Software Engineer",
  "job_description": "Full-stack developer...",
  "resumeData": "John Doe...",
  "questions": [
    {
      "id": 1,
      "question": "Explain REST APIs"
    }
  ],
  "messages": [
    {
      "role": "interviewer",
      "content": "Can you explain REST APIs?",
      "question_id": 1
    },
    {
      "role": "candidate",
      "content": "REST APIs are architectural principles..."
    }
  ],
  "time_left": 1800000,
  "force_next": false
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "AIResponse": "Great explanation! Now, can you tell me about your experience with database optimization?",
    "endInterview": false,
    "question_id": 2,
    "lastQuestion": false,
    "metadata": {
      "processingTime": 1.2,
      "modelUsed": "gemini-3-pro"
    }
  }
}
```

### Resume Analysis

**Endpoint:** `POST /api/analysis`

Initiates background resume analysis processing.

**Request Body:**
```json
{
  "resumeId": "uuid-string",
  "fileUrl": "https://res.cloudinary.com/...",
  "JobDescription": "We are looking for a skilled software engineer..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Analysis started in background",
  "resumeId": "uuid-string",
  "status": "PROCESSING"
}
```

## 📊 Error Handling & Status Codes

### Standard HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH requests |
| 201 | Created | Successful POST requests that create resources |
| 400 | Bad Request | Invalid request data or validation errors |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Valid auth but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists or conflict |
| 422 | Unprocessable Entity | Valid request but semantic errors |
| 429 | Too Many Requests | Rate limiting exceeded |
| 500 | Internal Server Error | Server-side errors |

### Error Response Format

All error responses follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "specific_field",
      "reason": "validation_failed",
      "provided": "invalid_value"
    },
    "timestamp": "2024-12-18T14:22:00Z",
    "requestId": "req_abc123"
  }
}
```

### Common Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| `VALIDATION_ERROR` | Request validation failed | Check request format and required fields |
| `AUTHENTICATION_REQUIRED` | Missing authentication | Sign in and include session |
| `INSUFFICIENT_PERMISSIONS` | Access denied | Check user permissions |
| `RESOURCE_NOT_FOUND` | Resource doesn't exist | Verify resource ID |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Wait and retry with backoff |
| `FILE_TOO_LARGE` | File exceeds size limit | Reduce file size |
| `INVALID_FILE_TYPE` | Unsupported file format | Use supported formats |
| `EXTERNAL_SERVICE_ERROR` | Third-party service failure | Retry or contact support |

## 🔄 Rate Limiting

### Rate Limit Headers

All API responses include rate limiting headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
X-RateLimit-Window: 3600
```

### Rate Limits by Endpoint

| Endpoint Category | Limit | Window | Notes |
|------------------|-------|--------|-------|
| Authentication | 5 requests | 15 minutes | Per IP address |
| Profile Updates | 10 requests | 1 hour | Per user |
| File Uploads | 20 requests | 1 hour | Per user |
| Interview Creation | 5 requests | 1 hour | Per user |
| Resume Analysis | 10 requests | 1 hour | Per user |
| General API | 100 requests | 1 hour | Per user |

## 📝 Request/Response Examples

### Complete Interview Flow Example

```javascript
// 1. Create Interview
const createInterview = async () => {
  const formData = new FormData();
  formData.append('post', 'Senior Software Engineer');
  formData.append('jobDescription', 'Full-stack developer with React and Node.js...');
  formData.append('resume', resumeFile);
  formData.append('interviewType', 'TECHNICAL');
  formData.append('duration', '30');

  const response = await fetch('/api/interview/new', {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  return data.interviewDets.id;
};

// 2. Get Interview Questions (from AI backend)
const getQuestions = async (interviewData) => {
  const response = await fetch('http://localhost:8000/api/generate/questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      post: interviewData.post,
      job_description: interviewData.jobDescription,
      resumeData: interviewData.resumeText,
      interview_type: interviewData.type,
      duration: interviewData.duration
    })
  });
  
  return response.json();
};

// 3. Conduct Interview (get next question)
const getNextQuestion = async (conversationData) => {
  const response = await fetch('http://localhost:8000/api/interview/next', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(conversationData)
  });
  
  return response.json();
};

// 4. Generate Feedback
const generateFeedback = async (interviewId, feedbackData) => {
  const response = await fetch(`http://localhost:8000/api/feedback/${interviewId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(feedbackData)
  });
  
  return response.json();
};
```

### Complete Resume Analysis Flow Example

```javascript
// 1. Create Resume Analysis
const analyzeResume = async (resumeFile, jobDescription, title) => {
  const formData = new FormData();
  formData.append('resume', resumeFile);
  formData.append('jobDescription', jobDescription);
  formData.append('title', title);

  const response = await fetch('/api/resume/create', {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  return data.resumeId;
};

// 2. Poll for Analysis Results
const pollAnalysisStatus = async (resumeId) => {
  const poll = async () => {
    const response = await fetch(`/api/resume/${resumeId}`);
    const data = await response.json();
    
    if (data.resume.status === 'COMPLETED') {
      return data.resume;
    } else if (data.resume.status === 'FAILED') {
      throw new Error('Analysis failed');
    } else {
      // Still processing, poll again in 3 seconds
      await new Promise(resolve => setTimeout(resolve, 3000));
      return poll();
    }
  };
  
  return poll();
};

// 3. Get All Resume Analyses
const getAllResumes = async () => {
  const response = await fetch('/api/resume/all');
  return response.json();
};
```

## 🔧 SDK & Client Libraries

### JavaScript/TypeScript SDK

```typescript
class ZerkoAPI {
  private baseUrl: string;
  private session: any;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  // Interview methods
  async createInterview(data: InterviewCreationRequest): Promise<Interview> {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const response = await fetch(`${this.baseUrl}/interview/new`, {
      method: 'POST',
      body: formData
    });

    return this.handleResponse(response);
  }

  async getInterview(id: string): Promise<Interview> {
    const response = await fetch(`${this.baseUrl}/interview/${id}`);
    return this.handleResponse(response);
  }

  // Resume methods
  async createResumeAnalysis(data: ResumeAnalysisRequest): Promise<{ resumeId: string }> {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const response = await fetch(`${this.baseUrl}/resume/create`, {
      method: 'POST',
      body: formData
    });

    return this.handleResponse(response);
  }

  async getResumeAnalysis(id: string): Promise<ResumeAnalysis> {
    const response = await fetch(`${this.baseUrl}/resume/${id}`);
    return this.handleResponse(response);
  }

  // Profile methods
  async updateProfile(data: ProfileUpdateRequest): Promise<User> {
    const response = await fetch(`${this.baseUrl}/profile/update-name`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    return this.handleResponse(response);
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }
    return response.json();
  }
}

// Usage
const api = new ZerkoAPI();

// Create interview
const interview = await api.createInterview({
  post: 'Software Engineer',
  jobDescription: 'Full-stack developer...',
  resume: resumeFile,
  interviewType: 'TECHNICAL',
  duration: '30'
});
```

## 📚 Additional Resources

- [Authentication Guide](./AUTHENTICATION_GUIDE.md)
- [Error Handling Best Practices](./ERROR_HANDLING.md)
- [Rate Limiting Guide](./RATE_LIMITING.md)
- [API Testing Guide](./API_TESTING.md)
- [Webhook Documentation](./WEBHOOKS.md)

---

**Document Version**: 1.0.0  
**Last Updated**: December 2024  
**API Version**: v1  
**Maintained By**: Zerko Development Team