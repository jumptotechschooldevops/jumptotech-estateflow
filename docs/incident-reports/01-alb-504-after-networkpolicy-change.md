# Incident 01 — HTTP 504 Gateway Timeout After Kubernetes NetworkPolicy Change

**Project:** EstateFlow — Real Estate Company  
**Platform:** AWS EKS, Kubernetes, AWS Application Load Balancer, Ingress, NetworkPolicy, PostgreSQL  
**Environment:** JumpToTech production-like training lab  
**Incident Type:** Network connectivity failure  
**Severity:** Example SEV-2 (actual severity depends on customer impact)  
**Affected Service:** EstateFlow Backend API  
**HTTP Error:** 504 Gateway Timeout  
**Root Cause Status:** NetworkPolicy is the leading suspected cause; full rollback verification was not captured in the available evidence.

---

## 1. Executive Summary

During our EstateFlow AWS EKS project, we configured a three-tier application consisting of:

- Frontend running on port 80
- Backend API running on port 4000
- PostgreSQL database running on port 5432

We used Kubernetes Ingress and an AWS Application Load Balancer (ALB) to route external traffic.

Initially, the application was accessible through the ALB.

Later, we introduced Kubernetes NetworkPolicies to control communication between application components.

Following the networking changes, we investigated an HTTP 504 Gateway Timeout affecting backend API traffic.

Our leading hypothesis was that a restrictive NetworkPolicy did not allow traffic from the ALB to reach backend Pods.

This incident demonstrates how an application can become unavailable even when Kubernetes Pods are running.

**Important:** The class evidence supports this troubleshooting hypothesis, but we should not claim that a completed rollback conclusively proved the root cause unless that test was performed and documented.

---

## 2. Application Architecture

Before the incident, the application architecture was:

```text
                    INTERNET
                       |
                       v
               AWS Load Balancer
                       |
                       v
                Kubernetes Ingress
                       |
             +---------+---------+
             |                   |
             v                   v
         / Route             /api Route
             |                   |
             v                   v
      Frontend Service      Backend Service
             |                   |
             v                   v
        Frontend Pods        Backend Pods
          Port 80             Port 4000
                                  |
                                  v
                           PostgreSQL Service
                                  |
                                  v
                            PostgreSQL Pod
                              Port 5432
                                  |
                                  v
                            EBS Storage
```

### Important Architecture Detail

Our Ingress used path-based routing:

- `/` → Frontend Service
- `/api` → Backend Service

Therefore, requests to `/api` did not pass through the frontend Pods.

The ALB forwarded API requests directly to backend targets.

This detail became extremely important when troubleshooting the NetworkPolicy.

---

## 3. What Changed Before the Incident?

We introduced Kubernetes NetworkPolicies to improve application security.

Our goal was to restrict communication between components.

For example:

- Frontend should communicate with Backend.
- Backend should communicate with PostgreSQL.
- Unauthorized workloads should not access protected services.

A representative restrictive backend policy was:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-allow-frontend
  namespace: real-estate-company
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: frontend
      ports:
        - protocol: TCP
          port: 4000
```

### What Does This Policy Mean?

This policy selects backend Pods and allows incoming connections from frontend Pods on TCP port 4000.

However, our ALB is not a frontend Pod.

The actual traffic path was:

```text
ALB → Backend Service → Backend Pod
```

The policy was designed around:

```text
Frontend Pod → Backend Pod
```

These are different network paths.

If NetworkPolicy enforcement is enabled and no other policy allows the ALB traffic, the ALB may be unable to reach the backend.

**Note:** We also used a policy named `backend-allow-alb` during the class. The exact deployed policy must be inspected before determining which rule caused a particular failure.

---

## 4. How Was the Incident Detected?

### Example Production Scenario

Imagine EstateFlow is a real production company.

A customer opens the website and tries to view available properties.

The homepage loads, but the property listing API fails.

The customer reports:

"The website opens, but I cannot see any properties."

Monitoring also detects elevated HTTP 5xx responses.

The on-call SRE receives an alert.

### First Actions

We would check the homepage:

```bash
curl -i http://ALB-DNS/
```

Then test the API:

```bash
curl -i http://ALB-DNS/api/properties
```

Possible results:

```text
GET /                 → HTTP 200 OK
GET /api/properties   → HTTP 504 Gateway Timeout
```

This tells us that the frontend route is working while the backend API route is failing.

It does not yet tell us why.

### What Does HTTP 504 Mean?

HTTP 504 Gateway Timeout means a gateway or proxy did not receive a timely response from its upstream target.

Possible causes include:

- NetworkPolicy blocking connectivity
- Security group or NACL restrictions
- Backend application hanging
- Backend dependency timeout
- Unhealthy or unreachable targets
- Network routing problems

We must investigate rather than assume the cause.

---

## 5. Incident Response — First 5 Minutes

In production, our first responsibility is to understand customer impact and coordinate the response.

### Step 1 — Acknowledge the Alert

The on-call SRE acknowledges the alert in PagerDuty or the company's incident management system.

### Step 2 — Determine Customer Impact

Questions to ask:

- Is the entire website unavailable?
- Is only the backend API failing?
- When did the problem start?
- How many customers are affected?
- Is the error happening consistently?
- Was there a deployment or configuration change?

### Step 3 — Open an Incident Channel

Example Slack channel:

`#incident-estateflow-api-504`

