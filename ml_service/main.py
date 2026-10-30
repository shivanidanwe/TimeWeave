import os
import sys
import datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

from model import model, user_models
from optimizer import scheduler

app = FastAPI(
    title="TimeWeave ML & Scheduling Service",
    description="Adaptive Personal Time and Workload Optimizer ML & Constraint Engine",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TaskPredictionRequest(BaseModel):
    user_id: Optional[str] = None
    title: str = "Task Title"
    description: Optional[str] = ""
    category: str = "Work"
    priority: str = "Medium"
    energy_requirement: str = "Medium"
    flexibility: str = "Flexible"
    user_estimated_minutes: Optional[int] = None
    user_history_count: Optional[int] = 0
    deadline: Optional[str] = None
    day_of_week: Optional[int] = 2
    hour_of_day: Optional[int] = 10
    has_dependencies: Optional[bool] = False

class BatchPredictionRequest(BaseModel):
    tasks: List[TaskPredictionRequest]
    user_history_count: Optional[int] = 0

class ScheduleGenerationRequest(BaseModel):
    tasks: List[Dict[str, Any]]
    user_id: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None
    fixed_events: Optional[List[Dict[str, Any]]] = None
    target_date: Optional[str] = None

class WorkloadAnalysisRequest(BaseModel):
    tasks: List[Dict[str, Any]]
    preferences: Optional[Dict[str, Any]] = None

class ChatAssistantRequest(BaseModel):
    message: str
    tasks: Optional[List[Dict[str, Any]]] = None
    preferences: Optional[Dict[str, Any]] = None
    conversation_history: Optional[List[Dict[str, str]]] = None

class TrainRequest(BaseModel):
    user_id: str = Field(min_length=1, max_length=128)
    records: List[Dict[str, Any]]

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "TimeWeave AI/ML & Optimization Service",
        "version": "1.0.0",
        "model_loaded": model.pipeline is not None,
        "model_version": model.version,
        "training_samples": model.training_samples
    }

@app.get("/model-info")
def get_model_info(user_id: Optional[str] = None):
    selected_model = user_models.get(user_id)
    return {
        "version": selected_model.version,
        "training_samples": selected_model.training_samples,
        "mae": selected_model.mae,
        "rmse": selected_model.rmse,
        "r2": selected_model.r2,
        "features": {
            "categorical": ["category", "priority", "energy_requirement", "flexibility"],
            "numerical": ["user_estimated_minutes", "word_count", "day_of_week", "hour_of_day", "has_dependencies"]
        },
        "baseline_heuristics": {
            "categories": {"Study": 60, "Work": 90, "Personal": 45, "Health": 45, "Other": 30},
            "priority_factors": {"Low": 0.85, "Medium": 1.0, "High": 1.25, "Critical": 1.5}
        }
    }

@app.post("/predict-duration")
def predict_duration(req: TaskPredictionRequest):
    data = req.model_dump()
    res = user_models.get(data.get("user_id")).predict(
        data, user_history_count=req.user_history_count or 0
    )
    return res

@app.post("/batch-predict")
def batch_predict(req: BatchPredictionRequest):
    results = []
    for t in req.tasks:
        d = t.model_dump()
        pred = user_models.get(d.get("user_id")).predict(
            d, user_history_count=req.user_history_count or 0
        )
        results.append({
            "title": t.title,
            **pred
        })
    return {"predictions": results}

@app.post("/generate-schedule")
def generate_schedule(req: ScheduleGenerationRequest):
    # Predict durations for any task missing predicted minutes
    enriched_tasks = []
    for t in req.tasks:
        t_copy = dict(t)
        if not t_copy.get("current_predicted_minutes"):
            pred = user_models.get(req.user_id).predict(
                t_copy, user_history_count=t_copy.get("user_history_count", 0)
            )
            t_copy["current_predicted_minutes"] = pred["predicted_minutes"]
            t_copy["prediction_source"] = pred["prediction_source"]
        enriched_tasks.append(t_copy)

    result = scheduler.schedule(
        tasks=enriched_tasks,
        preferences=req.preferences,
        fixed_events=req.fixed_events,
        target_date=req.target_date
    )
    return result

