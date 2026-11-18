# 09 · Ingress, ALB, and Target Groups

**Prerequisites:** [08 · AWS Load Balancer Controller](08-aws-load-balancer-controller.md), backend/frontend Deployments running ([05](05-kubernetes-deployments-and-services.md))
**Next step:** [10 · IAM, OIDC, and IRSA](10-iam-oidc-and-irsa.md)

## Why

This is what actually exposes EstateFlow to the public internet. An **Ingress** (Kubernetes
object) is a request for routing; the controller turns it into an **ALB** (the real AWS load
balancer) with **target groups** (lists of pod IPs + a health check, one per route).

## Prerequisites

- Controller installed and healthy ([08](08-aws-load-balancer-controller.md))
- Backend/frontend Services exist ([05](05-kubernetes-deployments-and-services.md))

## Why two Ingress objects, not one with two paths

A single `Ingress` with both `/` and `/api` paths would force both target groups to share one
health-check path — but the backend only answers `200` on `/api/health`, the frontend only on
`/`. The fix is the documented **IngressGroup** pattern:
`infra/k8s/07-ingress.yaml` defines two `Ingress` objects sharing
`alb.ingress.kubernetes.io/group.name: estateflow`, each with its own health-check path, merged
by the controller into **one** ALB. `group.order` (backend `10`, frontend `20`) sets listener
priority so `/api` is matched before the frontend's catch-all `/`.

## Commands

```bash
kubectl apply -f infra/k8s/07-ingress.yaml                                      # 1
kubectl get ingress -n estateflow-staging -w                                    # 2 (Ctrl+C once ADDRESS appears)

ALB_DNS=$(kubectl get ingress estateflow-frontend -n estateflow-staging \       # 3
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
curl -I "http://$ALB_DNS/"                                                       # 4
curl -s "http://$ALB_DNS/api/health"                                             # 5
```

## Explanation of each command

1. Creates both Ingress objects.
2. ALB provisioning takes 1–3 minutes; `-w` watches until the `ADDRESS` column fills in.
3. Captures the ALB's public DNS name into a variable for reuse.
4. / 5. Confirm both routes actually work from outside the cluster, not just from inside a pod.

## Expected results

```
NAME                   HOSTS   ADDRESS                                                PORTS
estateflow-backend     *       k8s-estateflowstaging-....us-east-1.elb.amazonaws.com   80
estateflow-frontend    *       k8s-estateflowstaging-....us-east-1.elb.amazonaws.com   80
```
`curl -I` → `HTTP/1.1 200 OK`. `curl /api/health` → `{"status":"ok","db":"up","redis":"up"}`.

## Verify

```bash
aws elbv2 describe-target-groups --region us-east-1 \
  --query "TargetGroups[?contains(TargetGroupName,'estateflow')].TargetGroupArn" --output text | \
  xargs -n1 aws elbv2 describe-target-health --region us-east-1 --target-group-arn
```
Every target should show `"State": "healthy"`.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `ADDRESS` never fills in | Controller can't create the ALB — check its logs | [11 · AWS Load Balancer Controller failures](../04-runbooks/11-aws-load-balancer-controller-failures.md) |
| Target health `unhealthy` | Pod readiness probe failing, or wrong health-check path/port | [10 · Unhealthy Target Groups](../04-runbooks/10-unhealthy-target-groups.md) |
| `502`/`503`/`504` from the ALB | Backend crashing, overloaded, or slow | [09 · ALB 502, 503, and 504](../04-runbooks/09-alb-502-503-504.md) |

## Troubleshooting

Check target group health (above) *before* assuming the application itself is broken — a
healthy pod with a misconfigured health-check path looks identical to a genuinely broken pod
from the ALB's perspective.

## Rollback

```bash
kubectl delete -f infra/k8s/07-ingress.yaml
```
Deleting the Ingress objects tells the controller to delete the ALB and target groups too —
confirm with `aws elbv2 describe-load-balancers` that it's actually gone (orphaned ALBs cost
money every hour).

## Completion checklist

- [ ] Both Ingress objects show a populated `ADDRESS`
- [ ] `curl` to `/` and `/api/health` both succeed through the ALB DNS name
- [ ] All targets in both target groups report `healthy`