### Step 4 — Send the Initial Update

**Example:**

"SEV-2 investigation started. EstateFlow API requests are returning HTTP 504. Frontend availability is being checked separately. We are reviewing ALB target health, backend Pods, and recent Kubernetes networking changes. Next update in 15 minutes."

---

## 6. Troubleshooting — Step by Step

### Step 1 — Confirm the AWS Account and Cluster

Before troubleshooting, verify the environment.

```bash
aws sts get-caller-identity
```

```bash
kubectl config current-context
```

```bash
kubectl get nodes
```

This prevents troubleshooting or modifying the wrong cluster.

### Step 2 — Check Kubernetes Pods

```bash
kubectl get pods -n real-estate-company -o wide
```

During the lab, we had two frontend Pods and two backend Pods.

A healthy output might look like:

```text
NAME                 READY   STATUS
frontend-xxxxx       1/1     Running
frontend-yyyyy       1/1     Running
backend-xxxxx        1/1     Running
backend-yyyyy        1/1     Running
postgres-0           1/1     Running
```

**Interview question:**

"If all Pods are Running, why is the application unavailable?"

**Answer:**

"Running means the container is running. It does not guarantee that external clients or the load balancer can reach the application."

### Step 3 — Check Kubernetes Services

```bash
kubectl get svc -n real-estate-company
```

Then:

```bash
kubectl describe svc backend -n real-estate-company
```

Check:

- Service type
- Service selector
- Service port
- Target port
- Backend endpoints

For our application, the backend listens on TCP 4000.

### Step 4 — Check EndpointSlices

```bash
kubectl get endpointslices \
  -n real-estate-company \
  -l kubernetes.io/service-name=backend
```

EndpointSlices tell us which backend Pod IP addresses are associated with the Service.

If ready endpoints exist, Kubernetes knows where to route Service traffic.

However, that does not prove the ALB can successfully reach those Pod IPs.

### Step 5 — Check Ingress

```bash
kubectl get ingress -n real-estate-company
```

```bash
kubectl describe ingress \
  real-estate-ingress \
  -n real-estate-company
```

Verify:

```text
/       → frontend:80
/api    → backend:4000
```

This was a critical part of our investigation.

We needed to understand that `/api` traffic was routed directly to the backend.

### Step 6 — Check Backend Logs

```bash
kubectl logs \
  -n real-estate-company \
  deployment/backend \
  --tail=100
```

During the class, we observed application logs showing the backend API listening on port 4000.

That confirmed the application process had started.

It did not prove that the ALB could reach the process.

If the ALB request never reaches the backend, the application might not log the request at all.

### Step 7 — Check NetworkPolicies

```bash
kubectl get networkpolicy \
  -n real-estate-company
```

Then:

```bash
kubectl describe networkpolicy \
  -n real-estate-company
```

And:

```bash
kubectl get networkpolicy \
  -n real-estate-company \
  -o yaml
```

We investigate:

1. Which policies select backend Pods?
2. Which sources are allowed?
3. Which ports are allowed?
4. Does the policy permit the actual ALB-to-backend path?
5. Are there other policies that also allow backend ingress?

Kubernetes NetworkPolicies are additive.

That means we must inspect all applicable policies, not just one.

### Step 8 — Check Whether NetworkPolicy Is Enforced

In AWS EKS, creating a NetworkPolicy resource does not automatically prove that network restrictions are being enforced.

We must verify the networking implementation.

