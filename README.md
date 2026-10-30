# TimeWeave — Adaptive Personal Time and Workload Optimizer

TimeWeave is a locally run personal time and workload optimizer for students and professionals. It combines task management, a deterministic scheduling engine, workload analytics, and per-user task-duration models.

Unlike conventional to-do lists, TimeWeave:
- Trains a per-user Scikit-Learn duration model from that user's completed task history when enough valid records are available.
- Compares planned workload against available working hours.
- Detects overcommitment before burnout occurs.
- Generates realistic schedules respecting hard and soft constraints (deadlines, dependencies, energy cycles, and breaks).
- Uses a responsive React interface for task planning, analytics, focus sessions, and preferences.

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
│   ├── train.py            # Explicit user-scoped training from supplied completion records
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
  - PostgreSQL is used when `DATABASE_URL` is set.
  - Embedded SQLite is used for zero-configuration local development when `DATABASE_URL` is omitted.

The optional seed command creates a development-only demo account and sample records. It deletes any existing demo account and its records before recreating them, so do not use it against a database containing data you need to keep. Seeding is rejected when `NODE_ENV` is not `development`.

---

## 4. Quick Start (Single Command)

From the project root directory (`C:\Users\SHIVANI\TimeWeave\TimeWeave`):

```powershell
# Run these commands from the TimeWeave application directory.

# 1. Install JavaScript dependencies
npm.cmd install
npm.cmd install --prefix backend
npm.cmd install --prefix frontend

# 2. Install Python dependencies in a virtual environment
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r ml_service\requirements.txt

# 3. Configure the backend environment (optional for SQLite development)
Copy-Item backend/.env.example backend/.env
# Set a unique JWT_SECRET. Set DATABASE_URL to a local PostgreSQL connection string, or leave it unset to use SQLite.

# 4. Seed development sample data (optional; deletes and recreates the demo account)
npm.cmd run seed

# 5. Start all three local services
npm.cmd run dev
```

The services will launch automatically:
- **Frontend Web UI**: http://localhost:3000
- **Node.js API Gateway**: http://localhost:5000/api
- **Python ML Service**: http://127.0.0.1:8000

If one of those ports is already occupied, use three PowerShell terminals from the application directory. This example uses frontend `3002`, API `5001`, and ML `8001`:

```powershell
# Terminal 1: ML service
$env:ML_SERVICE_PORT = '8001'
python .\ml_service\main.py

# Terminal 2: backend
$env:PORT = '5001'
$env:ML_SERVICE_URL = 'http://127.0.0.1:8001'
$env:FRONTEND_URL = 'http://localhost:3002'
npm.cmd run dev --prefix backend

# Terminal 3: frontend
$env:API_PROXY_TARGET = 'http://127.0.0.1:5001'
npm.cmd run dev --prefix frontend -- --host 127.0.0.1 --port 3002 --strictPort
```

---

## 5. Running Automated Tests

Run the Python unit tests, backend API integration tests, and frontend route test:

```powershell
npm.cmd test
# Or: node .\test-all.js
```

This runs:
1. **Python ML & Constraint Optimizer Tests (14 unit tests)**: Covers baseline prediction, held-out model evaluation, invalid history, per-user model isolation, workload, and schedule constraints.
2. **Backend REST API Integration Tests**: Covers health, registration, authentication, user data isolation, task CRUD and completion, preferences, schedule persistence, ten assistant intents, invalid input/token, empty history, ML/database failure, analytics, focus sessions, notifications, and legacy route compatibility.
3. **Frontend Tests (1 route test)**: Verifies unauthenticated navigation redirects from a protected page to login.

Build the frontend and backend:

```powershell
npm.cmd run build
```

---

## 6. Manual Step-by-Step Startup

If you prefer starting each service individually in separate terminals:

### Terminal 1: Python ML and Scheduling Service
```powershell
python .\ml_service\main.py
# Runs on http://127.0.0.1:8000 and is bound to loopback only.
```

### Terminal 2: Node.js Express Backend
```bash
cd backend
npm.cmd run dev
# Runs on http://localhost:5000
```

### Terminal 3: React Vite Frontend
```bash
cd frontend
npm.cmd run dev
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
| `POST` | `/api/assistant/chat` | Authenticated, user-context assistant; `/api/chat` remains a compatibility alias |
| `POST` | `/api/ml/predict-duration` | Python ML Random Forest task duration prediction |
| `POST` | `/api/ml/analyze-workload` | Workload capacity and overcommitment detection |
| `POST` | `/api/ml/optimize-schedule` | Constraint-based interval schedule solver |
| `GET` | `/api/ml/model-status` | ML model version, trained status, and metrics |

---

## 8. Data Science and Training

New tasks use a transparent category/priority baseline until that account has at least five valid completed-task records and a per-user model has been trained. On task completion, the backend sends only that account's valid completion history to the local ML service; retraining occurs after at least five new valid records. Model artifacts are stored under hashed user IDs and are never shared between accounts. The legacy shared `model.joblib` is not loaded by application predictions.

Training uses a deterministic 80/20 holdout split for MAE, RMSE, and R² reporting, then fits the persisted user model on all valid records. Targets must be finite actual durations from 1 to 1440 minutes. No synthetic benchmark records are generated by the application.

For explicit local training, provide a JSON array containing real completed task records and run:

```powershell
python .\ml_service\train.py <user-id> <records.json>
```

The schedule engine is deterministic rule-based optimization, not generative AI. It orders work by priority and deadline, preserves working hours and breaks, and reports infeasible tasks. If the Python service is unavailable, the backend uses a simpler deterministic capacity fallback and does not invent workload percentages.

## 9. License

MIT License. Built for TimeWeave Productivity.
