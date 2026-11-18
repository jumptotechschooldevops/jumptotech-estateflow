# 02 · Kubernetes Lab

**Prerequisites:** [01 · Docker lab](01-docker-lab.md), [02-deployment-guides/05](../02-deployment-guides/05-kubernetes-deployments-and-services.md)
**Next step:** [03 · Postgres + EBS lab](03-postgres-ebs-lab.md)

## Guided lab

Follow [02-deployment-guides/04](../02-deployment-guides/04-eks-and-kubernetes-basics.md) and
[05](../02-deployment-guides/05-kubernetes-deployments-and-services.md) exactly, in a lab
namespace/cluster, through to both Deployments reporting ready.

## Independent practice assignment

Without re-reading the guide: scale the backend to 4 replicas, confirm via `kubectl get pods`,
then scale it back to 2.

## Controlled failure scenario

```bash
kubectl set image deployment/backend backend=<registry>/estateflow-backend:this-tag-does-not-exist -n estateflow-staging
```

## Troubleshooting exercise

Using only
[`04-runbooks/01-imagepullbackoff.md`](../04-runbooks/01-imagepullbackoff.md)'s 🔍 diagnostic
commands, identify the exact problem, then fix it with `kubectl rollout undo` — don't just
`kubectl set image` back to a tag you remember; prove to yourself the rollback command works.

## Expected outcome

Backend returns to `Running`/ready with the previous working image, verified via
[deployment verification](../02-deployment-guides/13-deployment-verification.md).

## Verification checklist

- [ ] Both Deployments scaled up and back down successfully
- [ ] Diagnosed `ImagePullBackOff` using only the runbook's read-only commands
- [ ] Successfully rolled back using `kubectl rollout undo`, not a guessed manual fix

## Interview questions

1. **What's the difference between a Deployment and a StatefulSet, and why does this project
   use a StatefulSet for Postgres but not for the backend?**
2. **What happens, step by step, when you run `kubectl set image` on a Deployment?**
3. **Why does `kubectl rollout undo` work even if you don't remember the previous image tag?**

## Sample answers

1. A Deployment's pods are interchangeable (any replica can serve any request) and have no
   stable identity or dedicated storage; a StatefulSet gives each pod a stable name and its
   own PersistentVolumeClaim that follows it across restarts — needed for Postgres, which
   can't just swap in an identical-looking empty replica.
2. Kubernetes updates the Deployment's pod template, which creates a new ReplicaSet; it then
   performs a rolling update — starting new pods with the new image, waiting for each to pass
   its readiness probe, then terminating an old pod, one (or a few) at a time, based on the
   Deployment's `strategy` settings.
3. Kubernetes keeps a revision history of past ReplicaSets (each with its own exact pod spec,
   including the image tag) — `rollout undo` simply re-activates the previous revision's
   already-recorded spec, so you don't need to remember anything.
