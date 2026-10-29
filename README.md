# TimeWeave — Adaptive Personal Time and Workload Optimizer

TimeWeave is a full-stack, AI-powered personal time and workload optimization web application designed to help students, professionals, and teams plan their time realistically.

Unlike conventional to-do lists, TimeWeave:
- Learns actual task durations from historical completion variance using Scikit-Learn regression.
- Compares planned workload against available working hours.
- Detects overcommitment before burnout occurs.
- Generates realistic schedules respecting hard and soft constraints (deadlines, dependencies, energy cycles, and breaks).
- Implements the exact pastel aesthetic and 14 UI screens specified in the primary design reference.

---

## 1. Architecture Overview

```
TimeWeave
├── frontend/               # React 19 + Vite 8 + Tailwind CSS 4 + TypeScript
│   ├── src/pages/          # 13 Implemented View Pages (Landing, Auth, Onboarding, Dashboard, etc.)
│   ├── src/components/     # Modular Layout, Modals, Drawers, and UI components
│   ├── src/context/        # AuthContext and TaskContext with live focus timers
│   └── src/api/            # Typed REST API Client with JWT authorization
├── backend/                # Node.js + Express.js + TypeScript
│   ├── src/db/             # Dual-engine database adapter (PostgreSQL + SQLite zero-config fallback)
│   ├── src/migrations/     # SQL schema migrations (001_initial_schema.sql)
│   ├── src/controllers/    # Auth, Tasks, Schedules, Analytics, History, Notifications, Chat
│   └── tests/              # Automated backend integration tests (api.test.js)
├── ml_service/             # Python 3.11 + FastAPI + Scikit-Learn
│   ├── model.py            # Random Forest Duration Regression & Cold-Start Baseline Heuristics
│   ├── optimizer.py        # Deterministic Constraint-Based Scheduling Engine
│   ├── train.py            # Model training & benchmark dataset generator
│   └── tests/              # Automated ML and constraint scheduling unit tests
├── start-all.js            # Unified one-command startup launcher
└── test-all.js             # Automated end-to-end test runner
```

---

## 2. Implemented Screens (Matching Primary Reference Image)

1. **Landing Page (`/`)**: Hero section ("Plan Smarter. Work Better. Live Balanced."), floating category pills, interactive schedule demonstration preview, and 4 core value proposition feature cards.
2. **Login & Register (`/login`, `/register`)**: Welcome Back card, segmented login/register toggle, field validation, and bcrypt password hashing.
3. **Onboarding & Personalization (`/onboarding`)**: Goal selection cards (Study, Work, Personal, Health, Hobbies, Other), preferred working hours (Start/End), and energy peak preferences.
4. **User Dashboard Overview (`/dashboard`)**: Personalized greeting ("Good Morning, Shivani! ☀️"), 4 KPI summary cards (Tasks Today, Completed, Focus Time, Productivity Score), Today's Schedule with completion checkboxes, Recharts Weekly Overview bar chart (Planned vs Actual), and AI Insight banner.
5. **Task Management (`/tasks`)**: Filter tabs (`All Tasks`, `Today`, `Upcoming`, `Completed`), category and priority dropdowns, search bar, and action controls.
6. **Calendar & Timeline (`/calendar`)**: September 2026 timetable grid (8 AM - 6 PM), pastel colored task blocks (Study, Work, Health, Personal, Break), mini calendar widget, and category legend.
7. **AI Schedule Recommendations (`/ai-schedule`)**: 3 interactive optimization cards with `[Apply]` buttons, Overcommitment Alert with `[View Options]`, and timeline preview with `[Accept & Save Schedule]`.
8. **Workload Analytics & Insights (`/analytics`)**: Top 4 KPI metrics, Recharts Task Completion Trend spline chart, Recharts Time Distribution donut chart, and 3 data-driven cognitive insights.
9. **Focus Mode (Pomodoro) (`/focus`)**: Atmospheric deep indigo flow space, large circular countdown timer, Pomodoro/Stopwatch modes, and interruption recording.
10. **Task Creation Modal (AI Assisted)**: Segmented Manual vs AI Assisted tabs, live duration estimator displaying "AI Estimated: Xh Ym", energy level, and dependency linking.
11. **AI Assistant Chat (`/assistant`)**: Interactive productivity coach matching reference dialogue ("I have 5 tasks tomorrow. Is it realistic?"), feasibility breakdown, suggested schedule, and quick action buttons (`[Yes, create schedule]`, `[Show alternatives]`, `[No, keep as is]`).
12. **Profile & Settings (`/settings`)**: Profile Information, avatar upload, working hour preferences, break duration, and ML privacy management.
13. **Notifications Center (`/notifications`)**: Schedule updates, deadline reminders, goal achievements, and overcommitment alerts.
14. **Mobile Responsive UI**: Bottom navigation bar (`Home`, `Tasks`, `Calendar`, `Analytics`, `More`) ensuring complete usability on small screens.

