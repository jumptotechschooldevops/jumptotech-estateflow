# EstateFlow Kubernetes manifests

Targets the existing `eks-node` cluster in `us-east-1`, namespace `estateflow-staging`. These
manifests do **not** create or modify the cluster itself — they assume it already exists with:

- the AWS Load Balancer Controller installed (for `07-ingress.yaml`)
- the Amazon EBS CSI driver add-on installed, and a `gp3` `StorageClass` available (for
  `03-postgres.yaml`'s PVC) — see `docs/02-deployment-guides/06-postgresql-pvc-and-ebs.md`
- the `metrics-server` add-on installed (for `08-hpa.yaml`)
- (optional, see below) a NetworkPolicy-enforcing CNI, for `09-networkpolicy.yaml` to
  actually do anything — the default AWS VPC CNI does **not** enforce NetworkPolicy without
  extra configuration

See `docs/02-deployment-guides/04-eks-and-kubernetes-basics.md` through
`docs/02-deployment-guides/09-ingress-alb-and-target-groups.md` for the full walkthrough.
Nothing in this directory has been applied to a live cluster — review and run these yourself.

## Prerequisites before applying

1. Replace `<AWS_ACCOUNT_ID>` and `<BACKEND_ROLE_ARN>` in `05-backend.yaml` with the IRSA role
   created per `infra/iam/README.md`.
2. Replace `<ECR_REGISTRY>` in `05-backend.yaml` and `06-frontend.yaml` with your account's ECR
   registry (or let the first CI/CD deploy run do it via `kubectl set image`).
3. Set the real `S3_BUCKET_NAME` in `01-configmap.yaml` to the bucket created per
   `infra/s3/README.md`.
4. Create the real `estateflow-secrets` Secret (do **not** apply `02-secrets.example.yaml`
   as-is):
   ```bash
   kubectl create secret generic estateflow-secrets \
     --namespace estateflow-staging \
     --from-literal=POSTGRES_USER=estateflow \
     --from-literal=POSTGRES_PASSWORD="$(openssl rand -base64 24)" \
     --from-literal=ADMIN_API_TOKEN="$(openssl rand -base64 32)"
   ```
   The namespace must exist first — apply `00-namespace.yaml` (or let kustomize create it, see
   below) before running this command.

## What's in this directory

| File | Kind(s) | Covers |
|---|---|---|
| `00-namespace.yaml` | Namespace | `estateflow-staging` |
| `01-configmap.yaml` | ConfigMap | non-secret app config |
| `02-secrets.example.yaml` | Secret (example only) | template — see prerequisite 4 below |
| `03-postgres.yaml` | ConfigMap, Service, StatefulSet | database + migration init scripts |
| `04-redis.yaml` | Service, Deployment | cache |
| `05-backend.yaml` | ServiceAccount, Service, Deployment | API, IRSA-annotated for S3 access |
| `06-frontend.yaml` | Service, Deployment | static UI |
| `07-ingress.yaml` | Ingress ×2 | public ALB routing |
| `08-hpa.yaml` | HorizontalPodAutoscaler ×2 | autoscaling for backend/frontend |
| `09-networkpolicy.yaml` | NetworkPolicy ×6 | least-privilege pod-to-pod traffic — see the file's own header note on CNI enforcement, and `docs/02-deployment-guides/17-networkpolicy-enforcement.md` for the full guide |

**S3 permissions** are intentionally *not* a file in this directory — the backend's
permission to call S3 is granted via the IRSA role ARN annotated on the ServiceAccount in
`05-backend.yaml`, with the actual least-privilege IAM policy JSON living in
`infra/iam/backend-s3-policy.json` (IAM policies aren't Kubernetes objects, so they don't
belong in `infra/k8s/`). See `infra/iam/README.md`.

## Apply (requires your own explicit `kubectl apply` run — not executed for you)

```bash
kubectl apply -k infra/k8s/
# then, once the namespace + ConfigMap/StatefulSet exist:
kubectl create secret generic estateflow-secrets -n estateflow-staging --from-literal=...   # see above
kubectl rollout status deployment/backend -n estateflow-staging
kubectl rollout status deployment/frontend -n estateflow-staging
kubectl get ingress -n estateflow-staging   # wait for an ADDRESS (ALB DNS name) to appear
```

## Cleanup

```bash
kubectl delete -k infra/k8s/
kubectl delete secret estateflow-secrets -n estateflow-staging
```

This deletes the Deployments, Services, Ingress, HPA, ConfigMap, and the StatefulSet — the PVC
(and its EBS volume) is deleted too since no `retain` reclaim policy was set, so back up data
first if you need it. The namespace deletion also cascades to everything inside it.
