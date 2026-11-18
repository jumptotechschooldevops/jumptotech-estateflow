# 08 · Capstone: End-to-End Deployment

**Prerequisites:** all of labs [01](01-docker-lab.md)–[07](07-incident-response-lab.md)
**Next step:** none — this is the final lab. Go to [10-interview-preparation](../10-interview-preparation/README.md) next.

A single walkthrough from zero to "a stranger on the internet can browse EstateFlow listings
with photos, served from AWS" — deploying from GitHub to EKS and verifying every component:
Frontend, Backend, PostgreSQL, Redis, ALB, and S3.

## Guided lab

### Part 1 — Local verification (free, do this first)
```bash
cp .env.example .env
docker compose up --build -d
docker compose ps
curl http://localhost:8080/api/health
docker compose down
```
✅ All four services healthy; `/api/health` returns `db: up, redis: up`.

### Part 2 — AWS prerequisites
Follow [02-deployment-guides/04](../02-deployment-guides/04-eks-and-kubernetes-basics.md)
fully: confirm cluster access, confirm the Load Balancer Controller / EBS CSI driver /
metrics-server are present.
✅ `kubectl get nodes` lists `eks-node`'s nodes.

### Part 3 — ECR images
Follow [02-deployment-guides/03](../02-deployment-guides/03-aws-cli-and-ecr.md).
✅ Both images pushed, visible via `aws ecr describe-images`.

### Part 4 — S3 bucket
Follow [02-deployment-guides/11](../02-deployment-guides/11-s3-image-storage.md).
✅ `aws s3api get-public-access-block` shows all four flags `true`.

### Part 5 — IAM/IRSA
Follow [02-deployment-guides/10](../02-deployment-guides/10-iam-oidc-and-irsa.md).
✅ Trust policy scoped to `system:serviceaccount:estateflow-staging:estateflow-backend`.

### Part 6 — Fill in placeholders
`infra/k8s/01-configmap.yaml` (bucket name), `05-backend.yaml`/`06-frontend.yaml`
(`<AWS_ACCOUNT_ID>`, role ARN, `<ECR_REGISTRY>`).

### Part 7 — Deploy
Follow [02-deployment-guides/05](../02-deployment-guides/05-kubernetes-deployments-and-services.md),
[06](../02-deployment-guides/06-postgresql-pvc-and-ebs.md),
[07](../02-deployment-guides/07-redis.md),
[09](../02-deployment-guides/09-ingress-alb-and-target-groups.md), in that order.
✅ Both rollouts `successfully rolled out`; Ingress has a populated `ADDRESS`.

### Part 8 — Verify every component
Run every check in [02-deployment-guides/13 · Deployment verification](../02-deployment-guides/13-deployment-verification.md):
Frontend (`curl -I /`), Backend (`/api/health`), PostgreSQL (query via `psql`), Redis
(`X-Cache` header flip), ALB (target health all `healthy`), S3 (a real image upload+display).

### Part 9 — Wire up CI/CD
Follow [02-deployment-guides/12](../02-deployment-guides/12-github-actions-cicd.md)'s one-time
setup, then trigger `deploy.yml` and watch it succeed.

### Part 10 — Cleanup
Follow [02-deployment-guides/16 · Safe resource cleanup](../02-deployment-guides/16-safe-resource-cleanup.md)
fully — don't leave billable resources running after the capstone is done.

## Independent practice assignment

Repeat the entire capstone in a **second, separate lab AWS account/namespace** without
referring back to the guides except to check specific commands — this is the real test of
whether you actually internalized the sequence and the *why* behind each step, not just
copy-pasted commands in order once.

## Controlled failure scenario

After a successful deploy, deliberately break one thing from each category — your choice of
one runbook from [04-runbooks](../04-runbooks/README.md) — and recover fully, writing an
[execution record](../06-engineering-records/README.md) for each.

## Expected outcome

A fully working EstateFlow instance reachable at the ALB's public DNS name, with working image
upload, that you deployed yourself from a clean checkout, that you can also safely and
completely tear down.

## Verification checklist

- [ ] Local Docker Compose stack verified first
- [ ] All AWS prerequisites confirmed before deploying
- [ ] Images in ECR, bucket in S3, IAM role created — each independently verified
- [ ] Full deployment verification (all 6 components) passed
- [ ] CI/CD pipeline triggered and completed successfully at least once
- [ ] Full cleanup completed, confirmed via `aws elbv2 describe-load-balancers` and
      `aws s3api head-bucket` returning empty/not-found

## Interview questions

1. **Walk me through this entire deployment, start to finish, in under 3 minutes.**
2. **What would you do differently if you were doing this for a real production system, not
   a lab?**
3. **Which single step in this entire process, if skipped, would most likely cause a hard-to-
   diagnose problem later — and why?**

## Sample answers

1. *(Practice this out loud — see [10-interview-preparation/01](../10-interview-preparation/01-project-and-architecture.md)
   for the structured talk-track version of this answer.)*
2. Add real monitoring/alerting (currently proposed, not implemented — see
   [08-monitoring-and-observability](../08-monitoring-and-observability/README.md)), add
   HTTPS via an ACM certificate and a 443 listener, replace the single shared admin token
   with real per-user authentication, add automated database backups, and require a second
   reviewer + staging environment smoke test before any production deploy.
3. Skipping the EBS CSI driver / `gp3` StorageClass prerequisite check — the PVC will simply
   hang `Pending` with no immediately obvious cause unless you already know to check for it,
   and it's easy to burn a long time debugging the Postgres pod itself when the actual problem
   is one layer below it.
