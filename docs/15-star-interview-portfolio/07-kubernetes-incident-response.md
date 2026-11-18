# 07 · Kubernetes Incident Response

**Prerequisites:** [14-incident-simulations/02](../14-incident-simulations/student/02-crashloopbackoff.md)
**Next step:** [08 · Application downtime](08-application-downtime.md)

> Labeled training/lab work — see [README](README.md)'s honesty rule.

## Interview question
"Walk me through how you respond when pods start crash-looping."

## Situation
During a training exercise, backend pods entered `CrashLoopBackOff` shortly after an
environment variable change.

## Task
Diagnose the root cause under time pressure and restore service, following a structured
process rather than trial-and-error.

## Action
I read logs from the **previous** crashed container (`kubectl logs --previous`), not the
newly-restarted one, since that's where the actual failure is recorded. The logs showed
repeated database-connection errors referencing an invalid port. I cross-checked
`kubectl rollout history` to confirm this correlated with a very recent change, then
corrected the environment variable and watched the rollout stabilize — no new crashes for
several minutes before declaring it resolved.

## Result
Service restored within roughly 11 minutes of detection; wrote up a complete incident report
distinguishing the confirmed root cause (the specific invalid env var) from what I initially
suspected before checking the logs.

## Follow-up technical questions
- "Why check `--previous` logs instead of just the current ones?"
- "How do you decide when to escalate instead of continuing to debug alone?"
- "What's the difference between a liveness probe failure and a readiness probe failure in
  this scenario?"

## Strong sample answers
- The current container just restarted and may not have logged the failure yet; `--previous`
  shows the log from the container that actually crashed.
- After roughly 15 minutes with no clear lead on a significant incident, or any time a fix
  would require touching infrastructure outside my own ownership — escalating isn't a
  failure, it's the correct call under uncertainty.
- A readiness failure removes the pod from the Service's endpoints without killing it; a
  liveness failure kills and restarts it — in this case, the database connection failure
  caused both (the app itself likely crashed outright on a fatal connection error, not just
  failed a health check while staying up).

## Common mistakes
Jumping to "I restarted the pod" as the fix without identifying the actual root cause first —
a restart alone wouldn't have fixed an environment-variable problem; the specific corrective
action (fixing the variable) is the point of the story.

## 60-second version
"Backend pods started crash-looping after a config change in a training exercise. I checked
the previous container's logs — not the new one — which showed a database connection error
with an invalid port. I correlated that with recent rollout history to confirm the timing,
fixed the variable, and watched it stabilize with no new crashes before calling it resolved."

## 2-3 minute version
Add: the specific escalation criteria you'd apply if this hadn't been a training exercise
with an obvious fix, and how you wrote up the incident report distinguishing your initial
hypothesis from the confirmed cause.
