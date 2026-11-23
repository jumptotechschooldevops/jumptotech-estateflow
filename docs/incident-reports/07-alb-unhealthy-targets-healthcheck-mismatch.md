# Incident 07 — EstateFlow ALB Backend Targets Unhealthy (Health Check Path Mismatch)

**Project:** JumpToTech EstateFlow — AWS EKS Production Simulation  
**Lab date:** 2026-11-20  
**Environment:** AWS EKS, `us-east-1`, namespace `real-estate-company`  
**Incident type:** ALB target group health-check configuration mismatch  
**Severity:** SEV-3 (provisional lab classification; a real production severity must be assigned from measured customer impact)  
**Status:** Configuration corrected and verified; final target-health recovery must be verified separately  
**Report owner:** SRE / DevOps on-call (training role)

> **Evidence boundary:** This report is based on the lab screenshots and terminal outputs. It is a production-style simulation, not a claim of a real customer-facing outage. Exact incident start/end times, actual customer impact, alert names, and final `healthy` state were not captured. Do not invent them during interviews.

## 1. Executive summary

During the EstateFlow EKS lab, two backend pods were `Running` and `Ready` (`1/1`), and the API endpoint `/api/properties` returned HTTP `200` through the ALB. However, the AWS backend target group showed **2 unhealthy targets**. AWS returned `Target.ResponseCodeMismatch` and reported that health checks failed with HTTP `404`.

The target group was configured to probe `/` on backend port `4000`, while the Express backend exposed a working `/health` endpoint that returned HTTP `200`. We updated the Kubernetes backend Service annotation to request `/health`. AWS Load Balancer Controller reconciled the change, and a subsequent AWS CLI query confirmed that the target group's `HealthCheckPath` became `/health` with an expected status code of `200`. The screenshots do not establish that both targets had already returned to `healthy`; that verification is a required final step.

**Root cause:** ALB health-check path did not match an implemented successful backend endpoint.  
**Contributing factor:** Infrastructure and application health-check contract was not validated together before/after deployment.  
**Not the root cause:** NetworkPolicy, duplicate Ingress resources, crashed pods, or a database failure were not demonstrated as the cause of this specific `404` health-check mismatch.

## 2. Architecture and request paths

```text
Client / browser
    |
    v
DNS -> Internet-facing AWS Application Load Balancer (ALB)
    |
    +-- Listener HTTP :80, path /api/* -> Backend Target Group (IP targets :4000)
    |                                    -> backend pods -> PostgreSQL (when needed)
    |
    +-- Listener HTTP :80, path /*     -> Frontend Target Group (IP targets :80)
                                         -> frontend pods (nginx)

Kubernetes Ingress -> observed by AWS Load Balancer Controller
                   -> controller reconciles ALB listeners, rules, target groups

Independent ALB health check:
ALB -> Backend Target Group -> backend pod IP:4000 -> GET / [404 before]
ALB -> Backend Target Group -> backend pod IP:4000 -> GET /health [200 expected after]
```

**Important:** An Ingress object is configuration, not a separate proxy hop in this ALB architecture. The controller programs the AWS ALB from the Ingress and related Kubernetes resources. Kubernetes Pod readiness and ALB target-group health are separate mechanisms.

## 3. Observed evidence from the lab

| Check | Observed result | Interpretation |
|---|---|---|
| `kubectl get pods -n real-estate-company` | Two backend pods `1/1 Running`; frontend and postgres also running | Pods were not crashing |
| `kubectl get pods -o wide` | Backend IPs `172.31.92.167` and `172.31.85.205` | Matches the registered ALB target IPs |
| `kubectl describe ingress real-estate-ingress` | `/api` -> `backend:4000`; `/` -> `frontend:80`; successfully reconciled | Ingress routing was present |
| AWS Target Group | 2 total, 0 healthy, 2 unhealthy | ALB health checks failing |
| `describe-target-health` | `Target.ResponseCodeMismatch`, `Health checks failed with these codes: [404]` | Backend responded, but not with expected status |
| `describe-target-groups` before fix | `HealthCheckPath=/`, `Matcher=200`, `HealthCheckPort=traffic-port` | ALB probed the wrong path |
| Direct endpoint test | `/` -> `404`; `/health` -> `200`; `/api/health` -> `404`; `/api/properties` -> `200` | `/health` was appropriate for the backend |
| `kubectl annotate service backend ...` | `service/backend annotated` | Kubernetes Service changed |
| `kubectl get svc backend -o yaml` | `alb.ingress.kubernetes.io/healthcheck-path: /health` | Annotation persisted on the Service |
| AWS Target Group after fix | `HealthCheckPath=/health`, `Matcher=200`, `HealthCheckPort=traffic-port` | Controller reconciled the AWS setting |

**Important distinction:** The `200` observed for an API request or a local port-forward does not alone prove the target group is healthy. The final `describe-target-health` output must show `healthy` for each target.

## 4. Detection and incident declaration

