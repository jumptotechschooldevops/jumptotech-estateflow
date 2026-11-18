# 17 · NetworkPolicy Blocking Traffic

**Related guides:** [05 · Kubernetes Deployments and Services](../02-deployment-guides/05-kubernetes-deployments-and-services.md), [17 · NetworkPolicy enforcement](../02-deployment-guides/17-networkpolicy-enforcement.md)

> **Note on current state:** `infra/k8s/09-networkpolicy.yaml` defines 6 `NetworkPolicy`
> objects (default-deny baseline, DNS egress, ALB ingress to frontend/backend, backend-only
> access to Postgres/Redis). **Whether they actually restrict anything depends on your
> cluster's CNI** — the default AWS VPC CNI does not enforce NetworkPolicy without extra
> configuration. See
> [02-deployment-guides/17](../02-deployment-guides/17-networkpolicy-enforcement.md) for how
> to check. Don't assume traffic is actually being restricted just because the objects exist
> and `kubectl get networkpolicy` shows them.

## Symptoms
A pod that should be able to reach another pod/Service times out or gets connection refused,
despite DNS resolving correctly ([16 · DNS failures](16-dns-failures.md) ruled out) and the
target pod being healthy.

## Potential customer impact
Depends which traffic path is blocked — could range from one feature failing to a full
outage if it blocks the backend-to-database path.

## Detection and alerts
DNS resolves fine, but TCP connection itself hangs/refuses — this specific combination points
here rather than at runbook 16.

## Severity assessment
SEV2/SEV3 typically — usually introduced by a recent, identifiable change rather than
happening spontaneously.

## Diagnosis (🔍 read-only)
```bash
kubectl get networkpolicy -n estateflow-staging
kubectl describe networkpolicy <name> -n estateflow-staging
kubectl get pods -n estateflow-staging --show-labels
```

## How to interpret the output
`NetworkPolicy` selects pods by label — compare the policy's `podSelector`/`ingress.from`
label selectors against the actual labels on the pods that should be allowed to connect. A
mismatch (e.g. a Deployment's pod template labels changed without updating the policy) is the
most common cause.

## Possible causes
- A `NetworkPolicy` was added/edited and its label selectors don't match current pod labels
- A `NetworkPolicy` intended for a different namespace was accidentally applied cluster-wide
  or to the wrong namespace

## Safe mitigation steps (⚠️ changes infrastructure)
```bash
# Only after confirming exactly which rule is wrong — fix the policy's selector via a
# reviewed PR, then:
kubectl apply -f infra/k8s/<the-networkpolicy-file>.yaml
```
Never delete a NetworkPolicy outright to "fix" connectivity without understanding what
security boundary it was enforcing — that may reopen a gap it existed to close.

## Escalation criteria
If you don't fully understand why a given policy exists before touching it, ask whoever
authored it rather than guessing.

## Recovery verification
Re-test the specific connection that was failing (e.g.
`kubectl exec backend-pod -- nc -zv postgres 5432`), then full
[deployment verification](../02-deployment-guides/13-deployment-verification.md).

## Prevention recommendations
Whenever a Deployment's pod template labels change, grep for any `NetworkPolicy` referencing
the old labels in the same PR.
