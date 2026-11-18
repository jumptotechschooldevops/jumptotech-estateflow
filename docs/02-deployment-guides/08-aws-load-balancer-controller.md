# 08 · AWS Load Balancer Controller

**Prerequisites:** [04 · EKS and Kubernetes basics](04-eks-and-kubernetes-basics.md)
**Next step:** [09 · Ingress, ALB, and target groups](09-ingress-alb-and-target-groups.md)

## Why

A Kubernetes `Ingress` object, by itself, does nothing on AWS — some controller has to watch
for it and translate it into real AWS resources. The **AWS Load Balancer Controller** is that
controller: it watches for `Ingress` objects using the `alb` class and provisions a real
Application Load Balancer, target groups, and listener rules to match. This project assumes
it's **already installed** on `eks-node` — this guide is how to verify that, and how to
install it if it's genuinely missing (a cluster-wide change — coordinate with other
cluster users first).

## Prerequisites

- `kubectl`/`eksctl` access to the cluster ([04](04-eks-and-kubernetes-basics.md))
- `helm` installed, only if you need to install the controller

## Commands (verification)

```bash
kubectl get deployment -n kube-system aws-load-balancer-controller        # 1
kubectl logs -n kube-system deploy/aws-load-balancer-controller --tail=50  # 2
```

## Commands (installation — only if missing)

```bash
curl -o /tmp/alb-iam-policy.json \
  https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/main/docs/install/iam_policy.json
aws iam create-policy \
  --policy-name AWSLoadBalancerControllerIAMPolicy \
  --policy-document file:///tmp/alb-iam-policy.json

eksctl create iamserviceaccount \
  --cluster eks-node --region us-east-1 \
  --namespace kube-system \
  --name aws-load-balancer-controller \
  --attach-policy-arn arn:aws:iam::<AWS_ACCOUNT_ID>:policy/AWSLoadBalancerControllerIAMPolicy \
  --approve

helm repo add eks https://aws.github.io/eks-charts
helm repo update eks
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=eks-node \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller
```

## Explanation of each command

- The IAM policy download is AWS's own published least-privilege policy for this controller —
  don't hand-write a broader one.
- `eksctl create iamserviceaccount` is IRSA setup (see
  [10 · IAM, OIDC, and IRSA](10-iam-oidc-and-irsa.md)) specifically for this controller — note
  this is a **completely separate role** from the backend's S3 role. Never merge them: the
  controller's role can create/modify load balancers account-wide, the backend's role can only
  touch one S3 prefix. Giving the backend the controller's permissions (or vice-versa) would
  violate least privilege for no benefit.
- Helm installs the controller's actual pod/Deployment into `kube-system`.

## Expected results

```
NAME                             READY   UP-TO-DATE   AVAILABLE
aws-load-balancer-controller     2/2     2            2
```
Clean startup logs, no repeated `AccessDenied` or reconcile errors.

## Verify

After applying this project's Ingress objects (next guide):
```bash
kubectl get events -n estateflow-staging --field-selector involvedObject.kind=Ingress
# look for "SuccessfullyReconciled"
```

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `Warning FailedDeployModel` events on your Ingress | Controller IAM role missing a permission, or no subnets tagged `kubernetes.io/role/elb=1` | [11 · AWS Load Balancer Controller failures](../04-runbooks/11-aws-load-balancer-controller-failures.md) |
| Controller pod `CrashLoopBackOff` | Usually a missing/incorrect `--cluster-name` flag or IRSA misconfiguration | Check `kubectl logs`; re-verify the `eksctl create iamserviceaccount` step |

## Troubleshooting

The controller's own logs (`kubectl logs -n kube-system deploy/aws-load-balancer-controller`)
are the single best source of truth for anything ALB-related — check them before assuming the
problem is in your Ingress YAML.

## Rollback

```bash
helm uninstall aws-load-balancer-controller -n kube-system
```
**Only do this if you installed it yourself and are sure nothing else on the cluster depends on
it** — removing it from a shared cluster breaks every team's Ingress objects, not just
EstateFlow's.

## Completion checklist

- [ ] Controller Deployment shows all replicas `Available` in `kube-system`
- [ ] Controller logs show no repeated errors
- [ ] You understand this is a separate IAM role from the backend's S3 role
