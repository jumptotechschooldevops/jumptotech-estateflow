# 11 · AWS Load Balancer Controller Failures

**Related guide:** [08 · AWS Load Balancer Controller](../02-deployment-guides/08-aws-load-balancer-controller.md)

## Symptoms
`kubectl get ingress -n estateflow-staging` never shows an `ADDRESS`, or shows
`Warning FailedDeployModel` events.

## Potential customer impact
No ALB exists at all → full outage of public access (though internal cluster traffic between
frontend/backend pods is unaffected).

## Detection and alerts
`kubectl get ingress` ADDRESS column; `kubectl get events --field-selector
involvedObject.kind=Ingress`.

## Severity assessment
SEV1 if this is a first deploy with no previously-working ALB (no outage yet, but blocks
launch); SEV1/SEV2 if an existing, working ALB disappears.

## Diagnosis (🔍 read-only)
```bash
kubectl get deployment -n kube-system aws-load-balancer-controller
kubectl logs -n kube-system deploy/aws-load-balancer-controller --tail=100
kubectl describe ingress estateflow-frontend -n estateflow-staging
aws ec2 describe-subnets --region us-east-1 --filters "Name=tag:kubernetes.io/role/elb,Values=1"
```

## How to interpret the output
Controller logs are authoritative here. Common messages: `AccessDenied` (controller's IAM
role missing a permission), `no subnets found` (subnets not tagged
`kubernetes.io/role/elb=1`), or `rate exceeded` (AWS API throttling, usually transient).

## Possible causes
- Controller pod itself not running / crash-looping
- Controller's IAM role (separate from the backend's — see
  [10 · IAM, OIDC, and IRSA](../02-deployment-guides/10-iam-oidc-and-irsa.md)) missing a
  permission, often after an IAM policy was edited elsewhere
- VPC subnets not tagged for ALB discovery

## Safe mitigation steps (⚠️ changes infrastructure — cluster-wide, not EstateFlow-specific)
```bash
# If the controller pod itself is down:
kubectl rollout restart deployment/aws-load-balancer-controller -n kube-system
```
IAM policy or subnet tagging fixes require AWS account-level changes — always via a reviewed
change, never ad hoc during an incident if avoidable.

## Escalation criteria
**Always escalate to the cluster/platform owner.** This controller is shared cluster
infrastructure — a problem here likely affects every team's Ingress objects on `eks-node`,
not just EstateFlow's.

## Recovery verification
```bash
kubectl get ingress -n estateflow-staging    # ADDRESS populated
kubectl get events -n estateflow-staging --field-selector involvedObject.kind=Ingress
# "SuccessfullyReconciled"
```

## Prevention recommendations
Treat the controller's IAM policy and VPC subnet tags as shared cluster infrastructure with
its own change-review process — don't let individual project teams modify them unilaterally.
