# 01 · ImagePullBackOff

**Related guide:** [02-deployment-guides/03 · AWS CLI and ECR](../02-deployment-guides/03-aws-cli-and-ecr.md), [05 · Kubernetes Deployments and Services](../02-deployment-guides/05-kubernetes-deployments-and-services.md)

## Symptoms
`kubectl get pods` shows `ImagePullBackOff` or `ErrImagePull` in the `STATUS` column; the pod
never reaches `Running`.

## Potential customer impact
If this affects *all* replicas of a Deployment, that service is fully down. If only new pods
from a rollout are affected, old pods keep serving — likely no customer impact yet, but the
rollout is stuck.

## Detection and alerts
`kubectl get pods` status column; `kubectl rollout status` will hang/timeout.

## Severity assessment
All replicas affected + no old pods left serving → SEV1/SEV2 (see
[05-incident-management](../05-incident-management/README.md)). Only new rollout pods
affected, old pods still serving → SEV3/SEV4, not urgent but still needs fixing.

## Diagnosis (🔍 read-only)
```bash
kubectl describe pod <pod-name> -n estateflow-staging | grep -A10 Events
kubectl get deployment backend -n estateflow-staging -o jsonpath='{.spec.template.spec.containers[0].image}{"\n"}'
aws ecr describe-images --repository-name estateflow-backend --region us-east-1 --query "imageDetails[].imageTags"
```

## How to interpret the output
The Events section shows the exact error: `pull access denied` (auth/permissions),
`manifest unknown` (tag doesn't exist), or a generic timeout (network/registry
unreachable from the node).

## Possible causes
- The `<ECR_REGISTRY>`/`<ECR_REGISTRY>` placeholder in `infra/k8s/05-backend.yaml` or
  `06-frontend.yaml` was never replaced with the real registry.
- The image tag referenced doesn't exist in ECR (deleted, or never pushed).
- Node's IAM role lacks ECR pull permission (rare on EKS — usually comes for free via the
  node role, but check if node IAM was customized).
- ECR repository was deleted or renamed.

## Safe mitigation steps (⚠️ changes infrastructure)
```bash
# Confirm the correct, existing tag first (read-only), then:
kubectl set image deployment/backend backend=<correct-ECR_REGISTRY>/estateflow-backend:<correct-tag> -n estateflow-staging
kubectl rollout status deployment/backend -n estateflow-staging
```

## Escalation criteria
If the image genuinely doesn't exist in ECR (build/push never completed), escalate to whoever
owns the CI/CD pipeline rather than trying to manually rebuild/push under incident pressure —
see [12 · GitHub Actions CI/CD](../02-deployment-guides/12-github-actions-cicd.md).

## Recovery verification
```bash
kubectl get pods -n estateflow-staging -l app=backend    # all Running
```
Then run full [deployment verification](../02-deployment-guides/13-deployment-verification.md).

## Prevention recommendations
Never hand-edit the `<ECR_REGISTRY>` placeholders outside of a reviewed PR; prefer letting
`deploy.yml`'s `kubectl set image` step set the tag automatically rather than manual edits.