**Possible production signals (examples, not claims about this lab):** CloudWatch `UnHealthyHostCount`, elevated ALB 5xx, synthetic API probes, customer reports, or failed deployments.

1. SRE on-call acknowledges the alert and opens an incident channel and ticket.
2. Record incident start time, affected ALB, AWS region, namespace, services, and customer impact.
3. Assign a provisional severity based on actual impact, not solely on `Unhealthy` status.
4. Freeze unrelated production changes while investigating if warranted.
5. Confirm symptoms from the outside, then move layer by layer toward the application.

**Example incident message:**

> SEV-3 investigation opened (provisional): EstateFlow ALB backend target group reports 2/2 unhealthy targets. Kubernetes backend pods are Running. API requests currently return 200 in spot checks, so customer impact is not yet confirmed. We are investigating target health checks, endpoint routing, and recent configuration changes. Next update in 15 minutes.

## 5. Troubleshooting runbook — exact commands

Run commands from an authorized workstation or management EC2 instance with AWS credentials and `kubectl` context pointing at the intended cluster. **Never assume the current context.** Commands below are read-only until the explicitly labeled remediation step.

### Step 0 — Confirm identity, cluster and namespace

```bash
aws sts get-caller-identity
aws configure get region
kubectl config current-context
kubectl get namespaces
```

- `aws sts get-caller-identity`: verifies which AWS account and IAM principal are active.
- `aws configure get region`: displays the CLI default region; commands below explicitly use `us-east-1`.
- `kubectl config current-context`: verifies which cluster the shell will modify/query.
- `kubectl get namespaces`: checks that `real-estate-company` exists.

**Training safety:** This report uses the observed `us-east-1` lab. Do not copy commands into a different student account or cluster without validating identity.

### Step 1 — Establish the external baseline

```bash
export NS=real-estate-company
export AWS_REGION=us-east-1
export INGRESS=real-estate-ingress

export ALB_DNS=$(kubectl get ingress "$INGRESS" -n "$NS" \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

echo "$ALB_DNS"

for path in / /health /api/health /api/properties; do
  curl -sS --connect-timeout 5 --max-time 15 -o /dev/null \
    -w "$path -> HTTP %{http_code}\n" \
    "http://$ALB_DNS$path"
done
```

- `export`: saves values for repeated commands.
- `jsonpath`: extracts the ALB DNS hostname from Kubernetes Ingress status.
- `curl -o /dev/null`: suppresses the response body so logs do not flood the terminal.
- `-w`: prints the HTTP status.
- `--connect-timeout` and `--max-time`: bound the request time.

**Lab evidence:** `/api/properties` returned `200`. The root `/` may serve frontend HTML; the backend health-check path is a separate request directed at backend targets.

### Step 2 — Verify Kubernetes workloads and routing

```bash
kubectl get pods -n "$NS" -o wide
kubectl get deploy,sts,svc,ingress -n "$NS"
kubectl describe ingress "$INGRESS" -n "$NS"
kubectl get ingress "$INGRESS" -n "$NS" -o yaml
kubectl get endpointslices -n "$NS" -l kubernetes.io/service-name=backend
```

- `pods -o wide`: shows pod IPs and nodes; compare backend IPs with AWS targets.
- `deploy,sts,svc,ingress`: inventories the workload and networking resources.
- `describe ingress`: confirms `/api -> backend:4000` and `/ -> frontend:80`, plus reconciliation events.
- `get ingress -o yaml`: captures the actual Kubernetes configuration, including annotations.
- `endpointslices`: checks which backend pod IPs the Service selects.

**Interpretation:** `Running 1/1` does not guarantee the ALB's own health-check request will return 200.

### Step 3 — Inspect the ALB backend target group

The observed target group in this lab was `k8s-realesta-backend-04e5483ddb`. If the controller recreates it, discover the current group instead of assuming this name remains valid.

```bash
export TG_NAME=k8s-realesta-backend-04e5483ddb

export TG_ARN=$(aws elbv2 describe-target-groups \
  --names "$TG_NAME" \
  --region "$AWS_REGION" \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text)

echo "$TG_ARN"

aws elbv2 describe-target-health \
  --target-group-arn "$TG_ARN" \
  --region "$AWS_REGION" \
  --query 'TargetHealthDescriptions[].{IP:Target.Id,Port:Target.Port,State:TargetHealth.State,Reason:TargetHealth.Reason,Description:TargetHealth.Description}' \
  --output table
```

- `describe-target-groups`: retrieves the target group's AWS ARN.
- `describe-target-health`: shows each registered target and why it is healthy/unhealthy.
- `Target.ResponseCodeMismatch`: target replied with a code that does not match the configured success matcher.

**Observed:** `172.31.92.167:4000` and `172.31.85.205:4000` were unhealthy, with HTTP 404 health-check failures.

### Step 4 — Inspect the exact health-check contract

