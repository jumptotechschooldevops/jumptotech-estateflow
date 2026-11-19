# Incident 02 — Kubernetes CrashLoopBackOff: EstateFlow Backend Failure

**Project:** JumpToTech EstateFlow — Enterprise Real Estate Application  
**Environment:** AWS EKS / Kubernetes / AWS Application Load Balancer  
**Incident Type:** Application Availability / Container Restart Failure  
**Severity:** SEV-2 (training scenario; actual severity depends on customer impact)  
**Status:** Training incident report  
**Incident Date:** To be completed from lab evidence  
**Root Cause:** To be confirmed from logs and Kubernetes events

> **Training note:** This report documents a realistic production troubleshooting workflow based on our Kubernetes CrashLoopBackOff practice. The exact trigger, recovery action, and resolution timestamps must be verified before presenting it as an actual resolved production incident.

---

## 1. Business Context

EstateFlow is a real estate platform where customers can browse property listings and interact with backend APIs.

The application runs in AWS EKS.

### Architecture

```text
Customers
    |
    v
Route 53 / DNS
    |
    v
AWS Application Load Balancer
    |
    +---- / --------> Frontend Service
    |                    |
    |                    v
    |                Frontend Pods
    |
    +---- /api -----> Backend Service
                         |
                         v
                    Backend Pods
                         |
                         v
                   PostgreSQL Service
                         |
                         v
                   PostgreSQL Pod
                         |
                         v
                     EBS Volume
```

The frontend serves the web application. The backend provides APIs and communicates with PostgreSQL.

If the backend becomes unavailable, customers may be unable to retrieve property listings or complete API-dependent actions.

---

## 2. Incident Summary

### Scenario

The monitoring system detects that the EstateFlow backend has unhealthy or restarting containers.

During the investigation, the DevOps/SRE engineer discovers that a backend Pod is in `CrashLoopBackOff`.

Kubernetes repeatedly attempts to restart the failing container but applies an increasing delay between restart attempts.

### Potential customer impact

- Property listing APIs may fail.
- Customers may receive HTTP 5xx errors.
- ALB target health may deteriorate.
- If healthy backend replicas remain, some requests may continue succeeding.
- If no healthy backend targets remain, the API may become unavailable.

**Important:** CrashLoopBackOff does not automatically mean the entire application is down. We must verify the number of healthy replicas and actual customer impact.

---

## 3. How We Detect the Incident

### Step 1 — Check Grafana

An SRE engineer receives an alert about increased container restarts or unavailable backend replicas.

We open Grafana and examine:

- Container restart counts
- Ready versus desired replicas
- API error rates
- Request latency
- CPU and memory usage

Example PromQL:

```promql
kube_pod_container_status_waiting_reason{
  namespace="real-estate-company",
  reason="CrashLoopBackOff"
}
```

Container restart increases over 10 minutes:

```promql
increase(
  kube_pod_container_status_restarts_total{
    namespace="real-estate-company"
  }[10m]
)
```

These metrics depend on kube-state-metrics being installed and collected.

### Step 2 — Verify the alert in Kubernetes

```bash
kubectl get pods -n real-estate-company
```

Example simulated output:

```text
NAME                         READY   STATUS             RESTARTS
backend-abc123               0/1     CrashLoopBackOff   6
backend-def456               1/1     Running            0
frontend-xyz789              1/1     Running            0
postgres-0                   1/1     Running            0
```

We confirm that one backend replica is failing while another remains available.

### What I tell the interviewer

"I first checked monitoring to understand the business impact. Then I verified the Kubernetes Pod status and compared healthy and unhealthy replicas. I did not immediately restart the Deployment because I wanted to preserve the evidence and identify why the container was failing."

---

## 4. Investigation — Step by Step

### Step 1 — Inspect the Pod

```bash
kubectl describe pod backend-abc123 \
  -n real-estate-company
```

Replace `backend-abc123` with the actual failing Pod name.

Check:

