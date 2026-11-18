# 01 · EKS Deployment

**Prerequisites:** [02-deployment-guides/04–09](../02-deployment-guides/README.md)
**Next step:** [02 · ALB and Ingress configuration](02-alb-ingress-configuration.md)

> Labeled training/lab work — see [README](README.md)'s honesty rule.

## Interview question
"Tell me about a time you deployed an application to Kubernetes/EKS from scratch."

## Situation
I was extending an existing containerized application (EstateFlow, a DevOps training
project) that ran only locally via Docker Compose, with no Kubernetes manifests at all, onto
an existing EKS cluster.

## Task
Deploy the full stack — frontend, backend, PostgreSQL, Redis — onto EKS with durable storage,
proper health checks, and resource limits, without creating a new cluster or touching
anything else already running on it.

## Action
I wrote Kubernetes manifests in a specific dependency order: namespace and ConfigMap first,
then a StatefulSet with a `volumeClaimTemplate` for Postgres (since it needs durable,
per-pod storage that a plain Deployment can't provide), a stateless Deployment for Redis, and
Deployments with readiness/liveness probes for the frontend and backend. I deliberately
scoped resource requests/limits based on the application's actual needs rather than copying
defaults, and used a headless Service for Postgres since StatefulSets need stable per-pod
DNS identities.

## Result
All components deployed successfully with zero impact to other workloads already on the
shared cluster; verified via a full deployment-verification pass (all pods ready, database
schema correct, a real read/write round trip through the API).

## Follow-up technical questions
- "Why a StatefulSet for Postgres and not a Deployment?"
- "What would happen if you deployed the ConfigMap after the Deployment that reads it?"
- "How did you avoid affecting other teams' workloads on the shared cluster?"

## Strong sample answers
- A Deployment's pods are interchangeable with no stable storage; Postgres needs the *same*
  volume to follow it across restarts, which only a StatefulSet's per-pod PVC provides.
- Kubernetes is largely order-tolerant for `kubectl apply` — a Deployment referencing a
  ConfigMap that doesn't exist yet will fail to start its pods until the ConfigMap appears,
  then recover automatically; it's good practice to apply in dependency order anyway for
  predictability, not because it's strictly required.
- By working entirely inside a dedicated namespace (`estateflow-staging`) with its own
  resource requests/limits — never touching shared cluster-level resources like the Load
  Balancer Controller's own configuration.

## Common mistakes
Claiming you created the EKS cluster itself when you only deployed onto an existing one;
not being able to explain *why* a StatefulSet was needed instead of just stating that one was
used.

## 60-second version
"I deployed a multi-service app — frontend, backend, Postgres, Redis — onto an existing EKS
cluster. The key decision was using a StatefulSet with per-pod persistent volumes for
Postgres, since it needs durable storage that follows it across restarts, unlike the
stateless Deployments I used for everything else. I verified the whole thing end-to-end:
pods healthy, schema correct, a real write going through the API and showing up in the
database."

## 2-3 minute version
Expand the 60-second version with: the dependency-ordering reasoning, why resource
limits/probes matter (a pod that's `Running` isn't the same as one that's actually ready to
serve), and the specific verification steps you ran — naming the actual commands
(`kubectl rollout status`, a real curl to `/api/health`) rather than saying "I checked it
worked."
