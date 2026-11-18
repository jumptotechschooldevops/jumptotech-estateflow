# 07 · Incident Response Lab

**Prerequisites:** [04-runbooks](../04-runbooks/README.md), [05-incident-management](../05-incident-management/README.md)
**Next step:** [08 · Capstone: end-to-end deployment](08-capstone-end-to-end-deployment.md)

## Guided lab

Work through [05-incident-management/04 · Training incident scenarios](../05-incident-management/04-training-incident-scenarios.md)
Scenario 2 (bad image tag) exactly as written, filling out a full
[incident report](../05-incident-management/03-incident-templates.md#incident-report-template)
as you go — not after the fact from memory.

## Independent practice assignment

Without re-reading the scenario: run Scenario 3 (wrong `PGHOST`) solo, under a self-imposed
15-minute time limit, and produce a complete incident report by the end.

## Controlled failure scenario

Combine two failures at once (harder than the individual scenarios): break the image tag
*and* the ConfigMap's `PGHOST` in the same exercise, so you have to correctly diagnose which
symptom belongs to which cause rather than assuming there's only one problem.

## Troubleshooting exercise

Before touching any runbook: write down your hypothesis for what's wrong based on symptoms
alone, *then* check it against the actual runbook diagnosis steps — notice whether your
first guess was right, and what you'd have missed without the structured 🔍 commands.

## Expected outcome

Both issues correctly identified and fixed independently, with a report that correctly
attributes which symptom came from which root cause (not a single conflated explanation).

## Verification checklist

- [ ] Completed a full incident report under time pressure, not just informally
- [ ] Correctly separated two simultaneous failures into their distinct root causes
- [ ] Used runbook diagnostic commands systematically rather than guessing

## Interview questions

1. **Why is "blameless" postmortem culture important, and what's a concrete difference it
   makes in how an incident report is written?**
2. **How do you decide when to escalate during an incident instead of continuing to
   investigate alone?**
3. **Walk me through how you'd triage two services failing at once that initially look
   related but turn out to have independent causes.**

## Sample answers

1. A blameless postmortem focuses on *system* conditions that allowed a failure (a process
   gap, a missing safeguard), not individual blame — concretely, it writes "the deploy process
   allowed an unreviewed config change to reach production" instead of "X made a mistake."
   This matters because blame makes people hide information defensively in the next incident,
   while a systems focus produces corrective actions that actually prevent recurrence.
2. Per [05-incident-management/02](../05-incident-management/02-communication-and-escalation.md):
   after roughly 15 minutes with no clear lead on cause for a SEV1/SEV2, when a runbook's own
   escalation criteria say to, when the fix requires touching shared infrastructure beyond
   your ownership, or anytime you're not confident your next action is safe.
3. Check each service's *own* health independently first (don't assume shared cause) — use
   each runbook's diagnostic commands separately, compare timelines (did they start at the
   same moment, or different ones?), and look for a shared recent change (a deploy, a config
   edit) that could explain both before assuming coincidence vs. causation either way.
