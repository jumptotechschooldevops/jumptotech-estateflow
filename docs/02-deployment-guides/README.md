# 02 · Deployment Guides

**Prerequisites:** [01-architecture](../01-architecture/README.md)
**Next step:** [03-daily-operations](../03-daily-operations/README.md)

Step-by-step, tool-by-tool guides for taking EstateFlow from source code to a running
deployment on the existing `eks-node` EKS cluster (`us-east-1`, namespace
`estateflow-staging`). Work through them in order the first time — later guides assume earlier
ones are done (e.g. you need ECR repos before you can push images, you need IRSA before S3
uploads work).

Every guide follows the same structure: **Why** → **Prerequisites** → **Commands** (each
explained) → **Expected results** → **Verify** → **Common errors** → **Rollback** →
**Checklist**.

| # | Guide | Covers |
|---|---|---|
| 01 | [Git and GitHub](01-git-and-github.md) | Cloning, branches, the remote, basic workflow |
| 02 | [Docker and Docker Compose](02-docker-and-docker-compose.md) | Local multi-container dev |
| 03 | [AWS CLI and ECR](03-aws-cli-and-ecr.md) | Authenticating to AWS, pushing images |
| 04 | [EKS and Kubernetes basics](04-eks-and-kubernetes-basics.md) | Core K8s objects, pointing `kubectl` at the cluster |
| 05 | [Kubernetes Deployments and Services](05-kubernetes-deployments-and-services.md) | How the backend/frontend actually run |
| 06 | [PostgreSQL, PVC, and EBS](06-postgresql-pvc-and-ebs.md) | Durable database storage |
| 07 | [Redis](07-redis.md) | The cache layer |
| 08 | [AWS Load Balancer Controller](08-aws-load-balancer-controller.md) | Turns Ingress objects into real ALBs |
| 09 | [Ingress, ALB, and target groups](09-ingress-alb-and-target-groups.md) | Public routing |
| 10 | [IAM, OIDC, and IRSA](10-iam-oidc-and-irsa.md) | Pods assuming AWS permissions without keys |
| 11 | [S3 image storage](11-s3-image-storage.md) | Property photo uploads |
| 12 | [GitHub Actions CI/CD](12-github-actions-cicd.md) | Automated build/test/deploy |
| 13 | [Deployment verification](13-deployment-verification.md) | Confirming a deploy actually worked |
| 14 | [Scaling and rolling updates](14-scaling-and-rolling-updates.md) | Handling load, deploying new versions safely |
| 15 | [Rollback and recovery](15-rollback-and-recovery.md) | Undoing a bad deploy |

| 16 | [Safe resource cleanup](16-safe-resource-cleanup.md) | Tearing down resources safely |
| 17 | [NetworkPolicy enforcement](17-networkpolicy-enforcement.md) | Restricting pod-to-pod traffic |
| 18 | [CI vs. CD](17-ci-vs-cd.md) | Understanding integration and deployment |
| 19 | [GitHub OIDC authentication](18-github-oidc-authentication.md) | Secure AWS authentication |
| 20 | [Deployment approvals](19-deployment-approvals.md) | Required reviewer approval |
| 21 | [Troubleshooting failed AWS authentication](20-troubleshooting-aws-auth-failures.md) | Fixing AWS authentication errors |

## Progress checklist

- [ ] 01 Git and GitHub
- [ ] 02 Docker and Docker Compose
- [ ] 03 AWS CLI and ECR
- [ ] 04 EKS and Kubernetes basics
- [ ] 05 Kubernetes Deployments and Services
- [ ] 06 PostgreSQL, PVC, and EBS
- [ ] 07 Redis
- [ ] 08 AWS Load Balancer Controller
- [ ] 09 Ingress, ALB, and target groups
- [ ] 10 IAM, OIDC, and IRSA
- [ ] 11 S3 image storage
- [ ] 12 GitHub Actions CI/CD
- [ ] 13 Deployment verification
- [ ] 14 Scaling and rolling updates
- [ ] 15 Rollback and recovery
- [ ] 16 Safe resource cleanup
- [ ] 17 NetworkPolicy enforcement
- [ ] 18 CI vs. CD
- [ ] 19 GitHub OIDC authentication
- [ ] 20 Deployment approvals
- [ ] 21 Troubleshooting failed AWS authentication
