# 06 · Docker Image Failures

**Prerequisites:** [14-incident-simulations/01](../14-incident-simulations/student/01-imagepullbackoff.md)
**Next step:** [07 · Kubernetes incident response](07-kubernetes-incident-response.md)

> Labeled training/lab work — see [README](README.md)'s honesty rule.

## Interview question
"Describe a time a bad container image caused a deployment problem."

## Situation
During a training incident exercise, a Deployment update referenced a container image tag
that had never actually been built or pushed.

## Task
Diagnose why new pods wouldn't start, and recover without guessing at a replacement tag from
memory.

## Action
`kubectl get pods` showed new pods in `ImagePullBackOff`. I read the pod's `describe` Events,
which gave the exact error — the registry couldn't find that tag. I confirmed via
`aws ecr describe-images` which tags actually existed. Rather than trying to remember or
guess the "right" previous tag, I used `kubectl rollout undo`, which reverts to the
Deployment's last recorded, already-known-good revision automatically.

## Result
The Deployment rolled back successfully within minutes, old pods having continued serving
throughout since the rollout strategy didn't remove them until replacements were ready —
meaning actual impact in this exercise was zero, a detail worth noting rather than
overstating the severity.

## Follow-up technical questions
- "Why use `rollout undo` instead of manually setting the image back?"
- "What would you do differently if `maxUnavailable` had been set to 100%?"
- "How would you prevent this from reaching a real deploy pipeline?"

## Strong sample answers
- Kubernetes keeps a revision history with the exact previous pod spec recorded — `rollout
  undo` restores it exactly, removing any chance of misremembering the correct tag.
- With `maxUnavailable: 100%`, all old pods could be removed before new ones are confirmed
  healthy, turning this into a real outage instead of a non-event — worth explicitly
  checking rollout strategy settings, not just assuming safe defaults.
- A CI/CD pipeline that only ever references a tag it just verified was successfully pushed
  (rather than a human manually typing a tag) removes this entire failure class.

## Common mistakes
Describing the fix as "I just redeployed the right image" without mentioning *how* you knew
which tag was correct — the specific mechanism (`rollout undo`'s revision history) is the
actual technical point being tested.

## 60-second version
"In a training exercise, a deploy referenced an image tag that was never pushed. New pods
went into ImagePullBackOff while old pods kept serving. I confirmed the exact cause via
`kubectl describe pod` and `aws ecr describe-images`, then used `kubectl rollout undo` to
revert to the last known-good revision rather than guessing at a tag — recovered within
minutes with zero actual impact."

## 2-3 minute version
Add: the distinction between this being a non-event because of the rollout strategy vs. a
real outage under a different strategy, and what pipeline change would prevent a human from
ever typing a bad tag manually in the first place.