@app.post("/analyze-workload")
def analyze_workload(req: WorkloadAnalysisRequest):
    sched = scheduler.schedule(tasks=req.tasks, preferences=req.preferences)
    return {
        "status": sched["status"],
        "utilization_percentage": sched["utilization_percentage"],
        "planned_work_minutes": sched["planned_work_minutes"],
        "free_capacity_minutes": sched["free_capacity_minutes"],
        "overload_minutes": sched["overload_minutes"],
        "total_day_minutes": sched["total_day_minutes"],
        "recommendations": sched["recommendations"]
    }

@app.post("/chat-assistant")
def chat_assistant(req: ChatAssistantRequest):
    user_msg = req.message.lower().strip()
    tasks = req.tasks or []
    active_tasks = [t for t in tasks if t.get("status") not in ["Completed", "completed", "done"]]
    today_str = datetime.date.today().isoformat()

    # 1. "Which tasks are overdue?"
    if "overdue" in user_msg or "late" in user_msg:
        overdue_tasks = []
        for t in active_tasks:
            dline = t.get("deadline")
            if dline and dline < today_str:
                overdue_tasks.append(t)

        if overdue_tasks:
            items_text = "\n".join(f"• **{t['title']}** (Due: {t.get('deadline')}, Priority: {t.get('priority', 'Medium')})" for t in overdue_tasks)
            return {
                "reply": f"You currently have {len(overdue_tasks)} overdue task(s):\n\n{items_text}\n\nI recommend tackling the highest priority one first or adjusting their deadlines in your task manager.",
                "actions": [
                    {"label": "Which should I do next?", "action": "suggest_next"},
                    {"label": "Reschedule overdue tasks", "action": "optimize_today"}
                ]
            }
        else:
            return {
                "reply": "🎉 Great news! None of your active tasks are overdue. All deadlines are comfortably on track.",
                "actions": [
                    {"label": "Which task should I do next?", "action": "suggest_next"},
                    {"label": "Plan my day", "action": "plan_day"}
                ]
            }

    # 2. "Which task should I do next?"
    if "next" in user_msg or "what should i do" in user_msg or "recommend task" in user_msg:
        if not active_tasks:
            return {
                "reply": "You don't have any pending tasks right now! Create a new task or take a well-deserved break.",
                "actions": [{"label": "Create new task", "action": "create_task"}]
            }

        # Rank by Priority (Critical > High > Medium > Low) and Energy
        prio_weights = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1}
        ranked = sorted(active_tasks, key=lambda x: prio_weights.get(x.get("priority", "Medium"), 1), reverse=True)
        top_task = ranked[0]
        est = top_task.get("current_predicted_minutes") or top_task.get("user_estimated_minutes") or 60

        return {
            "reply": (
                f"I recommend working on **{top_task['title']}** next.\n\n"
                f"• **Category**: {top_task.get('category', 'Work')}\n"
                f"• **Priority**: {top_task.get('priority', 'Medium')}\n"
                f"• **Estimated Duration**: {est} minutes\n"
                f"• **Energy Level**: {top_task.get('energy_requirement', 'Medium')}\n\n"
                "Would you like to start a focus timer for this task?"
            ),
            "actions": [
                {"label": "Start Focus Timer", "action": "start_focus", "task_id": top_task.get("id")},
                {"label": "Plan my full day", "action": "plan_day"}
            ]
        }

    # 3. "Do I have enough time for these tasks?" / Workload capacity check
    if "enough time" in user_msg or "capacity" in user_msg or "how much time" in user_msg:
        total_requested = sum(
            t.get("current_predicted_minutes") or t.get("user_estimated_minutes") or 60
            for t in active_tasks
        )
        prefs = req.preferences or {}
        day_start = prefs.get("work_start_time", "09:00")
        day_end = prefs.get("work_end_time", "18:00")
        start_m = int(day_start.split(":")[0]) * 60 + int(day_start.split(":")[1])
        end_m = int(day_end.split(":")[0]) * 60 + int(day_end.split(":")[1])
        available = max(0, end_m - start_m)

        hours_req = total_requested // 60
        mins_req = total_requested % 60
        hours_avail = available // 60
        mins_avail = available % 60

        utilization = round((total_requested / max(1, available)) * 100, 1)

        if utilization > 100:
            return {
                "reply": (
                    f"⚠️ **Capacity Warning**: Your active tasks require approximately **{hours_req}h {mins_req}m**, "
                    f"which exceeds your configured working day ({hours_avail}h {mins_avail}m from {day_start} to {day_end}) at **{utilization}% capacity**.\n\n"
                    "I suggest moving 1 or 2 lower-priority tasks to tomorrow so you can finish on time without burnout."
                ),
                "actions": [
                    {"label": "Optimize & Fit Available Time", "action": "optimize_today"},
                    {"label": "Show alternatives", "action": "show_alternatives"}
                ]
            }
        else:
            free_mins = available - total_requested
            return {
                "reply": (
                    f"✅ **Yes, you have enough time!**\n\n"
                    f"• **Required Workload**: {hours_req}h {mins_req}m across {len(active_tasks)} task(s)\n"
                    f"• **Available Working Time**: {hours_avail}h {mins_avail}m\n"
                    f"• **Utilization**: {utilization}% (Leaves {free_mins // 60}h {free_mins % 60}m for breaks and buffer)"
                ),
                "actions": [
                    {"label": "Plan my schedule now", "action": "plan_day"},
                    {"label": "Which task to do next?", "action": "suggest_next"}
                ]
            }

    # 4. "Plan my day" / "Tomorrow" / "Schedule"
    if "plan" in user_msg or "realistic" in user_msg or "feasible" in user_msg or "tomorrow" in user_msg or "schedule" in user_msg:
        sched = scheduler.schedule(tasks=active_tasks, preferences=req.preferences)
        total_mins = sched["planned_work_minutes"]
        hours = total_mins // 60
        mins = total_mins % 60
        time_str = f"{hours}h {mins}m" if hours > 0 else f"{mins}m"
        
        status = sched["status"]
        util = sched["utilization_percentage"]
        unsched = len(sched["unscheduled_tasks"])
        
        analysis_points = []
        if unsched > 0:
            analysis_points.append(f"⚠️ {len(sched['scheduled_blocks'])} blocks fit, but {unsched} task(s) exceed available daily capacity")
        else:
            analysis_points.append(f"✅ {len(active_tasks)} tasks fit comfortably (total: {time_str})")
            
        if util > 100:
            analysis_points.append(f"⚠️ Overall workload utilization is {util}%")
        else:
            analysis_points.append(f"⚡ Workload utilization is comfortable at {util}%")
            
        schedule_preview = []
        idx = 1
        for b in sched["scheduled_blocks"]:
            if b.get("block_type") == "task":
                dur = b["duration_minutes"]
                dur_text = f"{dur//60}h {dur%60}m" if dur>=60 and dur%60!=0 else f"{dur//60}h" if dur>=60 else f"{dur}m"
                schedule_preview.append(f"{idx}. {b['title']} — {b['start_at']} ({dur_text})")
                idx += 1
            elif b.get("block_type") == "break":
                schedule_preview.append(f"☕ {b['title']} — {b['start_at']}")

        reply = (
            f"Here is your personalized schedule analysis:\n\n"
            + "\n".join(f"- {p}" for p in analysis_points) + "\n\n"
            + "**Proposed Timeline:**\n"
            + "\n".join(schedule_preview) + "\n\n"
            + "Would you like to apply and activate this schedule?"
        )

        return {
            "reply": reply,
            "actions": [
                {"label": "Yes, create schedule", "action": "apply_schedule", "schedule": sched},
                {"label": "Show alternatives", "action": "show_alternatives"},
                {"label": "No, keep as is", "action": "dismiss"}
            ],
            "schedule_data": sched
        }

    # General deterministic productivity assistant
    return {
        "reply": (
            "I'm your TimeWeave AI productivity coach! Here are some things you can ask me:\n\n"
            "• **'Plan my day'** — Generate an energy-aware schedule with breaks\n"
            "• **'Which tasks are overdue?'** — Check missed deadlines\n"
            "• **'Do I have enough time for these tasks?'** — Compare workload to capacity\n"
            "• **'Which task should I do next?'** — Prioritize by urgency and energy\n"
            "• **'Show me my workload for tomorrow'** — View upcoming commitments"
        ),
        "actions": [
            {"label": "Plan my day", "action": "plan_day"},
            {"label": "Which task should I do next?", "action": "suggest_next"},
            {"label": "Which tasks are overdue?", "action": "check_overdue"},
            {"label": "Do I have enough time?", "action": "check_time"}
        ]
    }

@app.post("/train")
def train_model(req: TrainRequest):
    res = user_models.get(req.user_id).train(req.records)
    return res

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=int(os.environ.get("ML_SERVICE_PORT", "8000")),
        reload=False
    )
