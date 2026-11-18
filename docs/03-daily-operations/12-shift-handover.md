# 12 · Shift Handover

**Prerequisites:** all other daily-operations checks, ideally run earlier in your shift
**Next step:** none — end of the daily-operations sequence. Full handover template:
[`11-handover`](../11-handover/README.md)

## Objective

Make sure the next engineer starts their shift with the same picture of reality you have —
not rediscovering problems you already knew about.

## Commands (gathering what to report)

```bash
kubectl get pods -n estateflow-staging | grep -v Running
kubectl rollout history deployment/backend -n estateflow-staging | tail -5
gh run list --limit 5
```

## What to actually hand over

Use the full template at
[`11-handover/01-sample-handover-document.md`](../11-handover/01-sample-handover-document.md)
— at minimum, state clearly:
1. Anything not fully healthy right now, even if it seems minor
2. Any change you made this shift (deploy, scale, config edit)
3. Any open incident and its current status
4. Anything you expected to happen but haven't verified yet

## Expected results

The next engineer can read your handover and know, without asking you, whether it's safe to
assume "everything is fine" or whether something needs continued attention.

## If something looks wrong

If there's an unresolved incident, use
[`05-incident-management/README.md`](../05-incident-management/README.md)'s handover section,
not just this daily note — incidents need the fuller context (severity, timeline, current
mitigation).

## Checklist

- [ ] Pod/deployment/CI state summarized
- [ ] Any changes made this shift documented (see
      [`06-engineering-records`](../06-engineering-records/README.md))
- [ ] Open incidents, if any, explicitly called out with current status
- [ ] Handover written down somewhere the next engineer will actually see it (not just said verbally)
