#!/usr/bin/env python3
"""Generate model dialogue corpus for French Fide exam preparation.

Reads scenario JSON files and uses Claude to generate realistic exam-style
dialogues with comprehension questions. Output: src/data/dialogues.json

Usage:
    python scripts/generate_dialogues.py [--dry-run] [--resume]

    --dry-run   Print what would be generated without calling the API
    --resume    Skip dialogues that already exist in output file
"""
from __future__ import annotations

import json
import os
import sys
import time
import argparse
from pathlib import Path

import anthropic

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
DATA_DIR = PROJECT_DIR / "src" / "data"
OUTPUT_FILE = DATA_DIR / "dialogues.json"

# Load API key from OC .env if not in environment
def load_api_key() -> str:
    key = os.environ.get("ANTHROPIC_API_KEY", "")
    if key:
        return key
    # Try OC .env
    oc_env = PROJECT_DIR.parent / "opencommodities-phase1" / ".env"
    if oc_env.exists():
        for line in oc_env.read_text().splitlines():
            if line.startswith("ANTHROPIC_API_KEY="):
                return line.split("=", 1)[1].strip()
    print("ERROR: No ANTHROPIC_API_KEY found", file=sys.stderr)
    sys.exit(1)


# Scenario definitions: (file, key_for_sub_items, sub_item_fields, variants_per_sub)
SCENARIO_SPECS = [
    {
        "file": "role-play.json",
        "type": "role_play",
        "items_key": "scenarios",
        "id_field": "id",
        "context_fn": lambda item: f"Role-play: {item['scenario']}. The examiner plays {item['role']}. Opening: \"{item['opening']}\"",
        "variants": 3,
        "level": "A2",
    },
    {
        "file": "open-discussion.json",
        "type": "open_discussion",
        "items_key": "topics",
        "id_field": "id",
        "context_fn": lambda item: f"Open discussion about: {item['title']}. Sample questions: {'; '.join(item['questions'][:3])}",
        "variants": 3,
        "level": "A2",
    },
    {
        "file": "image-description.json",
        "type": "image_description",
        "items_key": "image_prompts",
        "id_field": "id",
        "context_fn": lambda item: f"Image description: {item['description']}. Follow-ups: {'; '.join(item['follow_up_questions'])}",
        "variants": 2,
        "level": "A2",
    },
    {
        "file": "sequential-images.json",
        "type": "sequential_images",
        "items_key": "sequences",
        "id_field": "id",
        "context_fn": lambda item: f"Sequential image narration: {item['title']}. Images: {'; '.join(item['images'][:3])}...",
        "variants": 2,
        "level": "A1",
    },
    {
        "file": "self-introduction.json",
        "type": "self_introduction",
        "items_key": None,  # Single scenario, no sub-items
        "id_field": None,
        "context_fn": lambda _item: "Self-introduction interview. The examiner asks about name, nationality, family, work, life in Switzerland.",
        "variants": 4,
        "level": "A2",
    },
    {
        "file": "listening-comprehension.json",
        "type": "listening_comprehension",
        "items_key": "exercises",
        "id_field": "id",
        "context_fn": lambda item: f"Listening comprehension based on passage: \"{item['passage'][:100]}...\"",
        "variants": 2,
        "level": "A2",  # Overridden per-exercise in build_task_list
    },
    {
        "file": "letter-writing.json",
        "type": "letter_writing",
        "items_key": "prompts",
        "id_field": "id",
        "context_fn": lambda item: f"Letter/email writing: {item['situation']}. Required points: {'; '.join(item['required_points'])}",
        "variants": 2,
        "level": "A1",
    },
]

SYSTEM_PROMPT = """You are a Swiss French exam content creator for the Fide A1-A2 test. Generate a realistic model dialogue that could appear in the oral exam.

IMPORTANT RULES:
- Use Swiss French conventions (vous forms throughout, Swiss vocabulary where relevant)
- Keep vocabulary and grammar strictly at the specified CEFR level (A1 or A2)
- Each dialogue should be 6-10 turns (examiner + candidate alternating)
- The candidate should demonstrate competence at the target level, with natural minor hesitations
- Include 3 comprehension questions: one gist (what is the main topic/outcome), one response (what would be an appropriate reply), one vocab_in_context (what does a specific word/phrase mean in this context)
- Each question must have exactly 4 options with one correct answer
- Provide English translations for all French text

Respond with ONLY valid JSON matching this structure (no markdown, no extra text):
{
  "title": "Short descriptive title in English",
  "context": "One-sentence setup description in English",
  "turns": [
    {"speaker": "examiner", "french": "...", "english": "..."},
    {"speaker": "candidate", "french": "...", "english": "..."}
  ],
  "key_phrases": [
    {"french": "...", "english": "..."}
  ],
  "questions": [
    {
      "id": "q1",
      "question": "Question text in English",
      "type": "gist",
      "context_turn": 0,
      "options": ["A", "B", "C", "D"],
      "correct_index": 0,
      "explanation": "Brief explanation in English"
    }
  ]
}"""


def build_prompt(scenario_type: str, context: str, level: str, variant: int) -> str:
    return f"""Generate a model dialogue for the Swiss Fide French exam.

Scenario type: {scenario_type}
CEFR level: {level}
Context: {context}
Variant: {variant} (make this dialogue distinct from other variants of the same scenario)

Generate the dialogue now. Remember: ONLY valid JSON, no markdown fences."""


