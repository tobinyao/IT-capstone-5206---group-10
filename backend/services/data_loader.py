from pathlib import Path
import json


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"


def load_json_data(filename):
    file_path = DATA_DIR / filename

    with open(file_path, "r", encoding="utf-8") as file:
        return json.load(file)


def find_record_by_id(records, record_id):
    for record in records:
        if record.get("id") == record_id:
            return record
    return None
