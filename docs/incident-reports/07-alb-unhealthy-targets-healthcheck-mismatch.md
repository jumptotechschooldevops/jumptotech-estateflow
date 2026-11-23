# INC-007 — EstateFlow Production: ALB Backend Targets Unhealthy

**Service:** EstateFlow Property API  
**Environment:** Production (AWS EKS, `us-east-1`, namespace `real-estate-company`)  
**Component:** AWS Application Load Balancer / Backend Target Group / Express API  
**Incident category:** Availability / health-check configuration mismatch  
**Severity:** Pending confirmation from measured customer impact  
**Incident commander:** On-call SRE (role)  
**Status:** Health-check configuration corrected; final target-health confirmation outstanding

> **Record integrity:** This case reconstructs a production incident workflow from observed infrastructure outputs. The observed facts are listed below. Detection alerts, exact outage duration, customer counts, business loss, and communications are not evidenced and must be populated from production monitoring and incident records. Illustrative communication and timeline examples are clearly marked. Do not report them as events that have already occurred.

## 1. Executive summary

The backend target group of the EstateFlow internet-facing ALB reported **two unhealthy IP targets** on TCP port **4000**. AWS ELBv2 returned `Target.ResponseCodeMismatch`, with health-check responses of **HTTP 404**. At the same time, both backend Kubernetes Pods were `Running` and `Ready`, and the public API endpoint `/api/properties` returned **HTTP 200**. The issue was therefore not established as a failed deployment or a general application outage: it was an ALB health-check contract mismatch that could reduce availability and make routing vulnerable to failure.

The target group was checking `/`, expecting HTTP `200`. The Express backend's `/health` endpoint returned `200`; its `/` endpoint returned `404`. The backend Kubernetes Service was annotated with `alb.ingress.kubernetes.io/healthcheck-path: /health`. A subsequent AWS target-group query showed `HealthCheckPath=/health` and `Matcher.HttpCode=200`. The available evidence does **not** prove that both targets subsequently transitioned to `healthy`; this remains a closure criterion.

**Root cause:** The ALB target-group health-check path did not match an implemented success endpoint on the backend.  
**Contributing control gap:** No enforced contract check between the application health endpoint and ALB target-group configuration.  
**Not demonstrated:** An actual customer-wide outage, 504 errors, NetworkPolicy failure, database outage, or duplicate active Ingress.

## 2. Enterprise environments and release path

| Environment | Typical purpose | Required check before promotion |
|---|---|---|
| Development | Implement and validate API behavior | Confirm `GET /health` returns 200 and `/` behavior is understood |
| Staging | Integration with Kubernetes Services and AWS ALB | Verify target group health-check path, port, matcher, and target states |
| Pre-production | Production-like deployment and release approval | Smoke test public API; compare rendered Ingress/Service annotations and ALB settings |
| Production | Customer-facing workloads | Monitor ALB target health, API availability, error rate, and change events |

**Where the issue was found:** The captured evidence comes from the `real-estate-company` AWS EKS environment. A separately verified development, staging, or pre-production deployment history is not available. Do not assert that this specific defect passed through all environments unless deployment records establish that sequence.

### Architecture and actual request paths

```text
Customer -> DNS -> Internet-facing AWS ALB :80
                          |
                 ALB listener rules
                    /api/* | /*
                          |
                Backend TG | Frontend TG
                  IP:4000  | IP:80
                     |     |
               Backend Pods  Frontend Pods
                     |
                PostgreSQL (for DB-dependent requests)

AWS Load Balancer Controller watches Ingress/Service/EndpointSlice resources
and reconciles ALB listeners, rules, target groups, and registered Pod IPs.

ALB health check -> backend Pod IP:4000/   -> 404 (observed mismatch)
Corrected check  -> backend Pod IP:4000/health -> 200 (endpoint observed)
```

Kubernetes Ingress is configuration consumed by the AWS Load Balancer Controller; it is not a separate HTTP proxy that each request passes through. A Kubernetes Pod being `Ready` is not the same as its ALB target being `healthy`.

## 3. How a production SRE would discover the incident

**Detection sources to investigate (workflow, not claimed historical alerts):**

1. CloudWatch ALB metrics such as `UnHealthyHostCount`, `HealthyHostCount`, `HTTPCode_Target_5XX_Count`, and `TargetResponseTime`.
2. Synthetic monitoring for `GET /api/properties` and application health checks.
3. PagerDuty/Opsgenie alert or operations dashboard reporting backend target health degradation.
4. Release/deployment audit trail for recent application, Service, Ingress, or ALB controller changes.

