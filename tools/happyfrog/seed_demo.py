#!/usr/bin/env python3
"""Install curated demo data into an explicitly supplied COPY of a guest DB.

Uses only Python's standard library. Never connects to a device or account.
The manifest tracks fixture ownership; no application rows are deleted.
"""

from __future__ import annotations

import argparse
from collections import Counter
from datetime import date, datetime, timedelta, timezone
import json
from pathlib import Path
import sqlite3
import sys


PREFIX = "henscreenshots:demo:v1:"
MANIFEST = "henscreenshots_demo_manifest"
SCHEMA_VERSION = 28
# Integer identifiers are also recorded in the namespaced ownership manifest.
HABIT_BASE = -78001000
COMPLETION_BASE = -78010000
JOURNAL_BASE = -78002000


def build_fixture(day: date) -> list[tuple[str, dict]]:
    rows: list[tuple[str, dict]] = []

    def stamp(offset: int = 0, hour: int = 12, minute: int = 0) -> str:
        value = datetime.combine(day + timedelta(days=offset), datetime.min.time())
        return value.replace(hour=hour, minute=minute, tzinfo=timezone.utc).isoformat(
            timespec="milliseconds"
        ).replace("+00:00", "Z")

    def add(table: str, **values) -> None:
        rows.append((table, values))

    habits = [
        ("Morning stretch", "morning", set()),
        ("Drink enough water", "day", {10, 17}),
        ("Read 20 pages", "evening", {0, 6, 13}),
        ("Walk outdoors", "day", {0, 7, 14}),
        ("Write a daily reflection", "evening", {8, 15}),
        ("Screen-free bedtime", "night", {0, 6, 12, 18}),
    ]
    for index, (name, moment, missed) in enumerate(habits):
        habit_id = HABIT_BASE - index
        add("habits", id=habit_id, name=name, created_at=stamp(-20, 6, index),
            target_date=stamp(9), is_archived=0, moment=moment)
        for offset in range(21):
            if offset not in missed:
                add("habit_completions", id=COMPLETION_BASE - index * 100 - offset,
                    habit_id=habit_id, date=(day - timedelta(days=offset)).isoformat())

    projects = [
        ("creative", "Creative projects", "personal-work"),
        ("wellbeing", "A little better every day", "personal"),
    ]
    for key, name, area in projects:
        add("projects", id=f"{PREFIX}project:{key}", name=name, area_id=area,
            created_at=stamp(-20), updated_at=stamp(-1))

    work = [
        ("Plan the next app release", "creative", "personal-work", "next", "high", 45, 1,
         "Choose one meaningful improvement and keep the release small."),
        ("Sketch the welcome screen", "creative", "personal-work", "doing", "high", 60, 0,
         "Make the first minute feel simple, warm, and useful."),
        ("Take a quiet afternoon walk", "wellbeing", "personal", "next", "medium", 30, 0,
         "Leave the phone in my pocket and enjoy the fresh air."),
        ("Create a reading corner", "wellbeing", "personal", "doing", "medium", 25, 2,
         "A comfortable chair, good light, and the next book within reach."),
        ("Save inspiration for the next project", "creative", "personal-work", "backlog", "low", 20, 5,
         "Collect three thoughtful examples of calm, useful design."),
        ("Review this week's small wins", "wellbeing", "personal", "next", "medium", 15, 1,
         "Notice what worked and choose what to carry into next week."),
        ("Write the release checklist", "creative", "personal-work", "done", "high", 30, 0,
         "The next release now has a clear path from idea to launch."),
        ("Prepare a healthy breakfast", "wellbeing", "personal", "done", "medium", 20, 0,
         "Start the day with something nourishing and unhurried."),
    ]
    for index, (title, project, area, status, priority, minutes, due, description) in enumerate(work):
        item_id = f"{PREFIX}work:{index}"
        started = stamp(-1, 14) if status in {"doing", "done"} else None
        ended = stamp(0, 12, 15 + index) if status == "done" else None
        add("work_items", id=item_id, title=title, description=description,
            type="task", status=status, sort_order=index, priority=priority,
            area_id=area, project_id=f"{PREFIX}project:{project}",
            started_date=started, end_date=ended, due_date=stamp(due, 22),
            scheduled_at=stamp(due, 16), estimated_minutes=minutes,
            reminder_at=None, recurrence_frequency="none", recurrence_interval=1,
            recurrence_weekdays="", recurrence_source_id=None, archived_at=None,
            created_at=stamp(-7), updated_at=ended or started or stamp(-3))
        states = ["backlog", "next", "doing", "done"][:["backlog", "next", "doing", "done"].index(status) + 1]
        times = [stamp(-7), stamp(-3), started, ended]
        for step, state in enumerate(states):
            previous = states[step - 1] if step else None
            add("work_item_status_events", id=f"{PREFIX}status:{index}:{step}",
                work_item_id=item_id, from_status=previous, to_status=state,
                changed_at=times[step])
            add("work_item_events", id=f"{PREFIX}event:{index}:{step}",
                work_item_id=item_id, event_type="statusChanged" if step else "created",
                from_status=previous, to_status=state, changed_fields="[]",
                occurred_at=times[step])

    checklists = {
        0: ["Review feedback", "Choose the main improvement", "Set a release date"],
        1: ["Simplify the first step", "Write welcoming copy", "Check the small screen layout"],
        6: ["Test the main flows", "Prepare screenshots", "Write release notes"],
    }
    for item, titles in checklists.items():
        for index, title in enumerate(titles):
            add("work_item_checklist_items", id=f"{PREFIX}checklist:{item}:{index}",
                work_item_id=f"{PREFIX}work:{item}", title=title,
                is_completed=int(item == 6 or index == 0), sort_order=index,
                created_at=stamp(-7), updated_at=stamp(-1))

    reflections = [
        (0, "😊", "A calmer start\n\nA few stretches, a glass of water, and a clear plan. Small routines are making my mornings feel lighter."),
        (1, "🤩", "Small steps add up\n\nFinished the first sketch for my next app update. I kept the scope simple and left room to enjoy the process."),
        (2, "😊", "Room to breathe\n\nAn afternoon walk helped me return with a fresh perspective. Rest belongs in the plan, too."),
        (4, "🤔", "What I want to keep\n\nReading a little each evening is easier than waiting for a free weekend. Consistency feels good."),
        (6, "🥳", "A week worth celebrating\n\nProtected time for creative work, moved every day, and made progress on something I care about."),
    ]
    for index, (offset, emoji, content) in enumerate(reflections):
        # JournalEntryModel stores local wall time, unlike Work's UTC fields.
        journal_time = datetime.combine(day - timedelta(days=offset), datetime.min.time())
        journal_time = journal_time.replace(hour=8, minute=10 + index * 5)
        add("daily_reflections", id=JOURNAL_BASE - index,
            date=(day - timedelta(days=offset)).isoformat(), emoji=emoji,
            reflection=content, created_at=journal_time.isoformat(timespec="milliseconds"))

    for offset in range(7):
        for session in range(2 if offset == 0 else 3):
            add("pomodoro_entries", id=f"{PREFIX}focus:{offset}:{session}", mode="work",
                duration_seconds=1500, completed_at=stamp(-offset, 12 + session))
    return rows


