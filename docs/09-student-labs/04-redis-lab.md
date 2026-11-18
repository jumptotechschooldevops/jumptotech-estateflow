# 04 · Redis Lab

**Prerequisites:** [02-deployment-guides/07 · Redis](../02-deployment-guides/07-redis.md)
**Next step:** [05 · S3 + IAM lab](05-s3-and-iam-lab.md)

## Guided lab

Deploy Redis per [02-deployment-guides/07](../02-deployment-guides/07-redis.md), then observe
the `X-Cache` header flip from `MISS` to `HIT` on a repeated `GET /api/properties`.

## Independent practice assignment

Without re-reading the guide: make a property write (POST/PUT/DELETE), then confirm the very
next `GET /api/properties` shows `MISS` again (proving cache invalidation actually happened,
not just that the TTL expired coincidentally).

## Controlled failure scenario

```bash
kubectl scale deployment/redis -n estateflow-staging --replicas=0
```

## Troubleshooting exercise

Predict what `/api/health` and `GET /api/properties` will do before checking. (Expected:
`/api/health` reports `redis: down`; `GET /api/properties` still succeeds, every response
shows `MISS`, and it hits Postgres on every request — the app degrades gracefully rather than
failing, per `backend/src/redisClient.js`'s error handling.)

## Expected outcome

Confirmed both: Redis being down doesn't break reads/writes, and scaling it back to 1 restores
caching behavior without any other action needed.

## Verification checklist

- [ ] Observed a genuine `HIT` after a `MISS`
- [ ] Confirmed a write invalidates the cache (next read is `MISS` again)
- [ ] Confirmed the app survives Redis being fully down, with correct `/api/health` reporting

## Interview questions

1. **What is "cache-aside" and how does this project implement it?**
2. **Why does `backend/src/redisClient.js` catch and log Redis errors instead of letting them
   crash the request?**
3. **What would happen if the property list's cache TTL (30s) were longer than the image
   presigned URL TTL (5 min)? Why doesn't that happen here?**

## Sample answers

1. Cache-aside means the application code manages the cache directly: check cache → on miss,
   query the real source → populate the cache → return. `backend/src/routes/properties.js`
   does exactly this in `router.get('/')`, using `getCache`/`setCache` from `redisClient.js`.
2. Because Redis is a performance optimization, not a dependency the app can't function
   without — treating a Redis failure as fatal would turn a cache outage into a full
   application outage, which is strictly worse than just running slightly slower.
3. That scenario is backwards from this project's actual design: the cache TTL (30s) is
   *shorter* than the presigned URL TTL (5 min) in the sense that matters — but more
   importantly, presigned URLs are deliberately generated *outside* the cached payload
   entirely (see `attachImages()` in `properties.js`), so they're never subject to the
   property-list cache's TTL at all, avoiding the whole class of "serving an expired URL from
   cache" bug.
