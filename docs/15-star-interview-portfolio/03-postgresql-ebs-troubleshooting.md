# 03 · PostgreSQL and EBS Troubleshooting

**Prerequisites:** [04-runbooks/06-07](../04-runbooks/06-ebs-az-mismatch.md)
**Next step:** [04 · S3 integration and IAM permissions](04-s3-iam-integration.md)

> Labeled training/lab work — see [README](README.md)'s honesty rule. This story is based on
> [14-incident-simulations' EBS AZ mismatch and connection-failure exercises](../14-incident-simulations/README.md).

## Interview question
"Tell me about a database availability issue you diagnosed."

## Situation
During a training incident exercise, a Postgres pod's PersistentVolumeClaim showed `Bound`,
but the pod itself stayed `Pending` indefinitely — the database was fully inaccessible.

## Task
Diagnose why a seemingly healthy, bound volume still couldn't be used, without jumping to a
destructive fix (like recreating the PVC) before understanding the actual cause.

## Action
I started with `kubectl describe pod`, which showed a specific Events message: "volume node
affinity conflict." That told me this wasn't a missing-StorageClass problem (which would show
a different symptom) — it was that the EBS volume was physically located in one
Availability Zone, and no currently-schedulable node existed in that same zone. I confirmed
this by checking the PV's `nodeAffinity` against `kubectl get nodes`'s zone labels. Rather
than deleting and recreating the PVC (which would have meant data loss), I identified that
restoring node capacity in the correct AZ was the safe fix.

## Result
Once a node existed in the volume's AZ again, the pod scheduled immediately and reconnected
to its existing data with zero data loss — confirmed via a row-count query matching what was
expected before the incident.

## Follow-up technical questions
- "Why can't an EBS volume attach across Availability Zones?"
- "What would you have done if restoring a node in that AZ wasn't an option?"
- "How is this different from a plain 'PVC stuck Pending' problem?"

## Strong sample answers
- EBS volumes are physically located in one AZ — the storage hardware itself doesn't span
  zones, so a node in a different AZ simply cannot attach to it.
- I'd escalate rather than unilaterally recreate the PVC — that's a data-loss decision that
  needs a second person's sign-off, and only after confirming a verified backup exists.
- A plain PVC-Pending case means the volume was never provisioned at all (often a missing
  StorageClass); this case had a volume that existed and was bound, just unreachable from
  any current node — different root cause, different fix.

## Common mistakes
Jumping straight to "delete and recreate the PVC" without recognizing the data-loss risk;
not distinguishing this from a generic "PVC pending" case when asked to compare the two.

## 60-second version
"In a training exercise, a Postgres PVC showed Bound but the pod stayed Pending. The
describe output said 'volume node affinity conflict' — the EBS volume was in an AZ with no
current nodes. I confirmed that by checking the PV's node affinity against the cluster's
node zones, then restored capacity in that zone rather than risking data loss by recreating
the volume. The pod came up immediately once a node existed there, no data lost."

## 2-3 minute version
Add: why you specifically avoided the PVC-recreate shortcut (the data-loss risk and the
"requires sign-off" judgment call), and how you'd prevent this recurring (multi-AZ node
groups with a minimum per-zone node count).
