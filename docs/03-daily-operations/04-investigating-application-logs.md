# 04 · Investigating Application Logs

**Prerequisites:** `kubectl` access to `estateflow-staging`
**Next step:** [05 · Monitoring CPU and memory](05-monitoring-cpu-and-memory.md)

## Objective

Logs are the ground truth for "what actually happened," especially for errors that don't show
up as a failed health check (e.g. a single bad request, a slow query, an S3 permission error
on one specific upload).

## Commands

```bash
kubectl logs -f deploy/backend -n estateflow-staging
kubectl logs -f deploy/frontend -n estateflow-staging
kubectl logs deploy/backend -n estateflow-staging --previous     # logs from BEFORE the last crash
kubectl logs -n estateflow-staging -l app=backend --all-containers --prefix --tail=200
```

## Expected results

Steady-state backend logs show only the occasional `Redis client error` reconnect message (if
any) — no repeating stack traces. A healthy app produces a *boring* log.

## How to interpret what you see

- A single stack trace tied to one request (e.g. a `400` validation error) is normal
  application behavior, not an incident.
- A **repeating** stack trace, especially around startup, means something is structurally
  broken (bad config, unreachable dependency) — check `--previous` logs from the last crash.
- `AccessDenied`/`Forbidden` mentioning `s3.` means an IAM problem, not an app bug — see
  [13 · S3 AccessDenied](../04-runbooks/13-s3-accessdenied.md).

## If something looks wrong

| Symptom | Go to |
|---|---|
| Repeating startup crash in logs | [02 · CrashLoopBackOff](../04-runbooks/02-crashloopbackoff.md) |
| Postgres connection errors | [07 · PostgreSQL connection failures](../04-runbooks/07-postgresql-connection-failures.md) |
| Redis connection errors | [08 · Redis connection failures](../04-runbooks/08-redis-connection-failures.md) |
| S3 `AccessDenied` | [13 · S3 AccessDenied](../04-runbooks/13-s3-accessdenied.md) |

## Checklist

- [ ] Checked live logs for both backend and frontend
- [ ] No repeating (vs. one-off) stack traces present
- [ ] Any error found is matched to a runbook, not fixed ad hoc
