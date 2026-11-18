# Student-Facing Incident Scenarios

**Prerequisites:** [04-runbooks](../../04-runbooks/README.md), [05-incident-management](../../05-incident-management/README.md)

These 10 files are what you see as a student. No root cause or fix is given here — that's the
point of the exercise. Use the runbooks in
[04-runbooks](../../04-runbooks/README.md) as your reference material (exactly as you would
during a real incident), work the investigation checklist, and write up your findings using
the [incident report template](../../05-incident-management/03-incident-templates.md#incident-report-template).

Each file has the same structure: **Scenario** → **Detection and alerts** →
**Investigation checklist** → **Relevant commands** → **What to submit**.

| # | File |
|---|---|
| 01 | [ImagePullBackOff](01-imagepullbackoff.md) |
| 02 | [CrashLoopBackOff](02-crashloopbackoff.md) |
| 03 | [PostgreSQL EBS AZ mismatch](03-postgresql-ebs-az-mismatch.md) |
| 04 | [ALB 503 / unhealthy target groups](04-alb-503-unhealthy-targets.md) |
| 05 | [PostgreSQL connection failure](05-postgresql-connection-failure.md) |
| 06 | [S3 AccessDenied](06-s3-accessdenied.md) |
| 07 | [High CPU and HPA scaling](07-high-cpu-hpa-scaling.md) |
| 08 | [NetworkPolicy blocking database access](08-networkpolicy-blocking-database.md) |
| 09 | [Failed GitHub Actions deployment](09-failed-github-actions-deployment.md) |
| 10 | [Redis unavailable](10-redis-unavailable.md) |

Don't ask your instructor for the answer key before attempting the exercise — it's
intentionally kept in a separate, access-controlled repository, not in this one, and it's
only for grading your work afterward, not for using as a crib sheet during the exercise.