- Container state
- Last terminated state
- Exit code
- Restart count
- Readiness and liveness probes
- Environment variable references
- Recent Kubernetes events

Common exit codes:

| Exit code | Possible meaning |
|---|---|
| 1 | Application exited with an error |
| 137 | Process was killed; may indicate OOM or another SIGKILL |
| 143 | Process received SIGTERM |
| 0 | Process exited successfully, but may be unsuitable for a long-running Deployment |

An exit code alone is not sufficient to determine the root cause.

### Step 2 — Retrieve previous container logs

This is one of the most important commands:

```bash
kubectl logs backend-abc123 \
  -n real-estate-company \
  --previous \
  --tail=100
```

Why `--previous`?

Because the container has already crashed and restarted. We need the logs from the previous container instance.

Also inspect current logs:

```bash
kubectl logs backend-abc123 \
  -n real-estate-company \
  --tail=100
```

Potential findings include:

```text
Error: DATABASE_URL is not defined
```

or:

```text
Error: connect ECONNREFUSED
```

or:

```text
Error: password authentication failed
```

These are illustrative examples, not confirmed output from our lab.

### Step 3 — Check recent changes

```bash
kubectl rollout history deployment/backend \
  -n real-estate-company
```

Inspect the Deployment:

```bash
kubectl describe deployment backend \
  -n real-estate-company
```

Check whether the failure began after:

- A new container image
- A configuration change
- A Secret or ConfigMap change
- A liveness probe change
- A database deployment or maintenance event

### Step 4 — Check Secrets and ConfigMaps

```bash
kubectl get secrets -n real-estate-company
```

```bash
kubectl get configmaps -n real-estate-company
```

```bash
kubectl get deployment backend \
  -n real-estate-company -o yaml
```

Verify the names of referenced Secrets and ConfigMaps, and that the required environment variables are defined.

Never paste database passwords, Secret values, or connection credentials into incident reports or interview materials.

### Step 5 — Check PostgreSQL dependency

```bash
kubectl get pods -n real-estate-company
```

```bash
kubectl get svc -n real-estate-company
```

```bash
kubectl get endpointslices \
  -n real-estate-company
```

Check whether PostgreSQL is Ready and whether its Service has usable endpoints.

DNS verification from a running backend container:

```bash
kubectl exec -n real-estate-company \
  deploy/backend -- nslookup postgres
```

TCP connectivity test, if `nc` is installed:

```bash
kubectl exec -n real-estate-company \
  deploy/backend -- nc -z -w 5 postgres 5432
```

If the backend has no running container, use a temporary diagnostic Pod with appropriate access instead.

**Important:** A successful TCP connection does not prove that database authentication or SQL queries are working.

### Step 6 — Check NetworkPolicy

```bash
kubectl get networkpolicy \
  -n real-estate-company
```

```bash
kubectl describe networkpolicy \
  -n real-estate-company
```

Confirm that backend traffic to PostgreSQL is permitted on TCP port 5432 and that the installed CNI actually enforces NetworkPolicy.

A NetworkPolicy denial can cause application connection failures, but it only produces CrashLoopBackOff if the application exits or is repeatedly killed as a consequence.

### Step 7 — Check resource limits and probes

```bash
kubectl top pod -n real-estate-company
```

```bash
kubectl describe deployment backend \
  -n real-estate-company
```

Check for:

- OOMKilled
- Memory limits
- CPU constraints
- Incorrect liveness probe path or port
- Insufficient startup time

A failing readiness probe normally removes a Pod from service endpoints without restarting it.

A failing liveness or startup probe can cause Kubernetes to restart the container.

---

## 5. Root Cause Analysis

We must distinguish the **symptom** from the **root cause**.

### Symptom

```text
Backend Pod → CrashLoopBackOff
```

### Possible root causes

1. The application fails during startup because of missing configuration.
2. Database connection errors cause the application to exit.
3. A new image contains an application bug.
4. Memory exhaustion terminates the container.
5. Incorrect liveness or startup probes repeatedly kill the container.

