# 16 · Safe Resource Cleanup

**Prerequisites:** everything you're cleaning up should already be verified as no longer needed
**Next step:** none — this is the end of the deployment-guides sequence; see [03-daily-operations](../03-daily-operations/README.md) next

## Why

Every resource created in this lab costs money (ALB, EBS volume, NAT traffic, S3 storage) for
as long as it exists — and several of the deletions below are **irreversible**. This guide
exists so cleanup is deliberate, not accidental.

## Prerequisites

- Confirm with your team whether `eks-node` is shared with other projects before deleting
  anything cluster-wide (StorageClass, the Load Balancer Controller, metrics-server) — this
  guide only removes **EstateFlow's own** resources, never shared cluster infrastructure.

## Commands, in order

```bash
kubectl delete -k infra/k8s/                                                         # 1
kubectl delete secret estateflow-secrets -n estateflow-staging                       # 2
kubectl delete pvc data-postgres-0 -n estateflow-staging                             # 3 — IRREVERSIBLE

aws elbv2 describe-load-balancers --region us-east-1 \                               # 4
  --query "LoadBalancers[?contains(LoadBalancerName,'estateflow')]"

aws s3 rm "s3://$BUCKET_NAME" --recursive                                            # 5 — IRREVERSIBLE
aws s3api delete-bucket --bucket "$BUCKET_NAME" --region us-east-1

aws iam detach-role-policy --role-name estateflow-backend-s3 --policy-arn <policy-arn>  # 6
aws iam delete-role --role-name estateflow-backend-s3
aws iam delete-policy --policy-arn <policy-arn>

aws ecr delete-repository --repository-name estateflow-backend --region us-east-1 --force  # 7
aws ecr delete-repository --repository-name estateflow-frontend --region us-east-1 --force
```

## Explanation of each command

1. Removes the Deployments, Services, Ingress (and therefore the ALB), HPA, ConfigMap, and the
   Postgres StatefulSet — but **not** its PVC (Kubernetes never auto-deletes a PVC when its
   owning StatefulSet is deleted, by design, to prevent accidental data loss).
2. Removes the credentials Secret separately, since `kustomization.yaml` deliberately doesn't
   manage it (see [05 · Kubernetes Deployments and Services](05-kubernetes-deployments-and-services.md)).
3. **Deletes the EBS volume and all database data permanently.** Only run this once you're
   certain you don't need the data — take a `pg_dump` backup first if there's any doubt.
4. Confirms the ALB was actually torn down by step 1 — don't just trust `kubectl delete`
   succeeded; orphaned load balancers keep billing.
5. **Deletes every uploaded property image permanently.**
6. Removes the backend's IAM role/policy — only after confirming nothing else references it.
7. Deletes the container image repositories and everything in them.

## Expected results

```
ingress.networking.k8s.io "estateflow-backend" deleted
...
persistentvolumeclaim "data-postgres-0" deleted
[]    ← empty array from the describe-load-balancers query = confirmed gone
```

## Verify

```bash
kubectl get all -n estateflow-staging        # should be empty (or just show nothing found)
aws s3api head-bucket --bucket "$BUCKET_NAME" 2>&1   # should error "Not Found"
```

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `DeleteConflict` on the ECR repo | Images still exist and `--force` wasn't passed | Add `--force`, or delete images individually first |
| S3 bucket delete fails with `BucketNotEmpty` | Objects (or versions, if versioning was ever enabled) still present | Re-run `aws s3 rm --recursive`; check for versioned objects with `aws s3api list-object-versions` |
| ALB still billing after `kubectl delete` | Controller failed to clean up (rare) | Manually `aws elbv2 delete-load-balancer` — check controller logs for why it didn't |

## What this does **not** delete

The `eks-node` cluster itself, the AWS Load Balancer Controller, the EBS CSI driver, or
`metrics-server` — those are shared cluster infrastructure this project assumed already
existed. Never delete shared cluster add-ons as part of cleaning up one project's resources.

## Completion checklist

- [ ] All EstateFlow Kubernetes objects removed from `estateflow-staging`
- [ ] PVC/EBS volume deleted only after confirming no data needed to be kept
- [ ] ALB confirmed gone via `aws elbv2 describe-load-balancers`
- [ ] S3 bucket emptied and deleted
- [ ] IAM role/policy and ECR repositories removed
- [ ] Shared cluster infrastructure (LB Controller, EBS CSI, metrics-server) left untouched
