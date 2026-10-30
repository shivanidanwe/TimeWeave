import unittest
import sys
import os
import tempfile
from unittest.mock import patch

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from model import DurationModel, UserModelRegistry, model
from optimizer import scheduler
from main import TaskPredictionRequest

class TestMLAndOptimizer(unittest.TestCase):
    def test_model_loading_and_health(self):
        """Test model initialization and versioning."""
        self.assertIsNotNone(model.version)
        self.assertIn("1.0", model.version)

    def test_cold_start_insufficient_history(self):
        """Test fallback to baseline heuristic when history count < 5."""
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

    def test_personalized_prediction_and_bounds(self):
        """Test duration prediction bounds and upper/lower confidence intervals."""
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
        # Ensure predicted minutes fall within sensible realistic bounds (15 to 480 mins)
        self.assertGreaterEqual(res["predicted_minutes"], 15)
        self.assertLessEqual(res["predicted_minutes"], 480)

    def test_invalid_input_handling(self):
        """Test graceful fallback for empty, missing, or malformed task inputs."""
        empty_task = {}
        res = model.predict(empty_task, user_history_count=0)
        self.assertGreaterEqual(res["predicted_minutes"], 15)
        self.assertEqual(res["prediction_source"], "baseline")

    def test_baseline_multipliers(self):
        """Test category and priority heuristic multipliers."""
        high_task = {"category": "Work", "priority": "Critical", "energy_requirement": "High"}
        low_task = {"category": "Work", "priority": "Low", "energy_requirement": "Low"}
        pred_high, _ = model.calculate_baseline(high_task)
        pred_low, _ = model.calculate_baseline(low_task)
        self.assertGreater(pred_high, pred_low)

    def test_training_reports_holdout_metrics_and_filters_invalid_durations(self):
        records = [
            {
                "title": f"Task {i}",
                "category": "Work" if i % 2 else "Study",
                "priority": "Medium",
                "actual_duration_minutes": 30 + i * 5
            }
            for i in range(10)
        ]
        records.extend([
            {"title": "Invalid zero", "actual_duration_minutes": 0},
            {"title": "Invalid missing"}
        ])

        with tempfile.TemporaryDirectory() as temp_dir:
            with patch("model.MODEL_FILE", os.path.join(temp_dir, "model.joblib")):
                trainer = DurationModel()
                result = trainer.train(records)

        self.assertTrue(result["trained"])
        self.assertEqual(result["samples"], 10)
        self.assertEqual(result["evaluation_samples"], 2)
        self.assertEqual(result["evaluation_method"], "80/20 holdout")
        self.assertGreaterEqual(result["mae"], 0)
        self.assertGreaterEqual(result["rmse"], 0)

    def test_training_rejects_insufficient_valid_durations(self):
        records = [{"actual_duration_minutes": 0} for _ in range(8)]
        self.assertEqual(model.train(records)["status"], "insufficient_data")

    def test_user_models_are_persisted_and_isolated(self):
        records = [
            {
                "title": f"Private task {i}",
                "category": "Work",
                "actual_duration_minutes": 25 + i * 5
            }
            for i in range(10)
        ]
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch("model.USER_MODEL_DIR", temp_dir):
                registry = UserModelRegistry()
                user_one = registry.get("user-one")
                self.assertTrue(user_one.train(records)["trained"])
                user_two = registry.get("user-two")
                self.assertEqual(user_two.training_samples, 0)
                task = {"category": "Work", "priority": "Medium"}
                self.assertEqual(user_one.predict(task, user_history_count=10)["prediction_source"], "ml_personalized")
                self.assertEqual(user_two.predict(task, user_history_count=10)["prediction_source"], "baseline")
                self.assertEqual(UserModelRegistry().get("user-one").training_samples, 10)

    def test_prediction_request_preserves_user_scope(self):
        request = TaskPredictionRequest(user_id="user-one")
        self.assertEqual(request.model_dump()["user_id"], "user-one")

    def test_scheduler_constraints_and_breaks(self):
        """Test that tasks respect workday boundaries and automatic breaks are placed."""
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

    def test_overcommitment_detection(self):
        """Test detection of overcommitment when planned work exceeds capacity."""
        excessive_tasks = [
            {"id": f"t_{i}", "title": f"Heavy Task {i}", "category": "Work", "priority": "High", "current_predicted_minutes": 120}
            for i in range(6) # 12 hours of work in an 8-hour day
        ]
        prefs = {
            "work_start_time": "09:00",
            "work_end_time": "17:00", # 8 hours (480 mins)
            "break_duration": 30
        }
        res = scheduler.schedule(tasks=excessive_tasks, preferences=prefs)

        self.assertEqual(res["status"], "Overcommitted")
        self.assertGreater(res["utilization_percentage"], 100)
        self.assertGreater(len(res["unscheduled_tasks"]), 0)
        self.assertTrue(any("capacity reached" in u.get("unscheduled_reason", "").lower() for u in res["unscheduled_tasks"]))
        # Verify an overcommitment recommendation is generated
        self.assertTrue(any(r.get("type") == "overcommitment" for r in res.get("recommendations", [])))

    def test_dependency_enforcement(self):
        """Test that dependent tasks are held unscheduled until prerequisite finishes."""
        tasks = [
            {"id": "t1", "title": "Draft Architecture", "status": "Pending", "current_predicted_minutes": 60},
            {"id": "t2", "title": "Implement API", "dependencies": ["t1"], "status": "Pending", "current_predicted_minutes": 60}
        ]
        res = scheduler.schedule(tasks=tasks)
        unscheduled_reasons = [u.get("unscheduled_reason", "") for u in res["unscheduled_tasks"]]
        self.assertTrue(any("Prerequisite task(s)" in r for r in unscheduled_reasons))

    def test_energy_aware_task_placement(self):
        """Test that high energy tasks are scheduled in morning when preferred energy is Morning."""
        tasks = [
            {"id": "t_high", "title": "Complex Algorithm Design", "category": "Work", "priority": "High", "energy_requirement": "High", "current_predicted_minutes": 60},
            {"id": "t_low", "title": "Inbox Zero", "category": "Work", "priority": "Low", "energy_requirement": "Low", "current_predicted_minutes": 60}
        ]
        prefs = {
            "work_start_time": "09:00",
            "work_end_time": "17:00",
            "energy_preference": "Morning"
        }
        res = scheduler.schedule(tasks=tasks, preferences=prefs)
        blocks = res["scheduled_blocks"]
        # Find block for t_high
        high_block = next((b for b in blocks if b.get("task_id") == "t_high"), None)
        self.assertIsNotNone(high_block)
        # Should be scheduled before noon
        hour = int(high_block["start_at"].split(":")[0])
        self.assertLess(hour, 12)

    def test_lunch_break_preservation(self):
        """Test that a continuous full workday inserts protected lunch break."""
        tasks = [
            {"id": "t1", "title": "Morning Task", "category": "Work", "priority": "High", "current_predicted_minutes": 180},
            {"id": "t2", "title": "Afternoon Task", "category": "Work", "priority": "Medium", "current_predicted_minutes": 180}
        ]
        prefs = {
            "work_start_time": "09:00",
            "work_end_time": "18:00"
        }
        res = scheduler.schedule(tasks=tasks, preferences=prefs)
        has_break = any(b.get("block_type") == "break" for b in res["scheduled_blocks"])
        self.assertTrue(has_break)

if __name__ == '__main__':
    unittest.main()
