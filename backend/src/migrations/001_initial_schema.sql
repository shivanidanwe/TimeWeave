-- 001_initial_schema.sql
-- TimeWeave Database Schema Migration

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'Professional',
    timezone TEXT DEFAULT 'UTC',
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_preferences (
    user_id TEXT PRIMARY KEY,
    working_days TEXT DEFAULT '["Monday","Tuesday","Wednesday","Thursday","Friday"]',
    work_start_time TEXT DEFAULT '09:00',
    work_end_time TEXT DEFAULT '18:00',
    daily_capacity_minutes INTEGER DEFAULT 480,
    break_duration INTEGER DEFAULT 30,
    max_continuous_work_minutes INTEGER DEFAULT 120,
    energy_preference TEXT DEFAULT 'Morning',
    preferred_planning_horizon TEXT DEFAULT 'Daily',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'Work',
    priority TEXT DEFAULT 'Medium',
    status TEXT DEFAULT 'Pending',
    deadline TEXT,
    user_estimated_minutes INTEGER DEFAULT 60,
    current_predicted_minutes INTEGER,
    actual_duration_minutes INTEGER DEFAULT 0,
    energy_requirement TEXT DEFAULT 'Medium',
    flexibility TEXT DEFAULT 'Flexible',
    is_active_timer BOOLEAN DEFAULT 0,
    timer_started_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_dependencies (
    task_id TEXT NOT NULL,
    depends_on_task_id TEXT NOT NULL,
    PRIMARY KEY (task_id, depends_on_task_id),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (depends_on_task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_time_sessions (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP,
    duration_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_interruptions (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration_minutes INTEGER DEFAULT 0,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS schedule_versions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    target_date TEXT NOT NULL,
    version_number INTEGER DEFAULT 1,
    status TEXT DEFAULT 'draft',
    total_planned_minutes INTEGER DEFAULT 0,
    utilization_percentage REAL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS schedule_blocks (
    id TEXT PRIMARY KEY,
    schedule_version_id TEXT NOT NULL,
    task_id TEXT,
    title TEXT NOT NULL,
    start_at TEXT NOT NULL,
    end_at TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    block_type TEXT DEFAULT 'task',
    category TEXT DEFAULT 'Work',
    priority TEXT DEFAULT 'Medium',
    is_fixed BOOLEAN DEFAULT 0,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_version_id) REFERENCES schedule_versions(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS task_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    task_id TEXT,
    event_type TEXT NOT NULL,
    event_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS model_predictions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    task_id TEXT NOT NULL,
    predicted_minutes INTEGER NOT NULL,
    baseline_minutes INTEGER NOT NULL,
    confidence_lower INTEGER,
    confidence_upper INTEGER,
    model_version TEXT,
    prediction_source TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link_route TEXT,
    is_read BOOLEAN DEFAULT 0,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_schedule_user_date ON schedule_versions(user_id, target_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
