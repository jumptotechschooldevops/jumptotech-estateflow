# Incident 08 (Student) · NetworkPolicy Blocking Database Access

**Related runbooks:** [04-runbooks/17](../../04-runbooks/17-networkpolicy-blocking-traffic.md), [16](../../04-runbooks/16-dns-failures.md)

## Scenario

> *Labeled training exercise, lab environment only.* Note: this project's manifests now ship
> 6 real `NetworkPolicy` objects (`infra/k8s/09-networkpolicy.yaml`) — whether they're
> actually *enforced* depends on your cluster's CNI (see
> [02-deployment-guides/17](../../02-deployment-guides/17-networkpolicy-enforcement.md)).
> This exercise introduces an *additional*, deliberately broken policy on top of the real
> ones, the way a real hardening change gone wrong might.

`/api/health` reports `db: down`. DNS resolution for `postgres` works fine. Something else is
blocking the connection.

## Detection and alerts

`/api/health`; the specific combination of "DNS resolves, connection still fails" is the key
signal — see [03-daily-operations/06](../../03-daily-operations/06-checking-database-availability.md).

## Investigation checklist

- [ ] Confirm DNS resolution succeeds (rule out
      [16 · DNS failures](../../04-runbooks/16-dns-failures.md))
- [ ] Confirm TCP connection itself fails (not just a slow response) — time out vs. refused?
- [ ] Check for any `NetworkPolicy` objects in the namespace
- [ ] If one exists, compare its selector labels against the actual pod labels on both sides
      of the blocked connection

## Relevant commands

```bash
kubectl exec -n estateflow-staging deploy/backend -- getent hosts postgres
kubectl exec -n estateflow-staging deploy/backend -- nc -zv postgres 5432
kubectl get networkpolicy -n estateflow-staging
kubectl describe networkpolicy <name> -n estateflow-staging
kubectl get pods -n estateflow-staging --show-labels
```

## What to submit

- Evidence that DNS works but the connection itself is blocked
- The specific label mismatch found (if a NetworkPolicy is the cause)
- Completed [incident report](../../05-incident-management/03-incident-templates.md#incident-report-template)
