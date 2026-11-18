# 08 · Application Downtime

**Prerequisites:** [14-incident-simulations/10](../14-incident-simulations/student/10-redis-unavailable.md)
**Next step:** [09 · Monitoring and alerting](09-monitoring-and-alerting.md)

> Labeled training/lab work — see [README](README.md)'s honesty rule.

## Interview question
"Tell me about a time a dependency went down — how did you assess the actual impact?"

## Situation
During a training exercise, the caching layer (Redis) became completely unavailable. The
immediate question from a teammate was "is the site down?"

## Task
Determine the *actual* user-facing impact precisely, rather than assuming "a dependency is
down" automatically means "the application is down."

## Action
I checked whether the core read/write paths still functioned despite Redis being
unreachable, and confirmed they did — the backend was specifically designed to catch cache
errors and fall back to querying the database directly. I verified this with a real request
showing a successful response with the cache marked as a permanent `MISS`, not an error.
Based on that, I classified this as a performance-degradation severity, not an outage
severity — a meaningfully different, and more accurate, classification than the initial
assumption.

## Result
Correctly communicated "degraded, not down" to the team, avoiding an unnecessary all-hands
escalation for what was actually a contained, lower-severity issue — then restored Redis and
confirmed caching behavior resumed normally.

## Follow-up technical questions
- "How did you know the application was designed to degrade gracefully, rather than just
  getting lucky this time?"
- "What would make you classify this as higher severity instead?"
- "How do you communicate 'degraded, not down' to non-technical stakeholders?"

## Strong sample answers
- I read the actual error-handling code path (`try`/`catch` around every cache operation,
  logging but not throwing) before assuming graceful degradation — confirmed by design, not
  assumed by luck.
- If Postgres load climbed dangerously *because* caching stopped working, or if this
  coincided with unusually high traffic, I'd raise the severity — the dependency being down
  isn't inherently low-severity, its *actual measured impact* is what determines severity.
- Plain language focused on what users experience: "the site is fully working, just slightly
  slower than usual for some requests" — not "Redis is down," which means nothing to a
  non-technical audience.

## Common mistakes
Treating every dependency failure as the same severity regardless of actual measured impact;
not being able to point to the specific code behavior that made graceful degradation work,
rather than just asserting it did.

## 60-second version
"In a training exercise, the cache layer went fully down and a teammate asked if the site was
down. Instead of assuming, I verified the actual application behavior — reads and writes
still worked fine, just without caching, because the backend was built to catch cache errors
and fall back to the database. I classified it as degraded performance, not an outage, and
communicated that distinction clearly before restoring the cache."

## 2-3 minute version
Add: the specific code-level mechanism that made the graceful degradation real (not
assumed), what would have changed your severity classification, and how you'd phrase the
stakeholder update differently for a technical vs. non-technical audience.
