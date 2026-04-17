#!/usr/bin/env python3
"""Extract raw transcripts from *-ref.json files and save as .txt alongside them."""

import json
from pathlib import Path

VIDEOS_DIR = Path(__file__).parent / "Videos"


def extract_transcript(ref_path: Path) -> str:
    with open(ref_path) as f:
        data = json.load(f)
    words = [entry["content"] for entry in data.get("reference", [])]
    return " ".join(words)


def main():
    if not VIDEOS_DIR.is_dir():
        print(f"Videos directory not found: {VIDEOS_DIR}")
        return

    for folder in sorted(VIDEOS_DIR.iterdir()):
        if not folder.is_dir():
            continue
        for ref_file in folder.glob("*-ref.json"):
            txt_path = ref_file.with_suffix(".txt")
            transcript = extract_transcript(ref_file)
            txt_path.write_text(transcript, encoding="utf-8")
            print(f"Wrote {txt_path.relative_to(VIDEOS_DIR.parent)}")


if __name__ == "__main__":
    main()
