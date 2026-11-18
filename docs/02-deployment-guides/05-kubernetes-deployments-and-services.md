# 05 · Kubernetes Deployments and Services

**Prerequisites:** [04 · EKS and Kubernetes basics](04-eks-and-kubernetes-basics.md), images pushed to ECR ([03](03-aws-cli-and-ecr.md))
**Next step:** [06 · PostgreSQL, PVC, and EBS](06-postgresql-pvc-and-ebs.md)

## Why

The frontend and backend are stateless — any pod can answer any request — so they're run as
plain `Deployment`s, each fronted by a `ClusterIP` `Service` so other pods (and later, the
ALB) have a stable address to send traffic to.

## Prerequisites

- Namespace and config applied: `infra/k8s/00-namespace.yaml`, `infra/k8s/01-configmap.yaml`
- Real values filled in:
  - `infra/k8s/01-configmap.yaml` → real `S3_BUCKET_NAME`
  - `infra/k8s/05-backend.yaml` → real `<AWS_ACCOUNT_ID>`/`<BACKEND_ROLE_ARN>` (see
    [10 · IAM, OIDC, and IRSA](10-iam-oidc-and-irsa.md)) and `<ECR_REGISTRY>`
  - `infra/k8s/06-frontend.yaml` → real `<ECR_REGISTRY>`
- The real `estateflow-secrets` Secret created (not the `.example` file — see command below)

## Commands

```bash
kubectl apply -f infra/k8s/00-namespace.yaml                                    # 1
kubectl apply -f infra/k8s/01-configmap.yaml                                    # 2

kubectl create secret generic estateflow-secrets -n estateflow-staging \        # 3
  --from-literal=POSTGRES_USER=estateflow \
  --from-literal=POSTGRES_PASSWORD="$(openssl rand -base64 24)" \
  --from-literal=ADMIN_API_TOKEN="$(openssl rand -base64 32)"

kubectl apply -f infra/k8s/05-backend.yaml                                      # 4
kubectl apply -f infra/k8s/06-frontend.yaml                                     # 5

kubectl rollout status deployment/backend -n estateflow-staging                 # 6
kubectl rollout status deployment/frontend -n estateflow-staging
```

## Explanation of each command

1. Creates the `estateflow-staging` namespace everything else lives in.
2. Creates the non-secret environment config (DB host, Redis URL, AWS region, bucket name)
   every pod reads from.
3. Creates the real credentials Secret **imperatively**, so the password/token value never
   touches a file on disk or gets committed by accident — this is why `02-secrets.example.yaml`
   is a template, not something you apply directly.
4. / 5. Create the backend's ServiceAccount (annotated for IRSA — see
   [10 · IAM, OIDC, and IRSA](10-iam-oidc-and-irsa.md)), Deployment, and Service; same for the
   frontend.
6. Blocks until the Deployment's pods are actually ready, not just "created" — `kubectl apply`
   returns immediately even if the pods then crash.

## Expected results

```
namespace/estateflow-staging created
configmap/estateflow-config created
secret/estateflow-secrets created
serviceaccount/estateflow-backend created
service/backend created
deployment.apps/backend created
service/frontend created
deployment.apps/frontend created
deployment "backend" successfully rolled out
deployment "frontend" successfully rolled out
```

## Verify

```bash
kubectl get pods -n estateflow-staging -l app=backend
kubectl get pods -n estateflow-staging -l app=frontend
# both show 2/2 Running (2 replicas each, per infra/k8s/05-backend.yaml and 06-frontend.yaml)

kubectl exec -it deploy/backend -n estateflow-staging -- wget -qO- http://localhost:5000/api/health
# {"status":"ok",...}
```

## Common errors

See [04 · ImagePullBackOff](../04-runbooks/01-imagepullbackoff.md) and
[02 · CrashLoopBackOff](../04-runbooks/02-crashloopbackoff.md) for the full diagnostic flow.
Quick pointers:

| Error | Cause | Fix |
|---|---|---|
| `ImagePullBackOff` | `<ECR_REGISTRY>` placeholder never replaced, or image/tag doesn't exist | `kubectl describe pod` → check the exact image string; re-check [03](03-aws-cli-and-ecr.md) |
| `CrashLoopBackOff` on backend | Missing/wrong env var (e.g. `ADMIN_API_TOKEN` secret key typo) | `kubectl logs --previous` |
| Pod `Pending` forever | No node has capacity, or ServiceAccount doesn't exist yet | `kubectl describe pod` → Events |

## Troubleshooting

Full decision tree: [`04-runbooks/README.md`](../04-runbooks/README.md). Start with
`kubectl describe pod <name> -n estateflow-staging` — the Events section at the bottom almost
always names the actual problem.

## Rollback

```bash
kubectl rollout undo deployment/backend -n estateflow-staging
kubectl rollout undo deployment/frontend -n estateflow-staging
```
Full detail: [15 · Rollback and recovery](15-rollback-and-recovery.md).

## Completion checklist

- [ ] Namespace, ConfigMap, and the real Secret all exist
- [ ] Both Deployments report `2/2` ready pods
- [ ] `kubectl exec ... wget /api/health` returns `db: up, redis: up` (requires Postgres/Redis
      from the next two guides to be fully true — `db`/`redis` may show `down` until then)
