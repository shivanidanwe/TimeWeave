import os
import random
import numpy as np
import pandas as pd
from model import model, CATEGORY_BASELINES, PRIORITY_MULTIPLIERS, ENERGY_MULTIPLIERS

def generate_benchmark_data(num_samples: int = 150):
    categories = ["Study", "Work", "Personal", "Health", "Other"]
    priorities = ["Low", "Medium", "High", "Critical"]
    energies = ["Low", "Medium", "High"]
    flexibilities = ["Flexible", "Fixed"]

    sample_titles = {
        "Study": ["Machine Learning Lecture", "Read Research Paper", "Algorithm Practice", "Exam Preparation", "Statistics Notes"],
        "Work": ["Project Development", "Client Sprint Review", "Code Refactoring", "API Integration", "Database Migration"],
        "Personal": ["Grocery Shopping", "Organize Workspace", "Budget Review", "Meal Prep", "Call Family"],
        "Health": ["Gym Workout", "Cardio Run", "Yoga & Meditation", "Physio Session", "Evening Walk"],
        "Other": ["Inbox Zero", "Backup Files", "Desk Setup", "Renew Subscriptions"]
    }

    records = []
    random.seed(42)
    np.random.seed(42)

    for i in range(num_samples):
        cat = random.choice(categories)
        prio = random.choice(priorities)
        energy = random.choice(energies)
        flex = random.choice(flexibilities)
        title = random.choice(sample_titles[cat])
        desc = f"Comprehensive session focusing on {title.lower()} with targeted deliverables."

        base = CATEGORY_BASELINES[cat]
        p_factor = PRIORITY_MULTIPLIERS[prio]
        e_factor = ENERGY_MULTIPLIERS[energy]

        user_est = int(round(base * p_factor * random.uniform(0.7, 1.2)))
        user_est = max(15, min(360, user_est))

        # Humans typically underestimate by 15-30% on complex tasks
        human_bias = random.gauss(1.22, 0.18)
        actual = int(round(user_est * human_bias))
        actual = max(15, min(480, actual))

        day_of_week = random.randint(0, 6)
        hour_of_day = random.randint(8, 19)
        has_deps = 1 if random.random() < 0.25 else 0

        records.append({
            "title": title,
            "description": desc,
            "category": cat,
            "priority": prio,
            "energy_requirement": energy,
            "flexibility": flex,
            "user_estimated_minutes": user_est,
            "actual_duration_minutes": actual,
            "day_of_week": day_of_week,
            "hour_of_day": hour_of_day,
            "has_dependencies": has_deps
        })

    return records

def run_training():
    print("Generating benchmark training dataset...")
    data = generate_benchmark_data(200)
    print(f"Dataset generated: {len(data)} records.")

    print("Training DurationModel Random Forest Pipeline...")
    res = model.train(data)
    print("Training Results:")
    print(f"  Status: {res.get('status')}")
    print(f"  Samples: {res.get('samples')}")
    print(f"  MAE: {res.get('mae')} minutes")
    print(f"  R2 Score: {res.get('r2')}")
    print(f"  Model Version: {res.get('version')}")

    # Test sample prediction
    test_task = {
        "title": "Build Machine Learning Model",
        "description": "Implement and train classification model using Scikit-learn",
        "category": "Study",
        "priority": "High",
        "energy_requirement": "High",
        "flexibility": "Flexible",
        "user_estimated_minutes": 120
    }

    pred = model.predict(test_task, user_history_count=10)
    print("\nSample Test Prediction for 'Build Machine Learning Model':")
    print(f"  Predicted: {pred['predicted_minutes']}m ({pred['confidence_lower']}m - {pred['confidence_upper']}m)")
    print(f"  Source: {pred['prediction_source']}")
    print(f"  Explanations: {pred['explanations']}")

if __name__ == "__main__":
    run_training()
