# 06 · PostgreSQL, PVC, and EBS

**Prerequisites:** [04 · EKS and Kubernetes basics](04-eks-and-kubernetes-basics.md)
**Next step:** [07 · Redis](07-redis.md)

## Why

Postgres needs durable, exclusive-per-pod storage that survives pod restarts. A plain
`Deployment` with no persistent volume would lose all data the moment the pod moves to a
different node. `infra/k8s/03-postgres.yaml` uses a `StatefulSet` with a
`volumeClaimTemplate` so each pod gets its own `PersistentVolumeClaim`, backed by a real EBS
volume via the EBS CSI driver.

## Prerequisites

- Namespace + Secret already created ([05](05-kubernetes-deployments-and-services.md))
- Amazon EBS CSI driver add-on installed on the cluster, and a `gp3` `StorageClass` available

```bash
aws eks describe-addon --cluster-name eks-node --region us-east-1 \
  --addon-name aws-ebs-csi-driver --query "addon.addonVersion"
kubectl get storageclass
```
If no `gp3` StorageClass exists:
```bash
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

## Commands

```bash
kubectl apply -f infra/k8s/03-postgres.yaml                                   # 1
kubectl rollout status statefulset/postgres -n estateflow-staging             # 2
kubectl get pvc -n estateflow-staging                                          # 3
kubectl exec -it postgres-0 -n estateflow-staging -- psql -U estateflow -d estateflow -c '\dt'   # 4
```

## Explanation of each command

1. Applies a ConfigMap (`estateflow-db-init` — the same migration SQL as
   `backend/migrations/`), a headless Service, and the StatefulSet itself.
2. Waits for the single Postgres replica to become ready.
3. Shows the `PersistentVolumeClaim` created for the StatefulSet's pod — confirm it's `Bound`,
   not `Pending`.
4. Connects to the database directly and lists tables — confirms the init scripts actually ran.

## How migrations run here, vs. locally

Locally, Docker Compose bind-mounts `backend/migrations/` into Postgres's
`/docker-entrypoint-initdb.d/`. Kubernetes can't bind-mount a host folder across nodes, so the
same SQL is duplicated into the `estateflow-db-init` ConfigMap inside
`infra/k8s/03-postgres.yaml`. **Keep both in sync** — if you add a new
`backend/migrations/00N_description.sql`, add the identical content to the ConfigMap too.
Postgres only runs these scripts on a **fresh, empty** data directory, which is why every
migration here is additive (`CREATE TABLE IF NOT EXISTS`, never `DROP`) — rerunning them is a
safe no-op, and an already-initialized database is never touched by re-applying the manifest.

## Expected results

```
statefulset rolling update complete 1 pods at revision ...
NAME         STATUS   VOLUME     CAPACITY   ACCESS MODES   STORAGECLASS
data-postgres-0   Bound   pvc-...   10Gi       RWO            gp3
          List of relations
 Schema |      Name       | Type  |   Owner
--------+------------------+-------+------------
 public | properties       | table | estateflow
 public | property_images  | table | estateflow
```

## Verify

```bash
aws ec2 describe-volumes --region us-east-1 \
  --filters "Name=tag:kubernetes.io/created-for/pvc/name,Values=data-postgres-0"
# confirms a real EBS volume backs this PVC
```

## Common errors

| Error | Cause | Fix |
|---|---|---|
| PVC stuck `Pending` | No `gp3` StorageClass, or pod/PVC scheduled in an AZ with no EBS CSI driver support | See [05 · PVC Pending](../04-runbooks/05-pvc-pending.md) |
| Pod stuck `Pending`, PVC `Bound` | Volume provisioned in an AZ the pod's node isn't in | See [06 · EBS AZ mismatch](../04-runbooks/06-ebs-az-mismatch.md) |
| `psql: FATAL: password authentication failed` | Secret's `POSTGRES_PASSWORD` doesn't match what the volume was initialized with (common after recreating the Secret without recreating the PVC) | See [07 · PostgreSQL connection failures](../04-runbooks/07-postgresql-connection-failures.md) |

## Troubleshooting

`kubectl describe pod postgres-0 -n estateflow-staging` → Events first, always. Then
`kubectl logs postgres-0 -n estateflow-staging` for Postgres's own startup log.

## Rollback / backup

```bash
kubectl exec -it postgres-0 -n estateflow-staging -- pg_dump -U estateflow estateflow > backup.sql
```
A manual starting point only — a real production cluster needs scheduled EBS snapshots
(`aws ec2 create-snapshot`) or a managed tool (e.g. Velero). Deleting the StatefulSet does
**not** delete the PVC/EBS volume — see
[16 · Safe resource cleanup](16-safe-resource-cleanup.md) before deleting a PVC, which **is**
irreversible.

## Completion checklist

- [ ] StatefulSet rolled out successfully
- [ ] PVC shows `Bound` with a `gp3` StorageClass
- [ ] `psql \dt` shows both `properties` and `property_images` tables
- [ ] You've located (not necessarily taken) the EBS volume via `aws ec2 describe-volumes`
