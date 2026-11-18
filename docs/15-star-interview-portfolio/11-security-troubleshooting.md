# 11 · Security Troubleshooting

**Prerequisites:** [10-interview-preparation/08](../10-interview-preparation/08-iam-and-security-questions.md)
**Next step:** [12 · Infrastructure automation](12-infrastructure-automation.md)

> Labeled training/lab work — see [README](README.md)'s honesty rule.

## Interview question
"Tell me about a time you found or fixed a security weakness in an application or its
infrastructure."

## Situation
While reviewing an application's auth comparison logic, I noticed it compared a submitted
token against the expected value using a plain string comparison.

## Task
Determine whether this was a real vulnerability and fix it appropriately, without
overcorrecting into something heavier than the risk warranted.

## Action
A naive `===` string comparison can leak information about how many leading characters
matched via tiny response-timing differences — a timing side-channel. I replaced it with a
constant-time comparison (`crypto.timingSafeEqual`), which always takes the same time
regardless of how much of the input matches. I also reviewed the surrounding container
security posture at the same time: confirmed the backend ran with `readOnlyRootFilesystem`
and all Linux capabilities dropped, so even if some other vulnerability allowed code
execution, the blast radius stayed limited.

## Result
Closed a real (if narrow-impact, given the overall threat model of a lab environment)
timing side-channel, and confirmed defense-in-depth was already correctly layered elsewhere
rather than assuming one fix made the whole system secure.

## Follow-up technical questions
- "How practical is a timing side-channel attack over a real network, with typical jitter?"
- "What's the difference between fixing this and relying only on HTTPS?"
- "What else would you check in a broader security review of this auth mechanism?"

## Strong sample answers
- Realistically harder over a noisy network than in a lab benchmark, but it's a well-known,
  cheap-to-fix class of bug — there's no good reason to leave it in once you've noticed it,
  regardless of how practical an actual exploit would be today.
- HTTPS protects the token in transit; it does nothing about a timing leak in how the
  *server* compares the token after receiving it — they address completely different threats.
- I'd flag that this project uses one shared token for all write access rather than per-user
  credentials — a reasonable scope decision for a training lab, but the single biggest
  security gap if this were heading toward real production use.

## Common mistakes
Overstating the severity of a lab-scale finding as if it were a critical production breach;
not being able to explain *why* the fix (constant-time comparison) actually closes the gap,
just that "it's more secure."

## 60-second version
"I noticed an auth check used a plain string comparison for a secret token — a known timing
side-channel. I replaced it with a constant-time comparison, then checked the surrounding
container security posture, confirming defense-in-depth (read-only filesystem, dropped
capabilities) was already correctly layered, rather than assuming one fix covered everything."

## 2-3 minute version
Add: the mechanics of why a timing side-channel exists in a plain comparison, the realistic
exploitability caveat (worth being honest about, not oversold), and the broader security
review you'd recommend next (moving from a shared token to per-user auth).
