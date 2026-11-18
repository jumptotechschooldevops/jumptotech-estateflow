# 06 · Engineering Records

**Prerequisites:** none — use this after any task worth remembering
**Next step:** [07-change-management](../07-change-management/README.md)

## Why this exists

"I think I ran that last Tuesday and it worked" is not evidence. A real engineering team
keeps a record of what was actually done, so: the next person (or future-you) can repeat it
exactly, a postmortem can cite real facts instead of memory, and nobody accidentally claims a
task was verified when it wasn't.

## Rules

- Record **expected** results *before* running a command, then record the **actual** result —
  don't backfill "expected" after seeing what happened, that defeats the point.
- Never invent or guess at a command's output. If you didn't actually run it, say so.
- Never paste real credentials, tokens, or customer data into a record — use placeholders
  (`<ADMIN_API_TOKEN>`, `<account-id>`) exactly as the rest of this documentation does.
- Attach real evidence (terminal output, screenshots, log excerpts) wherever possible, not
  just a prose summary.

## In this folder

| File | Covers |
|---|---|
| [01 · Execution record template](01-execution-record-template.md) | The blank template to copy |
| [02 · Worked example](02-worked-example-execution-record.md) | A real, filled-out example from this project's own test history |

## When to write one

Any lab exercise, any production change (however small), any incident response action, any
troubleshooting session that took more than a couple of minutes — if you'd want to know what
happened if you came back to this in a month, write it down now.
