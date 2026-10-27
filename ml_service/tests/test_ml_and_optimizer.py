import unittest
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from model import model
from optimizer import scheduler

class TestMLAndOptimizer(unittest.TestCase):
    def test_cold_start_baseline(self):
        task = {
            "title": "Study Linear Algebra",
            "category": "Study",
            "priority": "Medium",
            "energy_requirement": "Medium"
        }
        res = model.predict(task, user_history_count=0)
        self.assertEqual(res["prediction_source"], "baseline")
        self.assertGreaterEqual(res["predicted_minutes"], 30)
        self.assertIn("Base duration for 'Study'", res["explanations"][0])

    def test_personalized_prediction(self):
        task = {
            "title": "Code Review and Testing",
            "category": "Work",
            "priority": "High",
            "energy_requirement": "High",
            "user_estimated_minutes": 90
        }
        res = model.predict(task, user_history_count=15)
        self.assertIn(res["prediction_source"], ["ml_personalized", "baseline"])
        self.assertGreater(res["predicted_minutes"], 0)
        self.assertTrue(res["confidence_lower"] <= res["predicted_minutes"] <= res["confidence_upper"])

    def test_scheduler_constraints_and_breaks(self):
        tasks = [
            {"id": "t1", "title": "ML Lecture", "category": "Study", "priority": "High", "current_predicted_minutes": 60, "energy_requirement": "High"},
            {"id": "t2", "title": "Project Work", "category": "Work", "priority": "Medium", "current_predicted_minutes": 90, "energy_requirement": "Medium"},
            {"id": "t3", "title": "Gym Workout", "category": "Health", "priority": "Low", "current_predicted_minutes": 60, "energy_requirement": "Medium"}
        ]
        prefs = {
            "work_start_time": "09:00",
            "work_end_time": "17:00",
            "break_duration": 30,
            "max_continuous_work_minutes": 120,
            "energy_preference": "Morning"
        }
        res = scheduler.schedule(tasks=tasks, preferences=prefs)

        self.assertIn("scheduled_blocks", res)
        self.assertGreater(len(res["scheduled_blocks"]), 0)
        self.assertIn(res["status"], ["Available Capacity", "Near Capacity", "Overcommitted"])
        
        # Verify no overlapping task blocks
        blocks = res["scheduled_blocks"]
        for i in range(len(blocks) - 1):
            curr_end = blocks[i]["end_at"]
            next_start = blocks[i+1]["start_at"]
            self.assertTrue(curr_end <= next_start, f"Overlap detected: block {i} ends at {curr_end}, next starts at {next_start}")

    def test_dependency_enforcement(self):
        tasks = [
            {"id": "t1", "title": "Draft Architecture", "status": "Pending", "current_predicted_minutes": 60},
            {"id": "t2", "title": "Implement API", "dependencies": ["t1"], "status": "Pending", "current_predicted_minutes": 60}
        ]
        res = scheduler.schedule(tasks=tasks)
        # t2 should be unscheduled or blocked because t1 is not completed
        unscheduled_reasons = [u.get("unscheduled_reason", "") for u in res["unscheduled_tasks"]]
        self.assertTrue(any("Prerequisite task(s)" in r for r in unscheduled_reasons))

if __name__ == '__main__':
    unittest.main()
