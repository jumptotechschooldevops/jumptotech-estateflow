# 02 · Portfolio Examples and Tips

**Prerequisites:** [01 · Portfolio README template](01-portfolio-readme-template.md)
**Next step:** none — last file in the documentation set. Return to
[docs/README.md](../README.md) for the full index.

## A strong entry vs. a weak one

**Weak:** "Deployed the backend to EKS. It worked."

**Strong:** "Deployed the backend Deployment to `estateflow-staging` on 2026-11-18. Ran into
an `ImagePullBackOff` because I'd referenced the wrong ECR registry URL — fixed by correcting
the `<ECR_REGISTRY>` placeholder in `infra/k8s/05-backend.yaml`, redeployed, verified via
`kubectl rollout status` and a passing `/api/health` check. *(Execution record → link to your own evidence here)*"

The difference is specificity and evidence — a real mistake and fix is more convincing than a
clean, vague success story, because it's checkable and it's how real work actually goes.

## Tips

- **Update as you go, not in one retroactive batch.** A portfolio built up incrementally
  reads as more credible than one written all at once right before an interview — and it's
  genuinely more accurate, since details fade from memory fast.
- **Link, don't just describe.** Every claim in your portfolio should link to real evidence —
  an execution record, a screenshot, a PR, an incident report.
- **Keep instructor-only answer keys out of your portfolio.** If you completed an incident
  simulation, your portfolio entry should reflect your own investigation and findings — not
  copy the answer key's wording (the answer keys live in the private
  `jumptotech-estateflow-instructor` repository — you shouldn't have access to them as a
  student in the first place).
- **Be honest about what didn't work the first time.** Instructors and interviewers both
  value "here's a mistake I made and how I caught it" far more than a portfolio that implies
  everything went perfectly on the first attempt — see
  [06-engineering-records/02](../06-engineering-records/02-worked-example-execution-record.md)'s
  worked example for exactly this pattern.
- **Keep it current.** Remove or clearly date older entries as your skills grow — a
  portfolio is a living document, not an archive you finish once.