For Amazon VPC CNI, check its configuration and network policy agent.

```bash
kubectl get daemonset aws-node \
  -n kube-system -o yaml
```

Check the VPC CNI add-on configuration:

```bash
aws eks describe-addon \
  --cluster-name restaurant-company \
  --addon-name vpc-cni \
  --region YOUR_REGION
```

Replace `YOUR_REGION` with the actual cluster region.

An add-on configuration value of `null` does not mean the add-on is missing.

We must confirm the effective enforcement settings.

### Step 9 — Check ALB Target Health

Open:

AWS Console → EC2 → Target Groups

Select the target group used by the backend API.

Check:

- Registered backend targets
- Target IP addresses
- Target ports
- Healthy or Unhealthy status
- Health check path
- Target health reason codes

Also inspect CloudWatch metrics such as:

- `HTTPCode_ELB_5XX_Count`
- `TargetResponseTime`
- `HealthyHostCount`
- `UnHealthyHostCount`

**Important:** A Kubernetes Pod can be Ready while an ALB target is Unhealthy.

These are different health checks.

### Step 10 — Test Internal Connectivity

Create a temporary diagnostic Pod:

```bash
kubectl run net-debug \
  -n real-estate-company \
  --image=busybox:1.36 \
  --restart=Never \
  -- sleep 3600
```

Wait until it is ready:

```bash
kubectl wait \
  --for=condition=Ready \
  pod/net-debug \
  -n real-estate-company \
  --timeout=90s
```

Test DNS:

```bash
kubectl exec \
  -n real-estate-company \
  net-debug -- nslookup backend
```

Test the backend TCP port:

```bash
kubectl exec \
  -n real-estate-company \
  net-debug -- nc -z -w 5 backend 4000
```

If DNS works but TCP fails, investigate network connectivity, policy rules, and application listening behavior.

A test from a debug Pod is not identical to a test from the ALB.

We must understand which source is being tested.

Delete the diagnostic Pod after testing:

```bash
kubectl delete pod net-debug \
  -n real-estate-company
```

---

## 7. How Do We Prove NetworkPolicy Caused the Incident?

This is one of the most important interview questions.

We should not answer:

"The problem started after NetworkPolicy was applied, so NetworkPolicy definitely caused it."

That is a hypothesis, not proof.

### Evidence Required

We need to establish:

**1. Before the change**

The API was working through the ALB.

**2. After the change**

The API began returning errors.

**3. Kubernetes state**

Backend Pods remained healthy and backend endpoints were present.

**4. Policy analysis**

The policy selected backend Pods but did not allow the actual incoming ALB traffic path.

**5. Enforcement**

The EKS networking implementation was enforcing NetworkPolicies.

**6. Controlled recovery test**

With approval, we roll back the specific policy change or apply a reviewed correction.

We then repeat the same API test.

If the API recovers and no other change explains the recovery, we have much stronger evidence that the policy caused the incident.

---

## 8. How Would We Restore the Application in Production?

Our priority is to restore customer service safely.

### Option A — Roll Back the Recent NetworkPolicy Change

If the investigation identifies the newly introduced policy as the cause, coordinate an approved rollback.

For a GitOps-managed environment, prefer reverting the change in Git and synchronizing it through Argo CD.

If an emergency manual rollback is authorized, an example command is:

```bash
kubectl delete networkpolicy \
  backend-allow-frontend \
  -n real-estate-company
```

**Warning:** This is only an example for a confirmed policy name and an approved rollback. Do not delete policies blindly in production.

If Argo CD manages the policy, it may recreate the deleted resource unless the desired configuration is also corrected.

### Option B — Correct the Policy

The permanent solution should permit the intended ALB-to-backend traffic while maintaining least-privilege security.

The exact solution depends on:

- AWS VPC CNI configuration
- ALB traffic path
- Source IP preservation or translation
- AWS security groups
- NetworkPolicy implementation
- Application architecture

Do not assume a standard Kubernetes NetworkPolicy can reference an AWS security group directly.

Security and platform engineers should review the proposed fix.

### Verify Recovery

After the approved change:

```bash
kubectl get pods \
  -n real-estate-company
```

```bash
kubectl get endpointslices \
  -n real-estate-company
```

```bash
curl -i http://ALB-DNS/api/properties
```

Then verify:

- API requests return successful responses.
- ALB targets are healthy.
- HTTP 5xx error rates return to normal.
- Application latency is stable.
- Customers can complete their business workflows.

