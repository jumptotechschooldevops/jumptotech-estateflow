# 13 · Deployment Verification

**Prerequisites:** a deployment has just run — manual ([05](05-kubernetes-deployments-and-services.md)) or via CI/CD ([12](12-github-actions-cicd.md))
**Next step:** [14 · Scaling and rolling updates](14-scaling-and-rolling-updates.md)

## Why

"The pipeline said success" is not the same as "the application actually works for a real
user." A rollout can report `successfully rolled out` while the app is still broken in a way
Kubernetes' own health checks don't catch (e.g. a bad environment variable that doesn't fail
the readiness probe). Always verify independently.

## Prerequisites

- ALB DNS name available: `kubectl get ingress -n estateflow-staging`

## Commands

```bash
kubectl get pods -n estateflow-staging                                              # 1
kubectl get deployment -n estateflow-staging                                        # 2

ALB_DNS=$(kubectl get ingress estateflow-frontend -n estateflow-staging \           # 3
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

curl -s "http://$ALB_DNS/api/health"                                                 # 4
curl -s "http://$ALB_DNS/api/properties" | python3 -m json.tool                     # 5
curl -I "http://$ALB_DNS/"                                                           # 6

curl -X POST "http://$ALB_DNS/api/properties" \                                      # 7
  -H "Content-Type: application/json" -H "Authorization: Bearer <ADMIN_API_TOKEN>" \
  -d '{"title":"Deployment Smoke Test","price":1}'
# then delete it again:
curl -X DELETE "http://$ALB_DNS/api/properties/<returned-id>" \
  -H "Authorization: Bearer <ADMIN_API_TOKEN>"
```

## Explanation of each command

1. / 2. Confirm pod counts match what each Deployment expects (no pods silently stuck
   `Pending`/`CrashLoopBackOff`).
3. Grabs the public entry point.
4. Confirms the full dependency chain (backend → Postgres → Redis) is healthy from outside the
   cluster, not just from inside a pod.
5. Confirms the actual read path works and returns real data, with image metadata attached.
6. Confirms the frontend serves successfully.
7. A full round-trip write+delete, proving the write path (auth, DB insert, cache
   invalidation) works end to end — and cleans up after itself.

## Expected results

All pods `Running` with full readiness (`N/N`); `/api/health` →
`{"status":"ok","db":"up","redis":"up"}`; `/` → `200`; the POST returns `201`, the DELETE
returns `204`.

## Verify (deeper)

```bash
kubectl top pods -n estateflow-staging        # no pod unexpectedly maxed on CPU/memory
kubectl get hpa -n estateflow-staging         # current replicas within min/max bounds
```

## Common errors

If any step above fails, go to [`04-runbooks/README.md`](../04-runbooks/README.md) and match
the symptom — don't try to fix it ad hoc without checking whether there's already a known
procedure.

## Troubleshooting

Compare the currently-running image tag against what you expected to deploy:
```bash
kubectl get deployment backend -n estateflow-staging -o jsonpath='{.spec.template.spec.containers[0].image}'
```
A mismatch here (old tag still running) usually means the rollout silently didn't pick up the
new image — check `kubectl rollout history deployment/backend -n estateflow-staging`.

## Rollback

See [15 · Rollback and recovery](15-rollback-and-recovery.md) if verification fails.

## Completion checklist

- [ ] All pods `Running` and ready
- [ ] `/api/health`, `/api/properties`, and `/` all verified from outside the cluster
- [ ] A real write+delete round-trip succeeded
- [ ] Deployed image tag confirmed to match what was intended
