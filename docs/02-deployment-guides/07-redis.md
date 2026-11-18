# 07 · Redis

**Prerequisites:** [05 · Kubernetes Deployments and Services](05-kubernetes-deployments-and-services.md)
**Next step:** [08 · AWS Load Balancer Controller](08-aws-load-balancer-controller.md)

## Why

Redis is a cache-aside layer in front of `GET /api/properties` and `GET /api/properties/:id`.
On a cache hit, the backend skips the Postgres query entirely, reducing database load under
read-heavy traffic. It holds nothing durable, so unlike Postgres it runs as a plain
`Deployment` — no PVC, no backup strategy needed; if the pod restarts, the cache is just empty
for a few seconds until it refills.

## Prerequisites

- Namespace created ([05](05-kubernetes-deployments-and-services.md))

## Commands

```bash
kubectl apply -f infra/k8s/04-redis.yaml                                  # 1
kubectl rollout status deployment/redis -n estateflow-staging             # 2
kubectl exec -it deploy/redis -n estateflow-staging -- redis-cli ping     # 3
```

## Explanation of each command

1. Creates the Redis Deployment and its `ClusterIP` Service.
2. Confirms the pod is ready.
3. Confirms Redis itself is actually answering, not just that the pod is `Running`.

## Expected results

```
deployment "redis" successfully rolled out
PONG
```

## Verify

```bash
kubectl exec -it deploy/backend -n estateflow-staging -- sh -c 'wget -qO- http://localhost:5000/api/health'
# {"status":"ok","db":"up","redis":"up"}

# Observe the cache actually working, from outside the cluster, once the Ingress is up:
curl -s -D - -o /dev/null "http://<ALB_DNS>/api/properties" | grep -i x-cache   # MISS
curl -s -D - -o /dev/null "http://<ALB_DNS>/api/properties" | grep -i x-cache   # HIT
```

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `redis: "down"` in `/api/health` | Wrong `REDIS_URL` in the ConfigMap, or Redis pod not ready | See [08 · Redis connection failures](../04-runbooks/08-redis-connection-failures.md) |
| Cache never shows `HIT` | Hitting slightly different URLs (different cache key), or outside the TTL window (30s list / 60s item) | Repeat the exact same request within the TTL |

## Troubleshooting

`kubectl logs deploy/redis -n estateflow-staging` — Redis logs are usually quiet unless it's
out of memory or crash-looping; check `kubectl describe pod` for OOMKilled events if so.

## Rollback

```bash
kubectl rollout undo deployment/redis -n estateflow-staging
```
Safe at any time — Redis holds no durable state to lose.

## Completion checklist

- [ ] `redis-cli ping` returns `PONG`
- [ ] `/api/health` reports `redis: up`
- [ ] Observed an `X-Cache: MISS` followed by `X-Cache: HIT` on a repeated request
