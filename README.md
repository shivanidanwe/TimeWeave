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

## 3. Prerequisites

- **Node.js**: v18.0.0 or higher (v22.x recommended)
- **npm**: v9.0.0 or higher
- **Python**: v3.10 or higher (v3.11 recommended) with pip
- **Database**: 
  - **Zero-config Local (Default)**: Embedded SQLite via `better-sqlite3` requires zero external configuration and works immediately out of the box.
  - **PostgreSQL (Optional)**: If you set `DATABASE_URL=postgresql://user:pass@localhost:5432/timeweave`, TimeWeave will automatically execute migrations and run on PostgreSQL.

---

## 4. Quick Start (Single Command)

From the project root directory (`C:\Users\Sayali\TimeWeave`):

```bash
# 1. Install dependencies
cd backend && npm install
cd ../frontend && npm install
cd ..
python -m pip install -r ml_service/requirements.txt

# 2. Start all services concurrently
node start-all.js
```

The services will launch automatically:
- **Frontend Web UI**: http://localhost:3000 (or http://127.0.0.1:3000)
- **Node.js API Gateway**: http://localhost:5000/api
- **Python ML Service**: http://127.0.0.1:8000

---

## 5. Running Automated Tests

Run the full end-to-end automated test suite:

```bash
node test-all.js
```

This executes:
1. **Python ML & Optimizer Unit Tests**: Verifies baseline heuristic calibration, personalized duration prediction, hard constraint enforcement, break insertion, and dependency ordering.
2. **Backend REST API Integration Tests**: Tests registration, JWT authentication, user data isolation, task CRUD, duration prediction proxy, schedule generation, and task completion logging.

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
| `GET` | `/api/auth/me` | Fetch authenticated user profile & preferences |
| `GET` | `/api/tasks` | List tasks with category, priority, and search filters |
| `POST` | `/api/tasks` | Create task with ML predicted duration |
| `PATCH` | `/api/tasks/:id` | Update task details |
| `POST` | `/api/tasks/:id/complete` | Complete task and record actual duration variance |
| `POST` | `/api/tasks/:id/start-timer` | Begin active focus tracking session |
| `POST` | `/api/tasks/:id/stop-timer` | End focus session and accumulate minutes |
| `POST` | `/api/tasks/:id/interruptions` | Record an unplanned delay / interruption |
| `POST` | `/api/schedules/generate` | Propose constraint-based daily schedule |
| `POST` | `/api/schedules/:id/accept` | Accept and persist schedule version |
| `GET` | `/api/schedules/active` | Fetch active schedule blocks for target date |
| `GET` | `/api/analytics/overview` | Fetch summary KPI counters and weekly chart data |
| `GET` | `/api/analytics/workload` | Fetch time distribution and completion trends |
| `GET` | `/api/history` | Fetch task event log and calibration variance |
| `GET` | `/api/notifications` | Fetch persisted notifications |
| `POST` | `/api/chat` | AI productivity coach chat and feasibility analysis |

---

## 8. License

MIT License. Built for TimeWeave Productivity.