**First on-call actions:** Acknowledge the alert, open an incident channel, identify the production service and scope, freeze unrelated changes, and assign an incident commander if severity requires it. Compare current customer-facing success rates with target-health degradation before declaring a customer outage.

**Severity assessment:** Two unhealthy backend targets are serious. Severity depends on real customer impact and redundancy, not solely the red target-group status. ALB behavior when all targets are unhealthy can be surprising; do not infer an HTTP 503 or 504 without observed requests and ALB logs.

## 4. Evidence and troubleshooting commands

### A. Verify AWS identity and Kubernetes context

```bash
aws sts get-caller-identity
kubectl config current-context
kubectl get ns real-estate-company
export AWS_REGION=us-east-1
export NS=real-estate-company
export INGRESS=real-estate-ingress
```

`get-caller-identity` establishes the AWS principal; `current-context` prevents accidental work on another EKS cluster; `NS` and `INGRESS` scope subsequent commands.

### B. Verify user-facing behavior

```bash
export ALB_DNS=$(kubectl get ingress "$INGRESS" -n "$NS" \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
echo "$ALB_DNS"
for path in / /health /api/health /api/properties; do
  curl -sS --connect-timeout 5 --max-time 15 -o /dev/null \
    -w "$path -> HTTP %{http_code}\n" "http://$ALB_DNS$path"
done
```

`curl` checks HTTP behavior through the **public ALB**. A 404 at `/api/health` does not prove that the backend lacks `/health`: Ingress path routing may preserve the `/api` prefix. Test backend routes directly in step D.

### C. Inspect Kubernetes configuration

```bash
kubectl get pods -n "$NS" -o wide
kubectl get deploy,sts,svc,ingress -n "$NS"
kubectl describe ingress "$INGRESS" -n "$NS"
kubectl get ingress "$INGRESS" -n "$NS" -o yaml
kubectl get svc backend -n "$NS" -o yaml
kubectl get endpointslices -n "$NS" \
  -l kubernetes.io/service-name=backend
```

Confirm `/api -> backend:4000`, `/ -> frontend:80`, and the backend Pod IPs. The recorded two backend Pods were `1/1 Running`; this did not establish ALB health.

### D. Test the backend independently of ALB

Run port-forward in **terminal 1**:

```bash
kubectl port-forward -n "$NS" svc/backend 4000:4000
```

Run in **terminal 2 on the same machine**:

```bash
for path in / /health /api/health /api/properties; do
  curl -sS -o /dev/null -w "$path -> HTTP %{http_code}\n" \
    "http://127.0.0.1:4000$path"
done
```

**Observed backend behavior:** `/ -> 404`, `/health -> 200`, `/api/health -> 404`, `/api/properties -> 200`. Port-forwarding bypasses the ALB and its target group. This isolates application route behavior; it does **not** by itself prove ALB connectivity or target health.

### E. Identify the backend target group and health failure

The observed backend target group name was `k8s-realesta-backend-04e5483ddb`; verify the live name because the controller can recreate resources.

```bash
export TG_NAME=k8s-realesta-backend-04e5483ddb
export TG_ARN=$(aws elbv2 describe-target-groups \
  --names "$TG_NAME" --region "$AWS_REGION" \
  --query 'TargetGroups[0].TargetGroupArn' --output text)

aws elbv2 describe-target-health \
  --target-group-arn "$TG_ARN" --region "$AWS_REGION" \
  --query 'TargetHealthDescriptions[].{IP:Target.Id,Port:Target.Port,State:TargetHealth.State,Reason:TargetHealth.Reason,Detail:TargetHealth.Description}' \
  --output table

aws elbv2 describe-target-groups \
  --target-group-arns "$TG_ARN" --region "$AWS_REGION" \
  --query 'TargetGroups[].{Path:HealthCheckPath,Port:HealthCheckPort,Protocol:HealthCheckProtocol,Matcher:Matcher.HttpCode}' \
  --output table
```

**Observed:** target IPs `172.31.92.167:4000` and `172.31.85.205:4000` were `unhealthy`; reason `Target.ResponseCodeMismatch`; description indicated `404`. Target-group health-check path was `/`, matcher `200`. These target IPs matched the backend Pod IPs shown by Kubernetes.

