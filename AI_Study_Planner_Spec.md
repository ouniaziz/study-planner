# 🎓 AI Study Planner — Project Specification

> **Version:** 1.0.0 | **Status:** In Development | **Type:** Full-Stack SaaS Web Application

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Core Objectives](#core-objectives)
3. [Tech Stack](#tech-stack)
4. [Authentication & Authorization](#authentication--authorization)
5. [Domain Model](#domain-model)
6. [Business Rules](#business-rules)
7. [Study Planning Engine](#study-planning-engine)
8. [API Design](#api-design)
9. [Backend Architecture](#backend-architecture)
10. [Frontend Requirements](#frontend-requirements)
11. [Validation Rules](#validation-rules)
12. [Optional AI Enhancements](#optional-ai-enhancements)
13. [Testing Strategy](#testing-strategy)
14. [Roadmap & Improvements](#roadmap--improvements)
15. [Deliverables](#deliverables)
16. [Implementation Guide](#implementation-guide)

---

## 🧠 Project Overview

**AI Study Planner** is a full-stack SaaS web application that generates intelligent, personalized study schedules for students. By analyzing subject difficulty, importance, deadlines, and user availability, the system produces optimized weekly plans that adapt to each student's unique learning profile.

The core engine is **deterministic and rule-based**, ensuring predictable, explainable results — with optional AI-powered enhancements layered on top for a smarter, adaptive experience.

### 🎯 Who Is It For?

| Audience | Use Case |
|----------|----------|
| High school & university students | Exam preparation planning |
| Self-learners | Structured course completion |
| Competitive exam candidates | Long-term multi-subject scheduling |

---

## 🎯 Core Objectives

- **Auto-generate** optimized study plans based on user inputs
- **Prioritize tasks** intelligently using a weighted scoring formula
- **Track progress** with measurable metrics and visual feedback
- **Adapt schedules** when sessions are missed or circumstances change
- **Motivate users** through gamification and streak systems

---

## 🏗️ Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| **React** (Vite) | UI framework with fast dev server |
| **Tailwind CSS** | Utility-first styling |
| **Axios** | HTTP client with JWT interceptor |
| **React Router** | Client-side routing |
| **Recharts / Chart.js** | Progress visualizations |

### Backend

| Technology | Purpose |
|------------|---------|
| **Spring Boot** | Application framework |
| **Spring Security + JWT** | Authentication & authorization |
| **Spring Data JPA** | Database ORM layer |
| **REST API** | Client-server communication |

### Database

| Technology | Purpose |
|------------|---------|
| **PostgreSQL** | Primary relational database |

### Infrastructure

| Technology | Purpose |
|------------|---------|
| **Docker** | Containerized deployment |
| **GitHub Actions** | CI/CD pipeline (recommended) |

---

## 🔐 Authentication & Authorization

### Security Model

- **JWT-based** stateless authentication
- **BCrypt** password hashing (strength factor: 12)
- Tokens expire after configurable duration (default: 24h)
- All protected endpoints require `Authorization: Bearer <token>` header

### Endpoints

```
POST /api/auth/register    → Create a new user account
POST /api/auth/login       → Authenticate and receive JWT token
```

### Register Request

```json
{
  "email": "student@example.com",
  "password": "securePass123"
}
```

### Login Response

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400
}
```

### User Roles

| Role | Description |
|------|-------------|
| `USER` | Default role — full access to own data only |

---

## 📚 Domain Model

### Entity Relationship Overview

```
User (1) ──── (N) Subject
User (1) ──── (N) StudySession
Subject (1) ── (N) StudySession
```

---

### 👤 User

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `email` | String (unique) | Login identifier |
| `password` | String (hashed) | BCrypt-hashed password |
| `createdAt` | Timestamp | Account creation date |

---

### 📖 Subject

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `userId` | UUID | FK → User | Owner reference |
| `name` | String | Required | Subject name |
| `difficulty` | Integer | 1–5 | How hard the subject is |
| `importance` | Integer | 1–5 | How critical for the exam |
| `examDate` | LocalDate | Future date | Scheduled exam date |

---

### 📅 StudySession *(Core Entity)*

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `userId` | UUID | FK → User | Owner reference |
| `subjectId` | UUID | FK → Subject | Associated subject |
| `date` | LocalDate | Required | Scheduled date |
| `startTime` | LocalTime | Optional | Start time of session |
| `duration` | Integer | ≥ 30 min | Duration in minutes |
| `status` | Enum | — | `PLANNED` / `COMPLETED` / `MISSED` |

---

## ⚙️ Business Rules

> ⚠️ These rules are **critical** and must be enforced at the service layer.

| # | Rule |
|---|------|
| 1 | A user can **only access their own data** (enforced via JWT principal) |
| 2 | Subjects must **belong to the authenticated user** |
| 3 | Study sessions are **system-generated**, not manually created initially |
| 4 | **No overlapping sessions** on the same day |
| 5 | **Minimum session duration** = 30 minutes |
| 6 | **Maximum sessions per day** = configurable (default: **4**) |
| 7 | Sessions cannot be scheduled on **past dates** |
| 8 | Subjects with past exam dates should be **excluded** from planning |

---

## 🧠 Study Planning Engine

This is the heart of the application. The engine transforms user inputs into a structured schedule.

### Inputs

| Input | Description |
|-------|-------------|
| `subjects` | List of user's subjects with metadata |
| `hoursPerDay` | Daily study availability (hours) |
| `startDate` | Plan generation start date (usually today) |
| `planDays` | Number of days to plan ahead (e.g., 14 or 30) |

### Output

A list of `StudySession` entities, persisted to the database and returned grouped by date.

---

### Priority Score Formula

The algorithm assigns each subject a **priority score** to determine daily session ordering:

```
priorityScore = (importance × 0.5) + (difficulty × 0.3) + (urgency × 0.2)

Where:
  urgency = 1 / (days_until_exam + 1)
```

| Factor | Weight | Rationale |
|--------|--------|-----------|
| `importance` | 50% | High-stakes subjects always get priority |
| `difficulty` | 30% | Harder subjects need more distributed attention |
| `urgency` | 20% | Closer deadlines increase session frequency |

---

### Algorithm Steps

```
1. Fetch all active subjects belonging to the user
2. For each subject:
   a. Compute days_until_exam from today
   b. Calculate priorityScore using the formula above
3. Sort subjects DESC by priorityScore
4. For each day in the planning window:
   a. Calculate available time slots based on hoursPerDay
   b. Assign sessions to subjects in priority order
   c. Respect max sessions per day limit
   d. Mark session as PLANNED
5. Stop when:
   - All available time slots are filled, OR
   - All subjects have sufficient coverage
6. Persist all generated sessions to the database
```

---

## 📡 API Design

### Authentication

```
POST   /api/auth/register          → Register new user
POST   /api/auth/login             → Login and get JWT
```

### Subjects

```
POST   /api/subjects               → Create a subject
GET    /api/subjects               → List all user's subjects
PUT    /api/subjects/{id}          → Update a subject
DELETE /api/subjects/{id}          → Delete a subject
```

### Planner

```
POST   /api/planner/generate       → Generate study sessions
GET    /api/planner                → Get sessions grouped by date
```

#### Planner Generate Request

```json
{
  "hoursPerDay": 4,
  "startDate": "2025-07-01",
  "planDays": 14
}
```

#### Planner Response (grouped by date)

```json
{
  "2025-07-01": [
    {
      "id": "uuid",
      "subjectName": "Mathematics",
      "duration": 90,
      "startTime": "09:00",
      "status": "PLANNED"
    }
  ],
  "2025-07-02": [...]
}
```

### Sessions

```
PUT    /api/sessions/{id}/complete → Mark session as COMPLETED
PUT    /api/sessions/{id}/miss     → Mark session as MISSED
```

### Statistics

```
GET    /api/stats                  → Get user progress stats
```

#### Stats Response

```json
{
  "completionRate": 75,
  "totalStudyTime": 1200,
  "streak": 5,
  "subjectsProgress": [
    {
      "subjectId": "uuid",
      "subjectName": "Physics",
      "completedSessions": 8,
      "totalSessions": 12,
      "progressPercent": 66
    }
  ]
}
```

---

## 🧩 Backend Architecture

### Package Structure

```
com.studyplanner
│
├── controller/         # HTTP layer — handles requests, returns DTOs
├── service/            # Business logic — planning algorithm lives here
├── repository/         # Data access — JPA repositories
├── model/              # JPA entities (User, Subject, StudySession)
├── dto/                # Request & Response data transfer objects
├── mapper/             # Entity ↔ DTO conversion (MapStruct recommended)
├── security/           # JWT filter, UserDetailsService, config
├── config/             # Spring beans, CORS, app configuration
└── exception/          # Custom exceptions and global error handler
```

### Layer Responsibilities

| Layer | Responsibility |
|-------|---------------|
| **Controller** | Validate HTTP input, delegate to service, return DTO responses |
| **Service** | Core business logic, planning algorithm, transaction management |
| **Repository** | Database queries via JPA, no business logic |
| **DTO** | Decoupled request/response objects — never expose entities directly |
| **Mapper** | Clean conversion between entities and DTOs |
| **Security** | JWT token parsing, request filtering, role enforcement |
| **Exception** | Centralized error handling with consistent error response format |

### Standard Error Response

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "examDate must be in the future",
  "timestamp": "2025-07-01T10:30:00Z"
}
```

---

## 🎨 Frontend Requirements

### Pages & Features

#### 1. 🔑 Auth Page
- Login form
- Registration form
- Form validation with user-friendly error messages
- Redirect to Dashboard on success

#### 2. 📊 Dashboard
- Summary stats (completion rate, total hours, streak)
- Upcoming sessions (next 7 days)
- Quick action buttons: "Generate Plan", "Add Subject"

#### 3. 📚 Subjects Page
- List all subjects with difficulty & importance indicators
- Create / Edit / Delete subjects
- Color-coded urgency indicators based on exam date proximity

#### 4. 📅 Planner Page
- "Generate Plan" button with config options (hours/day, duration)
- **Calendar view** displaying sessions per day
- Click session to mark as complete or missed

#### 5. 📈 Progress Page
- Bar chart: completed vs. planned sessions per subject
- Pie chart: time distribution across subjects
- Streak counter and milestone badges

---

### State Management

- **React Context API** for auth state (user + token)
- Local component state for forms and UI interactions
- **Redux** optional for complex state if needed

### API Layer

```javascript
// src/api/axiosInstance.js
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Attach JWT to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally (redirect to login)
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
```

---

## ✅ Validation Rules

| Field | Rule |
|-------|------|
| `difficulty` | Integer between 1 and 5 (inclusive) |
| `importance` | Integer between 1 and 5 (inclusive) |
| `examDate` | Must be a future date |
| `email` | Valid email format |
| `password` | Minimum 6 characters |
| `hoursPerDay` | Between 1 and 16 |
| `duration` | Minimum 30 minutes |

---

## 🤖 Optional AI Enhancements

These features can be integrated to elevate the experience beyond the rule-based engine:

| Feature | Description |
|---------|-------------|
| **Optimal Study Hours Suggestion** | Analyze past completion patterns to suggest best times of day |
| **Weak Subject Detection** | Flag subjects with high missed-session rates for intervention |
| **Adaptive Rescheduling** | Auto-adjust future sessions when previous ones are missed |
| **Natural Language Input** | Let users describe availability in plain text ("I'm free weekday evenings") |
| **Performance Forecasting** | Predict readiness score for each subject based on progress trends |

---

## 🧪 Testing Strategy

### Unit Tests (Service Layer)

- Priority score calculation correctness
- Algorithm produces no overlapping sessions
- Max sessions per day constraint respected
- Minimum duration constraint enforced

### Integration Tests (API Layer)

- Auth endpoints return valid JWT
- Protected routes reject unauthenticated requests
- Users cannot access other users' data
- Planner generates correct number of sessions

### Test Tools

| Tool | Purpose |
|------|---------|
| JUnit 5 | Unit testing |
| Mockito | Service layer mocking |
| Spring Boot Test | Integration testing |
| H2 (in-memory) | Test database |
| Postman / Newman | API contract testing |

---

## 🚀 Roadmap & Improvements

### Phase 1 — MVP (Current Scope)
- [x] JWT authentication
- [x] Subject CRUD
- [x] Planning engine
- [x] Session status tracking
- [x] Basic stats

### Phase 2 — Enhanced UX
- [ ] **Availability settings** — preferred hours, rest days, time-of-day preference
- [ ] **Session rescheduling** — auto-adjust when sessions are missed
- [ ] **Dark mode** UI toggle
- [ ] **Email reminders** for upcoming sessions

### Phase 3 — Gamification & AI
- [ ] **Streak system** — daily study streaks with milestone rewards
- [ ] **Achievement badges** — unlock rewards for consistency
- [ ] **AI-powered adaptive scheduling** based on performance history
- [ ] **Mobile app** (React Native)

---

## ✅ Deliverables

| Deliverable | Status |
|-------------|--------|
| Spring Boot backend with full REST API | 🔲 Pending |
| React frontend (5 pages) | 🔲 Pending |
| Planning engine with priority algorithm | 🔲 Pending |
| JWT authentication system | 🔲 Pending |
| PostgreSQL schema + migrations | 🔲 Pending |
| Unit & integration test suite | 🔲 Pending |
| GitHub repository with README | 🔲 Pending |
| Docker Compose setup | 🔲 Pending |

---

## 👨‍💻 Implementation Guide

### Recommended Build Order

#### Backend

```
Step 1: Project setup (Spring Initializr, dependencies, DB config)
Step 2: Domain entities (User, Subject, StudySession)
Step 3: Repositories (JPA interfaces)
Step 4: DTOs & Mappers
Step 5: Security config (JWT filter, UserDetailsService)
Step 6: Auth endpoints (register, login)
Step 7: Subject CRUD service + controller
Step 8: Planning engine (core algorithm)
Step 9: Planner endpoints (generate, get)
Step 10: Session status endpoints + Stats endpoint
Step 11: Exception handling (global @ControllerAdvice)
Step 12: Unit & integration tests
```

#### Frontend

```
Step 1: Vite + React project setup, Tailwind config
Step 2: Axios instance with JWT interceptor
Step 3: Auth Context + Login/Register pages
Step 4: Protected route wrapper
Step 5: Dashboard page (stats + upcoming sessions)
Step 6: Subjects page (CRUD)
Step 7: Planner page (generate + calendar view)
Step 8: Progress page (charts)
Step 9: Dark mode toggle
Step 10: Responsive design polish
```

### Key Design Principles

- **SOLID** — Single responsibility per class, dependency injection everywhere
- **Clean Architecture** — No business logic in controllers, no DB queries in services
- **DTO Pattern** — Never expose JPA entities via API responses
- **Fail Fast** — Validate inputs at the controller layer before reaching services
- **Security First** — Enforce user ownership checks in every service method

---

*Last updated: July 2025 | Maintained by the AI Study Planner Team*
