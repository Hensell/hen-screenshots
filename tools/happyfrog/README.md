# FrogHappy screenshot demo data

`seed_demo.py` creates a small English fixture using FrogHappy's real SQLite v28
schema. Python 3.9+ and its standard library are sufficient. It does not change
FrogHappy source code, connect to Firebase, or control a device.

## Safe capture workflow

1. Launch the development flavor on a **dedicated, signed-out Android emulator**:
   `flutter run --flavor development -t lib/main_development.dart`.
   Its package is `com.hensell.froghappy.dev`.
2. Let the app initialize, then stop it. Copy its guest database
   `databases/froghappy_guest.db` to a local working directory. Preserve any
   `-wal` and `-shm` sidecars beside the copy; keep an untouched backup too.
3. Run the helper only on that local **copy**, using the emulator's calendar date:

   ```sh
   python3 tools/happyfrog/seed_demo.py --db /absolute/path/demo/froghappy_guest.db --date 2026-09-06
   ```

4. With the app still stopped, restore the complete seeded SQLite file to the
   same guest database location and relaunch. Dismiss welcome/sync tips through
   the normal UI, keep the app in English and light mode, and enable Android's
   system demo clock/battery for the capture session.

Use device time consistently: the fixture is relative to `--date`. Work and
Focus timestamps use canonical UTC; Journal `created_at` uses local wall time
(08:10–08:30, without a `Z` suffix), matching the app's Journal model. Habit and
Journal dates are calendar dates. Android's demo status-bar clock changes only
the displayed clock, not the app's calendar date. Re-run with the device's new
date before another session if needed.

For the exact emulator settings and automated five-image flow, see the
[capture session](../../docs/capture-session.md).

The fixture contains six habits with three weeks of varied history (three done
today and a strongest streak of 21 days), eight tasks in two projects, five
journal reflections, checklists, truthful task status history, and seven days
of focus sessions. Suggested screens: **Home**, **Morning stretch details**,
**Work**, **Journal**, and **Focus**. Habit **Insights** is a useful sixth option.

## Ownership and validation

The helper checks schema v28, required columns, built-in catalog references,
SQLite integrity, foreign keys, and the absence of account-owned rows before
writing. All changes commit in one transaction or roll back together.

Text IDs start with `henscreenshots:demo:v1:`. Integer IDs occupy small reserved
negative ranges beginning at `-78001000`, `-78002000`, and `-78010000`; each is
tracked in the namespaced `henscreenshots_demo_manifest` table. An existing ID
without this ownership record causes a complete rollback. Re-running updates
only fixture-owned records by ID, without deleting any application records or
changing unrelated rows, account metadata, or preferences. Do not remove the
manifest while retaining the fixture.

Validated on 2026-09-06 using temporary copies of the untouched v28 guest DB
pulled from the dedicated Android emulator:

- Repeating the same date produced an identical complete SQL dump; shifting
  the date retained all fixture counts and correctly shifted its history.
- `integrity_check` returned `ok`; `foreign_key_check` returned no violations.
- Three of six habits were complete on the reference date, with 21 consecutive
  completions for Morning stretch; Journal preserved its local 08:10 timestamp.
- An unrelated habit and completion remained byte-for-byte equal as SQL values.
- Unowned integer and text ID collisions, and account-owned data, caused full
  rollback with no change to the pre-run SQL dump.

The original device DB remained unchanged (SHA-256 checked before and after).

Never sign the demo emulator into a real account: a later login can legitimately
import guest data into that account. Keep the generated DB and raw screenshots
in the ignored local references directory, outside the public source tree.
