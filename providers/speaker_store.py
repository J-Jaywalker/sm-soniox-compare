import json
import os
import uuid
from typing import TypedDict, List

class EnrolledSpeaker(TypedDict):
    id: str
    label: str
    identifiers: List[str]

_STORE_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "speakers.json")
_store: dict[str, EnrolledSpeaker] = {}


def _load() -> None:
    global _store
    try:
        with open(_STORE_PATH, "r") as f:
            data = json.load(f)
        _store = {s["id"]: s for s in data}
    except FileNotFoundError:
        _store = {}


def _save() -> None:
    os.makedirs(os.path.dirname(_STORE_PATH), exist_ok=True)
    with open(_STORE_PATH, "w") as f:
        json.dump(list(_store.values()), f, indent=2)


# Load on import
_load()


def get_all() -> List[EnrolledSpeaker]:
    return list(_store.values())


def add(label: str, identifiers: List[str]) -> EnrolledSpeaker:
    speaker_id = str(uuid.uuid4())
    speaker: EnrolledSpeaker = {
        "id": speaker_id,
        "label": label,
        "identifiers": identifiers,
    }
    _store[speaker_id] = speaker
    _save()
    return speaker


def remove(speaker_id: str) -> bool:
    existed = _store.pop(speaker_id, None) is not None
    if existed:
        _save()
    return existed