```bash
aws elbv2 describe-target-groups \
  --names "$TG_NAME" \
  --region "$AWS_REGION" \
  --query 'TargetGroups[0].{Path:HealthCheckPath,Port:HealthCheckPort,Protocol:HealthCheckProtocol,Matcher:Matcher.HttpCode}' \
  --output table
```

**Before:** `Path=/`, `Port=traffic-port`, `Matcher=200`.  
**Question:** Does the Express backend return `200` for `GET /`? The lab demonstrated it returned `404`.

### Step 5 — Test the backend directly (bypass ALB)

In terminal A:

```bash
kubectl port-forward -n "$NS" svc/backend 4000:4000
```

In terminal B, **on the same machine that started the port-forward**:

```bash
for path in / /health /api/health /api/properties; do
  curl -sS --connect-timeout 5 --max-time 10 -o /dev/null \
    -w "$path -> HTTP %{http_code}\n" \
    "http://localhost:4000$path"
done
```

**Observed in the lab:** `/` -> 404, `/health` -> 200, `/api/health` -> 404, `/api/properties` -> 200.

**Why this matters:** Port-forward verifies application behavior independently of ALB target-group routing. It does **not** prove the pod is reachable from the ALB, nor does it prove network policies/security groups are correct. `kubectl port-forward` goes through Kubernetes control-plane/kubelet mechanisms and is not a substitute for an ALB-to-pod connectivity test.

If needed, ask the Backend Engineer to confirm the `/health` endpoint's semantics and whether it should also check downstream dependencies.

### Step 6 — Determine root cause

Combine evidence:

```text
Kubernetes backend pods: Running / Ready
Ingress /api route: configured to backend:4000
ALB registered targets: backend pod IPs :4000
Target health: unhealthy / Target.ResponseCodeMismatch / 404
ALB health check: GET /
Backend GET /: 404
Backend GET /health: 200
```

**Conclusion:** Health-check path mismatch. A blocked TCP connection more often presents as timeout/connection errors; an explicit `404` response is strong evidence that an HTTP server answered the request. Still check all relevant configuration if symptoms differ.

## 6. Remediation and verification

### Step 7 — Apply a reviewed Kubernetes change

**Preferred production path:** change the tracked Kubernetes Service manifest or Helm values in Git, review the Pull Request, and allow the approved GitOps/CD workflow to apply it. The lab Service was marked with `argocd.argoproj.io/tracking-id`, so an uncommitted live patch may be reverted by Argo CD.

Example desired Service metadata (merge into the existing Service manifest; preserve all other fields):

```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: real-estate-company
  annotations:
    alb.ingress.kubernetes.io/healthcheck-path: /health
spec:
  # Keep the existing selector, ports, and other Service settings unchanged.
```

**Lab hotfix command actually used:**

```bash
kubectl annotate service backend \
  -n real-estate-company \
  alb.ingress.kubernetes.io/healthcheck-path=/health \
  --overwrite
```

This adds/updates the annotation on `Service/backend`. AWS Load Balancer Controller, when managing this ALB target group, reconciles the change into AWS. The controller may take time to reconcile. The annotation's effectiveness depends on the relevant controller/Ingress setup; always verify the resulting AWS target-group configuration.

### Step 8 — Confirm the Kubernetes Service annotation

```bash
kubectl get svc backend -n "$NS" -o yaml
kubectl get svc backend -n "$NS" \
  -o jsonpath='{.metadata.annotations.alb\.ingress\.kubernetes\.io/healthcheck-path}{"\n"}'
```

**Observed:** `/health`.

### Step 9 — Confirm AWS reconciliation

```bash
aws elbv2 describe-target-groups \
  --names "$TG_NAME" \
  --region "$AWS_REGION" \
  --query 'TargetGroups[0].{HealthCheckPath:HealthCheckPath,Port:HealthCheckPort,Matcher:Matcher.HttpCode}' \
  --output table
```

**Observed after fix:** `HealthCheckPath=/health`, `Port=traffic-port`, `Matcher=200`.

### Step 10 — Confirm actual recovery (mandatory before closing)

```bash
aws elbv2 describe-target-health \
  --target-group-arn "$TG_ARN" \
  --region "$AWS_REGION" \
  --query 'TargetHealthDescriptions[].{IP:Target.Id,State:TargetHealth.State,Reason:TargetHealth.Reason}' \
  --output table

curl -sS --connect-timeout 5 --max-time 15 \
  -o /dev/null -w 'API HTTP %{http_code}\n' \
  "http://$ALB_DNS/api/properties"
```

Wait for several health-check intervals and repeat if targets are `initial` or `unhealthy`. If targets remain unhealthy, inspect AWS target-health description, ALB-to-pod connectivity, NetworkPolicy enforcement, security groups, listener rules, and application logs. Do not assume a path fix solved a second issue.

**Close only when:** target health is healthy, customer-facing checks pass, metrics stabilize, the GitOps source is updated, and stakeholders agree service has recovered.

## 7. Incident roles and communication

