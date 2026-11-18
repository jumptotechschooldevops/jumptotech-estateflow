# Incident 07 (Student) · High CPU and HPA Scaling

**Related runbook:** [04-runbooks/14](../../04-runbooks/14-high-cpu-and-memory.md)

## Scenario

> *Labeled training exercise, lab environment only.*

Response times have climbed steadily over the last 20 minutes. No pods have crashed. No
errors appear in logs.

## Detection and alerts

Slow responses with no errors; [03-daily-operations/05](../../03-daily-operations/05-monitoring-cpu-and-memory.md).

## Investigation checklist

- [ ] Check current CPU/memory usage against configured limits
- [ ] Check HPA status — is it scaling, and is it already at its maximum?
- [ ] Determine whether this correlates with a recent deploy, or with increasing load alone
- [ ] Decide: is more replicas the actual fix, or is the real bottleneck downstream
      (Postgres)?

## Relevant commands

```bash
kubectl top pods -n estateflow-staging
kubectl get hpa -n estateflow-staging
kubectl rollout history deployment/backend -n estateflow-staging
```

## What to submit

- CPU/memory and HPA findings
- Your reasoning for whether scaling further would actually help, with evidence
- Completed [incident report](../../05-incident-management/03-incident-templates.md#incident-report-template)
