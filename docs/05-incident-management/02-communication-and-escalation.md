# 02 · Communication and Escalation

**Prerequisites:** [01 · Roles and responsibilities](01-roles-and-responsibilities.md)
**Next step:** [03 · Incident templates](03-incident-templates.md)

## Escalation matrix (template — fill in real names/channels for your team)

| Severity | Who to notify | How | Response time target |
|---|---|---|---|
| SEV1 | Incident Commander + all relevant roles, team lead | Page/call, not just chat | Immediate (minutes) |
| SEV2 | Primary on-call + relevant specialist role | Page or urgent chat mention | Within 15 minutes |
| SEV3 | Primary on-call | Chat message | Within the current shift |
| SEV4 | Whoever owns the affected area | Ticket/issue, no page | Normal backlog priority |

Fill in: `<your paging tool>`, `<incident chat channel>`, `<team lead contact>` before relying
on this for anything real.

## When to escalate (don't wait too long)

- You've spent more than ~15 minutes on a SEV1/SEV2 with no clear lead on the cause
- A runbook's own "Escalation criteria" section tells you to (every runbook in
  [04-runbooks](../04-runbooks/README.md) has one — read it before you're mid-incident, not
  during)
- The fix requires touching shared cluster infrastructure (nodes, the Load Balancer
  Controller, IAM/OIDC provider) rather than something EstateFlow-specific
- You suspect data loss, a security exposure, or you're not fully sure your next action is
  safe — ask before acting, not after

Escalating is never a failure. The cost of pausing to ask is always lower than the cost of a
wrong guess made alone under pressure.

## Communicating during an incident

- **Internal (incident channel):** short, frequent updates — what's known, what's being
  tried, what's next. "Still investigating, no update yet" is a valid update; silence is not.
- **Stakeholder updates (non-engineering audience):** plain language, no jargon, focus on
  impact and ETA-if-known, not technical root cause (that belongs in the postmortem). Use the
  [stakeholder update template](03-incident-templates.md#stakeholder-update-template).
- **Never speculate about root cause publicly** before it's confirmed — say "investigating a
  possible cause" instead of naming a specific suspected component prematurely.

## After the incident

Every SEV1/SEV2 gets a postmortem (see
[03 · Incident templates](03-incident-templates.md#blameless-postmortem-template)) within a
few business days, while details are still fresh. SEV3/SEV4 get at minimum a short written
record ([06-engineering-records](../06-engineering-records/README.md)).