| Role | Responsibility during this incident | What they communicate |
|---|---|---|
| **Incident Commander (IC)** | Owns timeline, severity, coordination, updates, and closure decision | Impact, next update time, decision log |
| **SRE / DevOps On-call** | Checks ALB target health, Kubernetes state, controller reconciliation; proposes and validates fix | Evidence, suspected cause, remediation and verification |
| **Backend Engineer** | Confirms `/health` behavior, HTTP routes, logs, dependency health | Which endpoints should return 200 and why `/` returns 404 |
| **Cloud / Platform Engineer** | Validates AWS target group, ALB controller, IAM/networking if needed | AWS configuration and target registration status |
| **Release / GitOps Owner** | Updates Git manifest/Helm values, PR review, Argo CD sync, rollback plan | Change ID, approval, deployment state |
| **Support / Customer Success** | Communicates externally **if actual customers are affected** | Approved customer-facing impact and resolution notice |
| **Security Engineer** | Consulted if a proposed fix changes network exposure or security controls | Security impact and approvals, when relevant |

For a small team, one engineer may perform several roles. Do not invent team participation in the lab: this table describes **production practice**.

### Example incident-channel timeline (illustrative; not actual timestamps)

**10:00 — SRE:** “ALB backend target group is 0/2 healthy. Kubernetes backend pods are 2/2 Ready. Checking target-health reasons and endpoint responses. Customer impact not yet confirmed.”

**10:05 — SRE -> Backend Engineer:** “AWS reports `Target.ResponseCodeMismatch`, HTTP 404 on health checks. Does this service implement `GET /` or `GET /health`? Please confirm the intended health contract.”

**10:08 — Backend Engineer:** “`GET /health` returns 200. Root `/` is not implemented and returns 404.”

**10:10 — SRE -> IC:** “Root cause identified: ALB checks `/`, while backend's health endpoint is `/health`. Proposed fix: update the backend Service annotation in Git and verify AWS reconciliation.”

**10:12 — IC -> Release Owner:** “Please review the minimal manifest change and confirm the rollback path. No unrelated changes.”

**10:20 — SRE:** “AWS target group now reports HealthCheckPath `/health`. Waiting for target-health transition and validating API traffic. Recovery not yet declared.”

**10:25 — IC (only if confirmed):** “Both targets healthy, external probes stable, monitoring clear. Incident resolved; postmortem and preventive actions to follow.”

### Stakeholder update template

> **Status:** Investigating / Mitigating / Monitoring / Resolved  
> **Impact:** Confirmed customer impact, or “not yet confirmed”  
> **Finding:** ALB backend health checks return 404 because configured path differs from implemented endpoint  
> **Action:** Update health-check path to `/health` through approved GitOps change  
> **Validation:** Target Group health and external API checks  
> **Next update:** [time]

## 8. Prevention and follow-up actions

1. **Codify the health-check contract:** Backend team documents `/health` and its expected HTTP status; Platform team references it in manifests.
2. **GitOps as source of truth:** Commit the Service annotation or equivalent Helm values and avoid long-lived manual-only changes.
3. **PR review checklist:** Verify ALB health-check path, port, success codes, Service selectors, and actual app routes.
4. **Automated smoke test:** In CI/staging, check `/health` returns 200 before promotion.
5. **Post-deploy verification:** Check ALB target health and external `/api/properties`, not just `kubectl get pods`.
6. **Monitoring:** Alert on unhealthy targets plus user-facing request errors, with sensible thresholds and severity tied to impact.
7. **Runbook:** Preserve commands, screenshots, observed evidence, and a rollback procedure.
8. **Change coordination:** Notify backend and platform owners when API route or health endpoint changes.

**Suggested action owners:** Backend Engineer (health endpoint contract), Platform Engineer (manifest and CI checks), SRE (monitoring and runbook), Release Owner (GitOps rollout). Set actual deadlines in the team's issue tracker.

## 9. What not to do

- Do not restart healthy pods as a first reaction to an ALB `404` health-check mismatch.
- Do not widen security groups or remove NetworkPolicies without evidence of a network block.
- Do not confuse ALB `Target.ResponseCodeMismatch` with a 504 timeout incident.
- Do not declare recovery solely because `kubectl annotate` succeeded or the target-group path changed.
- Do not claim that a successful port-forward proves ALB-to-pod connectivity.
- Do not leave a manual hotfix uncommitted if Argo CD manages the Service.
- Do not change the AWS target group directly as the permanent fix if the Kubernetes controller will reconcile it back.

## 10. Interview answer — STAR format

**Situation:** “In our EstateFlow AWS EKS production-style environment, backend pods were running and API requests could return 200, but the ALB backend target group reported two unhealthy targets.”

**Task:** “I needed to identify why the load balancer considered healthy Kubernetes workloads unhealthy, coordinate with the backend/platform owners, and restore the correct configuration without unnecessary restarts.”

