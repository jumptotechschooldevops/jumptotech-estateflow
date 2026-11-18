# 02 · CrashLoopBackOff

**Related guide:** [05 · Kubernetes Deployments and Services](../02-deployment-guides/05-kubernetes-deployments-and-services.md)

## Symptoms
`kubectl get pods` shows `CrashLoopBackOff`, with `RESTARTS` climbing.

## Potential customer impact
Same logic as [01 · ImagePullBackOff](01-imagepullbackoff.md): full outage if all replicas
affected, degraded capacity if only some are.

## Detection and alerts
Restart count visible in `kubectl get pods`; readiness probe failures show in
`kubectl describe pod` Events.

## Severity assessment
All backend replicas crash-looping with no healthy pods serving → SEV1. One of several
replicas → SEV3, investigate before it spreads.

## Diagnosis (🔍 read-only)
```bash
kubectl logs <pod-name> -n estateflow-staging --previous
kubectl describe pod <pod-name> -n estateflow-staging
kubectl get deployment backend -n estateflow-staging -o yaml | grep -A20 env:
```

## How to interpret the output
`--previous` shows the log from the crashed container, not the new one that just restarted —
this is where the actual error is. Common patterns: a stack trace immediately on startup
(bad config/missing env var), `ECONNREFUSED` to Postgres/Redis (dependency not ready — see
runbooks 07/08), or an uncaught exception from a real code bug.

## Possible causes
- Missing/misnamed environment variable (e.g. a typo'd Secret key reference)
- A genuine application bug introduced by a recent deploy
- Readiness/liveness probe misconfigured to the wrong port/path (the app may be fine, but
  Kubernetes is killing it because the probe itself is wrong)
- Dependency (Postgres/Redis) unreachable at startup

## Safe mitigation steps (⚠️ changes infrastructure)
```bash
# If caused by a recent bad deploy:
kubectl rollout undo deployment/backend -n estateflow-staging
# If caused by a dependency being down, fix that dependency first (runbooks 07/08), the
# backend will recover on its own once it can connect — no action needed on the backend itself.
```

## Escalation criteria
If logs show a code-level exception you don't understand, pull in whoever owns that code path
rather than guessing at a fix during an active incident.

## Recovery verification
```bash
kubectl get pods -n estateflow-staging -l app=backend
kubectl logs -f deploy/backend -n estateflow-staging   # no repeat crashes for several minutes
```

## Prevention recommendations
Keep readiness/liveness probes pointed at a real, lightweight endpoint (`/api/health`, not `/`
for the backend); test every new env var locally before it reaches a Secret/ConfigMap.
