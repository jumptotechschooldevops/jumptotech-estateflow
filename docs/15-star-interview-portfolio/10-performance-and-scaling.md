# 10 · Performance and Scaling

**Prerequisites:** [14-incident-simulations/07](../14-incident-simulations/student/07-high-cpu-hpa-scaling.md)
**Next step:** [11 · Security troubleshooting](11-security-troubleshooting.md)

> Labeled training/lab work — see [README](README.md)'s honesty rule.

## Interview question
"Describe a time you diagnosed a performance problem under load."

## Situation
During a training load exercise, response times climbed steadily over roughly 20 minutes
with no errors and no crashed pods.

## Task
Determine whether scaling up would actually help, or whether the real bottleneck was
somewhere else entirely, before just throwing more replicas at it.

## Action
I checked CPU/memory against configured limits (confirmed genuinely CPU-bound, not a
memory leak pattern), checked the HPA's current state (climbing toward its max, not yet
there), and checked whether this correlated with a recent deploy (it didn't — ruling out a
code regression and pointing at genuine load). Since the HPA wasn't maxed yet, I scaled
toward its current ceiling as an immediate measure while confirming the load was synthetic
test traffic, then stopped the load generator rather than permanently raising `maxReplicas`
for a scenario that wasn't real sustained demand.

## Result
Confirmed the system's existing autoscaling behaved correctly under load, identified the
specific point (current `maxReplicas`) where it would need a reviewed capacity change for
genuinely sustained higher traffic, and avoided making a permanent infrastructure change in
response to a temporary test condition.

## Follow-up technical questions
- "How do you tell a memory leak apart from a genuine load increase?"
- "Why not just raise `maxReplicas` immediately when you see it climbing?"
- "What would you check if scaling up more replicas *didn't* help?"

## Strong sample answers
- A leak shows steady memory growth with no corresponding traffic increase, often without
  CPU rising proportionally; genuine load shows CPU and traffic rising together, correlated.
- Raising `maxReplicas` is a capacity/cost decision that belongs in a reviewed PR, not an ad
  hoc edit under pressure — especially when the immediate cause might be temporary (like
  test traffic) rather than a lasting demand shift.
- I'd check whether the actual bottleneck is downstream — e.g. Postgres CPU/connections —
  since adding app-tier replicas doesn't help if the database itself is the constraint.

## Common mistakes
Describing "I scaled it up and it got better" without checking *why* it was slow first — that
answer doesn't demonstrate diagnostic skill, just a reflexive action that happened to help.

## 60-second version
"During a training load test, response times climbed over about 20 minutes with no errors or
crashes. I checked CPU/memory against limits — confirmed it was CPU-bound, not a leak — and
checked the HPA, which was climbing but not yet maxed. I confirmed it correlated with the
synthetic load, not a recent deploy, scaled up as an immediate measure, then stopped the
load generator rather than making a permanent capacity change for temporary test traffic."

## 2-3 minute version
Add: the specific commands used to distinguish a leak from genuine load, why a permanent
`maxReplicas` change needs review rather than an ad hoc edit, and what you'd check next if
scaling hadn't helped (downstream database bottleneck).
