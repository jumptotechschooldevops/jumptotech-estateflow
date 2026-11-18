# 14 · Scaling and Rolling Updates

**Prerequisites:** [13 · Deployment verification](13-deployment-verification.md)
**Next step:** [15 · Rollback and recovery](15-rollback-and-recovery.md)

## Why

Traffic isn't constant, and new versions need to ship without downtime. Kubernetes gives you
both for free *if* you understand what it's actually doing — this guide covers manual scaling,
the `HorizontalPodAutoscaler` (automatic scaling), and how a rolling update avoids downtime.

## Prerequisites

- `metrics-server` installed (required for HPA): `kubectl get deployment -n kube-system metrics-server`

## Manual scaling

```bash
kubectl scale deployment/backend -n estateflow-staging --replicas=4     # 1
kubectl get pods -n estateflow-staging -l app=backend                   # 2
```
1. Directly sets the desired replica count — useful for a known, temporary traffic spike (e.g.
   a planned load test) where you don't want to wait for the HPA to react.
2. Confirms the new pods actually came up.

## Automatic scaling (HPA)

```bash
kubectl apply -f infra/k8s/08-hpa.yaml                                   # 3
kubectl get hpa -n estateflow-staging -w                                 # 4 (Ctrl+C to stop watching)
```
3. Applies HPA rules for both backend and frontend: scale between 2–6 replicas, targeting 70%
   average CPU utilization.
4. Watch it react live — generate load (e.g. `hey` or `ab` against the ALB URL) and watch
   `REPLICAS` climb, then fall back down a few minutes after load stops.

**Important:** manually scaling a Deployment that also has an HPA attached is temporary — the
HPA will override your manual replica count on its next reconcile loop (every ~15-30s) based
on current CPU. Use manual scaling only when you also pause/delete the HPA, or accept it'll be
overridden shortly.

## Rolling updates (how a deploy avoids downtime)

`kubectl set image` (used by `deploy.yml`, see
[12 · GitHub Actions CI/CD](12-github-actions-cicd.md)) triggers Kubernetes' default
`RollingUpdate` strategy: it starts new pods with the new image, waits for each to pass its
readiness probe, *then* terminates an old pod — one (or a few) at a time, never all at once.
This is why the readiness probes in `infra/k8s/05-backend.yaml`/`06-frontend.yaml` matter: a
broken readiness probe either blocks the rollout forever (safe, but stuck) or — worse — passes
when it shouldn't (unsafe, serves broken traffic).

```bash
kubectl rollout status deployment/backend -n estateflow-staging    # watch a rollout in progress
kubectl rollout history deployment/backend -n estateflow-staging   # see past revisions
```

## Expected results

```
deployment.apps/backend scaled
NAME                       REFERENCE            TARGETS   MINPODS   MAXPODS   REPLICAS
backend                    Deployment/backend   23%/70%   2         6         2
```

## Verify

```bash
kubectl describe hpa backend -n estateflow-staging
# "Events" section shows scaling decisions and why (e.g. "the desired replica count is more
# than the maximum replica count")
```

## Common errors

| Error | Cause | Fix |
|---|---|---|
| HPA shows `<unknown>` for current CPU | `metrics-server` missing | [14 · High CPU and memory](../04-runbooks/14-high-cpu-and-memory.md) covers metrics-server too |
| Rollout stuck, never completes | New pods failing readiness probe | [02 · CrashLoopBackOff](../04-runbooks/02-crashloopbackoff.md) or check `kubectl describe pod` |
| Scaled up but no improvement | Bottleneck is actually the database, not the app pods | Check Postgres connection count/CPU, not just app pod metrics |

## Troubleshooting

`kubectl describe deployment backend -n estateflow-staging` shows the rollout's current
condition and recent events — this is the first thing to check if a deploy "hangs."

## Rollback

See [15 · Rollback and recovery](15-rollback-and-recovery.md).

## Completion checklist

- [ ] Manually scaled a Deployment and watched new pods come up
- [ ] HPA applied and showing real (not `<unknown>`) CPU metrics
- [ ] Watched a rolling update in progress with `kubectl rollout status`
- [ ] Understand why manual scaling is overridden by an active HPA
