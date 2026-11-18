# 11 · Handover

**Prerequisites:** [03-daily-operations/12 · Shift handover](../03-daily-operations/12-shift-handover.md)
**Next step:** [16-student-portfolios](../16-student-portfolios/README.md) to record your
handover practice as portfolio evidence, or return to the [master index](../README.md).

## Why a written handover, not just a verbal one

Verbal handovers get forgotten, compressed, or misremembered within hours. A written handover
is something the next engineer can actually re-read, and something that exists as a record if
an incident's timeline needs to be reconstructed later.

## End-of-shift handover template

```markdown
## Shift Handover — <date> — <engineer name> → <next engineer name>

### Overall status
<one line: "all clear" / "degraded, see below" / "active incident, see below">

### Open incidents
<link to the incident record, current severity, current status, what's already been tried>

### Pending deployments
<anything merged but not yet deployed, or deployed but not yet verified>

### Known infrastructure problems (not yet incidents, but worth knowing)
<e.g. "node X has been flaky, watching it">

### Scheduled maintenance
<anything planned in the next 24-48h that the next engineer should know about>

### Unresolved alerts
<anything that fired and wasn't fully closed out>

### Changes made this shift
<link to execution records — see 06-engineering-records>

### Next engineer action items
<specific, concrete — "check if the HPA scaled back down by 3pm" not "keep an eye on things">
```

## In this folder

[01 · Sample handover document](01-sample-handover-document.md) — a filled-out example using
this project's own real (labeled-training) history.

## Checklist for writing a good handover

- [ ] Written down, not just said out loud
- [ ] Every open issue has a clear current status, not just "it's being looked at"
- [ ] Action items are specific and checkable, not vague
- [ ] The next engineer could act on this without needing to ask you a clarifying question first