def validate_database(db: sqlite3.Connection, fixture: list[tuple[str, dict]]) -> None:
    version = db.execute("PRAGMA user_version").fetchone()[0]
    if version != SCHEMA_VERSION:
        raise ValueError(f"Expected FrogHappy schema {SCHEMA_VERSION}; found {version}.")
    if db.execute("PRAGMA quick_check").fetchone()[0] != "ok":
        raise ValueError("SQLite quick_check failed; use a complete, healthy database copy.")
    if db.execute("PRAGMA foreign_key_check").fetchone():
        raise ValueError("Database already has broken foreign keys; refusing to modify it.")
    expected = {table: set(values) for table, values in fixture}
    expected.update({"sync_account_scope": {"owner_uid"}, "sync_entities": {"owner_uid"}})
    for table, columns in expected.items():
        actual = {row[1] for row in db.execute(f'PRAGMA table_info("{table}")')}
        if missing := columns - actual:
            raise ValueError(f"Incompatible table {table}; missing columns: {sorted(missing)}")
    for table in ("sync_account_scope", "sync_entities"):
        if db.execute(f'SELECT 1 FROM "{table}" WHERE owner_uid IS NOT NULL AND trim(owner_uid) != ? LIMIT 1', ("",)).fetchone():
            raise ValueError("This database has account-owned data. Use a copied guest database from the dedicated emulator.")
    for table, identifier in (("areas", "personal"), ("areas", "personal-work"), ("work_item_types", "task")):
        if not db.execute(f'SELECT 1 FROM "{table}" WHERE id = ?', (identifier,)).fetchone():
            raise ValueError(f"Missing built-in catalog entry {table}/{identifier}; launch FrogHappy first.")


