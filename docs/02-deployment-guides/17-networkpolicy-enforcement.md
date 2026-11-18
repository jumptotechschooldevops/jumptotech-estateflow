# 17 · NetworkPolicy Enforcement

**Prerequisites:** [05 · Kubernetes Deployments and Services](05-kubernetes-deployments-and-services.md), [06 · PostgreSQL, PVC, and EBS](06-postgresql-pvc-and-ebs.md), [07 · Redis](07-redis.md)
**Next step:** none — last file in this folder. Return to
[02-deployment-guides/README.md](README.md).

## Why

Until now, any pod in `estateflow-staging` could reach any other pod on any port — a
frontend pod could connect directly to Postgres, nothing stopped it. `infra/k8s/
09-networkpolicy.yaml` fixes that: default-deny everything, then explicitly allow only the
traffic paths the application actually uses (verified against the real ports/selectors in
`03-postgres.yaml` through `07-ingress.yaml` — see that file's own comments for exactly which
real resource each rule maps to).

**Read this before anything else:** the default AWS VPC CNI on EKS does **not** enforce
NetworkPolicy out of the box. Applying these objects on a cluster without an enforcing
CNI/add-on is harmless — they just sit there, unenforced — but don't mistake "the objects
exist" for "traffic is actually being restricted." Step 1 below tells you how to check which
is true for your cluster before relying on this for anything.

## Prerequisites

- Backend/frontend/Postgres/Redis already deployed and working (this guide only adds
  restrictions on top of an already-working setup — verify it works *before* locking it
  down, so you can tell "the policy broke something" apart from "it was already broken")

## Step 1: Confirm whether your cluster actually enforces NetworkPolicy

```bash
kubectl get daemonset -n kube-system | grep -i calico
aws eks describe-cluster --name eks-node --region us-east-1 \
  --query "cluster.kubernetesNetworkConfig" --output table
```
Look for either a Calico (or similar) DaemonSet running, or — for the native VPC CNI — a
`kubernetesNetworkConfig` showing `elasticLoadBalancing`/`ipFamily` settings plus confirmation
the VPC CNI's `NetworkPolicy` feature is enabled (this is a separate add-on configuration
step, not automatic). **If neither is true, the commands in this guide will all succeed, but
the policies won't actually block anything** — treat the rest of this guide as "prepared, not
yet effective" until you've confirmed enforcement.

## Commands

```bash
kubectl apply -f infra/k8s/09-networkpolicy.yaml                                    # 1
kubectl get networkpolicy -n estateflow-staging                                     # 2
```

## Explanation of each command

1. Applies all 6 policies: a baseline `default-deny-all`, a DNS-egress allowance for every
   pod, ingress allowances for the frontend (8080) and backend (5000) ports the ALB connects
   to directly, ingress-to-Postgres/Redis restricted to backend pods only, and backend egress
   scoped to Postgres, Redis, and port 443 (for S3/STS AWS API calls).
2. Lists what actually got created — confirms the apply worked, not whether enforcement is
   active (see Step 1).

## Expected results

```
networkpolicy.networking.k8s.io/default-deny-all created
networkpolicy.networking.k8s.io/allow-dns-egress created
networkpolicy.networking.k8s.io/allow-ingress-to-frontend created
networkpolicy.networking.k8s.io/allow-ingress-to-backend created
networkpolicy.networking.k8s.io/allow-backend-to-postgres created
networkpolicy.networking.k8s.io/allow-backend-to-redis created
networkpolicy.networking.k8s.io/allow-backend-egress-to-dependencies created
```

## Verify — prove the restriction actually works (only meaningful if enforcement is on)

```bash
# This SHOULD still work — backend is explicitly allowed to reach Postgres:
kubectl exec -n estateflow-staging deploy/backend -- nc -zv postgres 5432

# This SHOULD now fail/time out — nothing allows the frontend to reach Postgres directly:
kubectl exec -n estateflow-staging deploy/frontend -- nc -zv postgres 5432

# The application itself should still work end to end:
curl -s "http://<ALB_DNS>/api/health"
```
If the second command *succeeds* (frontend can reach Postgres), either enforcement isn't
active on your cluster (go back to Step 1), or the policy's selector doesn't match your
pods' actual labels — check with `kubectl get pods -n estateflow-staging --show-labels`.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| App breaks entirely after applying (health checks fail, 503s) | A real traffic path wasn't accounted for — check `kubectl describe networkpolicy` selectors against actual pod labels first | [04-runbooks/17 · NetworkPolicy blocking traffic](../04-runbooks/17-networkpolicy-blocking-traffic.md) |
| "It applied fine but nothing is actually restricted" | Enforcement isn't active on this cluster (expected on vanilla VPC CNI) | Not an error — see Step 1; this is expected unless you've specifically enabled enforcement |
| ALB health checks start failing after applying | `allow-ingress-to-frontend`/`allow-ingress-to-backend` port doesn't match the Service's actual `targetPort` | Compare against `infra/k8s/05-backend.yaml`/`06-frontend.yaml` exactly — ports must match |

## Troubleshooting

Full decision tree: [`04-runbooks/17-networkpolicy-blocking-traffic.md`](../04-runbooks/17-networkpolicy-blocking-traffic.md).
Start with `kubectl describe networkpolicy <name> -n estateflow-staging` and compare its
selector against `kubectl get pods --show-labels` — a label mismatch is the most common
cause of "this policy isn't doing what I expected."

## Rollback

```bash
kubectl delete -f infra/k8s/09-networkpolicy.yaml
```
Safe at any time — removing all NetworkPolicy objects returns to the previous "allow
everything" behavior, which is less secure but never breaks the application (the reverse of
applying them, which *can* break things if a real traffic path was missed).

## Completion checklist

- [ ] Confirmed whether your cluster's CNI actually enforces NetworkPolicy
- [ ] All 6 policies applied successfully
- [ ] Verified backend → Postgres/Redis still works
- [ ] Verified frontend → Postgres is blocked (if enforcement is active) or explicitly noted
      it isn't yet (if not)
- [ ] Full application still works end to end through the ALB after applying
