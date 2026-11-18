# 03 · Incident Templates

**Prerequisites:** [02 · Communication and escalation](02-communication-and-escalation.md)
**Next step:** [04 · Training incident scenarios](04-training-incident-scenarios.md)

Copy whichever template you need into the incident's tracking doc/ticket. Don't invent
details you don't actually have — leave a field blank or marked `TBD` rather than guessing.

## Incident timeline template

```markdown
## Incident Timeline — <short title>

- **Severity:** SEV_
- **Incident Commander:** <name>
- **Start time (UTC):**
- **Detected at:**
- **Detected by:** (alert / user report / engineer noticed)

| Time (UTC) | Who | What happened |
|---|---|---|
|  |  | Incident declared |
|  |  |  |

- **Mitigated at:**
- **Resolved at:**
- **Total duration:**
```

## Stakeholder update template

```markdown
Subject: [SEV_] <one-line plain-English description of the impact>

**Current status:** investigating / mitigated / resolved
**What's affected:** <plain language — e.g. "some users may see slow page loads">
**What we're doing:** <one sentence, no jargon>
**Next update by:** <time>
```
Keep this free of root-cause speculation and technical jargon — this audience needs impact
and timeline, not component names.

## Incident report template

```markdown
## Incident Report — <short title> — <date>

- **Severity:** SEV_
- **Duration:** <start> to <end> (<total time>)
- **Customer impact:** <what was actually affected, how many/what fraction, if known>
- **Incident Commander:**
- **Responders:**

### Summary
<2-4 sentences: what broke, how it was noticed, how it was resolved>

### Timeline
<link to or paste the timeline template above>

### Root cause
<the actual technical cause — be specific; "network issue" is not a root cause, "the ALB
target group health check pointed at the wrong path after a Service port change" is>

### What went well

### What could have gone better

### Verified facts vs. open questions
<list anything still unconfirmed explicitly — don't let an assumption get recorded as fact>
```

## Blameless postmortem template

Same structure as the incident report, with two additions, and one ground rule:

**Ground rule:** write about the *system* that allowed the failure, never about a person's
competence. "The deploy process allowed an untested config change to reach production" — not
"X forgot to test." If a process gap let a mistake through, the process is the finding.

```markdown
### Contributing factors
<every factor that had to be true for this to happen — usually more than one>

### Corrective actions
| Action | Owner | Due date | Status |
|---|---|---|---|
|  |  |  | Not started |
```

## Corrective action tracking

Track every postmortem's corrective actions in one place (a GitHub Issues label, a shared
board — whatever your team already uses) so they don't quietly disappear. Review open
corrective actions at a regular cadence (e.g. weekly) until closed. An incident without
follow-through on its corrective actions is likely to repeat.
