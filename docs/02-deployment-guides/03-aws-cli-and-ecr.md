# 03 · AWS CLI and ECR

**Prerequisites:** [02 · Docker and Docker Compose](02-docker-and-docker-compose.md) (app works locally first)
**Next step:** [04 · EKS and Kubernetes basics](04-eks-and-kubernetes-basics.md)

## Why

Kubernetes can't run a Docker image straight from your laptop — it pulls images from a
registry. **Amazon ECR** (Elastic Container Registry) is that registry for this project. Before
any Kubernetes work, confirm you can actually authenticate to AWS and push an image.

## Prerequisites

- AWS CLI v2 installed: `aws --version`
- Credentials configured (`aws configure` or AWS SSO) with access to the account that owns
  `eks-node`
- Docker images build locally (previous guide)

## Commands

```bash
aws sts get-caller-identity                                                    # 1
aws ecr create-repository --repository-name estateflow-backend --region us-east-1    # 2
aws ecr create-repository --repository-name estateflow-frontend --region us-east-1   # 2

aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <ECR_REGISTRY>                  # 3

docker build -t <ECR_REGISTRY>/estateflow-backend:latest ./backend             # 4
docker push <ECR_REGISTRY>/estateflow-backend:latest                           # 5

docker build -t <ECR_REGISTRY>/estateflow-frontend:latest ./frontend
docker push <ECR_REGISTRY>/estateflow-frontend:latest
```
`<ECR_REGISTRY>` is `<your-account-id>.dkr.ecr.us-east-1.amazonaws.com` — get the account ID
from step 1's output.

## Explanation of each command

1. Confirms *which* AWS identity you're using before you create anything under it — always
   check this before running account-changing commands.
2. Creates one repository per image. ECR repositories don't exist until created explicitly;
   pushing to a non-existent repo fails.
3. Exchanges your AWS credentials for a short-lived Docker registry login token (valid ~12
   hours) — this is why you don't need (and shouldn't use) a long-lived registry password.
4. Tags the image with the full registry path — Docker needs this exact format to know where
   to push it.
5. Uploads the image layers to ECR.

## Expected results

```json
{"UserId": "...", "Account": "123456789012", "Arn": "arn:aws:iam::123456789012:user/you"}
```
```
Login Succeeded
```
```
latest: digest: sha256:... size: ...
```

## Verify

```bash
aws ecr describe-images --repository-name estateflow-backend --region us-east-1 \
  --query "imageDetails[].imageTags"
# shows ["latest"] (or your pushed tag)

aws ecr list-images --repository-name estateflow-frontend --region us-east-1
```

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `Unable to locate credentials` | AWS CLI not configured | `aws configure` or set up SSO per [`00-start-here/02`](../00-start-here/02-first-day-as-a-devops-engineer.md)'s access-request step |
| `RepositoryAlreadyExistsException` | Repo already created by someone else | Fine — skip step 2, just push |
| `no basic auth credentials` on `docker push` | ECR login token expired (>12h) or step 3 skipped | Re-run step 3 |
| `denied: User ... is not authorized to perform ecr:...` | Your IAM identity lacks ECR permissions | Ask your AWS administrator for `ecr:*` on `estateflow-*` repos (see [00-start-here/02](../00-start-here/02-first-day-as-a-devops-engineer.md)) |

## Troubleshooting

If `docker push` hangs or times out, check your network can reach
`*.dkr.ecr.us-east-1.amazonaws.com` — corporate VPNs/proxies sometimes block this.

## Rollback

Deleting a bad image tag: `aws ecr batch-delete-image --repository-name estateflow-backend
--region us-east-1 --image-ids imageTag=<bad-tag>`. This only removes that tag from the
registry — it does **not** affect anything already running in the cluster; see
[15 · Rollback and recovery](15-rollback-and-recovery.md) for undoing a live deployment.

## Completion checklist

- [ ] `aws sts get-caller-identity` succeeds
- [ ] Both ECR repositories exist
- [ ] Both images pushed and visible via `aws ecr describe-images`
