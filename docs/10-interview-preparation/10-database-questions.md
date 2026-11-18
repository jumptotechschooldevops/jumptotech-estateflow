# 10 · Database Questions

**Prerequisites:** [09 · Networking questions](09-networking-questions.md)
**Next step:** [11 · Monitoring and incident response questions](11-monitoring-and-incident-response-questions.md)

**Q: Why is `property_images` a separate table with a foreign key, rather than an array
column on `properties`?**
A: A separate table with `ON DELETE CASCADE` supports an unbounded number of images per
property cleanly, keeps each image's own metadata (content type, size, created_at) properly
typed instead of packed into an array, and lets you index/query images independently (e.g.
"all images for property X") without unpacking an array column.

**Q: Why does `002_add_property_images.sql` only use `CREATE TABLE IF NOT EXISTS`, never
`DROP` or destructive statements?**
A: Migrations here are additive-only by design, so re-running them against an
already-initialized database is always a safe no-op, and rolling back the *application* code
to a previous version never breaks against a newer, additive-only schema. A genuinely
destructive schema change would need its own separate, carefully reviewed rollback plan — see
[02-deployment-guides/15 · Rollback and recovery](../02-deployment-guides/15-rollback-and-recovery.md).

**Q: What does `ON DELETE CASCADE` do on the `property_images.property_id` foreign key, and
why is it appropriate here?**
A: When a `properties` row is deleted, every `property_images` row referencing it is
automatically deleted too — appropriate because an orphaned image-metadata row (pointing at a
property that no longer exists) would be meaningless. The backend additionally deletes the
matching S3 *objects* explicitly in the same request handler, since the database cascade
doesn't know anything about S3.

**Q: Why is Postgres run as a StatefulSet with its own PVC, instead of, say, Amazon RDS?**
A: This is a deliberate teaching choice — running Postgres in-cluster teaches StatefulSets,
PVCs, and EBS directly. For a real production system, a managed service like RDS (automated
backups, patching, Multi-AZ failover) would usually be preferred over operating Postgres
yourself inside Kubernetes, unless there's a specific reason not to use a managed database.

**Q: What's the actual effect of the Redis cache-aside layer on the database, measured
concretely?**
A: Every cached read (within the 30s list / 60s item TTL window) is a query Postgres never
has to serve at all. Under read-heavy, repeat-request traffic, this can meaningfully cut
database load; it has zero effect on write load, since writes always go to Postgres and then
invalidate the relevant cache keys.
