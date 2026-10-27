import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

from model import model
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
def get_model_info():
    return {
        "version": model.version,
        "training_samples": model.training_samples,
        "mae": model.mae,
        "r2": model.r2,
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
    res = model.predict(data, user_history_count=req.user_history_count or 0)
    return res

@app.post("/batch-predict")
def batch_predict(req: BatchPredictionRequest):
    results = []
    for t in req.tasks:
        d = t.model_dump()
        pred = model.predict(d, user_history_count=req.user_history_count or 0)
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
            pred = model.predict(t_copy, user_history_count=t_copy.get("user_history_count", 0))
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
    
    # 1. Schedule feasibility analysis (matches Screen 11 reference conversation!)
    if "realistic" in user_msg or "feasible" in user_msg or "how many tasks" in user_msg or "tomorrow" in user_msg or "schedule" in user_msg:
        active_tasks = [t for t in tasks if t.get("status") not in ["Completed", "completed"]]
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
            analysis_points.append(f"⚠️ {len(sched['scheduled_blocks'])} blocks fit, but {unsched} task(s) cause overcommitment")
        else:
            analysis_points.append(f"✅ {len(active_tasks)} tasks are realistic (total: {time_str})")
            
        if util > 100:
            analysis_points.append(f"⚠️ Overall workload is {util}% of available capacity")
        else:
            analysis_points.append(f"⚡ Workload utilization is comfortable at {util}%")
            
        # Build suggested schedule outline
        schedule_preview = []
        idx = 1
        for b in sched["scheduled_blocks"]:
            if b.get("block_type") == "task":
                dur = b["duration_minutes"]
                dur_text = f"{dur//60}h {dur%60}m" if dur>=60 and dur%60!=0 else f"{dur//60}h" if dur>=60 else f"{dur}m"
                schedule_preview.append(f"{idx}. {b['title']} - {b['start_at']} ({dur_text})")
                idx += 1
            elif b.get("block_type") == "break":
                schedule_preview.append(f"• {b['title']} - {b['start_at']}")

        reply = (
            f"Based on your past data and current workload, here's the analysis:\n\n"
            + "\n".join(f"- {p}" for p in analysis_points) + "\n\n"
            + "Suggested optimized schedule:\n"
            + "\n".join(schedule_preview) + "\n\n"
            + "Would you like me to create this schedule for you?"
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

    # General productivity tips
    return {
        "reply": (
            "I'm your TimeWeave AI productivity coach! I can analyze your schedule feasibility, "
            "optimize task blocks based on your energy patterns, detect overcommitment, and adjust estimates. "
            "Try asking: 'I have 5 tasks tomorrow. Is it realistic?' or 'Optimize my day'."
        ),
        "actions": [
            {"label": "Is tomorrow realistic?", "action": "check_feasibility"},
            {"label": "Optimize today's schedule", "action": "optimize_today"}
        ]
    }

@app.post("/train")
def train_model(req: TrainRequest):
    res = model.train(req.records)
    return res

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
