# 07 · PostgreSQL Connection Failures

**Related guide:** [06 · PostgreSQL, PVC, and EBS](../02-deployment-guides/06-postgresql-pvc-and-ebs.md)

## Symptoms
`/api/health` reports `"db":"down"`; backend logs show `ECONNREFUSED`, `password
authentication failed`, or connection timeouts to Postgres.

## Potential customer impact
All property read/write operations fail — effectively a full application outage even though
the frontend may still load its static shell.

## Detection and alerts
`/api/health` response; backend logs.

## Severity assessment
SEV1 if sustained — this is the primary datastore.

## Diagnosis (🔍 read-only)
```bash
kubectl get pods -n estateflow-staging -l app=postgres
kubectl exec -it postgres-0 -n estateflow-staging -- pg_isready -U estateflow
kubectl exec -n estateflow-staging deploy/backend -- env | grep -E 'PGHOST|PGPORT|PGUSER|PGDATABASE'
kubectl logs deploy/backend -n estateflow-staging | grep -i -A3 postgres
```

## How to interpret the output
`ECONNREFUSED`/timeout → Postgres pod isn't up or the Service/hostname is wrong. `password
authentication failed` → the Secret's `POSTGRES_PASSWORD` doesn't match what Postgres was
actually initialized with (common after recreating the Secret without recreating the data
volume — the password is baked into Postgres at first init, not read from the Secret on every
connection).

## Possible causes
- Postgres pod down/crashing — see [02 · CrashLoopBackOff](02-crashloopbackoff.md) and
  [05 · PVC Pending](05-pvc-pending.md)
- `estateflow-secrets` Secret recreated with a new password, but the existing Postgres data
  volume still has the old password
- `PGHOST` pointing at the wrong Service name (typo in the ConfigMap)
- Connection pool exhaustion under unusually high load

## Safe mitigation steps (⚠️ changes infrastructure)
```bash
# If it's a password mismatch after a Secret recreation, you must set Postgres's actual
# password to match (do NOT just edit the Secret and expect it to retroactively apply):
kubectl exec -it postgres-0 -n estateflow-staging -- psql -U estateflow -c \
  "ALTER USER estateflow WITH PASSWORD '<the password now in the Secret>';"

kubectl rollout restart deployment/backend -n estateflow-staging
```

## Escalation criteria
If `pg_isready` fails and the pod itself looks healthy with no obvious cause, escalate to
whoever has deeper Postgres operational experience rather than experimenting on a shared
database.

## Recovery verification
```bash
curl -s "http://<ALB_DNS>/api/health"   # "db":"up"
```

## Prevention recommendations
Never regenerate `estateflow-secrets`' `POSTGRES_PASSWORD` independently of the actual running
database — change both together, deliberately, as a reviewed change
([07-change-management](../07-change-management/README.md)), not as a routine secret rotation
without this extra step.
