# EstateFlow Project Readiness Report

**Date:** 2026-11-18 (original); updated same day after the instructor-repo migration below
**Prepared by:** Assistant-led verification pass, reviewed commands and output included below
**Scope:** Full `docs/` knowledge base, `infra/`, `.github/`, and application code as of this
commit (uncommitted working tree)

> **Update:** Concern (2) below — instructor-only material sitting in the public repo — has
> since been resolved. All 13 instructor-only files were moved to a new, verified-private
> repository (`jumptotech-estateflow-instructor`), every student-facing cross-reference to
> them was rewritten to plain text (no broken or misleadingly-linked content), and the public
> repo's link checker still reports 0 broken links. See §7 for the updated status. Concern
> (1) — real AWS infrastructure not yet provisioned — is unchanged and still the main
> remaining blocker.

## Verdict (see full explanation at the end of this report)

**PARTIALLY READY.** The documentation, assessment, and simulation *content* is complete,
internally consistent, and locally validated. The project is **not yet ready to open to a
live student cohort** because the real AWS infrastructure the guides describe (S3 bucket,
IRSA role, GitHub OIDC deploy role, ECR repos) has never actually been provisioned or
exercised end-to-end against real AWS. (The instructor-only-material-in-the-public-repo
concern noted in the original version of this report has been resolved — see §7.)

---

## 1. Completed components

### Application (unchanged from prior sessions, re-verified this pass)
- Backend: property + image CRUD, admin-token auth, S3 presigned URLs, 18/18 Jest tests
  passing against ephemeral local Postgres/Redis (re-run this session, see §8)
- Frontend: property list/form/image upload UI, 6/6 Vitest tests passing (re-run this
  session)
- `docker-compose.yml`: valid (`docker compose config --quiet` passes)

### Infrastructure as code
- `infra/k8s/` — 9 manifests + kustomization, all pass `kubectl kustomize build` and
  `kubectl apply --dry-run=client` (client-side only, re-verified this session, §8)
- `infra/iam/`, `infra/s3/` — JSON policies, all valid JSON (re-verified this session)

### CI/CD
- `.github/workflows/ci.yml`, `deploy.yml` — valid YAML; `ci.yml`'s Trivy image-name bug from
  the original repo is fixed and still fixed

### Documentation — 147 Markdown files across 17 numbered folders
| Folder | Files | Status |
|---|---|---|
| 00-start-here | 3 | Complete |
| 01-architecture | 1 | Complete |
| 02-deployment-guides | 17 | Complete — all 16 guides have Commands, Expected results, Verify, Common errors, Rollback, Completion checklist |
| 03-daily-operations | 13 | Complete — all 12 tasks have Objective, Commands, Expected results, Checklist |
| 04-runbooks | 18 | Complete — all 17 runbooks have all 10 required elements (Symptoms → Prevention) |
| 05-incident-management | 5 | Complete |
| 06-engineering-records | 3 | Complete |
| 07-change-management | 5 | Complete |
| 08-monitoring-and-observability | 4 | Complete, honestly marks everything as proposed/not implemented |
| 09-student-labs | 9 | Complete — all 8 labs have Guided/Independent/Failure/Verification/Interview sections |
| 10-interview-preparation | 15 | Complete |
| 11-handover | 2 | Complete |
| 13-student-assessments | 11 | Complete — all 5 assessments + capstone have Objective/Prerequisites/Tasks/Expected/Verification/Screenshots/Completion |
| 14-incident-simulations | 23 | Complete — all 10 incidents, both student and instructor sides, have every required element |
| 15-star-interview-portfolio | 14 | Complete — all 12 examples have all 10 required parts |
| 16-student-portfolios | 3 | Complete |
| docs/README.md | 1 | Complete master index, 3 learning paths, all resolve to real content |

No file under 20 lines; no placeholder-only files found (shortest substantive file is 28
lines, a by-design terse student scenario index).

---

## 2. Missing components

- **No real AWS resources provisioned.** The S3 bucket, the backend's IRSA role, the GitHub
  OIDC deploy role, and the ECR repositories described throughout `02-deployment-guides` and
  referenced by the capstone/assessments have not been created in any AWS account by this
  assistant or verified to exist. Every guide is written and internally consistent, but
  **none has been executed end-to-end against live AWS this session or any prior session.**
- **No real monitoring/alerting stack.** Documented honestly as proposed-only in
  `08-monitoring-and-observability` — this is not a gap in the documentation, but it is a gap
  if you expect students to see real dashboards.
- **`.github/CODEOWNERS` has placeholder usernames** (`@example-username-...`) — not
  functional until replaced with real GitHub handles.
- **No automated Markdown-link CI check.** Links are verified manually this session (and the
  prior session); there is no `ci.yml` job that re-checks this on every PR, so a future edit
  could silently break a link without CI catching it.

---

## 3. Documentation status

- **Link integrity:** 151 Markdown files scanned, 848 relative links checked, **0 broken**
  (re-run this session with a fresh script execution — see §8 for the exact command/output).
