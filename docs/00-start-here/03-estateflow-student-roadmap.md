# JumpToTech DevOps/SRE Capstone Project: EstateFlow — Enterprise AWS EKS, CI/CD, Production Operations & Incident Response

**Level:** Beginner to Advanced DevOps/SRE  
**Project:** EstateFlow — Real Estate Management Platform  
**Environment:** Local Docker Compose and AWS EKS Training Environment  
**Roles:** DevOps Engineer, Site Reliability Engineer, Platform Engineer

## 1. Welcome to EstateFlow

Imagine you have joined a real estate technology company as a DevOps Engineer.

The developers have already built an application where customers can browse properties, view listings, and manage real estate information.

Your responsibility is to take ownership of the infrastructure and deployment process.

You will learn how to:

- Understand an existing application and its dependencies.
- Run the application locally using Docker Compose.
- Build and test Docker images.
- Automate CI/CD with GitHub Actions.
- Deploy containerized workloads to Amazon EKS.
- Configure networking, storage, and AWS permissions.
- Troubleshoot real-world Kubernetes incidents.
- Perform daily operational checks.
- Communicate during incidents and document your findings.
- Prepare for technical DevOps/SRE interviews.

**This is not just a Kubernetes deployment exercise. It is an end-to-end engineering training project.**

## 2. GitHub Repository — Source of Truth

All application code, infrastructure configurations, scripts, and detailed engineering documentation are maintained in the EstateFlow GitHub repository.

