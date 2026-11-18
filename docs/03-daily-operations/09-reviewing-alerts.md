# 09 · Reviewing Alerts

**Prerequisites:** none
**Next step:** [10 · Checking CI/CD pipeline failures](10-checking-cicd-pipeline-failures.md)

## Objective

Start your shift by seeing anything that already fired, instead of only finding out when a
user reports it.

## Important — current state of alerting in this project

**This teaching project does not yet have Prometheus, Grafana, or CloudWatch alarms
configured.** Do not assume they exist just because this doc exists. See
[`08-monitoring-and-observability/README.md`](../08-monitoring-and-observability/README.md)
for the exact, honest breakdown of what's implemented vs. proposed. Until real alerting
exists, this task is a manual substitute:

## Commands (manual substitute for alerting)

```bash
kubectl get events -n estateflow-staging --sort-by=.lastTimestamp | tail -30
gh run list --workflow=ci.yml --limit 5
gh run list --workflow=deploy.yml --limit 5
```

## Expected results

No `Warning`-type events in the last several hours beyond routine scaling/rollout events; the
last few CI/CD runs show `success`, not `failure`.

## If something looks wrong

| Symptom | Go to |
|---|---|
| Repeated `Warning` events of the same kind | Match the event's `Reason` field against [`04-runbooks/README.md`](../04-runbooks/README.md) |
| A `failure` run in GitHub Actions | [10 · Checking CI/CD pipeline failures](10-checking-cicd-pipeline-failures.md) |

## If this becomes a real incident

Follow [`05-incident-management/README.md`](../05-incident-management/README.md) — don't try
to resolve something that's actively affecting users entirely on your own, silently.

## Checklist

- [ ] Checked for unusual Kubernetes events
- [ ] Checked recent CI/CD run history
- [ ] Confirmed with the team what real alerting (if any) exists for the environment you're responsible for
