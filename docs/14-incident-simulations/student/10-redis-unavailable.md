# Incident 10 (Student) · Redis Unavailable

**Related runbook:** [04-runbooks/08](../../04-runbooks/08-redis-connection-failures.md)

## Scenario

> *Labeled training exercise, lab environment only.*

`/api/health` reports `redis: down`. Someone on the team asks "is the site down?"

## Detection and alerts

`/api/health`; [03-daily-operations/06](../../03-daily-operations/06-checking-database-availability.md)
(the same daily check covers both db and redis).

## Investigation checklist

- [ ] Confirm whether property reads/writes still actually work despite `redis: down`
- [ ] Check the Redis pod's own status and recent events (crashed? OOMKilled? just not
      there?)
- [ ] Correctly classify severity — is this the same severity as a Postgres outage, or
      different, and why?

## Relevant commands

```bash
curl -s "http://<ALB_DNS>/api/health"
curl -s "http://<ALB_DNS>/api/properties"   # does this still work?
kubectl get pods -n estateflow-staging -l app=redis
kubectl describe pod <redis-pod> -n estateflow-staging
```

## What to submit

- Evidence of whether the core application functions despite Redis being down
- A severity classification with explicit reasoning for why it differs (or doesn't) from a
  Postgres outage
- Completed [incident report](../../05-incident-management/03-incident-templates.md#incident-report-template)
