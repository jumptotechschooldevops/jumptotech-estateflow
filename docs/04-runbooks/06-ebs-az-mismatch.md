# 06 · EBS Availability Zone Mismatch

**Related guide:** [06 · PostgreSQL, PVC, and EBS](../02-deployment-guides/06-postgresql-pvc-and-ebs.md)

## Symptoms
`kubectl get pvc` shows `data-postgres-0` as `Bound`, but the Postgres pod stays `Pending`
anyway.

## Potential customer impact
Same as [05 · PVC Pending](05-pvc-pending.md) — full database outage, even though the PVC
itself looks fine.

## Detection and alerts
`kubectl get pvc` (Bound) + `kubectl get pods` (Pending) together is the specific signature of
this issue, distinct from runbook 05.

## Severity assessment
SEV1/SEV2 — database fully inaccessible.

## Diagnosis (🔍 read-only)
```bash
kubectl describe pod postgres-0 -n estateflow-staging | grep -A10 Events
# Look specifically for: "node(s) had volume node affinity conflict"
kubectl get pv -o jsonpath='{range .items[*]}{.metadata.name}{" "}{.spec.nodeAffinity}{"\n"}{end}'
kubectl get nodes -o custom-columns=NAME:.metadata.name,ZONE:.metadata.labels."topology\.kubernetes\.io/zone"
```

## How to interpret the output
EBS volumes are zonal — a volume created in `us-east-1a` can only attach to a node also in
`us-east-1a`. "volume node affinity conflict" means the volume and every schedulable node are
in different AZs.

## Possible causes
- The volume was first provisioned when only one AZ had nodes, and that AZ's nodes have since
  been scaled to zero or removed
- A node group's AZ configuration changed after the PVC/volume already existed

## Safe mitigation steps (⚠️ changes infrastructure)
There is no safe way to move an existing EBS volume to a different AZ in place. Options,
in order of preference:
```bash
# Option 1 (preferred): ensure at least one node exists in the volume's AZ
kubectl get nodes -o custom-columns=NAME:.metadata.name,ZONE:.metadata.labels."topology\.kubernetes\.io/zone"
# scale the node group back up in that AZ if it was scaled down

# Option 2 (data-loss risk — only with an explicit, reviewed decision and a backup first):
# delete the PVC and let a new one provision in an AZ that currently has nodes, then restore
# from the most recent pg_dump/EBS snapshot.
```

## Escalation criteria
Always escalate before choosing "Option 2" above — recreating the PVC discards the existing
volume's data unless a verified backup/snapshot exists. This is exactly the kind of decision
that needs a second person's sign-off per
[07-change-management](../07-change-management/README.md).

## Recovery verification
```bash
kubectl get pods -n estateflow-staging -l app=postgres    # Running
kubectl exec -it postgres-0 -n estateflow-staging -- pg_isready -U estateflow
```

## Prevention recommendations
Keep node groups spanning multiple AZs rather than a single AZ, so this specific failure mode
can't occur from routine node scaling.