### F. Correct the Kubernetes source of configuration

The observed change was applied to the backend Service:

```bash
kubectl annotate service backend -n "$NS" \
  alb.ingress.kubernetes.io/healthcheck-path=/health \
  --overwrite
```

**Production change control:** First confirm the AWS Load Balancer Controller version and which Ingress/Service annotation takes precedence. If Argo CD or another GitOps controller manages the Service, update the authoritative Git manifest through the approved change process as well, or the live annotation may be reverted. Avoid manual changes to an ALB target group that is managed by the controller.

### G. Validate reconciliation and recovery

```bash
kubectl get svc backend -n "$NS" -o yaml
aws elbv2 describe-target-groups \
  --target-group-arns "$TG_ARN" --region "$AWS_REGION" \
  --query 'TargetGroups[].{Path:HealthCheckPath,Matcher:Matcher.HttpCode}' \
  --output table

aws elbv2 describe-target-health \
  --target-group-arn "$TG_ARN" --region "$AWS_REGION" \
  --query 'TargetHealthDescriptions[].{IP:Target.Id,State:TargetHealth.State,Reason:TargetHealth.Reason}' \
  --output table

curl -sS -o /dev/null -w 'API HTTP %{http_code}\n' \
  "http://$ALB_DNS/api/properties"
```

**Observed:** AWS reported the corrected path `/health` and matcher `200`. **Not captured:** both targets subsequently showing `healthy`. Do not close the incident until healthy target count, API success, and stability over the team's observation window are verified.

## 5. Communication and escalation (example operational scripts)

**SRE on-call → Incident channel:**

> Investigating EstateFlow production backend ALB target health degradation. Two backend IP targets are unhealthy with `Target.ResponseCodeMismatch` (HTTP 404). Kubernetes backend Pods are Ready and the public properties API currently returns HTTP 200. Customer impact is being assessed; next update after target-group configuration review.

**SRE → Backend engineer:**

> Please confirm the intended health endpoint and expected response code for the current backend release. Direct Service port-forward returns 200 on `/health` and 404 on `/`. We are checking ALB health-check configuration against the application contract.

**SRE → Platform/Cloud engineer:**

> Please verify AWS Load Balancer Controller reconciliation, target-group health-check path, and ownership of the Service annotations. We will implement the fix in the GitOps source and validate the AWS target group after reconciliation.

**Incident commander → Stakeholders:**

> Backend ALB targets have been marked unhealthy due to a health-check path mismatch. Public API smoke checks currently succeed. We are correcting the health-check configuration and monitoring target recovery. Customer impact and incident severity remain under assessment.

**Escalate to:** Backend owner for route contract; Platform/Cloud for ALB/controller and IAM permissions; Release engineer for change history and rollback; incident commander for severity and stakeholder updates; customer support only when external impact is established.

## 6. Timeline and duration

Do **not** invent a precise incident duration. A production record should capture UTC timestamps from CloudWatch alarms, AWS target-health events, Kubernetes/Argo CD deployment history, change approvals, and incident communications.

| Milestone | Source to verify | Actual timestamp |
|---|---|---|
| First unhealthy target / alert | CloudWatch alarm history | Not recorded |
| On-call acknowledgment | PagerDuty/Opsgenie | Not recorded |
| Incident declaration | Incident channel | Not recorded |
| 404 mismatch identified | ELBv2 target-health output | Timestamp not recorded |
| `/health` Service annotation applied | Kubernetes audit / GitOps history | Timestamp not recorded |
| AWS target-group path confirmed `/health` | ELBv2 query | Timestamp not recorded |
| Both targets healthy | ELBv2 target-health history | Not yet evidenced |
| Incident resolved | Incident commander | Not established |

**How long can it take in production?** Detection, diagnosis, approval, reconciliation, and health-check recovery may take minutes or hours depending on alerting, access, rollout policy, and organizational approvals. No defensible elapsed time can be calculated from the available evidence.

## 7. Business impact and severity

**Confirmed infrastructure impact:** 2/2 backend ALB targets reported unhealthy at the time of inspection.  
**Confirmed application observation:** `/api/properties` returned HTTP 200 during a captured smoke check.  
**Unknown:** failed customer requests, latency degradation, revenue loss, SLA breach, and duration.  
**Severity:** assign using production incident policy after assessing actual user impact. Avoid automatically labeling this SEV-1 or SEV-2 based solely on unhealthy targets.