**Action:** “I verified the cluster context, inspected the Ingress routes and backend pod IPs, and used `aws elbv2 describe-target-health` to find `Target.ResponseCodeMismatch` with HTTP 404. Then I checked the target group's `HealthCheckPath` and found it was `/`. I used `kubectl port-forward` and `curl` to compare endpoints: `/` returned 404 while `/health` returned 200. We updated the backend Service's ALB health-check annotation to `/health`, then verified that AWS Load Balancer Controller had reconciled the new path into the target group.”

**Result:** “We confirmed the AWS health-check configuration changed to `/health` with a 200 matcher. The final target-health recovery was a separate validation step; I would only declare the incident resolved after both targets were healthy and external probes remained successful. I also recommended committing the fix to GitOps and adding smoke tests and monitoring.”

**30-second version:**

> “We found an ALB target group with two unhealthy backend targets, even though the Kubernetes pods were Ready. AWS target health showed HTTP 404 response-code mismatches. The ALB was checking `/`, but the Express backend returned 200 on `/health`. We verified this through port-forward and curl, updated the backend Service annotation, and confirmed AWS reconciled the target group's health-check path. The lesson was to validate application health endpoints and load balancer configuration together, and to persist fixes through GitOps.”

## 11. Interview questions for students

1. Why can a Kubernetes pod be `Running 1/1` while an ALB target is unhealthy?
2. What does `Target.ResponseCodeMismatch` mean?
3. How is an HTTP 404 health-check failure different from a TCP timeout?
4. What does `HealthCheckPort=traffic-port` mean?
5. How does AWS Load Balancer Controller know about Ingress and Service changes?
6. Why is `kubectl port-forward` useful, and what does it *not* prove?
7. How do you compare ALB target IPs with backend Pod IPs?
8. What would you check if the target group still shows unhealthy after the path fix?
9. Why should the fix be committed to Git when Argo CD manages the Service?
10. Who communicates to customers, and when should the incident be declared resolved?

## 12. Evidence checklist for the GitHub report

Store sanitized screenshots or terminal excerpts under `docs/incident-reports/evidence/07-alb-healthcheck/` if approved by the team:

- [ ] Pods `Running 1/1` and `kubectl get pods -o wide`
- [ ] Ingress `/api -> backend:4000`
- [ ] Target group 0 healthy / 2 unhealthy
- [ ] `Target.ResponseCodeMismatch` and 404 descriptions
- [ ] Original HealthCheckPath `/`
- [ ] Local backend endpoint tests (`/` 404, `/health` 200)
- [ ] `service/backend annotated` output
- [ ] Service annotation `/health`
- [ ] AWS target-group path `/health` after reconciliation
- [ ] **Final `healthy` target status — not yet evidenced in provided screenshots**
- [ ] Git PR / commit and Argo CD sync evidence

**Sanitize** account IDs, instance IPs where appropriate, access tokens, credentials, personal names, and customer data before publishing publicly.

## 13. Git workflow — add this report to the feature branch

```bash
cd ~/jumptotech-estateflow
git switch feature-file
git pull --rebase origin feature-file
mkdir -p docs/incident-reports
# Place this Markdown file at:
# docs/incident-reports/07-alb-unhealthy-targets-healthcheck-mismatch.md

git add docs/incident-reports/07-alb-unhealthy-targets-healthcheck-mismatch.md
git commit -m "docs: add ALB unhealthy health-check mismatch incident report"
git pull --rebase origin feature-file
git push origin feature-file
```

Then open a Pull Request from `feature-file` to `main`, request review, and merge only after approval. If `git pull --rebase` reports conflicts, resolve them and continue the rebase; do not force-push shared branches without coordination.

## 14. Final incident summary

**Confirmed in lab:** ALB health-check mismatch was diagnosed, the Service annotation was changed, and AWS reflected the new `/health` path.  
**Not yet confirmed by screenshots:** Both targets recovered to `healthy`, exact restoration time, and any real customer impact.  
**Key lesson:** Troubleshoot layer by layer, compare observed HTTP status codes to expected health-check behavior, communicate with application owners, and validate the change end-to-end before closing the incident.


---

## 15. How the incident would be discovered in a real company (production simulation)

**This section is a teaching scenario, not an account of actual EstateFlow customers or an observed PagerDuty alert.** A realistic detection sequence might be:

1. A CloudWatch alarm for the backend target group's `UnHealthyHostCount` crosses its threshold. An alert routes to PagerDuty/Opsgenie and the SRE on-call acknowledges it. The alert contains AWS account, region, ALB name, target group, and a dashboard link.
2. The on-call checks customer-facing synthetic probes and `HTTPCode_ELB_5XX_Count`/`HTTPCode_Target_5XX_Count` and request latency. These show whether the issue is merely a health signal or a user-visible outage. In our observed lab, `/api/properties` returned HTTP 200; we **did not measure real customer failures**.
3. The on-call opens an incident issue, establishes a single Slack/Teams incident channel, records the first detection time, and asks an Incident Commander (IC) to coordinate if the incident warrants it.
4. The IC assigns provisional SEV-3 when targets are unhealthy but user requests still work; escalates to SEV-2 if a core customer journey is failing for a substantial portion of users. Company severity matrices vary.
5. The SRE correlates the alert with recent deployment, Service/Ingress/Helm changes and target health details; asks the backend owner to confirm the intended endpoint.
6. Once `404` on `/` versus `200` on `/health` is established, the team proposes a minimal, reviewed change and a rollback plan. A successful ALB health check is verified **after** reconciliation, not assumed.