**GitHub Repository:** [JumpToTech EstateFlow](https://github.com/jumptotechschooldevops/jumptotech-estateflow)

**Start Here:** [Engineering Documentation](https://github.com/jumptotechschooldevops/jumptotech-estateflow/tree/main/docs)

This DEV Community article explains the project, engineering responsibilities, learning path, and practical scenarios.

For exact deployment commands, Kubernetes manifests, CI/CD configuration, and troubleshooting procedures, follow the GitHub documentation.

## 3. Understand the Application Architecture

EstateFlow is a full-stack property listing application.

| Component | Technology | Responsibility |
|---|---|---|
| Frontend | React, TypeScript, Vite, NGINX | User interface |
| Backend | Node.js, Express | REST API and business logic |
| Database | PostgreSQL | Persistent property data |
| Cache | Redis | Cache property reads |
| Containers | Docker | Package application services |
| Local environment | Docker Compose | Run application dependencies together |
| Cloud platform | AWS EKS | Kubernetes orchestration |
| Container registry | Amazon ECR | Store container images |
| Persistent storage | Amazon EBS | Store PostgreSQL data |
| Image storage | Amazon S3 | Store property images |
| CI/CD | GitHub Actions | Build, test, scan, and deploy |
| Security | IAM, IRSA, NetworkPolicy | Control access and communication |

### Request flow

For local Docker Compose development:

Browser → NGINX Frontend → Express Backend → PostgreSQL / Redis

NGINX serves the frontend application and proxies `/api/*` requests to the backend.

For the AWS EKS environment, the repository provides Kubernetes resources for frontend, backend, PostgreSQL, Redis, Services, Ingress, and NetworkPolicy.

The exact external request path depends on the deployed Ingress and load balancer configuration.

## 4. Phase One — Start Like a DevOps Engineer

In a real engineering team, your first responsibility is to understand the environment before making changes.

Verify your tools:

```bash
aws --version
kubectl version --client
docker --version
git --version
```

Verify your AWS identity:

```bash
aws sts get-caller-identity
```

Verify the Kubernetes environment:

```bash
kubectl config current-context
kubectl get nodes
kubectl get pods -A
```

**Interview question:**

What do you check before making changes to production infrastructure?

**Example answer:**

"First, I verify the AWS account, region, Kubernetes context, and namespace. Then I review the health of the application, recent deployments, and existing incidents. I want to understand the current state before making changes."

## 5. Phase Two — Run EstateFlow Locally

The repository provides a Docker Compose environment containing frontend, backend, PostgreSQL, and Redis.

Clone the repository and open the project directory.

```bash
cp .env.example .env
docker compose config
docker compose up --build -d
docker compose ps
```

The default local application URLs are:

- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:5000/api`
- API through NGINX: `http://localhost:8080/api`

Test the application:

```bash
curl -i http://localhost:8080
curl -i http://localhost:8080/api/health
curl -i http://localhost:8080/api/properties
```

### Engineering responsibility

Do not immediately blame Kubernetes when an application fails.

First verify whether the application works in a controlled local environment.

This helps distinguish application problems from infrastructure problems.

## 6. Phase Three — CI/CD and Container Security

The repository includes GitHub Actions workflows:

- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml`

Students should inspect these workflows to understand the actual build, test, security, and deployment stages.

Important concepts include:

- Pull requests and code review
- Automated tests and linting
- Docker image builds
- Container vulnerability scanning
- Amazon ECR
- AWS authentication
- Deployment automation
- Rollback planning

### Interview question

What happens when a developer creates a pull request?

**Example answer:**

"Our CI pipeline validates the code before it is merged. We run the configured checks, including tests and security scanning. If a required check fails, we investigate before allowing the change to proceed."

## 7. Phase Four — Deploy to Amazon EKS

The repository maintains Kubernetes configurations under:

`infra/k8s/`

These include:

- Namespace and application configuration
- Kubernetes Secrets example
- PostgreSQL StatefulSet
- Redis
- Backend and frontend Deployments
- Ingress
- Horizontal Pod Autoscaler
- NetworkPolicy
- Kustomize configuration

Start with the repository's `infra/k8s/README.md` and deployment guides.

Before deploying, verify your AWS account, cluster, namespace, image references, storage requirements, and permissions.

**Important:** The existence of a Kubernetes YAML file does not prove that a resource is deployed or healthy. Students must validate the actual environment.

## 8. Phase Five — Kubernetes Networking

A DevOps Engineer must understand how applications communicate.

Key topics include:

- Pod IP addresses
- ClusterIP Services
- Headless Services
- CoreDNS
- Kubernetes Endpoints and EndpointSlices
- Ingress
- AWS Application Load Balancer
- NetworkPolicy
- Security Groups
- TCP ports and DNS resolution

### Practical troubleshooting scenario

A backend application cannot connect to PostgreSQL.

The PostgreSQL Service exists, but the application reports database connectivity failures.

What should you investigate?

First, establish the actual failure.

```bash
kubectl get pods -n YOUR_NAMESPACE
kubectl get svc -n YOUR_NAMESPACE
kubectl get endpointslice -n YOUR_NAMESPACE
```

Check Pod events and application logs.

```bash
kubectl describe pod YOUR_POSTGRES_POD -n YOUR_NAMESPACE
kubectl logs YOUR_BACKEND_POD -n YOUR_NAMESPACE
```

Then investigate DNS resolution, TCP connectivity, NetworkPolicy, and database authentication as indicated by the symptoms.

**Interview answer:**

"I troubleshoot the connection layer by layer. I first confirm that the database Pod is scheduled and healthy, and that the Service has ready endpoints. Then I test DNS resolution and TCP connectivity. If networking works, I investigate credentials, database configuration, and application logs."

## 9. Phase Six — PostgreSQL and Persistent Storage

PostgreSQL requires persistent storage because database information must survive container replacement.

The EstateFlow Kubernetes configuration uses a StatefulSet with a PersistentVolumeClaim.

Students should understand:

- StatefulSet versus Deployment
- PersistentVolume and PersistentVolumeClaim
- StorageClass
- Amazon EBS CSI driver
- ReadWriteOnce
- Availability Zones
- Volume attachment and scheduling

### Incident scenario — PostgreSQL Pending

During a practical Kubernetes troubleshooting session, we investigated a PostgreSQL Pod that remained in `Pending`.

The PersistentVolume was bound to an EBS volume in `us-east-1d`, but the existing worker nodes were located in other Availability Zones.

The Kubernetes scheduler could not place the Pod on a compatible node.

The investigation included:

```bash
kubectl describe pod postgres-0 -n real-estate-company
kubectl get pvc -n real-estate-company
kubectl describe pv YOUR_PV_NAME
kubectl get nodes -L topology.kubernetes.io/zone
```

The recovery approach was to add a compatible EKS worker node in the same Availability Zone as the EBS volume.

### Interview question

Why can a PostgreSQL Pod remain Pending even when its PVC is Bound?

**Example answer:**

"A bound PVC does not guarantee that Kubernetes can schedule the Pod. For zonal EBS storage, the Pod must run on a compatible node in the same Availability Zone as the volume. I check Pod scheduling events, PV node affinity, and worker node zones before changing infrastructure."

Never delete a production database PVC or EBS volume as an initial troubleshooting step.

## 10. Phase Seven — Daily DevOps/SRE Operations

The repository includes a dedicated daily operations section:

`docs/03-daily-operations/`

Students should practice operational routines such as:

- Checking cluster and application health
- Reviewing failed workloads
- Inspecting recent deployments
- Investigating events and logs
- Checking infrastructure dependencies
- Recording operational findings
- Escalating issues to the appropriate engineering team

The objective is to learn how engineers maintain an application after deployment, not just how they deploy it once.

## 11. Phase Eight — Incident Response and Runbooks

The repository contains:

`docs/04-runbooks/`  
`docs/05-incident-management/`  
`docs/14-incident-simulations/`

The incident simulation section includes 10 gradable exercises.

Students practice the engineering workflow:

**Detect → Investigate → Communicate → Mitigate → Verify → Document**

During an incident, technical commands are only part of the job.

You must also understand:

- Incident severity
- Ownership and escalation
- Communication with developers and other teams
- Customer impact
- Safe mitigation
- Verification of service restoration
- Post-incident documentation

### Interview question

What do you do when a production application becomes unavailable?

**Example answer:**

"I first confirm the incident and assess its impact. I check monitoring, application health, recent deployments, and infrastructure dependencies. I communicate the situation to the responsible teams, work on a safe mitigation, and verify recovery. After the incident, I document the root cause, timeline, and preventive actions."

## 12. Phase Nine — Monitoring and Observability

The repository includes:

`docs/08-monitoring-and-observability/`

This section distinguishes existing capabilities from proposed improvements.

Students should learn to interpret:

- Application availability
- Pod readiness and restarts
- CPU and memory utilization
- Deployment health
- Application logs
- Metrics and alerts
- Service Level Indicators and Service Level Objectives

Do not claim a monitoring integration is operational until it has been configured and tested.

## 13. Phase Ten — Change Management and Engineering Documentation

Production engineering requires controlled changes.

The repository includes:

`docs/06-engineering-records/`  
`docs/07-change-management/`  
`docs/11-handover/`

Students should practice documenting:

- What changed
- Why the change was necessary
- Who reviewed it
- Expected impact
- Verification results
- Rollback procedures
- Remaining risks

A successful deployment is not complete until its outcome is verified and communicated.

## 14. Phase Eleven — Interview Preparation

The EstateFlow repository contains dedicated interview preparation materials:

`docs/10-interview-preparation/`  
`docs/15-star-interview-portfolio/`  
`docs/16-student-portfolios/`

Students can prepare answers using the technical work they actually completed.

For every lab, practice explaining:

1. What was the problem?
2. How did you detect it?
3. Which commands did you run?
4. What did the results tell you?
5. How did you resolve the problem?
6. How did you verify the solution?
7. How would you prevent the issue from happening again?

Use the STAR method to organize real experiences into interview stories.

Do not present a simulated incident as a real production outage. Explain clearly that it was a production-style training environment.

## 15. Recommended Student Learning Paths

The repository supports three different reading paths.

### Path A — New DevOps Engineer

Start with onboarding, architecture, deployment, daily operations, runbooks, engineering records, change management, student labs, and assessments.

### Path B — On-Call / SRE

Focus on daily operations, runbooks, incident management, monitoring, incident simulations, and shift handover.

### Path C — Interview Preparation

Study architecture, deployment guides, runbooks, the end-to-end capstone lab, interview questions, STAR stories, and portfolio documentation.

These paths are documented in `docs/README.md`.

## 16. Student Assessments and Portfolio

EstateFlow includes student assessments, a scoring rubric, and an end-to-end capstone exercise.

Students should build a portfolio that demonstrates:

- Technical understanding
- Hands-on deployment experience
- Troubleshooting methodology
- Incident communication
- Engineering documentation
- Interview readiness

The public repository contains student-facing materials. Instructor-only answers and grading guidance are maintained separately.

## 17. Final Project Objective

By the end of the EstateFlow capstone, students should be able to explain and demonstrate how a DevOps/SRE Engineer works across the application lifecycle.

That includes understanding the application, managing infrastructure, deploying changes, responding to incidents, communicating with teams, and documenting engineering decisions.

The goal is not to memorize Kubernetes commands.

**The goal is to develop the judgment and troubleshooting skills required to operate real systems.**

---

### Project Resources

**GitHub:** [JumpToTech EstateFlow](https://github.com/jumptotechschooldevops/jumptotech-estateflow)

**Complete documentation:** `docs/README.md`

**Kubernetes configurations:** `infra/k8s/`

**CI/CD:** `.github/workflows/`

**Incident simulations:** `docs/14-incident-simulations/`

**Interview preparation:** `docs/10-interview-preparation/`

*JumpToTech — Learn DevOps by building, operating, troubleshooting, and documenting real-world-style systems.*