One successful `curl` is not sufficient to declare full production recovery.

---

## 9. Who Is Involved During the Incident?

| Team Member | Responsibility |
|---|---|
| Incident Commander | Coordinates the incident, establishes severity, manages communications and decisions |
| SRE / DevOps On-Call | Investigates alerts, ALB, Ingress, Services, Pods, and NetworkPolicies |
| AWS / Cloud Platform Engineer | Checks target groups, VPC networking, security groups, and CNI |
| Backend Engineer | Investigates application logs, port 4000, request handling, and application health |
| Security Engineer | Reviews the policy correction and temporary security exceptions |
| Database Engineer | Investigates PostgreSQL if evidence points to database connectivity or query failures |
| Customer Support | Communicates approved updates and gathers customer reports |

### Example Incident Communication

**SRE:**

"We confirmed that backend Pods are running and Kubernetes endpoints exist. We are investigating why the ALB cannot successfully communicate with backend targets. A recent NetworkPolicy change is a leading hypothesis."

**Cloud Platform Engineer:**

"I am checking target health, VPC CNI enforcement, security groups, and the network path from the ALB to backend Pod IPs."

**Backend Engineer:**

"I am checking API logs and application health to determine whether requests reach the backend process."

**Security Engineer:**

"I will review the proposed NetworkPolicy correction to ensure that we restore access without unnecessarily exposing the backend."

**Incident Commander:**

"We will proceed with the approved mitigation once the impact and risk are understood. We will verify recovery and provide another update in 15 minutes."

---

## 10. Root Cause Analysis

### Leading Suspected Root Cause

The Kubernetes NetworkPolicy allowed ingress to backend Pods from frontend Pods on TCP 4000.

However, the Kubernetes Ingress configuration routed `/api` requests directly from the AWS ALB to backend targets.

If the restrictive policy was enforced and no other policy allowed that traffic, the ALB-to-backend connection could be denied.

This could cause API requests to time out.

### Contributing Factors to Investigate

- NetworkPolicy was introduced without testing every application traffic path.
- The team initially focused on frontend-to-backend communication rather than ALB-to-backend communication.
- ALB target health and Kubernetes Pod readiness were not treated as separate checks.
- NetworkPolicy enforcement needed explicit verification.
- The policy change required a documented rollback and validation procedure.

### Alternative Causes to Exclude

- Backend application timeout
- Incorrect ALB health check
- Unhealthy or missing target registration
- Security group restrictions
- Wrong target port
- Network routing issues
- PostgreSQL dependency timeout

**Final RCA status:** Suspected NetworkPolicy-related connectivity failure. A documented rollback and successful retest would be required to confirm the exact cause conclusively.

---

## 11. Example Incident Timeline

The following is a sample production response timeline, not a record of exact class timestamps.

| Time | Action |
|---|---|
| 10:00 | Monitoring detects HTTP 504 errors |
| 10:03 | On-call SRE acknowledges the alert |
| 10:05 | Incident Commander assigned |
| 10:10 | SRE confirms API failure and checks backend Pods |
| 10:15 | Kubernetes Services and EndpointSlices verified |
| 10:20 | Recent NetworkPolicy change identified |
| 10:25 | Platform team verifies enforcement and network path |
| 10:30 | Approved rollback or policy correction performed |
| 10:35 | API connectivity and ALB health verified |
| 11:00 | Incident closed after monitoring confirms stability |

---

## 12. Preventive Actions

To reduce the chance of repeating this incident:

1. Document the complete traffic flow from the ALB to application Pods.
2. Test allowed and denied network connections in staging.
3. Add API synthetic monitoring through the external ALB.
4. Configure alerts for unhealthy ALB targets.
5. Validate NetworkPolicy enforcement before rollout.
6. Require peer review for network security changes.
7. Use GitOps and maintain a tested rollback procedure.
8. Add automated connectivity tests to the deployment process.
9. Document incident findings and share them with engineering teams.

---

## 13. Interview Preparation — Tell Me About an Incident

### Interviewer Question

"Tell me about a Kubernetes production incident you investigated. What was the problem, and how did you troubleshoot it?"

### Sample Answer — 90 Seconds

"In our EstateFlow production-like AWS EKS project, we investigated an HTTP 504 Gateway Timeout after introducing Kubernetes NetworkPolicies.

Our application had an AWS Application Load Balancer, Kubernetes Ingress, frontend Pods, backend API Pods, and PostgreSQL.

