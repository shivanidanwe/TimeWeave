import argparse
import json
from pathlib import Path

from model import user_models


def run_training(user_id: str, records_path: Path) -> int:
    with records_path.open(encoding="utf-8") as records_file:
        records = json.load(records_file)

    if not isinstance(records, list):
        raise ValueError("Training input must be a JSON array of completed task records.")

    result = user_models.get(user_id).train(records)
    print(json.dumps(result, indent=2))
    return 0 if result.get("trained") else 1


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train one user's duration model from completed task records.")
    parser.add_argument("user_id", help="The local TimeWeave user ID that owns these records.")
    parser.add_argument("records_json", type=Path, help="JSON array of that user's completed task records.")
    args = parser.parse_args()
    raise SystemExit(run_training(args.user_id, args.records_json))