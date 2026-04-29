# 🎓 AI Study Planner

> A full-stack SaaS web application that generates intelligent, personalized study schedules using a deterministic priority-scoring algorithm.

![Tech Stack](https://img.shields.io/badge/Spring_Boot-3.2.4-6DB33F?style=flat&logo=springboot)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=flat&logo=tailwindcss)

---

## 🚀 Quick Start

### Prerequisites
- Java 17+
- Maven 3.6+
- Node.js 18+
- Docker & Docker Compose (for PostgreSQL)

---

### Option A — Local Development (Recommended)

**1. Start the PostgreSQL database:**
```bash
docker compose up postgres -d
```

**2. Start the Spring Boot backend:**
```bash
cd backend
mvn spring-boot:run
```
> Backend runs at `http://localhost:8080`

**3. Start the React frontend:**
```bash
cd frontend
npm install
npm run dev
```
> Frontend runs at `http://localhost:5173`

---

### Option B — Full Docker Deployment

```bash
docker compose up --build
```
> App runs at `http://localhost:80`

---

## 📁 Project Structure

```
Study Planning/
├── backend/                    ← Spring Boot (Maven)
│   └── src/main/java/com/studyplanner/
│       ├── controller/         # HTTP layer
│       ├── service/            # Business logic + planning engine
│       ├── repository/         # JPA data access
│       ├── model/              # JPA entities
│       ├── dto/                # Request & Response DTOs
│       ├── security/           # JWT filter + UserDetailsService
│       ├── config/             # Security & CORS config
│       └── exception/          # Global error handling
├── frontend/                   ← React + Vite + TailwindCSS
│   └── src/
│       ├── api/                # Axios API calls
│       ├── context/            # Auth context
│       ├── components/         # Reusable UI
│       └── pages/              # 5 application pages
├── docker-compose.yml
└── README.md
```

---

## 🔐 Authentication

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | Login → receives JWT |

All other endpoints require: `Authorization: Bearer <token>`

---

## 📡 API Reference

### Subjects
| Endpoint | Method | Description |
|---|---|---|
| `/api/subjects` | GET | List all subjects |
| `/api/subjects` | POST | Create subject |
| `/api/subjects/{id}` | PUT | Update subject |
| `/api/subjects/{id}` | DELETE | Delete subject |

### Planner
| Endpoint | Method | Description |
|---|---|---|
| `/api/planner/generate` | POST | Generate study plan |
| `/api/planner` | GET | Get all sessions grouped by date |
| `/api/sessions/{id}/complete` | PUT | Mark session complete |
| `/api/sessions/{id}/miss` | PUT | Mark session missed |

### Stats
| Endpoint | Method | Description |
|---|---|---|
| `/api/stats` | GET | Get progress statistics |

---

## 🧠 Planning Algorithm

The engine prioritizes subjects using a weighted formula:

```
priorityScore = (importance × 0.5) + (difficulty × 0.3) + (urgency × 0.2)

where urgency = 1 / (days_until_exam + 1)
```

| Factor | Weight | Rationale |
|---|---|---|
| Importance | 50% | High-stakes subjects get priority |
| Difficulty | 30% | Harder subjects need more time |
| Urgency | 20% | Closer exams increase frequency |

---

## ⚙️ Configuration

Edit `backend/src/main/resources/application.yml`:

```yaml
app:
  jwt:
    secret: <your-base64-encoded-256-bit-secret>
    expiration: 86400000   # 24 hours in milliseconds
```

> ⚠️ **Change the JWT secret before deploying to production!**

---

## 🧪 Running Tests

```bash
cd backend
mvn test
```

---

## 📄 License

MIT — built for educational purposes.
