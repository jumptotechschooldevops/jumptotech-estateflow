# 06 · Checking Database Availability

**Prerequisites:** `kubectl` access to `estateflow-staging`
**Next step:** [07 · Verifying ALB target group health](07-verifying-alb-target-group-health.md)

## Objective

Confirm Postgres is not just "Running" as a pod, but actually accepting and answering queries
— these are not the same thing.

## Commands

```bash
kubectl get pods -n estateflow-staging -l app=postgres
kubectl exec -it postgres-0 -n estateflow-staging -- pg_isready -U estateflow
kubectl exec -it postgres-0 -n estateflow-staging -- psql -U estateflow -d estateflow -c 'SELECT count(*) FROM properties;'
kubectl get pvc -n estateflow-staging
```

## Expected results

```
postgres-0   1/1   Running
/var/run/postgresql:5432 - accepting connections
 count
-------
     3
```
PVC shows `Bound`.

## If something looks wrong

| Symptom | Go to |
|---|---|
| `pg_isready` fails / pod not `Running` | [07 · PostgreSQL connection failures](../04-runbooks/07-postgresql-connection-failures.md) |
| PVC `Pending` | [05 · PVC Pending](../04-runbooks/05-pvc-pending.md) |
| Pod `Pending`, PVC `Bound` | [06 · EBS AZ mismatch](../04-runbooks/06-ebs-az-mismatch.md) |
| `/api/health` shows `db: down` but pod looks fine | Check the backend's `PGHOST`/`PGPASSWORD` env against the ConfigMap/Secret for a typo |

## Checklist

- [ ] Postgres pod `Running` and `pg_isready` succeeds
- [ ] A real query against `properties` returns a sane row count
- [ ] PVC shows `Bound`, not `Pending`
