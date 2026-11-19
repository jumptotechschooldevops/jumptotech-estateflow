# EstateFlow Kubernetes manifests

Targets the existing `eks-node` cluster in `us-east-1`, namespace `estateflow-staging`. These
manifests do **not** create or modify the cluster itself — they assume it already exists with:

- the AWS Load Balancer Controller installed (for `07-ingress.yaml`)
- the Amazon EBS CSI driver add-on installed, and a `gp3` `StorageClass` available (for
  `03-postgres.yaml`'s PVC) — see `docs/02-deployment-guides/06-postgresql-pvc-and-ebs.md`
- the `metrics-server` add-on installed (for `08-hpa.yaml`)

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
