# 03 · Pod Pending

**Related guide:** [05 · Kubernetes Deployments and Services](../02-deployment-guides/05-kubernetes-deployments-and-services.md)

## Symptoms
`kubectl get pods` shows `Pending` and never progresses to `Running`.

## Potential customer impact
Reduces available capacity (fewer serving replicas than expected); full outage only if every
replica is stuck.

## Detection and alerts
`STATUS: Pending` persisting for more than ~1 minute (brief `Pending` during normal scheduling
is expected and not a problem).

## Severity assessment
A single pod briefly `Pending` during a rollout: normal, not an incident. Multiple pods stuck
`Pending` for minutes with reduced capacity: SEV2/SEV3.

## Diagnosis (🔍 read-only)
```bash
kubectl describe pod <pod-name> -n estateflow-staging | grep -A10 Events
kubectl get nodes
kubectl describe nodes | grep -A5 "Allocated resources"
```

## How to interpret the output
Events will say exactly why: `Insufficient cpu`/`Insufficient memory` (no node has room),
`0/N nodes are available: ... didn't match Pod's node affinity` (scheduling constraint
issue), or a PVC-related message (see [05 · PVC Pending](05-pvc-pending.md) instead if so).

## Possible causes
- Cluster genuinely out of spare CPU/memory capacity
- Requested resources (`infra/k8s/05-backend.yaml` requests) too large for available nodes
- Waiting on a PVC that hasn't bound yet
- Node pool scaled down overnight and hasn't scaled back up

## Safe mitigation steps (⚠️ changes infrastructure)
```bash
# If it's a capacity problem and the cluster uses a node autoscaler, it should self-resolve in
# 1-3 minutes — confirm before intervening further:
kubectl get events -n kube-system | grep -i autoscal

# Only if genuinely stuck and you understand why, consider temporarily reducing requested
# resources via a reviewed PR — do not permanently lower resource requests under incident
# pressure without review.
```

## Escalation criteria
If this is a cluster-wide capacity problem (not EstateFlow-specific), escalate to the cluster
owner immediately — other teams on `eks-node` are affected too, not just EstateFlow.

## Recovery verification
```bash
kubectl get pods -n estateflow-staging -l app=backend    # Running
```

## Prevention recommendations
Keep resource `requests` realistic (measured, not guessed) so the scheduler can actually place
pods; monitor overall cluster capacity trends over time, not just at incident time.
