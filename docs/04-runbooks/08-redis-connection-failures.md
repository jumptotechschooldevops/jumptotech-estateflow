# 08 · Redis Connection Failures

**Related guide:** [07 · Redis](../02-deployment-guides/07-redis.md)

## Symptoms
`/api/health` reports `"redis":"down"`; backend logs show `Redis client error` or `Redis
connection failed`.

## Potential customer impact
**Lower than a Postgres failure** — the backend is designed to degrade gracefully: cache
get/set failures are caught and logged (see `backend/src/redisClient.js`), falling back to
querying Postgres directly. Users see slower responses (no caching benefit) and lose the
`X-Cache` observability signal, but reads and writes still work.

## Detection and alerts
`/api/health` response; backend logs.

## Severity assessment
SEV3/SEV4 under normal circumstances (degraded performance, not an outage) — escalate to
SEV2 only if Postgres is also under elevated load *because* caching stopped working.

## Diagnosis (🔍 read-only)
```bash
kubectl get pods -n estateflow-staging -l app=redis
kubectl exec -it deploy/redis -n estateflow-staging -- redis-cli ping
kubectl exec -n estateflow-staging deploy/backend -- env | grep REDIS_URL
kubectl logs deploy/redis -n estateflow-staging
```

## How to interpret the output
`PONG` failing or timing out confirms Redis itself is the problem, not just the backend's
connection to it. Check `kubectl describe pod` for `OOMKilled` if Redis crashed —  it has a
small memory limit (`infra/k8s/04-redis.yaml`) by design, since it holds only a short-TTL
cache.

## Possible causes
- Redis pod restarted/crashed (cache is simply empty afterward — not an error by itself)
- Wrong `REDIS_URL` in the ConfigMap
- Redis OOMKilled under unexpectedly large cached payloads

## Safe mitigation steps (⚠️ changes infrastructure)
```bash
kubectl rollout restart deployment/redis -n estateflow-staging
```
Safe at any time — Redis holds no durable state, so restarting it has no data-loss risk,
unlike Postgres.

## Escalation criteria
Rarely needs escalation on its own, given the graceful degradation — escalate only if
Postgres load is climbing dangerously as a side effect (check
[05 · Monitoring CPU and memory](../03-daily-operations/05-monitoring-cpu-and-memory.md)
against the database).

## Recovery verification
```bash
curl -s "http://<ALB_DNS>/api/health"   # "redis":"up"
curl -s -D - -o /dev/null "http://<ALB_DNS>/api/properties" | grep -i x-cache   # MISS then HIT
```

## Prevention recommendations
Keep Redis's memory limit sized to the actual cached payload volume; monitor for repeated
OOMKills rather than just restarting repeatedly without investigating.