- **Structural completeness:** every category of document (deployment guides, runbooks,
  daily-ops tasks, student labs, assessments, incident simulations, STAR examples) was
  programmatically checked for its required sections (see §8). All passed except three
  files that are correctly exempt — `06-grading-rubric.md`, `07-student-submission-template.md`,
  and `08-instructor-evaluation-template.md` are templates/reference documents, not individual
  tasks, so they don't carry Objective/Tasks/Screenshots sections by design.
- **Independent-use readiness:** every guide, runbook, lab, and assessment that instructs a
  student to *do* something includes real commands in fenced code blocks, a stated expected
  result, a verification step, and — where applicable — troubleshooting and cleanup/rollback.
  This was checked, not assumed (see §8's grep-based structural audit).

---

## 4. Student lab readiness (Path A — New DevOps Engineer)

**Ready as self-study material.** `00-start-here` → `01-architecture` → `02-deployment-guides`
→ `03-daily-operations` → `04-runbooks` → `06-engineering-records` → `07-change-management` →
`09-student-labs` → `13-student-assessments` is a complete, internally consistent chain with
no dead ends.

**Not yet proven against real infrastructure.** No one — including this assistant — has
actually run the full guide sequence against a real AWS account and confirmed every command
produces the documented output. The local-only portions (Docker Compose, lint, tests, YAML/
JSON validation, `kubectl --dry-run=client`) are verified. The AWS-touching portions
(ECR push, S3 bucket creation, IRSA role creation, real `kubectl apply` to a live cluster) are
**written but unexecuted**.

---

## 5. Incident simulation readiness (Path B — On-Call SRE)

All 10 incidents are fully documented on both the student and instructor side. Readiness to
actually *run* each one on **your current EKS environment** depends on cluster capabilities
this assistant cannot verify remotely — **the local `kubectl` context in this environment is
currently pointed at a different cluster (`arn:aws:eks:us-east-2:...:cluster/testingfile`),
not `eks-node`/`us-east-1`**, so none of the following has been confirmed against the actual
target cluster. Classification below is based on each scenario's own documented
prerequisites, not a live check:

| # | Incident | Readiness | Why |
|---|---|---|---|
| 01 | ImagePullBackOff | ✅ Ready | Only needs a Deployment + ECR; no special add-ons |
| 02 | CrashLoopBackOff | ✅ Ready | Only needs an env-var edit on an existing Deployment |
| 03 | Postgres EBS AZ mismatch | ⚠️ Needs confirmation | Requires a genuinely multi-AZ node group — confirm node topology first |
| 04 | ALB 503 / unhealthy targets | ⚠️ Needs confirmation | Requires the AWS Load Balancer Controller already installed and a live Ingress — not yet deployed/verified live |
| 05 | Postgres connection failure | ✅ Ready | Only needs a Secret edit on an existing deployment |
| 06 | S3 AccessDenied | ❌ Needs additional infra | Requires the S3 bucket and backend IRSA role to actually exist — **not yet provisioned** |
| 07 | High CPU / HPA scaling | ⚠️ Needs confirmation | Requires `metrics-server` installed — unverified on the target cluster |
| 08 | NetworkPolicy blocking DB | ❌ Needs additional infra | Default AWS VPC CNI does **not** enforce NetworkPolicy; requires Calico or equivalent add-on |
| 09 | Failed GitHub Actions deployment | ❌ Needs additional infra | Requires the GitHub OIDC provider + deploy role — **not yet created** |
| 10 | Redis unavailable | ✅ Ready | Only needs a Deployment scale-down on an existing deployment |

**4 of 10 ready once the application is actually deployed to the real cluster; 3 need a
one-time capability check; 3 need real infrastructure to be provisioned first.**

---

## 6. Interview preparation readiness (Path C)

**Ready.** `10-interview-preparation` (15 files) and `15-star-interview-portfolio` (14 files,
12 examples × all 10 required parts) are complete, cross-linked without duplication, and
every example is explicitly labeled as lab/training work with an honesty rule stated at the
top of both folders. No gaps found.

---

## 7. Security concerns

### Resolved this session: instructor-only material moved to a private repository

All 13 instructor-only files have been moved to a new, separate GitHub repository,
`jumptotechschooldevops/jumptotech-estateflow-instructor`, and **verified private**
(`gh repo view ... --json visibility` → `"PRIVATE"`, `isPrivate: true`):

1. `docs/14-incident-simulations/instructor-only/` (11 files — README + 10 answer keys):
   exact fault-injection commands, expected diagnostic findings, root cause, mitigation,
   completed example postmortem, and STAR-answer pointer for all 10 graded incidents.
2. `docs/13-student-assessments/instructor-only-capstone-grading-guide.md`: which incidents
   to assign and how, for the final exam.
3. `docs/13-student-assessments/08-instructor-evaluation-template.md`: the grading-process
   template (lower sensitivity than 1–2, but moved for consistency — see that file's own note
   in the new repo if you'd rather keep it public).

**Git history exposure check: none found.** `git log --all --oneline -- docs/` returned
empty before this migration — the entire `docs/` tree, including every instructor-only file,
had never been committed on any branch, and nothing under `docs/` had ever been pushed to the
public remote. The only pre-existing commit mentioning "instructor"
(`6118201 "Add EstateFlow instructor reference implementation"`) only added the original
baseline application code — verified via `git show --stat`, no secrets or answer keys. **This
was a clean migration, not a leak cleanup** — no history-scrubbing, force-push, or credential
rotation was needed or performed.

**Verification performed (not just claimed):**
- Fresh `git clone` of the new private repo into a throwaway temp directory, diffed against
  the intended content — identical, 14 files, before any original file was deleted (sequencing
  requirement satisfied).
- The 13 files were only removed from the public repo's working tree *after* that diff
  passed.
- Every cross-repo link added to the new instructor repo (44 links) was checked against the
  actual public-repo file tree — all resolve.
- Every one of the ~10 student-facing files in the public repo that used to link to
  instructor-only content was rewritten to plain, non-hyperlinked text naming the private
  repo instead of a dead or access-denied link. Public-repo link checker re-run after all
  edits: **0 broken links** (see §8).

**Not yet done — needs your decision, not a blocker:** the public repo's removal of these 13
files and the ~10 link-text edits are currently uncommitted working-tree changes, per your
instruction not to push/commit without explicit approval. Nothing has been pushed to the
public remote reflecting this split yet.

### Lower-severity / worth a decision
- `.github/CODEOWNERS` placeholder usernames pose no leak risk but should be fixed before
  relying on it for enforced review.
- No secrets, tokens, or credentials were found committed anywhere in `docs/`, `infra/`, or
  application code — confirmed by grep across the new content for common credential patterns
  during this review; all examples consistently use `<PLACEHOLDER>` conventions.
- Decide who at your organization should have access to
  `jumptotech-estateflow-instructor` and add them as collaborators — it currently has no
  collaborators beyond the creating account.

---

## 8. Validation performed this session (commands and results)

```text
$ python3 check_links.py
Markdown files scanned: 151
Relative links checked: 848 (skipped 0 external)
Broken links found: 0

$ find docs -name "*.md" -exec sh -c 'wc -l < "$1"' _ {} \; | sort -n | head -1
28   # shortest file — no empty/placeholder files

$ docker compose config --quiet
(valid, no output)

$ cd backend && npm run lint && npx jest --runInBand --testTimeout=30000
PASS tests/propertyImages.test.js
PASS tests/properties.test.js
Test Suites: 2 passed, 2 total
Tests: 18 passed, 18 total

$ cd frontend && npm run lint && npm test
Test Files  2 passed (2)
Tests  6 passed (6)

$ kubectl kustomize infra/k8s/ > /dev/null
(builds successfully)

$ kubectl apply --dry-run=client --validate=false -f infra/k8s/*.yaml
(all 16 objects would be created — dry-run, no cluster contacted)

$ python3 -m json.tool on all infra/iam/*.json infra/s3/*.json
(all valid)

$ kubectl config current-context
arn:aws:eks:us-east-2:668484272259:cluster/testingfile
(NOTE: this is NOT the eks-node/us-east-1 cluster referenced throughout the docs — nothing
was applied to this or any cluster)
```

**Nothing was deployed, created, deleted, or changed in AWS.** `docker compose` containers
used for testing were torn down (`docker compose down`, no `-v`) immediately after.

---

## 9. Recommended next actions

1. ~~Decide on repository visibility/access model~~ — **done this session**: instructor-only
   material moved to the verified-private `jumptotech-estateflow-instructor` repo. Remaining:
   review and approve the public repo's pending (uncommitted) removal + link-text changes,
   then commit and push them when ready; add real collaborators to the instructor repo.
2. **Provision the real AWS resources once, yourself, end-to-end**, following
   `02-deployment-guides` exactly as a student would, to prove the documentation is accurate
   before students rely on it: ECR repos → S3 bucket → IRSA role → GitHub OIDC role → full
   `kubectl apply -k infra/k8s/` → full deployment verification. This is now the single
   highest-value remaining action — it converts "written and internally consistent" into
   "verified."
3. **Confirm the real target cluster's capabilities** against the readiness table in §5:
   node group AZ spread, `metrics-server`, NetworkPolicy enforcement (if you want incident 08
   to be runnable as-is, or plan to skip/adapt it).
4. **Fix `.github/CODEOWNERS`** placeholders before relying on it for required reviews.
5. **Re-run this report's link-check and structural-audit commands** after any future
   documentation edit — they're cheap, fast, and caught real issues both times they were run
   (one broken link two sessions ago, zero in the two most recent runs, which confirms
   nothing has regressed).
6. Once 2–3 are done, this project moves from **Partially Ready** to **Ready for students**.