### Example training root cause

For classroom practice, we can simulate a backend deployment that requires `DATABASE_URL` but does not receive it.

Example log:

```text
Error: DATABASE_URL is not defined
Application startup failed
Process exited with code 1
```

**Example root-cause statement:**

"The backend Deployment was missing a required database configuration variable. The application exited during initialization. Kubernetes restarted the container repeatedly, causing CrashLoopBackOff."

This root cause must only be used if the actual logs and configuration confirm it.

---

## 6. Incident Response — Who Is Involved?

| Role | Responsibility |
|---|---|
| SRE / DevOps On-Call | Acknowledge alert, investigate Kubernetes, coordinate recovery |
| Incident Commander | Manage incident timeline, priorities and communication |
| Backend Engineer | Investigate application startup failure and code |
| Database Engineer | Verify PostgreSQL health, authentication and connectivity |
| Cloud / Platform Engineer | Investigate EKS nodes, networking, storage and resource constraints |
| Release Engineer | Check deployment history and coordinate rollback |
| Support / Business Stakeholder | Communicate confirmed customer impact |

For a small incident, one person may cover several roles.

### Example communication

**Initial incident update**

"EstateFlow backend is experiencing repeated container restarts in AWS EKS. We are investigating application logs, recent deployments, configuration and dependencies. Customer impact is being assessed."

**Engineering update**

"We confirmed that the backend container is repeatedly terminating. We are reviewing its previous logs and Deployment configuration to determine the cause. Healthy replicas and ALB targets are being monitored."

**Recovery update**

"The identified configuration or deployment issue has been corrected. Backend replicas are becoming Ready. We are validating API responses, error rates and restart metrics before resolving the incident."

Only send the recovery update after verifying the correction.

---

## 7. Recovery Plan

The remediation depends on the confirmed root cause.

### Option A — Roll back a bad release

If the incident started after a deployment and the previous revision is known to be healthy:

```bash
kubectl rollout history deployment/backend \
  -n real-estate-company
```

With incident approval, roll back to the verified healthy revision:

```bash
kubectl rollout undo deployment/backend \
  -n real-estate-company
```

Monitor:

```bash
kubectl rollout status deployment/backend \
  -n real-estate-company
```

Rollback is not always appropriate for database migrations or changes outside the Deployment.

### Option B — Fix application configuration

If logs prove a missing environment variable, correct the configuration in the source-of-truth manifest, Helm values, or GitOps repository.

Deploy the corrected configuration through the approved pipeline.

### Option C — Fix resource or probe problems

If evidence shows OOMKilled or probe failures, correct the resource configuration or probe settings and redeploy.

Do not increase memory limits blindly without understanding the workload.

---

## 8. Verify Service Recovery

Check the Pods:

```bash
kubectl get pods \
  -n real-estate-company
```

Check Deployment health:

```bash
kubectl rollout status deployment/backend \
  -n real-estate-company
```

```bash
kubectl get deployment backend \
  -n real-estate-company
```

Check Service endpoints:

```bash
kubectl get endpointslices \
  -n real-estate-company
```

Check application health:

```bash
curl -i http://YOUR_ALB_DNS/api/properties
```

Expected result for the working EstateFlow properties API:

```text
HTTP/1.1 200 OK
```

Verify that the response body contains the expected application data.

Also confirm:

- Healthy backend replicas meet the desired count.
- Restart counts are no longer increasing.
- ALB targets are healthy.
- API error rates return to baseline.
- Grafana alerts recover.

The incident is resolved only after recovery is verified and monitored.

---

## 9. Prevention and Follow-Up Actions

### Application improvements

- Validate required environment variables before deployment.
- Improve application startup error messages.
- Avoid unnecessary application exits during temporary database interruptions.
- Use appropriate startup, readiness and liveness probes.

### CI/CD improvements

