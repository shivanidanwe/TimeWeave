import datetime
from typing import List, Dict, Any, Optional, Tuple

def parse_time_to_minutes(time_str: str) -> int:
    """Parses 'HH:MM' or 'HH:MM:SS' into minutes from midnight."""
    if not time_str:
        return 9 * 60 # Default 09:00 AM
    parts = time_str.split(":")
    hours = int(parts[0])
    minutes = int(parts[1]) if len(parts) > 1 else 0
    return hours * 60 + minutes

def minutes_to_time_str(mins: int) -> str:
    """Converts minutes from midnight to 'HH:MM AM/PM'."""
    hours = (mins // 60) % 24
    minutes = mins % 60
    period = "AM" if hours < 12 else "PM"
    display_hour = hours % 12
    if display_hour == 0:
        display_hour = 12
    return f"{display_hour:02d}:{minutes:02d} {period}"

def minutes_to_24h(mins: int) -> str:
    """Converts minutes from midnight to 'HH:MM'."""
    hours = (mins // 60) % 24
    minutes = mins % 60
    return f"{hours:02d}:{minutes:02d}"

class ConstraintScheduler:
    def __init__(self):
        pass

    def schedule(
        self,
        tasks: List[Dict[str, Any]],
        preferences: Optional[Dict[str, Any]] = None,
        fixed_events: Optional[List[Dict[str, Any]]] = None,
        target_date: Optional[str] = None
    ) -> Dict[str, Any]:
        prefs = preferences or {}
        day_start_str = prefs.get("work_start_time", "09:00")
        day_end_str = prefs.get("work_end_time", "18:00")
        break_duration = int(prefs.get("break_duration", 30))
        max_continuous_work = int(prefs.get("max_continuous_work_minutes", 120))
        preferred_energy = prefs.get("energy_preference", "Morning") # Morning, Afternoon, Evening, Flexible

        day_start = parse_time_to_minutes(day_start_str)
        day_end = parse_time_to_minutes(day_end_str)
        total_day_minutes = max(0, day_end - day_start)

        fixed_blocks = []
        if fixed_events:
            for ev in fixed_events:
                s = parse_time_to_minutes(ev.get("start_time", "12:00"))
                e = parse_time_to_minutes(ev.get("end_time", "13:00"))
                fixed_blocks.append({
                    "start": s,
                    "end": e,
                    "duration": e - s,
                    "title": ev.get("title", "Fixed Event"),
                    "block_type": ev.get("block_type", "fixed"),
                    "is_fixed": True
                })

        # Add lunch break if not present and workday is >= 5 hours
        lunch_start = parse_time_to_minutes("13:00")
        lunch_end = lunch_start + 45
        has_lunch = any(b["start"] < lunch_end and b["end"] > lunch_start for b in fixed_blocks)
        if not has_lunch and total_day_minutes >= 300 and day_start <= lunch_start and day_end >= lunch_end:
            fixed_blocks.append({
                "start": lunch_start,
                "end": lunch_end,
                "duration": 45,
                "title": "Lunch Break",
                "block_type": "break",
                "category": "Break",
                "is_fixed": True,
                "reason": "Regular nutritional and cognitive recovery break"
            })

        fixed_blocks.sort(key=lambda x: x["start"])

        # Dependency check: Map completed / scheduled task IDs
        completed_task_ids = set()
        for t in tasks:
            if t.get("status") in ["Completed", "completed", "done"]:
                completed_task_ids.add(str(t.get("id")))

        # Filter actionable tasks (Pending or In Progress)
        actionable_tasks = [
            t for t in tasks 
            if t.get("status") not in ["Completed", "completed", "done"]
        ]

        # Check for dependencies & blocked tasks
        ready_tasks = []
        blocked_tasks = []
        for t in actionable_tasks:
            deps = t.get("dependencies") or []
            unmet_deps = [d for d in deps if str(d) not in completed_task_ids]
            if unmet_deps:
                blocked_tasks.append({
                    **t,
                    "unscheduled_reason": f"Prerequisite task(s) [{', '.join(unmet_deps)}] not completed"
                })
            else:
                ready_tasks.append(t)

        # Sort tasks by priority, energy alignment, and deadline
        priority_weights = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1}

        def task_sort_key(item: Dict[str, Any]):
            p = priority_weights.get(item.get("priority", "Medium"), 2)
            energy = item.get("energy_requirement", "Medium")
            # If user prefers morning and task requires high energy, boost priority
            energy_score = 2 if energy == "High" and preferred_energy == "Morning" else 1
            dur = item.get("current_predicted_minutes") or item.get("user_estimated_minutes") or 60
            deadline = item.get("deadline", "9999-12-31")
            return (-p, -energy_score, deadline, dur)

        ready_tasks.sort(key=task_sort_key)

        # Available time slots (excluding fixed blocks)
        free_intervals = []
        curr = day_start
        for fb in fixed_blocks:
            if fb["start"] > curr:
                free_intervals.append({"start": curr, "end": fb["start"]})
            curr = max(curr, fb["end"])
        if curr < day_end:
            free_intervals.append({"start": curr, "end": day_end})

        scheduled_blocks = []
        unscheduled_tasks = list(blocked_tasks)

        # Merge fixed blocks into scheduled blocks initially
        for fb in fixed_blocks:
            scheduled_blocks.append({
                "task_id": fb.get("task_id", None),
                "title": fb["title"],
                "start_at": minutes_to_24h(fb["start"]),
                "end_at": minutes_to_24h(fb["end"]),
                "start_time_display": minutes_to_time_str(fb["start"]),
                "end_time_display": minutes_to_time_str(fb["end"]),
                "duration_minutes": fb["duration"],
                "block_type": fb.get("block_type", "fixed"),
                "category": fb.get("category", "Break"),
                "priority": "Medium",
                "is_fixed": True,
                "reason": fb.get("reason", "Fixed commitment or configured break")
            })

        # Slot tasks into available intervals
        current_interval_idx = 0
        current_time = free_intervals[0]["start"] if free_intervals else day_start
        continuous_work = 0

        for task in ready_tasks:
            duration = int(task.get("current_predicted_minutes") or task.get("user_estimated_minutes") or 60)
            duration = max(15, duration)

            # Check if break is needed before next task
            if continuous_work + duration > max_continuous_work and break_duration > 0:
                # Insert short break if there's room
                break_end = current_time + break_duration
                if current_interval_idx < len(free_intervals) and break_end <= free_intervals[current_interval_idx]["end"]:
                    scheduled_blocks.append({
                        "task_id": None,
                        "title": f"Focus Recovery Break ({break_duration}m)",
                        "start_at": minutes_to_24h(current_time),
                        "end_at": minutes_to_24h(break_end),
                        "start_time_display": minutes_to_time_str(current_time),
                        "end_time_display": minutes_to_time_str(break_end),
                        "duration_minutes": break_duration,
                        "block_type": "break",
                        "category": "Break",
                        "priority": "Low",
                        "is_fixed": False,
                        "reason": f"Break after {continuous_work}m of intensive focus to maintain peak cognitive performance"
                    })
                    current_time = break_end
                    continuous_work = 0

            # Find interval that can accommodate this task
            placed = False
            while current_interval_idx < len(free_intervals):
                interval = free_intervals[current_interval_idx]
                if current_time < interval["start"]:
                    current_time = interval["start"]
                    continuous_work = 0

                remaining_in_interval = interval["end"] - current_time
                if remaining_in_interval >= duration:
                    # Fits!
                    task_start = current_time
                    task_end = task_start + duration
                    
                    reason_items = [
                        f"Priority: {task.get('priority', 'Medium')}",
                        f"Energy: {task.get('energy_requirement', 'Medium')}"
                    ]
                    if task.get("category"):
                        reason_items.append(f"Category: {task['category']}")
                    if task_start < 12 * 60 and preferred_energy == "Morning":
                        reason_items.append("Aligned with morning peak focus hours")

                    scheduled_blocks.append({
                        "task_id": task.get("id"),
                        "title": task.get("title", "Untitled Task"),
                        "description": task.get("description", ""),
                        "category": task.get("category", "Work"),
                        "priority": task.get("priority", "Medium"),
                        "energy_requirement": task.get("energy_requirement", "Medium"),
                        "start_at": minutes_to_24h(task_start),
                        "end_at": minutes_to_24h(task_end),
                        "start_time_display": minutes_to_time_str(task_start),
                        "end_time_display": minutes_to_time_str(task_end),
                        "duration_minutes": duration,
                        "block_type": "task",
                        "is_fixed": False,
                        "reason": " • ".join(reason_items)
                    })

                    current_time = task_end
                    continuous_work += duration
                    placed = True
                    break
                else:
                    # Move to next interval
                    current_interval_idx += 1
                    if current_interval_idx < len(free_intervals):
                        current_time = free_intervals[current_interval_idx]["start"]
                        continuous_work = 0

            if not placed:
                unscheduled_tasks.append({
                    **task,
                    "unscheduled_reason": f"Working capacity reached for the day ({duration}m needed, free remaining: {max(0, day_end - current_time)}m)"
                })

        # Sort all scheduled blocks by start_at
        scheduled_blocks.sort(key=lambda b: parse_time_to_minutes(b["start_at"]))

        # Calculate workload and capacity statistics
        scheduled_task_minutes = sum(b["duration_minutes"] for b in scheduled_blocks if b.get("block_type") == "task")
        break_minutes = sum(b["duration_minutes"] for b in scheduled_blocks if b.get("block_type") == "break")
        fixed_minutes = sum(b["duration_minutes"] for b in scheduled_blocks if b.get("is_fixed") and b.get("block_type") != "break")

        # Total requested work includes both placed and unscheduled tasks
        total_requested_task_minutes = sum(
            t.get("current_predicted_minutes") or t.get("user_estimated_minutes") or 60
            for t in actionable_tasks
        )

        available_capacity = max(1, total_day_minutes - break_minutes - fixed_minutes)
        free_capacity_minutes = max(0, total_day_minutes - (scheduled_task_minutes + break_minutes + fixed_minutes))
        utilization = round((total_requested_task_minutes / available_capacity) * 100, 1)

        if utilization > 100 or len(unscheduled_tasks) > 0:
            status = "Overcommitted"
            overload_mins = max(0, total_requested_task_minutes - available_capacity)
        elif utilization >= 80:
            status = "Near Capacity"
            overload_mins = 0
        else:
            status = "Available Capacity"
            overload_mins = 0

        # Generate intelligent recommendations (matching Screen 7 & 4)
        recommendations = []
        if status == "Overcommitted" or len(unscheduled_tasks) > 0:
            unsched_count = len(unscheduled_tasks)
            recommendations.append({
                "type": "overcommitment",
                "title": f"Overcommitment Alert: {utilization}% workload planned",
                "description": f"You are {utilization}% committed today with {unsched_count} task(s) unplaced. Consider moving low-priority task to tomorrow.",
                "action_type": "reschedule_overflow",
                "impact": "Reduces burnout risk and ensures realistic deadlines"
            })

        # Energy match recommendation
        for b in scheduled_blocks:
            if b.get("block_type") == "task" and b.get("energy_requirement") == "High":
                start_m = parse_time_to_minutes(b["start_at"])
                if start_m >= 14 * 60: # Scheduled late afternoon
                    recommendations.append({
                        "type": "energy_optimization",
                        "title": f"Move '{b['title']}' to 10:30 AM",
                        "description": "Better energy match (+40% focus during morning peak)",
                        "task_id": b.get("task_id"),
                        "action_type": "move_earlier",
                        "impact": "Higher focus (+40%)"
                    })
                    break

        if not any(b.get("block_type") == "break" for b in scheduled_blocks):
            recommendations.append({
                "type": "break_suggestion",
                "title": "Add 30 min restorative break after 2 hours",
                "description": "Continuous work without breaks leads to mental fatigue.",
                "action_type": "add_break",
                "impact": "Improves productivity (+25%)"
            })

        return {
            "target_date": target_date,
            "status": status,
            "utilization_percentage": min(utilization, 200),
            "total_day_minutes": total_day_minutes,
            "planned_work_minutes": scheduled_task_minutes,
            "total_requested_minutes": total_requested_task_minutes,
            "break_minutes": break_minutes,
            "free_capacity_minutes": free_capacity_minutes,
            "overload_minutes": max(0, overload_mins),
            "scheduled_blocks": scheduled_blocks,
            "unscheduled_tasks": unscheduled_tasks,
            "recommendations": recommendations,
            "optimizer_version": "constraint-engine-v1.0"
        }

scheduler = ConstraintScheduler()
