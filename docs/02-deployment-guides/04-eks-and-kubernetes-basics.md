# 04 · EKS and Kubernetes Basics

**Prerequisites:** [03 · AWS CLI and ECR](03-aws-cli-and-ecr.md)
**Next step:** [05 · Kubernetes Deployments and Services](05-kubernetes-deployments-and-services.md)

## Why

This project does **not** create an EKS cluster — it deploys onto `eks-node`, which already
exists, in `us-east-1`. Before touching any manifest, confirm you can actually reach it, and
understand the handful of Kubernetes object types this project uses.

## Prerequisites

- `kubectl` installed: `kubectl version --client`
- `eksctl` installed (optional, simplifies IAM/IRSA steps later): `eksctl version`
- AWS CLI access confirmed (previous guide)

## Core concepts, in plain English

- **Namespace** — a folder inside the cluster. EstateFlow lives entirely in
  `estateflow-staging`, so it can't collide with other teams' workloads on the same cluster.
- **Deployment** — "keep N copies of this container running, replace any that crash." Used for
  the stateless frontend and backend.
- **StatefulSet** — like a Deployment, but each pod gets a stable identity and its own
  persistent volume that follows it across restarts. Used for Postgres.
- **Service** — a stable internal DNS name/IP for a set of pods. `ClusterIP` (used here) is
  only reachable from inside the cluster.
- **ConfigMap / Secret** — key-value env config; Secrets are base64-encoded and
  access-controlled separately — passwords/tokens go in Secrets, everything else in
  ConfigMaps.
- **PersistentVolumeClaim (PVC)** — a request for durable storage; the EBS CSI driver turns it
  into a real EBS volume.
- **Ingress** — "give me a way in from the internet"; the AWS Load Balancer Controller
  provisions a real ALB to match.
- **HorizontalPodAutoscaler (HPA)** — watches CPU usage, adds/removes pods to stay near a
  target.

## Commands

```bash
aws eks describe-cluster --name eks-node --region us-east-1 --query "cluster.status"   # 1
aws eks update-kubeconfig --name eks-node --region us-east-1                           # 2
kubectl config current-context                                                          # 3
kubectl get nodes                                                                        # 4
kubectl get deployment -n kube-system aws-load-balancer-controller                      # 5
kubectl get deployment -n kube-system metrics-server                                     # 6
```

## Explanation of each command

1. Confirms the cluster exists and is `ACTIVE` before you try to point `kubectl` at it.
2. Writes/updates your local `~/.kube/config` so `kubectl` knows how to reach this specific
   cluster — this can silently switch you away from a different cluster you were previously
   pointed at, so check step 3 afterward.
3. Confirms which cluster `kubectl` is actually talking to right now — **always check this
   before running any `kubectl apply`/`delete` against a shared cluster.**
4. Lists worker nodes — confirms basic connectivity and that nodes are `Ready`.
5. / 6. Confirm the add-ons this project's manifests assume already exist (needed later for
   Ingress and the HPA respectively).

## Expected results

```
"ACTIVE"
Updated context arn:aws:eks:us-east-1:<account>:cluster/eks-node in ...
arn:aws:eks:us-east-1:<account>:cluster/eks-node
NAME                          STATUS   ROLES    AGE   VERSION
ip-10-0-x-x.ec2.internal      Ready    <none>   ...   v1.2x.x
```

## Verify

```bash
kubectl get ns estateflow-staging
# NotFound is expected before you've applied infra/k8s/00-namespace.yaml — that's the next guide
```

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `ResourceNotFoundException` on `describe-cluster` | Wrong account/region, or cluster name typo | Confirm with whoever manages the cluster — this project hardcodes `eks-node`/`us-east-1` |
| `kubectl get nodes` hangs/times out | Security group / VPN not allowing access to the cluster's API endpoint | Check with your network/cluster admin |
| `error: You must be logged in to the server (Unauthorized)` | Your IAM identity isn't mapped into the cluster's RBAC yet | Ask to be added via `aws-auth` ConfigMap or EKS access entries — see [00-start-here/02](../00-start-here/02-first-day-as-a-devops-engineer.md) |

## Troubleshooting

If `kubectl config current-context` shows the wrong cluster, re-run step 2 — don't manually
edit `~/.kube/config` unless you're comfortable with its syntax, it's easy to corrupt.

## Rollback

Switching back to a previous cluster context: `kubectl config get-contexts` to list saved
contexts, `kubectl config use-context <name>` to switch without re-running
`update-kubeconfig`.

## Completion checklist

- [ ] `kubectl get nodes` lists `eks-node`'s worker nodes as `Ready`
- [ ] `kubectl config current-context` confirmed to be `eks-node`, not some other cluster
- [ ] Confirmed AWS Load Balancer Controller and metrics-server deployments exist in `kube-system`