- Add application startup tests.
- Validate required configuration in CI.
- Run smoke tests after deployment.
- Use controlled rollout strategies.
- Keep a tested rollback procedure.

### Monitoring improvements

- Alert on CrashLoopBackOff.
- Monitor container restart increases.
- Monitor unavailable replicas.
- Monitor API 5xx errors and latency.
- Track OOMKilled events and memory utilization.

### Documentation improvements

- Document troubleshooting commands.
- Record the exact root cause.
- Preserve relevant redacted logs and events.
- Record remediation and verification evidence.
- Update the on-call runbook.

---

## 10. Interview Answer — 2-Minute Version

**Interviewer: Tell me about a Kubernetes production incident you investigated.**

"In our EstateFlow AWS EKS project, we practiced investigating a backend availability incident involving CrashLoopBackOff.

The application had an AWS Application Load Balancer, frontend and backend services, and PostgreSQL running inside Kubernetes.

My first priority was to understand the impact. I checked the health of the backend replicas, the ALB targets, and the API responses.

Then I used `kubectl get pods` and `kubectl describe pod` to identify the failing container and review its restart count, termination reason, exit code, and events.

One of the most useful commands was `kubectl logs --previous` because it allowed me to investigate the previous crashed container rather than only the current restart.

I also checked recent deployment changes, environment configuration, Secrets, PostgreSQL connectivity, resource limits, and liveness probes.

The important lesson was that CrashLoopBackOff is a symptom, not a root cause. We need evidence before deciding whether to fix configuration, roll back a deployment, or investigate infrastructure.

In a real production incident, I would coordinate with the backend engineer and incident commander, apply the approved recovery action, and verify that the desired replicas are Ready, the ALB targets are healthy, and the API error rate has returned to normal.

Finally, I would document the root cause and add preventive checks to CI/CD and monitoring."

**Important:** When presenting this lab in an interview, describe it as an AWS EKS capstone incident simulation unless you have actually handled an equivalent production incident.

---

## 11. Interview Follow-Up Questions

**Q1. What is CrashLoopBackOff?**

A Kubernetes status indicating that a container is repeatedly terminating and Kubernetes is delaying subsequent restart attempts.

**Q2. What command do you run first?**

```bash
kubectl get pods -n real-estate-company
```

**Q3. How do you find why the container crashed?**

```bash
kubectl describe pod POD_NAME -n real-estate-company
kubectl logs POD_NAME -n real-estate-company --previous
```

**Q4. What does exit code 137 mean?**

The process was killed by SIGKILL. OOM is one possible cause; verify the termination reason and events.

**Q5. Can PostgreSQL cause CrashLoopBackOff?**

Yes, if database connection failures cause the backend application to exit or trigger failing probes. Database unavailability does not automatically cause CrashLoopBackOff.

**Q6. Does NetworkPolicy directly cause CrashLoopBackOff?**

Not necessarily. NetworkPolicy can block connectivity, but the application must then fail or be restarted for CrashLoopBackOff to occur.

**Q7. What is the difference between readiness and liveness probes?**

Readiness determines whether the Pod should receive Service traffic. Liveness determines whether Kubernetes should restart the container.

**Q8. Why not immediately delete the Pod?**

Deleting the Pod may temporarily remove useful diagnostic evidence and will not fix an incorrect Deployment configuration or application bug.

**Q9. When would you roll back?**

When evidence connects the failure to a recent deployment and a previous known-good revision is available.

**Q10. How do you know the incident is resolved?**

Healthy replicas, successful API requests, healthy ALB targets, stable restart metrics, and monitoring recovery.

---

## 12. Final Lessons Learned

The most important lesson from this incident is:

**CrashLoopBackOff is a symptom. The engineer's job is to determine the actual cause, restore service safely, verify recovery, and prevent recurrence.**

A strong DevOps/SRE engineer does not simply restart Pods. They investigate evidence, communicate clearly, choose the correct remediation, and document what happened.

**JumpToTech EstateFlow — Kubernetes Incident Response Training**
