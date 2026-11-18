# 09 · Monitoring and Alerting

**Prerequisites:** [08-monitoring-and-observability](../08-monitoring-and-observability/README.md)
**Next step:** [10 · Performance and scaling](10-performance-and-scaling.md)

> Labeled training/lab work — see [README](README.md)'s honesty rule. This example is
> deliberately about *identifying a gap and proposing a design*, not claiming a monitoring
> stack exists that doesn't.

## Interview question
"Tell me about a time you identified a monitoring gap and what you did about it."

## Situation
While documenting a lab project's operational readiness, I found that "checking for
problems" relied entirely on manually running `kubectl` commands — there was no automated
alerting of any kind, despite documentation elsewhere implying operational maturity.

## Task
Be explicit about what actually existed vs. what was only proposed, and design a concrete,
prioritized alerting plan rather than leaving the gap undocumented or vague.

## Action
I audited every monitoring-related claim against what was actually configured and found
real gaps: no Prometheus, no Grafana, no CloudWatch alarms, nothing wired to a paging tool.
I documented this honestly in a single canonical "implemented vs. proposed" table, then
designed a specific, prioritized alert set (starting with the single highest-value alert —
ALB target group health, since it uses data AWS already provides natively, needing no new
infrastructure) rather than proposing everything at once.

## Result
A clear, truthful operational picture that prevents anyone from assuming protections exist
that don't, plus a concrete first step (one native-AWS-metric alert) that's actually
implementable without first building a whole observability stack.

## Follow-up technical questions
- "Why would you alert on ALB target health first, before CPU/memory metrics?"
- "What's the risk of documentation implying more monitoring maturity than actually exists?"
- "How would you implement burn-rate alerting on top of an error budget?"

## Strong sample answers
- It's already a native AWS metric with zero additional infrastructure required — the
  highest-value, lowest-effort alert available, and it directly signals user-facing impact.
- Teams start trusting the documentation over the actual system, and during a real incident
  discover — at the worst possible time — that the alert they expected to fire never existed.
- You'd need to track error-budget consumption over a rolling window (via Prometheus or
  CloudWatch metrics math) and alert on the *rate* of consumption, not just a static
  threshold — catching both sudden severe outages and slow, creeping degradation.

## Common mistakes
Describing monitoring tools you've read about as if they were actually running in this
project; proposing a large, all-at-once monitoring buildout instead of a prioritized,
incrementally implementable first step.

## 60-second version
"I found that a lab project's documentation implied monitoring maturity that didn't actually
exist — no real alerting was wired up anywhere. I was explicit about that gap instead of
glossing over it, and proposed a concrete first alert — ALB target health, since AWS already
provides that data natively — rather than a vague 'we should add monitoring' recommendation."

## 2-3 minute version
Add: the specific implemented-vs-proposed table structure you used to keep this honest going
forward, why you prioritized target-group health over, say, CPU alerts, and how error-budget
burn-rate alerting would build on top of that first step.