### Production detection commands

```bash
# Inspect recent Kubernetes events; does not prove a specific deployment caused the incident.
kubectl get events -n real-estate-company --sort-by=.lastTimestamp | tail -30

# Inspect change history and rollout state.
kubectl rollout history deployment/backend -n real-estate-company
kubectl rollout status deployment/backend -n real-estate-company --timeout=60s

# Check the live Service and its managed-field/change annotations.
kubectl get svc backend -n real-estate-company -o yaml

# If Argo CD is available, inspect application sync/health in its UI or CLI.
# argocd app get <application-name>

# From a local Git checkout, inspect recent changes to the relevant manifests.
git log --oneline --all -- k8s/backend-service.yaml
# Adjust the path to the actual repository layout.
```

**Caution:** Git history and Kubernetes events establish correlation and change history; they do not prove which person introduced the mismatch without change evidence. A default ALB health-check path can also explain the mismatch when no explicit path was ever set.

## 16. Duration, timeline, and business impact — two distinct records

### A. What the class actually documented

| Item | Supported observation |
|---|---|
| Lab date | November 20, 2026 |
| Detection | Two backend targets were `Unhealthy` and the health-check response was 404 |
| Application | Two backend pods Ready; external API sample returned 200 |
| Diagnosis | `/` returned 404; `/health` returned 200; target group checked `/` |
| Fix | Backend Service annotation updated to `/health` |
| Verification | AWS Target Group configuration reported `/health`, matcher 200 |
| Incident start timestamp | **Not captured** |
| Incident end timestamp | **Not captured** |
| Total time to detect/resolve | **Unknown — do not claim a number** |
| Affected real customers | **Not measured / not established** |
| Financial loss | **Not measured / not established** |
| Final 2/2 healthy result | **Not shown in available evidence** |

### B. Example two-hour production incident timeline (fictional, for role-play)

This example intentionally separates **mitigation**, **monitoring**, and **follow-up**. It is **not** the actual duration of the lab.

| Example time | Owner | Action and evidence | Communication |
|---|---|---|---|
| 09:00 | Monitoring | Alarm: backend target group 0/2 healthy | PagerDuty notifies on-call |
| 09:03 | SRE on-call | Acknowledge; check synthetic API probes, ALB 5xx, latency | “Investigating; impact unconfirmed” |
| 09:08 | IC | Open incident channel and issue; provisional SEV-3 | Assign roles; next update 09:23 |
| 09:12 | SRE | `kubectl get pods` shows 2/2 backend Ready | Pods running; ALB health separate |
| 09:18 | Cloud engineer | `describe-target-health`: response mismatch 404 | Target group evidence shared |
| 09:25 | Backend engineer | `curl`/port-forward: `/` 404, `/health` 200 | Confirm endpoint contract |
| 09:35 | SRE + IC | Root cause confirmed; approve small Service annotation change | Change/rollback plan recorded |
| 09:45 | Release engineer | PR reviewed, GitOps change applied (or approved emergency patch) | Change ID shared |
| 10:00 | Cloud engineer | Target group config now `/health`; wait for health transitions | “Mitigated, monitoring” only if traffic checks support it |
| 10:15 | SRE | Confirm target health and synthetic checks | If both healthy, begin observation window |
| 10:30 | IC | Close active incident **only if** customer journeys stable and health restored | Resolution notice |
| 11:00 | Team | Document timeline, owners, prevention tasks | Schedule blameless review |

**Example metrics:** time to acknowledge = 3 minutes; time to configuration correction = 60 minutes; time to incident closure = 90 minutes; post-incident documentation completed at 120 minutes. These are fictional planning numbers, not measured MTTA/MTTR for the class.

### Business impact assessment

In a real estate business, customers might experience unavailable listings, failed property searches, failed inquiries, or increased latency **if** the health-check issue affected actual request delivery. Do not assume that every unhealthy target causes downtime: AWS ALB can fail open when all registered targets in a target group are unhealthy, and the class observed a successful API response.

The IC should ask Product/Support/Analytics to establish:

- How many requests failed, and for how long? Compare `RequestCount`, 5xx metrics, synthetic checks, and application logs against baseline.
- Which endpoints failed (`/api/properties`, inquiries, login, etc.) and which customer regions were affected?
- What percentage of customers or sessions experienced errors? Were users unable to complete a critical journey?
- Was revenue or lead submission actually lost? Only report amounts supported by business analytics.
- Did the alarm indicate **latent risk** without confirmed customer impact? If yes, say so plainly.

