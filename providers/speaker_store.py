import uuid
from typing import TypedDict, List

class EnrolledSpeaker(TypedDict):
    id: str
    label: str
    identifiers: List[str]

_store: dict[str, EnrolledSpeaker] = {}


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
    return speaker


def remove(speaker_id: str) -> bool:
    return _store.pop(speaker_id, None) is not None
