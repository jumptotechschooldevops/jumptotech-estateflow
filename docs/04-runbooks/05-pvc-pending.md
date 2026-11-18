# 05 · PVC Pending

**Related guide:** [06 · PostgreSQL, PVC, and EBS](../02-deployment-guides/06-postgresql-pvc-and-ebs.md)

## Symptoms
`kubectl get pvc -n estateflow-staging` shows `data-postgres-0` stuck `Pending` instead of
`Bound`.

## Potential customer impact
Postgres pod cannot start at all without its volume — full outage of anything requiring the
database (most of the app).

## Detection and alerts
`kubectl get pvc`; Postgres pod stays `Pending` too.

## Severity assessment
SEV1/SEV2 — this blocks the database entirely.

## Diagnosis (🔍 read-only)
```bash
kubectl describe pvc data-postgres-0 -n estateflow-staging | grep -A10 Events
kubectl get storageclass
aws eks describe-addon --cluster-name eks-node --region us-east-1 --addon-name aws-ebs-csi-driver
```

## How to interpret the output
Events naming a missing StorageClass, or a provisioner error, point straight at the cause.
`describe-addon` returning `NotFound` or a non-`ACTIVE` status means the EBS CSI driver itself
is the problem — nothing Kubernetes-side can fix that.

## Possible causes
- The `gp3` `StorageClass` referenced in `infra/k8s/03-postgres.yaml` doesn't exist
- The EBS CSI driver add-on isn't installed, or its own IRSA role is broken
- AWS account EBS volume limit reached in that region

## Safe mitigation steps (⚠️ changes infrastructure)
```bash
# Only if the StorageClass is genuinely missing (confirmed via kubectl get storageclass above):
kubectl apply -f - <<'EOF'
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: gp3
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
volumeBindingMode: WaitForFirstConsumer
EOF
```
If the EBS CSI driver itself is missing/broken, that's a cluster-wide fix — see
[06 · PostgreSQL, PVC, and EBS](../02-deployment-guides/06-postgresql-pvc-and-ebs.md) — escalate
rather than installing cluster add-ons solo during an incident.

## Escalation criteria
If this is the first time Postgres has ever been deployed (no existing PVC/data to protect)
and the fix is a missing StorageClass, you can self-resolve. If a *previously working* PVC
suddenly can't bind, escalate — something changed in the cluster's storage layer that likely
affects other workloads too.

## Recovery verification
```bash
kubectl get pvc data-postgres-0 -n estateflow-staging    # Bound
kubectl get pods -n estateflow-staging -l app=postgres   # Running
```

## Prevention recommendations
Confirm the `gp3` StorageClass and EBS CSI driver exist *before* the first deploy (see
[02-deployment-guides/06](../02-deployment-guides/06-postgresql-pvc-and-ebs.md) prerequisites),
not after something breaks.