**Illustrative impact calculation, not an actual finding:** If an endpoint received 600 requests/minute for 30 minutes and 5% failed, estimated failed requests = `600 × 30 × 0.05 = 900`. This is a hypothetical exercise; it is **not** EstateFlow production data.

## 17. Realistic Slack/Teams communications and escalation

### First alert acknowledgement — SRE to incident channel

> **09:03 | Investigating | SEV-3 provisional** — Backend target group is reporting 0/2 healthy in us-east-1. Kubernetes Pods appear Ready; user-facing impact is not yet confirmed. I am checking AWS target-health reasons, API probes, and recent configuration changes. Next update in 15 minutes.

### SRE to Backend Engineer

> Can you confirm the supported health endpoint for the Express backend on port 4000? AWS target checks return 404. We see `/health` returning 200 in direct tests but `/` returning 404. Please confirm this is intended and whether the health endpoint depends on PostgreSQL.

### SRE to Cloud/Platform Engineer

> Please verify the ALB Target Group health-check path, matcher, port, registered Pod IPs, and AWS Load Balancer Controller reconciliation. Do not modify security groups or NetworkPolicies unless connectivity evidence points there.

### IC to Release/GitOps Engineer

> Root cause appears to be a health-check path mismatch. Please prepare a minimal PR changing the backend Service ALB health-check annotation to `/health`. Confirm review, Argo CD ownership, rollback procedure, and post-change validation. Avoid unrelated releases during mitigation.

### IC to management/support (only if impact is verified)

> We are investigating degraded availability for the EstateFlow property API. The backend itself is responding to direct checks, but the load balancer health-check configuration is incorrect. A targeted fix is being deployed. We will provide a confirmed impact estimate and next update at 10:00.

### Recovery communication (send only after verification)

> **Resolved:** ALB backend targets are healthy, synthetic property API checks pass, and error/latency metrics have returned to baseline. The issue was caused by an ALB health-check path mismatch (`/` versus `/health`). The configuration is now committed to Git and reconciled by the controller. A blameless postmortem and prevention tasks are open.

## 18. Production remediation, rollback, and validation playbook

**Preferred long-term fix:** change the Git-managed Service manifest/Helm values, review the PR, deploy via Argo CD, and verify AWS reconciliation. The lab used a direct `kubectl annotate` command as an immediate change; GitOps may revert such manual changes if the repository is not updated.

```bash
# Inspect the live value before changing anything.
kubectl get svc backend -n real-estate-company   -o jsonpath='{.metadata.annotations.alb\.ingress\.kubernetes\.io/healthcheck-path}{"\n"}'

# Emergency/lab change — use only after authorization and with a rollback plan.
kubectl annotate service backend -n real-estate-company   alb.ingress.kubernetes.io/healthcheck-path=/health --overwrite

# Confirm Service state.
kubectl get svc backend -n real-estate-company -o yaml

# Confirm AWS reconciliation.
aws elbv2 describe-target-groups   --names k8s-realesta-backend-04e5483ddb --region us-east-1   --query 'TargetGroups[0].{Path:HealthCheckPath,Port:HealthCheckPort,Matcher:Matcher.HttpCode}'   --output table

# Inspect each registered target's actual state and reason.
TG_ARN=$(aws elbv2 describe-target-groups   --names k8s-realesta-backend-04e5483ddb --region us-east-1   --query 'TargetGroups[0].TargetGroupArn' --output text)
aws elbv2 describe-target-health --target-group-arn "$TG_ARN"   --region us-east-1   --query 'TargetHealthDescriptions[].{IP:Target.Id,State:TargetHealth.State,Reason:TargetHealth.Reason,Description:TargetHealth.Description}'   --output table
```

**Rollback:** Revert the exact Git commit/PR and resync Argo CD if the change introduces a regression; for an emergency manual annotation, restore the previously recorded value rather than blindly deleting or setting `/`. Rolling back to a known-bad `/` check is generally **not** an appropriate recovery action for this specific root cause. Escalate if the target group remains unhealthy after the change: investigate whether `/health` is actually reachable from ALB, whether security groups/NetworkPolicy block traffic, whether the Service endpoints are correct, and whether the controller is reconciling.

**Closure gate:** Both targets healthy (or expected healthy capacity), ALB and synthetic checks passing, metrics stable over an agreed observation period, GitOps source updated, IC approval, and stakeholder update sent.

## 19. Blameless root-cause analysis: five whys

1. **Why did AWS mark backend targets unhealthy?** Health probes returned HTTP 404 rather than expected 200.
2. **Why did probes return 404?** ALB requested `/` on port 4000.
3. **Why was `/` not successful?** The backend's implemented health endpoint was `/health`, not `/`.
4. **Why did ALB and backend disagree?** The Service/Target Group health-check configuration and backend API contract were not aligned.
5. **Why was this not detected before the incident?** The observed workflow did not have a demonstrated release gate validating both the application's health endpoint and the AWS Target Group configuration. This is a **process hypothesis for follow-up**, not a proven fact about who made a mistake.

