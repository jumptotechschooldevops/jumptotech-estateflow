# EstateFlow — Student Quick Start Guide

## 1. Prerequisites

Install the following tools:

- Git
- Docker Desktop
- Docker Compose v2.24.4 or newer
- VS Code or another code editor
- curl
- jq (optional, for formatting JSON)

No AWS account is required for this local lab.

## 2. Clone the repository

git clone https://github.com/jumptotechschooldevops/jumptotech-estateflow.git
cd jumptotech-estateflow
git switch main

## 3. Configure the environment

Copy the example environment file:

    cp .env.example .env

The default credentials are for local learning only.

Never commit your .env file or AWS credentials.

## 4. Start the application

Make sure Docker Desktop is running.

Validate the configuration:

    docker compose -p estateflow-student -f docker-compose.yml -f compose.student.yaml config --quiet

Build and start the application:

    docker compose -p estateflow-student -f docker-compose.yml -f compose.student.yaml up -d --build

## 5. Verify the containers

    docker compose -p estateflow-student -f docker-compose.yml -f compose.student.yaml ps

All four containers should become healthy:

- frontend
- backend
- db
- cache

## 6. Application endpoints

| Component | Address |
|---|---|
| Frontend | http://localhost:8085 |
| Swagger UI | http://localhost:5005/api/docs/ |
| OpenAPI JSON | http://localhost:5005/api/openapi.json |
| Backend health | http://localhost:5005/api/health |
| Properties API | http://localhost:5005/api/properties |
| PostgreSQL | localhost:5435 |
| Redis | localhost:6381 |

The student configuration uses fixed localhost ports.
If a port is occupied, adjust compose.student.yaml.

## 7. Test the application

Check backend health:

    curl -fsS http://localhost:5005/api/health

Expected response:

    {"status":"ok","db":"up","redis":"up"}

Check the property records:

    curl -fsS http://localhost:5005/api/properties

Check the frontend:

    curl -I http://localhost:8085/

Check Nginx API routing:

    curl -fsS http://localhost:8085/api/health

Check Swagger:

    curl -fsS http://localhost:5005/api/openapi.json

## 8. View application logs

    docker compose -p estateflow-student -f docker-compose.yml -f compose.student.yaml logs backend

    docker compose -p estateflow-student -f docker-compose.yml -f compose.student.yaml logs db

    docker compose -p estateflow-student -f docker-compose.yml -f compose.student.yaml logs cache

    docker compose -p estateflow-student -f docker-compose.yml -f compose.student.yaml logs frontend

## 9. Stop the application

    docker compose -p estateflow-student -f docker-compose.yml -f compose.student.yaml down

PostgreSQL data is preserved in the Docker volume.

To start again, repeat the startup command.

Do not use down -v unless you intentionally want
to delete your local database.

## 10. Security notes

- Swagger is enabled only for local learning.
- Published ports are restricted to localhost.
- AWS credentials are not required.
- S3 image operations are disabled in this lab.
- The shared admin token is for training only.
- Do not deploy to the instructor's AWS environment.
- Never use production credentials in this lab.

## 11. Learning objectives

After completing this lab, students should understand:

- Docker images and containers
- Docker Compose
- Container networking and port mapping
- Environment variables
- PostgreSQL persistent volumes
- Redis caching
- REST APIs and Swagger
- Nginx reverse proxy
- Application health checks
- Basic application troubleshooting

JumpToTech DevOps Training
