# Incident 05 (Student) · PostgreSQL Connection Failure

**Related runbook:** [04-runbooks/07](../../04-runbooks/07-postgresql-connection-failures.md)

## Scenario

> *Labeled training exercise, lab environment only.*

`/api/health` reports `db: down`, but `kubectl get pods -l app=postgres` shows the pod
`Running`.

## Detection and alerts

`/api/health` response; [03-daily-operations/06](../../03-daily-operations/06-checking-database-availability.md).

## Investigation checklist

- [ ] Confirm Postgres itself is actually accepting connections (`pg_isready`), not just
      `Running`
- [ ] Compare the backend's configured `PGUSER`/`PGPASSWORD`/`PGHOST` against what Postgres
      was actually initialized with
- [ ] Check backend logs for the exact connection error text
- [ ] Determine: is this a credential mismatch, a hostname problem, or something else
      entirely?

## Relevant commands

```bash
kubectl exec -it postgres-0 -n estateflow-staging -- pg_isready -U estateflow
kubectl exec -n estateflow-staging deploy/backend -- env | grep -E 'PGHOST|PGUSER|PGPASSWORD'
kubectl logs deploy/backend -n estateflow-staging | grep -i -A3 postgres
```

## What to submit

- The exact error text from backend logs
- Your determination of the specific cause category (credentials vs. hostname vs. other)
- Completed [incident report](../../05-incident-management/03-incident-templates.md#incident-report-template)
