"""
One-time / resume-safe generator for numerology_tendencies (~14,256 rows).

Usage:
  python generate_numerology_db.py              # Anthropic batches (needs ANTHROPIC_API_KEY)
  python generate_numerology_db.py --resume     # continue from checkpoint
  python generate_numerology_db.py --templates  # instant local bootstrap (no API)
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from typing import Any, Dict, List, Tuple

from numerology_db import (
    BASE_SEED,
    NumerologyBase,
    NumerologyTendency,
    SessionLocal,
    init_db,
    seed_base_rows,
)
from numerology_engine import GENDERS, SEVERITIES, AGE_BANDS, VARIANTS_PER_COMBO, sanitize_public_text

PROGRESS_FILE = os.path.join(os.path.dirname(__file__), "numerology_gen_progress.json")
BATCH_SIZE = int(os.environ.get("NUMEROLOGY_GEN_BATCH", "75"))
ANTHROPIC_MODEL = os.environ.get("ANTHROPIC_NUMEROLOGY_MODEL", "claude-sonnet-4-20250514")


def build_combinations() -> List[Dict[str, Any]]:
    combos: List[Dict[str, Any]] = []
    for number, _planet, _dasha, dosha, _sec, organs in BASE_SEED:
        for organ in organs:
            for severity in SEVERITIES:
                for age_band in AGE_BANDS:
                    for gender in GENDERS:
                        for variant in range(VARIANTS_PER_COMBO):
                            combos.append(
                                {
                                    "number": number,
                                    "dosha": dosha,
                                    "organ": organ,
                                    "severity": severity,
                                    "age_band": age_band,
                                    "gender": gender,
                                    "variant_index": variant,
                                }
                            )
    return combos


def template_entry(combo: Dict[str, Any]) -> Tuple[str, str]:
    v = combo["variant_index"]
    tendency = (
        f"Constitutional Tendency ({combo['severity']}): {combo['dosha']} influence on the "
        f"{combo['organ']} is notable for {combo['age_band'].lower()} patients "
        f"({combo['gender']}). Variant {v + 1}: tissue congestion or functional drift may "
        f"appear under stress, dehydration, or seasonal change. Electro-Homeopathy assessment "
        f"should correlate this with blood–lymph circulation and visible temperament signs."
    )
    watch = f"Periodic review of {combo['organ']} markers and {combo['dosha'].lower()} aggravation triggers."
    return sanitize_public_text(tendency), sanitize_public_text(watch)


def load_progress() -> Dict[str, int]:
    if not os.path.isfile(PROGRESS_FILE):
        return {"completed_index": 0, "total": 0}
    with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_progress(completed_index: int, total: int):
    with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
        json.dump({"completed_index": completed_index, "total": total}, f, indent=2)


def call_anthropic_batch(batch: List[Dict[str, Any]]) -> List[Dict[str, str]]:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY not set — use --templates for offline bootstrap")

    try:
        import anthropic
    except ImportError as exc:
        raise RuntimeError("pip install anthropic") from exc

    client = anthropic.Anthropic(api_key=api_key)
    payload = [
        {
            "number": c["number"],
            "dosha": c["dosha"],
            "organ": c["organ"],
            "severity": c["severity"],
            "age_band": c["age_band"],
            "gender": c["gender"],
            "variant_index": c["variant_index"],
        }
        for c in batch
    ]
    prompt = (
        f"Generate {len(batch)} unique constitutional health tendency descriptions for an "
        "Electro-Homeopathy system. Each corresponds to a dosha + organ + severity + age + "
        "gender combination (provided as a list). For each, write 1–2 sentences describing "
        "the tendency, plus one monitoring watch_point. Do NOT mention numerology, astrology, "
        "planets, grah, dasha, or numbers anywhere — phrase purely as constitutional/clinical "
        "tendencies. Ensure wording is varied across all entries — no duplicates. Return ONLY "
        "a JSON array matching input order, each item: "
        '{"tendency_text":"...","watch_point":"..."}. Input combinations:\n'
        + json.dumps(payload)
    )

    msg = client.messages.create(
        model=ANTHROPIC_MODEL,
        max_tokens=8000,
        messages=[{"role": "user", "content": prompt}],
    )
    text = msg.content[0].text if msg.content else "[]"
    start = text.find("[")
    end = text.rfind("]") + 1
    if start < 0 or end <= start:
        raise ValueError("Anthropic response did not contain JSON array")
    rows = json.loads(text[start:end])
    if len(rows) != len(batch):
        raise ValueError(f"Expected {len(batch)} rows, got {len(rows)}")
    return rows


def insert_rows(db, combos: List[Dict[str, Any]], generated: List[Dict[str, str]]):
    for combo, gen in zip(combos, generated):
        tendency_text = sanitize_public_text(gen.get("tendency_text", ""))
        watch_point = sanitize_public_text(gen.get("watch_point", ""))
        if not tendency_text:
            tendency_text, watch_point = template_entry(combo)
        row = NumerologyTendency(
            number=combo["number"],
            dosha=combo["dosha"],
            organ=combo["organ"],
            severity=combo["severity"],
            age_band=combo["age_band"],
            gender=combo["gender"],
            variant_index=combo["variant_index"],
            tendency_text=tendency_text,
            watch_point=watch_point,
        )
        db.add(row)
    db.commit()


def generate(use_templates: bool, resume: bool):
    init_db()
    db = SessionLocal()
    try:
        seed_base_rows(db)
        existing = db.query(NumerologyTendency).count()
        if existing > 0 and not resume and not use_templates:
            print(f"[gen] numerology_tendencies already has {existing} rows — use --resume to continue")
            return

        combos = build_combinations()
        total = len(combos)
        progress = load_progress() if resume else {"completed_index": 0, "total": total}
        start_idx = progress.get("completed_index", 0) if resume else 0
        if not resume:
            db.query(NumerologyTendency).delete()
            db.commit()
            save_progress(0, total)

        print(f"[gen] total combinations: {total} | starting at index {start_idx}")

        idx = start_idx
        while idx < total:
            batch = combos[idx : idx + BATCH_SIZE]
            if use_templates:
                generated = [
                    {"tendency_text": template_entry(c)[0], "watch_point": template_entry(c)[1]}
                    for c in batch
                ]
            else:
                try:
                    generated = call_anthropic_batch(batch)
                except Exception as exc:
                    print(f"[gen] Anthropic batch failed at {idx}: {exc}")
                    print("[gen] falling back to template text for this batch")
                    generated = [
                        {"tendency_text": template_entry(c)[0], "watch_point": template_entry(c)[1]}
                        for c in batch
                    ]

            insert_rows(db, batch, generated)
            idx += len(batch)
            save_progress(idx, total)
            print(f"Generated {idx} / {total} entries…")
            if not use_templates:
                time.sleep(0.5)

        print(f"[gen] complete — {total} rows in numerology_tendencies")
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--resume", action="store_true", help="Continue from checkpoint")
    parser.add_argument(
        "--templates",
        action="store_true",
        help="Generate varied template text locally (no Anthropic)",
    )
    args = parser.parse_args()
    generate(use_templates=args.templates, resume=args.resume)


if __name__ == "__main__":
    main()
