# 12 · Infrastructure Automation

**Prerequisites:** [14-incident-simulations/08](../14-incident-simulations/student/08-networkpolicy-blocking-database.md)
**Next step:** [13 · Editable template](13-editable-template.md)

> Labeled training/lab work — see [README](README.md)'s honesty rule.

## Interview question
"Tell me about a time you automated something that used to be done manually, or turned a
one-off fix into a repeatable process."

## Situation
Early in a lab project, database migrations and Kubernetes manifests were maintained as two
separate, manually-synced things — the actual SQL files in one place, a duplicated copy
embedded in a Kubernetes ConfigMap in another, with no enforced link between them.

## Task
Make the duplication explicit and documented so it doesn't silently drift, since Kubernetes
can't bind-mount a local folder the way Docker Compose does for local development.

## Action
I documented clearly, in both locations, that these two copies must be kept in sync
manually whenever a new migration is added, and made every migration strictly additive
(`CREATE TABLE IF NOT EXISTS`, never destructive) specifically so that re-running them is
always a safe no-op — removing the most dangerous failure mode of the duplication (a
destructive statement being re-applied). I also built a NetworkPolicy troubleshooting
runbook and training exercise after recognizing that infrastructure automation (like adding
a NetworkPolicy) needs the same "verify the intended caller can still connect" discipline as
any other code change, not just "the object was created successfully."

## Result
A documented, safe pattern for an unavoidable duplication, and a concrete process
(runbook + training exercise) for validating infrastructure changes don't silently break
something they weren't meant to touch.

## Follow-up technical questions
- "Why not eliminate the duplication entirely with a shared ConfigMap generation step?"
- "How do additive-only migrations reduce risk here specifically?"
- "What would a fully automated version of this look like?"

## Strong sample answers
- That's the better long-term answer, and worth proposing — e.g. a CI step that generates
  the ConfigMap from the same source SQL files automatically. For the current scope, explicit
  documentation of the manual-sync requirement was the pragmatic first step rather than
  leaving it undocumented.
- Because they're additive-only, accidentally re-running an out-of-sync or duplicated
  migration against an already-initialized database is a safe no-op instead of a destructive
  failure — removing the worst-case outcome of the duplication even before it's fully
  automated away.
- A build step (e.g. in CI) that reads `backend/migrations/*.sql` and generates the
  Kubernetes ConfigMap YAML automatically, failing the build if someone edits one location
  without the other being regenerated.

## Common mistakes
Presenting a documented manual process as if it were already fully automated; not having a
concrete next step in mind when asked "how would you automate this further."

## 60-second version
"I found that database migrations existed in two places — plain SQL files and a duplicated
copy in a Kubernetes ConfigMap — with no automated link between them. I made every migration
additive-only so re-running either copy is always safe, documented the manual-sync
requirement explicitly, and proposed a CI step to generate the ConfigMap from the SQL files
automatically as the real long-term fix."

## 2-3 minute version
Add: why Kubernetes can't just bind-mount a local folder the way Docker Compose does (the
actual reason the duplication exists at all), the specific safety property additive-only
migrations provide, and the CI-generation approach you'd implement given more time.