---

## 3. Prerequisites & Database Configuration

- **Node.js**: v18.0.0 or higher (v24.x tested)
- **npm**: v9.0.0 or higher
- **Python**: v3.10 or higher (v3.11 tested) with pip
- **Database**:
  - **PostgreSQL (Primary & Configured)**: Local PostgreSQL is configured and active.
    - URL: `postgresql://postgres:1234@localhost:5432/timeweave`
    - Tables: 12 relational tables (`users`, `user_preferences`, `tasks`, `task_dependencies`, `task_time_sessions`, `task_interruptions`, `schedule_versions`, `schedule_blocks`, `task_history`, `model_predictions`, `notifications`, `model_metrics`).
  - **Zero-config SQLite (Fallback)**: When `DATABASE_URL` is omitted, the dual-engine database manager falls back to embedded SQLite.

### Pre-seeded Demo Credentials
- **Email:** `demo@timeweave.app`
- **Password:** `demoPassword123!`
- Seed command: `npm run seed` (or `cd backend && npm run seed`)

---

## 4. Quick Start (Single Command)

From the project root directory (`C:\Users\SHIVANI\TimeWeave\TimeWeave`):

```bash
# 1. Seed or re-seed sample user data (optional)
npm run seed

# 2. Start all 3 services concurrently
npm run dev
# Or: node start-all.js
```

The services will launch automatically:
- **Frontend Web UI**: http://localhost:3000
- **Node.js API Gateway**: http://localhost:5000/api
- **Python ML Service**: http://127.0.0.1:8000

---

## 5. Running Automated Tests

Run the full end-to-end automated test suite:

```bash
npm test
# Or: node test-all.js
```

This runs:
1. **Python ML & Constraint Optimizer Tests (10 unit tests)**: Evaluates heuristic baseline predictions, Random Forest model predictions, overcommitment detection, priority/energy ordering, break insertion, and 4.J natural language queries.
2. **Backend REST API Integration Tests (12 integration tests)**: Executes health checks, registration, duplicate checks, token auth, multi-user data isolation, task CRUD, completion logging, preferences, schedule generation/acceptance, focus sessions, real analytics calculations, and notifications against PostgreSQL.

---

## 6. Manual Step-by-Step Startup

If you prefer starting each service individually in separate terminals:

### Terminal 1: Python AI/ML Service
```bash
python ml_service/main.py
# Runs on http://127.0.0.1:8000
```

### Terminal 2: Node.js Express Backend
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

### Terminal 3: React Vite Frontend
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

---

## 7. API Reference Contract

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new account with password hashing |
| `POST` | `/api/auth/login` | Authenticate and obtain JWT token |
| `POST` | `/api/auth/logout` | Invalidate active user session |
| `GET` | `/api/auth/me` | Fetch authenticated user profile & preferences |
| `POST` | `/api/auth/change-password` | Update account password |
| `GET` | `/api/tasks` | List tasks with category, priority, and search filters |
| `POST` | `/api/tasks` | Create task with ML predicted duration |
| `PATCH` | `/api/tasks/:id` | Update task details |
| `DELETE` | `/api/tasks/:id` | Delete task with confirmation |
| `POST` | `/api/tasks/:id/complete` | Complete task and record actual duration variance |
| `POST` | `/api/tasks/:id/start-timer` | Begin active focus tracking session |
| `POST` | `/api/tasks/:id/stop-timer` | End focus session and accumulate minutes |
| `POST` | `/api/tasks/:id/interruptions` | Record an unplanned delay / interruption |
| `GET` | `/api/focus/sessions` | List user focus timer sessions and total minutes |
| `POST` | `/api/focus/sessions` | Log a completed focus session |
| `POST` | `/api/schedules/generate` | Propose constraint-based daily schedule |
| `POST` | `/api/schedules/:id/accept` | Accept and persist schedule version |
| `GET` | `/api/schedules/active` | Fetch active schedule blocks for target date |
| `GET` | `/api/analytics/overview` | Fetch summary KPI counters and weekly chart data |
| `GET` | `/api/analytics/workload` | Fetch time distribution and completion trends |
| `GET` | `/api/history` | Fetch task event log and calibration variance |
| `GET` | `/api/notifications` | Fetch persisted notifications |
| `POST` | `/api/chat` | AI productivity coach chat and feasibility analysis |
| `POST` | `/api/ml/predict-duration` | Python ML Random Forest task duration prediction |
| `POST` | `/api/ml/analyze-workload` | Workload capacity and overcommitment detection |
| `POST` | `/api/ml/optimize-schedule` | Constraint-based interval schedule solver |
| `GET` | `/api/ml/model-status` | ML model version, trained status, and metrics |

---

## 8. License

MIT License. Built for TimeWeave Productivity.
