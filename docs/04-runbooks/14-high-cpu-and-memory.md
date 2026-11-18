# 14 · High CPU and Memory

**Related guide:** [05 · Monitoring CPU and memory](../03-daily-operations/05-monitoring-cpu-and-memory.md), [14 · Scaling and rolling updates](../02-deployment-guides/14-scaling-and-rolling-updates.md)

## Symptoms
`kubectl top pods` shows usage near/at configured `limits`; users report slow responses; a pod
shows `OOMKilled` in `kubectl describe pod`.

## Potential customer impact
Slow responses, timeouts, or a crashed pod (if OOMKilled) — ranges from degraded to a partial
outage.

## Detection and alerts
`kubectl top pods`; `kubectl describe pod` for `OOMKilled` events; HPA `REPLICAS` pinned at
`MAXPODS`.

## Severity assessment
Sustained high latency affecting users: SEV2/SEV3. Repeated OOMKills causing visible
downtime: SEV1/SEV2.

## Diagnosis (🔍 read-only)
```bash
kubectl top pods -n estateflow-staging
kubectl describe pod <pod-name> -n estateflow-staging | grep -A3 "Last State"
kubectl get hpa -n estateflow-staging
kubectl get deployment -n kube-system metrics-server    # confirm metrics-server itself is healthy
```

## How to interpret the output
`Last State: Terminated, Reason: OOMKilled` confirms a genuine memory limit breach, not just
high-but-safe usage. HPA stuck at `MAXPODS` with CPU still above target means you're
under-provisioned for current load, not just experiencing a transient spike.

## Possible causes
- Genuine traffic growth beyond current `maxReplicas`
- A memory leak (steady climb with no corresponding traffic increase — see
  [05 · Monitoring CPU and memory](../03-daily-operations/05-monitoring-cpu-and-memory.md))
- An inefficient query or N+1 pattern under specific data conditions
- `metrics-server` itself unhealthy, making the HPA blind (shows `<unknown>`, not high values)

## Safe mitigation steps (⚠️ changes infrastructure)
```bash
# Immediate relief while root-causing:
kubectl scale deployment/backend -n estateflow-staging --replicas=6   # up to current HPA max

# If a leak is suspected, a restart buys time but doesn't fix it:
kubectl rollout restart deployment/backend -n estateflow-staging
```
Raising `maxReplicas` beyond what `infra/k8s/08-hpa.yaml` currently allows requires a reviewed
PR, not an ad hoc `kubectl edit`, since it has cost implications.

## Escalation criteria
If scaling up doesn't relieve the symptom, the bottleneck is likely downstream (Postgres) —
escalate rather than continuing to add app-tier replicas that won't help.

## Recovery verification
```bash
kubectl top pods -n estateflow-staging    # usage back under limits
curl -s "http://<ALB_DNS>/api/health"
```

## Prevention recommendations
Load-test before assuming current `maxReplicas`/resource `limits` are sufficient for expected
peak traffic; investigate any steady (non-traffic-correlated) memory growth as a leak, don't
just restart repeatedly and move on.
