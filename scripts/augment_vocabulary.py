#!/usr/bin/env python3
"""Augment vocabulary.json with new words from teacher materials.

Reads a JSON file of new words and merges them into the existing vocabulary.
- New words (by french form) are added
- Existing words can be updated if --update flag is set (teacher formulations take priority)
- Maintains ID uniqueness and topic/level metadata

Usage:
    python scripts/augment_vocabulary.py new_words.json [--update] [--dry-run]

Input format (new_words.json):
[
  {
    "french": "le plat principal",
    "english": "main course",
    "example_fr": "Comme plat principal, je voudrais le poulet.",
    "example_en": "For the main course, I would like the chicken.",
    "topic": "food",
    "level": "A1",
    "pos": "noun",
    "gender": "m"
  }
]

Words with a matching 'french' field are considered duplicates.
"""
from __future__ import annotations

import json
import sys
import argparse
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
VOCAB_FILE = PROJECT_DIR / "src" / "data" / "vocabulary.json"


def normalize(french: str) -> str:
    """Normalize French text for comparison (lowercase, strip articles)."""
    return french.strip().lower()


def generate_id(word: dict, existing_ids: set[str]) -> str:
    """Generate a unique ID for a new word."""
    base = word["french"].lower()
    # Strip leading articles
    for article in ["le ", "la ", "l'", "les ", "un ", "une ", "des "]:
        if base.startswith(article):
            base = base[len(article):]
            break
    # Convert to slug
    slug = base.replace(" ", "_").replace("'", "").replace("-", "_")
    # Remove accents roughly
    for old, new in [("e", "e"), ("a", "a"), ("i", "i"), ("o", "o"), ("u", "u")]:
        slug = slug.replace(old, new)

    candidate = f"{word['topic']}_{slug}"
    if candidate not in existing_ids:
        return candidate

    # Add numeric suffix
    for i in range(2, 100):
        suffixed = f"{candidate}_{i}"
        if suffixed not in existing_ids:
            return suffixed

    raise ValueError(f"Cannot generate unique ID for {word['french']}")


def main():
    parser = argparse.ArgumentParser(description="Augment vocabulary corpus")
    parser.add_argument("input", help="JSON file with new words")
    parser.add_argument("--update", action="store_true", help="Update existing words with new data")
    parser.add_argument("--dry-run", action="store_true", help="Show what would change")
    args = parser.parse_args()

    # Load existing vocabulary
    vocab = json.loads(VOCAB_FILE.read_text())
    existing_words = vocab["words"]
    existing_by_french = {normalize(w["french"]): w for w in existing_words}
    existing_ids = {w["id"] for w in existing_words}

    # Load new words
    new_words = json.loads(Path(args.input).read_text())
    print(f"Existing: {len(existing_words)} words")
    print(f"Input: {len(new_words)} words")

    added = 0
    updated = 0
    skipped = 0

    for nw in new_words:
        key = normalize(nw["french"])
        if key in existing_by_french:
            if args.update:
                # Update existing word with teacher data
                existing = existing_by_french[key]
                changes = []
                for field in ["english", "example_fr", "example_en"]:
                    if field in nw and nw[field] != existing.get(field):
                        changes.append(field)
                        if not args.dry_run:
                            existing[field] = nw[field]
                if changes:
                    updated += 1
                    if args.dry_run:
                        print(f"  UPDATE: {nw['french']} ({', '.join(changes)})")
                else:
                    skipped += 1
            else:
                skipped += 1
                if args.dry_run:
                    print(f"  SKIP (exists): {nw['french']}")
        else:
            added += 1
            word_id = generate_id(nw, existing_ids)
            existing_ids.add(word_id)
            entry = {
                "id": word_id,
                "french": nw["french"],
                "english": nw["english"],
                "example_fr": nw.get("example_fr", ""),
                "example_en": nw.get("example_en", ""),
                "topic": nw["topic"],
                "level": nw.get("level", "A1"),
                "pos": nw.get("pos", "noun"),
                "gender": nw.get("gender"),
            }
            if args.dry_run:
                print(f"  ADD: {nw['french']} ({nw['english']}) [{nw['topic']}, {nw.get('level', 'A1')}]")
            else:
                existing_words.append(entry)
                existing_by_french[key] = entry

    print(f"\nResult: {added} added, {updated} updated, {skipped} skipped")

    if not args.dry_run and (added > 0 or updated > 0):
        # Update metadata
        vocab["metadata"]["total_words"] = len(existing_words)
        vocab["metadata"]["topics"] = sorted(set(w["topic"] for w in existing_words))
        levels = {}
        for w in existing_words:
            levels[w["level"]] = levels.get(w["level"], 0) + 1
        vocab["metadata"]["levels"] = levels

        VOCAB_FILE.write_text(json.dumps(vocab, indent=2, ensure_ascii=False))
        print(f"Saved: {len(existing_words)} total words")


if __name__ == "__main__":
    main()
