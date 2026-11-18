# 03 · Postgres + EBS Lab

**Prerequisites:** [02 · Kubernetes lab](02-kubernetes-lab.md), [02-deployment-guides/06](../02-deployment-guides/06-postgresql-pvc-and-ebs.md)
**Next step:** [04 · Redis lab](04-redis-lab.md)

## Guided lab

Follow [02-deployment-guides/06](../02-deployment-guides/06-postgresql-pvc-and-ebs.md) through
to a `Bound` PVC and a successful `\dt` listing both tables.

## Independent practice assignment

Without re-reading the guide: `pg_dump` the database to a local file, then confirm the dump
file contains the `INSERT` statements for the seeded properties.

## Controlled failure scenario

Delete the `postgres-0` pod directly (not the StatefulSet): `kubectl delete pod postgres-0 -n
estateflow-staging`.

## Troubleshooting exercise

Before checking: predict whether this causes data loss, then verify your prediction.
(Expected: no data loss — the StatefulSet immediately recreates the pod, which re-attaches to
the *same* PVC/EBS volume; only the container restarted, the data never moved.)

## Expected outcome

Pod recreated automatically within seconds; `psql \dt` and a row count query show the data is
unchanged.

## Verification checklist

- [ ] Successfully took a `pg_dump` backup
- [ ] Predicted correctly (or corrected your understanding) of what pod deletion does to data
- [ ] Confirmed via a real query that no data was lost

## Interview questions

1. **Why does deleting a StatefulSet's pod not delete its data, while deleting its PVC
   does?**
2. **What problem does the EBS CSI driver solve that didn't exist before CSI (Container
   Storage Interface) drivers?**
3. **Why does this project's Postgres manifest set `PGDATA` to a subdirectory
   (`/var/lib/postgresql/data/pgdata`) instead of the volume's mount root?**

## Sample answers

1. The pod is just a running process; the PVC is the actual claim on durable storage. A
   StatefulSet's `volumeClaimTemplate` creates one PVC per pod *identity* (e.g.
   `data-postgres-0`), and that PVC survives pod deletion/recreation by design — only
   explicitly deleting the PVC itself removes the underlying volume.
2. Before CSI, each cloud provider's storage integration was built directly into Kubernetes
   core, making the codebase unwieldy and coupling Kubernetes releases to every cloud's
   storage API changes. CSI is a standard plugin interface — AWS (and every other provider)
   ships its own driver that implements it, decoupled from core Kubernetes.
3. Some storage backends (and EBS historically) place a `lost+found` directory at a volume's
   mount root; Postgres's own initialization can fail or behave oddly if its data directory
   isn't completely empty. Using a subdirectory avoids that conflict.
