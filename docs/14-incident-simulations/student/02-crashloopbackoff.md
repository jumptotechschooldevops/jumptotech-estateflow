# Incident 02 (Student) · CrashLoopBackOff

**Related runbook:** [04-runbooks/02](../../04-runbooks/02-crashloopbackoff.md)

## Scenario

> *Labeled training exercise, lab environment only.*

Users (simulated, in this exercise — your instructor or a synthetic check) report the API is
intermittently failing. Pods look like they're restarting.

## Detection and alerts

`kubectl get pods` restart counts; see
[03-daily-operations/02](../../03-daily-operations/02-checking-kubernetes-workloads.md).

## Investigation checklist

- [ ] Confirm which pod(s) are restarting and how many times
- [ ] Read logs from the **previous** crashed container, not just the current one
- [ ] Determine whether this started right after a recent change (check
      `kubectl rollout history`)
- [ ] Distinguish: is this a code-level crash, a missing config value, or the pod being
      unable to reach a dependency?
- [ ] Classify severity

## Relevant commands

```bash
kubectl get pods -n estateflow-staging
kubectl logs <pod-name> -n estateflow-staging --previous
kubectl describe pod <pod-name> -n estateflow-staging
kubectl rollout history deployment/backend -n estateflow-staging
```

## What to submit

- Investigation checklist with findings
- The specific error message from `--previous` logs, quoted exactly
- Severity classification with justification
- Completed [incident report](../../05-incident-management/03-incident-templates.md#incident-report-template)