If customer impact is verified, quantify it with ALB access logs, API 5xx metrics, synthetic monitoring, customer support tickets, and traffic baselines. Keep infrastructure symptoms separate from proven customer outcomes.

## 8. Root-cause analysis (five whys)

1. **Why were backend targets unhealthy?** ALB health checks received HTTP 404 instead of the expected 200.
2. **Why did the health checks receive 404?** The target group checked `/` on port 4000.
3. **Why was `/` unsuitable?** The backend exposed `/health` as the successful health endpoint; `/` returned 404.
4. **Why did the configuration disagree with the application?** The health-check path and backend route contract were not validated together before the target group was evaluated.
5. **Why was the mismatch not prevented?** No evidence of an enforced pre-release check validating the effective ALB target-group path against the deployed backend route. This is a recommended process improvement, not a verified organizational historical fact.

## 9. Corrective and preventive actions

| Priority | Action | Owner | Completion evidence |
|---|---|---|---|
| P0 | Confirm both backend targets are `healthy` | On-call SRE | ELBv2 target-health output |
| P0 | Confirm public API success and error-rate stability | SRE + Backend | CloudWatch dashboard / synthetic checks |
| P1 | Commit health-check annotation to GitOps source | Platform | Approved PR and sync evidence |
| P1 | Add automated `/health` contract test in CI | Backend | Passing pipeline |
| P1 | Validate effective target-group path in staging and pre-production | Platform / Release | Release checklist evidence |
| P1 | Alert on sustained unhealthy targets with appropriate thresholds | SRE | Alert test and runbook link |
| P2 | Document health-check ownership and change review | Platform + Backend | Updated service runbook |
| P2 | Review ALB access logs and incident timeline | Incident commander | Completed post-incident review |

## 10. Interview questions and strong answers

**Q1. The Pods are Running; why does the ALB say Unhealthy?**  
Kubernetes readiness and ALB health checks are separate. The Pods were Ready, but ALB probed `/` and received 404 while expecting 200.

**Q2. How did you isolate the problem?**  
I checked public HTTP responses, Ingress routing, backend Service and Pod IPs, ELBv2 target-health reasons, and the target-group health-check path. Port-forwarding to the backend confirmed `/health` returned 200 and `/` returned 404.

**Q3. Why not restart Pods?**  
The evidence pointed to a configuration mismatch rather than a crashed application. Restarting healthy Pods would add risk without addressing the wrong health-check path.

**Q4. Why didn't port-forward prove that the ALB worked?**  
Port-forward bypasses the ALB and target-group health checks. It only helped verify backend route behavior.

**Q5. Who did you work with?**  
The SRE on-call coordinates investigation; backend engineering confirms the health endpoint; platform engineering owns controller/ALB configuration; release engineering validates change history; the incident commander handles severity and stakeholder communication.

**Q6. How was it fixed?**  
The backend Service health-check annotation was changed to `/health`; the AWS target group then reported `/health` as its health-check path. Target recovery still requires independent confirmation.

**Q7. Was this a 504 incident?**  
Not based on the available evidence. The verified symptom was ALB unhealthy targets due to HTTP 404 health-check responses. A 504 must be supported by an actual timed-out request or ALB log.

**Q8. What should happen before closing the incident?**  
Both targets must be healthy, customer-facing API checks stable, change ownership confirmed in Git, and the incident timeline and business impact documented.

**Q9. Why check staging and pre-production?**  
They should validate the actual effective ALB health-check path and backend route contract before promoting changes to production. Merely checking Pod readiness is insufficient.

**Q10. How do you prevent recurrence?**  
Add endpoint contract tests, target-group health validation in release gates, alerting on unhealthy targets, GitOps-managed configuration, and an explicit owner for ALB health-check settings.

## 11. Incident closure checklist

- [ ] AWS target-group health-check path is `/health` with expected code `200`
- [ ] Both backend targets show `healthy`
- [ ] Backend Pods and Service endpoints are healthy
- [ ] External API smoke checks succeed
- [ ] Error rate and latency return to baseline
- [ ] GitOps source reflects the applied configuration
- [ ] Change approval and rollback are recorded
- [ ] Customer impact and severity are confirmed or marked unknown
- [ ] Incident timestamps and communications are attached
- [ ] Corrective actions have owners and due dates

**Final status from currently available evidence:** Configuration corrected; full target recovery and customer-impact assessment not verified.
