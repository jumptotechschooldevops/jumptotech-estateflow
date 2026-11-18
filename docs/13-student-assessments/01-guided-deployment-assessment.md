# 01 · Guided Deployment Assessment

**Prerequisites:** [02-deployment-guides](../02-deployment-guides/README.md) completed at least once
**Next step:** [02 · Independent deployment challenge](02-independent-deployment-challenge.md)

## Objective

Prove you can follow the full deployment guide sequence correctly, end to end, and produce
evidence at each stage — this is the "can you execute a documented procedure reliably"
assessment, before the next one removes the hand-holding.

## Prerequisites

- A lab AWS account/namespace you control (never a shared environment)
- Completed [09-student-labs/01–06](../09-student-labs/README.md) at least once

## Tasks

1. Deploy the local Docker Compose stack and verify it's healthy.
2. Push both images to ECR with real, correctly-named tags.
3. Create the S3 bucket per [02-deployment-guides/11](../02-deployment-guides/11-s3-image-storage.md),
   with public access fully blocked and default encryption on.
4. Create the backend's IRSA role per [02-deployment-guides/10](../02-deployment-guides/10-iam-oidc-and-irsa.md).
5. Deploy all Kubernetes manifests in `infra/k8s/` in the documented order.
6. Confirm the ALB Ingress receives a public address and both target groups report healthy.
7. Upload one real test image through the running app and confirm it displays via its
   presigned URL.

## Expected outcomes

- All pods `Running` and ready
- `/api/health` returns `db: up, redis: up` via the public ALB address
- A real image upload succeeds and is visible in a browser

## Verification commands

```bash
docker compose ps
kubectl get pods -n estateflow-staging
kubectl get ingress -n estateflow-staging
curl -s "http://<ALB_DNS>/api/health"
aws elbv2 describe-target-health --region us-east-1 --target-group-arn <arn>
```

## Required screenshots

1. `docker compose ps` showing all four services healthy
2. `kubectl get pods -n estateflow-staging` showing all pods `Running`/ready, with your shell
   prompt/hostname visible
3. The EstateFlow UI open in a browser at the ALB's DNS address, showing at least one
   property with an uploaded image displayed
4. `aws elbv2 describe-target-health` output showing `"State": "healthy"` for all targets

## Completion criteria

- [ ] All 7 tasks completed in order
- [ ] All 4 required screenshots captured, each showing your own environment (not copied from
      documentation)
- [ ] A completed [execution record](../06-engineering-records/01-execution-record-template.md)
      for the full exercise
- [ ] Submitted using the [student submission template](07-student-submission-template.md)

Graded against [06 · Grading rubric](06-grading-rubric.md).