**Avoid blame:** The evidence does not show that “Engineer A wrote `/` and Engineer B changed it.” It could have been an omitted annotation/default setting. A postmortem should verify the actual Git/Argo CD history before attributing a change.

## 20. Follow-up questions with model answers (interview drill)

**Q1. How did you know there was an incident if the API returned 200?**  
A: The ALB reported 0/2 healthy backend targets. This is a serious reliability signal, even when sampled requests succeed. We investigated to prevent a latent availability risk and measured user-facing impact separately.

**Q2. How long did the incident last?**  
A: In the lab, exact detection and resolution timestamps were not recorded. In the fictional production exercise, the team acknowledged at 09:03 and closed at 10:30, about 90 minutes after the alert. I would never present that example as measured lab MTTR.

**Q3. How many customers were impacted?**  
A: Not established by the lab. In production, we would correlate ALB metrics, synthetic checks, logs, customer reports, and analytics before stating a number.

**Q4. Why did `kubectl get pods` show `Running 1/1`?**  
A: Kubernetes readiness and ALB target health are separate. A Pod can be Ready while an ALB probe receives 404 on the wrong route.

**Q5. Why did a direct API request succeed if all targets were unhealthy?**  
A: AWS ALB can fail open when every target in a target group is unhealthy. A 200 API response therefore does not establish healthy targets.

**Q6. What did port-forwarding prove?**  
A: It showed that the Service/backend application responded on the tested path when bypassing ALB. It did not prove that ALB-to-Pod network connectivity or target health was good.

**Q7. Why did you inspect `Target.ResponseCodeMismatch`?**  
A: It narrowed the failure to an HTTP response-code mismatch rather than an immediate assumption about crashed Pods or network timeouts.

**Q8. Why not restart the backend deployment?**  
A: The backend Pods were Ready and the correct endpoint responded with 200. Restarting would not fix an ALB probe pointed at an unsupported path.

**Q9. Why not modify the ALB Target Group manually in AWS Console?**  
A: The AWS Load Balancer Controller manages it from Kubernetes resources. Manual AWS changes can be overwritten; update the Git-managed Kubernetes source of truth.

**Q10. What if `/health` returns 200 but the targets remain unhealthy?**  
A: Inspect actual health-check path/port, security groups, subnet routing, NetworkPolicies, Pod IP registration, controller logs, health-check intervals and the target-health reason. Direct localhost success does not guarantee ALB reachability.

**Q11. What was the severity?**  
A: We used provisional SEV-3 for the lab because the targets were unhealthy but sampled API traffic worked. If real customers could not search properties, we would reassess based on the organization's impact matrix.

**Q12. Who owned communication?**  
A: The Incident Commander coordinated updates and severity; the SRE supplied evidence; the backend and cloud engineers validated the cause; Support communicated externally only if customer impact was confirmed.

**Q13. What was the root cause, and what was not the cause?**  
A: A mismatch between the ALB health-check path `/` and backend endpoint `/health`. We did not demonstrate NetworkPolicy, a database outage, or a duplicate Ingress as the cause of this 404 mismatch.

**Q14. How would you prevent recurrence?**  
A: Document the health contract, keep ALB annotations in Git, add a `/health` smoke test, verify target health after deployments, alert on unhealthy targets, and require cross-team review for route changes.

**Q15. What should you say if the interviewer asks, “Did you personally solve this in production?”**  
A: “I reproduced and investigated this in our EstateFlow AWS EKS production-style capstone. I can show the actual AWS/Kubernetes evidence and explain the production response process. It was a lab, not a customer outage.”

## 21. GitHub Issue template and Definition of Done

**Suggested title:** `[INCIDENT-07][SEV-3] EstateFlow ALB Backend Targets Unhealthy — Health Check Path Mismatch`

**Suggested labels:** `incident`, `sev-3`, `aws`, `eks`, `alb`, `documentation` (create labels if needed).

**Description:** Two backend targets unhealthy despite 2/2 Kubernetes backend Pods Ready. AWS health checks returned HTTP 404 because target group checked `/` instead of implemented `/health`. Direct endpoint checks and ALB configuration confirmed mismatch. Service annotation changed; AWS target-group path confirmed updated. Final healthy-state validation remains pending in the available evidence.

**Tasks:**

- [x] Record Pod readiness and registered target IPs
- [x] Record AWS target-health reason and HTTP 404
- [x] Verify `/` versus `/health` endpoint behavior
- [x] Apply Service annotation and verify AWS path reconciliation
- [ ] Capture `describe-target-health` showing expected healthy targets
- [ ] Commit the change to the Git-managed manifest/Helm values
- [ ] Verify Argo CD sync and no drift
- [ ] Add post-deploy smoke test and unhealthy-target alert
- [ ] Attach actual timeline and impact evidence if this is a real production incident
- [ ] Conduct blameless review and assign action owners/due dates

**Definition of Done:** Verified target health and customer-facing functionality, source-of-truth updated, follow-ups assigned, and incident summary reviewed. Do not close the issue based solely on a changed HealthCheckPath.