def generate_one(client: anthropic.Anthropic, scenario_type: str, scenario_id: str,
                 context: str, level: str, variant: int, dialogue_id: str) -> dict | None:
    prompt = build_prompt(scenario_type, context, level, variant)

    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )
        text = response.content[0].text.strip()
        # Strip markdown fences if present
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
            if text.endswith("```"):
                text = text[:-3]

        data = json.loads(text)

        # Validate structure
        assert "turns" in data and len(data["turns"]) >= 4, "Too few turns"
        assert "questions" in data and len(data["questions"]) >= 3, "Too few questions"
        for q in data["questions"]:
            assert len(q["options"]) == 4, f"Question {q['id']} needs 4 options"
            assert 0 <= q["correct_index"] <= 3, f"Invalid correct_index in {q['id']}"

        # Attach metadata
        data["id"] = dialogue_id
        data["scenario_type"] = scenario_type
        data["scenario_id"] = scenario_id
        data["level"] = level

        # Ensure question IDs are unique within dialogue
        for i, q in enumerate(data["questions"]):
            q["id"] = f"{dialogue_id}-q{i+1}"

        return data

    except json.JSONDecodeError as e:
        print(f"  JSON parse error for {dialogue_id}: {e}", file=sys.stderr)
        return None
    except AssertionError as e:
        print(f"  Validation error for {dialogue_id}: {e}", file=sys.stderr)
        return None
    except Exception as e:
        print(f"  API error for {dialogue_id}: {e}", file=sys.stderr)
        return None


def build_task_list() -> list[dict]:
    """Build the full list of dialogues to generate."""
    tasks = []
    for spec in SCENARIO_SPECS:
        scenario_file = DATA_DIR / spec["file"]
        scenario_data = json.loads(scenario_file.read_text())

        if spec["items_key"] is None:
            # Single-item scenario (self-introduction)
            for v in range(1, spec["variants"] + 1):
                dialogue_id = f"{spec['type']}-v{v}"
                context = spec["context_fn"](scenario_data)
                tasks.append({
                    "id": dialogue_id,
                    "type": spec["type"],
                    "scenario_id": spec["type"],
                    "context": context,
                    "level": spec["level"],
                    "variant": v,
                })
        else:
            items = scenario_data[spec["items_key"]]
            for item in items:
                item_id = item[spec["id_field"]]
                # Handle level from item or spec
                if spec["type"] == "listening_comprehension":
                    level = "A1" if item.get("level") == "A1" else "A2"
                else:
                    level = spec["level"]

                for v in range(1, spec["variants"] + 1):
                    dialogue_id = f"{spec['type']}-{item_id}-v{v}"
                    context = spec["context_fn"](item)
                    tasks.append({
                        "id": dialogue_id,
                        "type": spec["type"],
                        "scenario_id": item_id,
                        "context": context,
                        "level": level,
                        "variant": v,
                    })

    return tasks


def main():
    parser = argparse.ArgumentParser(description="Generate dialogue corpus")
    parser.add_argument("--dry-run", action="store_true", help="Print tasks without calling API")
    parser.add_argument("--resume", action="store_true", help="Skip existing dialogues")
    args = parser.parse_args()

    tasks = build_task_list()
    print(f"Total dialogues to generate: {len(tasks)}")

    if args.dry_run:
        for t in tasks:
            print(f"  {t['id']} ({t['type']}, {t['level']}, variant {t['variant']})")
        return

    # Load existing if resuming
    existing_ids = set()
    existing_dialogues = []
    if args.resume and OUTPUT_FILE.exists():
        corpus = json.loads(OUTPUT_FILE.read_text())
        existing_dialogues = corpus.get("dialogues", [])
        existing_ids = {d["id"] for d in existing_dialogues}
        print(f"Resuming: {len(existing_ids)} dialogues already generated")

    remaining = [t for t in tasks if t["id"] not in existing_ids]
    print(f"Remaining: {len(remaining)} dialogues")

    if not remaining:
        print("Nothing to generate.")
        return

    api_key = load_api_key()
    client = anthropic.Anthropic(api_key=api_key)

    dialogues = list(existing_dialogues)
    failed = []

    for i, task in enumerate(remaining):
        print(f"[{i+1}/{len(remaining)}] Generating {task['id']}...")
        result = generate_one(
            client,
            task["type"],
            task["scenario_id"],
            task["context"],
            task["level"],
            task["variant"],
            task["id"],
        )

        if result:
            dialogues.append(result)
            print(f"  OK: {len(result['turns'])} turns, {len(result['questions'])} questions")
        else:
            failed.append(task["id"])
            print(f"  FAILED")

        # Save progress every 10 dialogues
        if (i + 1) % 10 == 0 or i == len(remaining) - 1:
            save_corpus(dialogues)
            print(f"  Saved ({len(dialogues)} total)")

        # Rate limiting: ~0.5s between calls
        if i < len(remaining) - 1:
            time.sleep(0.5)

    save_corpus(dialogues)
    print(f"\nDone. {len(dialogues)} dialogues saved, {len(failed)} failed.")
    if failed:
        print(f"Failed: {', '.join(failed)}")


def save_corpus(dialogues: list[dict]):
    scenario_types = sorted(set(d["scenario_type"] for d in dialogues))
    corpus = {
        "version": "1.0",
        "metadata": {
            "total_dialogues": len(dialogues),
            "scenario_types": scenario_types,
        },
        "dialogues": dialogues,
    }
    OUTPUT_FILE.write_text(json.dumps(corpus, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
