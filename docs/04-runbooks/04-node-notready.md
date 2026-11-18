# 04 · Node NotReady

**Related guide:** [04 · EKS and Kubernetes basics](../02-deployment-guides/04-eks-and-kubernetes-basics.md)

## Symptoms
`kubectl get nodes` shows a node's `STATUS` as `NotReady`.

## Potential customer impact
Pods on that node become unreachable; Kubernetes will reschedule them elsewhere automatically
after a tolerance period (default ~5 minutes) — brief capacity reduction, not necessarily a
full outage if other nodes have room.

## Detection and alerts
`kubectl get nodes`; pods on the affected node show as not ready too.

## Severity assessment
A single node, cluster otherwise has capacity to absorb rescheduled pods: SEV3/SEV4. Multiple
nodes NotReady, or no spare capacity: SEV1/SEV2 — this is a cluster infrastructure problem
beyond just EstateFlow.

## Diagnosis (🔍 read-only — infrastructure, not application-level)
```bash
kubectl describe node <node-name> | grep -A10 Conditions
kubectl get events --field-selector involvedObject.kind=Node
aws ec2 describe-instance-status --region us-east-1 --instance-ids <instance-id-for-that-node>
```

## How to interpret the output
`Conditions` shows *why* — `MemoryPressure`, `DiskPressure`, `NetworkUnavailable`, or kubelet
itself stopped reporting (often an underlying EC2/networking issue). The EC2 instance status
check confirms whether AWS itself sees the underlying instance as healthy.

## Possible causes
- Underlying EC2 instance has a hardware/hypervisor issue
- kubelet process crashed or lost network connectivity
- Node ran out of disk/memory and became unresponsive

## Safe mitigation steps (⚠️ changes infrastructure — node-level actions affect every workload on that node, not just EstateFlow)
```bash
# Cordon (stop new scheduling) before investigating further, so the problem doesn't get worse:
kubectl cordon <node-name>
# If the node is confirmed unrecoverable and part of an EKS-managed node group, let the
# cluster autoscaler/managed node group replace it rather than manually terminating the EC2
# instance yourself unless you own that responsibility for this cluster.
```

## Escalation criteria
**Always escalate to the cluster/platform owner** — a NotReady node is infrastructure shared
across every workload on `eks-node`, not an EstateFlow-specific problem to fix alone.

## Recovery verification
```bash
kubectl get nodes    # node back to Ready, or safely removed/replaced
kubectl get pods -n estateflow-staging -o wide    # pods rescheduled onto healthy nodes
```

## Prevention recommendations
Ensure node group has enough spare capacity to absorb one node's worth of pods being
rescheduled; keep an eye on node-level CloudWatch metrics if available (see
[08-monitoring-and-observability](../08-monitoring-and-observability/README.md)).