def install(db: sqlite3.Connection, day: date) -> dict:
    fixture = build_fixture(day)
    db.execute("PRAGMA foreign_keys = ON")
    db.execute("BEGIN IMMEDIATE")
    try:
        validate_database(db, fixture)
        db.execute(f'CREATE TABLE IF NOT EXISTS "{MANIFEST}" (fixture TEXT NOT NULL, table_name TEXT NOT NULL, record_id TEXT NOT NULL, PRIMARY KEY(table_name, record_id))')
        owned = {(table, identifier) for table, identifier in db.execute(
            f'SELECT table_name, record_id FROM "{MANIFEST}" WHERE fixture = ?', (PREFIX,))}
        # Check every collision before modifying any application rows.
        for table, values in fixture:
            identifier = values["id"]
            if (table, str(identifier)) not in owned and db.execute(
                f'SELECT 1 FROM "{table}" WHERE id = ?', (identifier,)
            ).fetchone():
                raise ValueError(f"Unowned ID collision in {table}: {identifier}. No data changed.")
        for table, values in fixture:
            columns = list(values)
            assignments = ", ".join(f'"{column}" = excluded."{column}"' for column in columns if column != "id")
            column_sql = ", ".join(f'"{column}"' for column in columns)
            placeholders = ", ".join("?" for _ in columns)
            db.execute(f'INSERT INTO "{table}" ({column_sql}) VALUES ({placeholders}) ON CONFLICT(id) DO UPDATE SET {assignments}', tuple(values.values()))
            db.execute(f'INSERT OR IGNORE INTO "{MANIFEST}" VALUES (?, ?, ?)', (PREFIX, table, str(values["id"])))
        if db.execute("PRAGMA foreign_key_check").fetchone():
            raise ValueError("Fixture violated foreign keys; rolled back.")
        summary = {"date": day.isoformat(), "schema_version": SCHEMA_VERSION,
                   "fixture": PREFIX, "records": dict(Counter(table for table, _ in fixture)),
                   "fixture_today": {"habits_completed": 3, "habits_total": 6,
                             "strongest_habit_streak_days": 21, "work_completed": 2,
                             "focus_minutes": 50}}
        db.commit()
        return summary
    except BaseException:
        db.rollback()
        raise


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", required=True, type=Path, help="Explicit path to a COPIED guest SQLite DB, never a live application file")
    parser.add_argument("--date", required=True, type=date.fromisoformat, help="Device calendar date, YYYY-MM-DD")
    args = parser.parse_args()
    if args.db.is_symlink() or not args.db.is_file():
        parser.error("--db must name an existing regular copied database, not a symlink.")
    path = args.db.resolve()
    try:
        db = sqlite3.connect(f"{path.as_uri()}?mode=rw", uri=True, isolation_level=None)
        try:
            result = install(db, args.date)
        finally:
            db.close()
        print(json.dumps({"database": str(path), **result}, indent=2))
    except (sqlite3.Error, ValueError) as error:
        print(f"Seed refused: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