The Ingress used path-based routing. Requests to `/` went to the frontend, while requests to `/api` went directly to the backend Service on port 4000.

When API requests began timing out, I started by checking the ALB routing, backend Pod health, Services, and endpoints.

The backend Pods were running, so I investigated the networking layer and reviewed recent configuration changes.

We identified a possible mismatch between the NetworkPolicy and the actual traffic path.

The policy allowed traffic from frontend Pods, but the ALB was sending API traffic directly to backend Pods.

I also needed to verify that the EKS VPC CNI was enforcing NetworkPolicies.

In a real production incident, I would coordinate with the Incident Commander, cloud platform engineer, backend engineer, and security engineer.

If testing confirmed the policy was responsible, I would perform an approved rollback or correction and verify recovery using ALB target health, API responses, and monitoring metrics.

The biggest lesson was that a healthy Pod does not guarantee application availability. We must understand the complete network path and validate security changes before deploying them."

**Interview accuracy:** Present this as a production-like training incident unless you personally handled an equivalent incident in a real production environment.

---

## 14. Interview Follow-Up Questions

Students should practice answering these questions without reading notes.

1. What does HTTP 504 Gateway Timeout mean?
2. What is the difference between HTTP 502, 503, and 504?
3. Why can a Pod be Running while the application is unavailable?
4. What is the difference between an ALB and Kubernetes Ingress?
5. How does an AWS ALB route traffic to EKS Pods?
6. What is the difference between a Kubernetes Service and an EndpointSlice?
7. Why does a healthy Kubernetes endpoint not guarantee successful ALB connectivity?
8. What is a Kubernetes NetworkPolicy?
9. What does `podSelector` mean?
10. What is the difference between Ingress and Egress policies?
11. Are NetworkPolicies additive?
12. How can you verify whether AWS EKS enforces NetworkPolicies?
13. How would you prove that a NetworkPolicy caused a 504 error?
14. What is the difference between an AWS security group and a Kubernetes NetworkPolicy?
15. How would you safely roll back a NetworkPolicy managed by Argo CD?
16. How would you investigate an ALB target that is Unhealthy?
17. How do you distinguish a DNS failure from a TCP connectivity failure?
18. Who should be involved in a SEV-2 incident?
19. What information belongs in a post-incident review?
20. What monitoring and automation would prevent this issue from recurring?

---

## 15. Lessons Learned

This incident taught us several important SRE principles.

**Lesson 1 — Running does not mean reachable.**

A backend Pod can be Running and Ready while external traffic cannot reach it.

**Lesson 2 — Understand the real network path.**

We must know whether traffic travels directly from the ALB to backend Pods or passes through another application component.

**Lesson 3 — Security changes can affect availability.**

NetworkPolicies improve isolation, but incorrect rules can interrupt legitimate application traffic.

**Lesson 4 — Troubleshoot using evidence.**

We should compare application behavior, ALB health, Kubernetes resources, and recent changes before determining root cause.

**Lesson 5 — Recovery must be verified.**

A rollback is not considered successful until customer-facing functionality and monitoring confirm recovery.

**Lesson 6 — Communication is part of engineering.**

During an incident, an SRE must coordinate with engineering teams, provide clear updates, and document the final findings.

---

## 16. Evidence to Save

Save relevant, redacted screenshots and command outputs in:

`docs/incident-reports/evidence/incident-01/`

Recommended evidence includes:

- ALB HTTP 504 response
- Ingress configuration
- Backend Service configuration
- Backend EndpointSlices
- Backend Pod status and logs
- NetworkPolicy YAML
- AWS VPC CNI configuration
- ALB target health
- Git or Argo CD change history
- Approved rollback or correction
- API recovery verification

Do not include credentials, tokens, customer information, or unnecessary AWS account identifiers.

---

## Conclusion

The EstateFlow incident demonstrates how Kubernetes networking configuration can affect application availability.

The most important engineering lesson is that **a Kubernetes Pod can be healthy while the application remains inaccessible because the actual network traffic path is blocked**.

A successful SRE investigation requires understanding the architecture, collecting evidence, coordinating with the appropriate teams, restoring service safely, and verifying the result.

**Project:** JumpToTech EstateFlow  
**Incident:** 01 — ALB 504 After NetworkPolicy Change  
**Purpose:** Hands-on troubleshooting, production incident response, and DevOps/SRE interview preparation

