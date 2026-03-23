# Deployment Guide

This guide covers deploying Tempus Engine to production environments.

## Table of Contents

- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Cloud Providers](#cloud-providers)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Security Considerations](#security-considerations)
- [Monitoring](#monitoring)
- [Backup and Recovery](#backup-and-recovery)

## Docker Deployment

### Quick Start with Docker Compose

```bash
# Clone the repository
git clone https://github.com/JPatronC92/tempus-engine.git
cd tempus-engine

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start services
docker compose up -d

# Run migrations
docker compose exec api alembic upgrade head
```

### Production Docker Configuration

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - tempus-network

  api:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    environment:
      - DATABASE_URL=postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db/${POSTGRES_DB}
      - SECRET_KEY=${SECRET_KEY}
      - ENVIRONMENT=production
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "8000:8000"
    networks:
      - tempus-network
    restart: unless-stopped

volumes:
  postgres_data:

networks:
  tempus-network:
    driver: bridge
```

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (1.24+)
- kubectl configured
- Helm 3.x (optional)

### Basic Kubernetes Manifests

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: tempus-engine
```

```yaml
# k8s/postgres.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: tempus-engine
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:16-alpine
          env:
            - name: POSTGRES_USER
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: username
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: password
            - name: POSTGRES_DB
              value: tempus_db
          volumeMounts:
            - name: postgres-storage
              mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
    - metadata:
        name: postgres-storage
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 10Gi
```

```yaml
# k8s/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tempus-api
  namespace: tempus-engine
spec:
  replicas: 3
  selector:
    matchLabels:
      app: tempus-api
  template:
    metadata:
      labels:
        app: tempus-api
    spec:
      containers:
        - name: api
          image: ghcr.io/jpatronc92/tempus-engine:latest
          ports:
            - containerPort: 8000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: api-secrets
                  key: database-url
            - name: SECRET_KEY
              valueFrom:
                secretKeyRef:
                  name: api-secrets
                  key: secret-key
          resources:
            requests:
              memory: "512Mi"
              cpu: "500m"
            limits:
              memory: "1Gi"
              cpu: "1000m"
```

Deploy to Kubernetes:

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/postgres-secret.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/api-secrets.yaml
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/api-service.yaml
```

## Cloud Providers

### AWS Deployment

#### ECS with Fargate

```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name tempus-engine

# Create task definition
aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json

# Create service
aws ecs create-service \
  --cluster tempus-engine \
  --service-name tempus-api \
  --task-definition tempus-api \
  --desired-count 2 \
  --launch-type FARGATE
```

#### RDS PostgreSQL

```bash
aws rds create-db-instance \
  --db-instance-identifier tempus-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 16.1 \
  --master-username postgres \
  --master-user-password YOUR_PASSWORD \
  --allocated-storage 20
```

### Google Cloud Platform

#### Cloud Run

```bash
# Build and push container
gcloud builds submit --tag gcr.io/PROJECT_ID/tempus-engine

# Deploy to Cloud Run
gcloud run deploy tempus-api \
  --image gcr.io/PROJECT_ID/tempus-engine \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL=postgresql://...
```

#### Cloud SQL

```bash
gcloud sql instances create tempus-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=us-central1
```

### Azure

#### Container Instances

```bash
az container create \
  --resource-group myResourceGroup \
  --name tempus-api \
  --image ghcr.io/jpatronc92/tempus-engine:latest \
  --cpu 1 \
  --memory 1 \
  --ports 8000 \
  --environment-variables DATABASE_URL=postgresql://...
```

## Environment Configuration

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/tempus_db
# OR
POSTGRES_USER=postgres
POSTGRES_PASSWORD=secure_password
POSTGRES_SERVER=localhost
POSTGRES_DB=tempus_db

# Security
SECRET_KEY=your-super-secret-key-min-32-chars
ENVIRONMENT=production

# Optional
LOG_LEVEL=INFO
MAX_CONNECTIONS=100
RATE_LIMIT_PER_MINUTE=60
```

### Generating a Secure Secret Key

```bash
# Generate a secure random key
openssl rand -hex 32

# Or using Python
python -c "import secrets; print(secrets.token_hex(32))"
```

## Database Setup

### PostgreSQL Configuration

```sql
-- Create database
CREATE DATABASE tempus_db;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create user (optional, for better security)
CREATE USER tempus_app WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE tempus_db TO tempus_app;
```

### Connection Pooling with PgBouncer

```ini
# pgbouncer.ini
[databases]
tempus_db = host=localhost port=5432 dbname=tempus_db

[pgbouncer]
listen_port = 6432
listen_addr = 127.0.0.1
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
```

### Database Migrations

```bash
# Run migrations
alembic upgrade head

# Check current version
alembic current

# Rollback one migration
alembic downgrade -1

# Create new migration
alembic revision --autogenerate -m "description"
```

## Security Considerations

### HTTPS/TLS

Always use HTTPS in production. Configure TLS termination at:
- Load balancer (AWS ALB, NGINX, Traefik)
- Reverse proxy
- Application level (not recommended for performance)

### Secrets Management

#### Using AWS Secrets Manager

```python
import boto3
from src.core.config import Settings

def get_secret():
    client = boto3.client('secretsmanager')
    response = client.get_secret_value(SecretId='tempus-engine/prod')
    return response['SecretString']
```

#### Using HashiCorp Vault

```python
import hvac

client = hvac.Client(url='https://vault.example.com')
client.token = 'your-token'
secret = client.secrets.kv.v2.read_secret_version(path='tempus-engine')
```

### Network Security

- Use private subnets for databases
- Configure security groups/firewall rules
- Enable VPC flow logs
- Use service mesh for microservices

### API Security

- Rate limiting: 100 requests/minute per API key
- Input validation using Pydantic schemas
- SQL injection prevention via SQLAlchemy
- XSS protection via FastAPI defaults

## Monitoring

### Health Checks

```bash
# Liveness probe
GET /health/live

# Readiness probe
GET /health/ready

# Full health check
GET /health
```

### Metrics with Prometheus

```python
# Add to src/core/metrics.py
from prometheus_client import Counter, Histogram, generate_latest

REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests')
REQUEST_LATENCY = Histogram('http_request_duration_seconds', 'HTTP request latency')

@app.middleware("http")
async def metrics_middleware(request, call_next):
    REQUEST_COUNT.inc()
    with REQUEST_LATENCY.time():
        response = await call_next(request)
    return response
```

### Logging

```python
import logging
import structlog

structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)
```

### Distributed Tracing with Jaeger

```python
from opentelemetry import trace
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

provider = TracerProvider()
processor = BatchSpanProcessor(
    JaegerExporter(
        agent_host_name="jaeger",
        agent_port=6831,
    )
)
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)
```

## Backup and Recovery

### PostgreSQL Backups

#### Automated Backups with pg_dump

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
FILENAME="tempus_db_$DATE.sql"

pg_dump -h $POSTGRES_SERVER -U $POSTGRES_USER -d $POSTGRES_DB \
  | gzip > "$BACKUP_DIR/$FILENAME.gz"

# Keep only last 7 days
find $BACKUP_DIR -name "tempus_db_*.sql.gz" -mtime +7 -delete
```

#### Point-in-Time Recovery (PITR)

```bash
# Enable WAL archiving
# postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /backups/wal/%f'
max_wal_senders = 3
```

### Disaster Recovery

1. **RPO (Recovery Point Objective)**: 1 hour
2. **RTO (Recovery Time Objective)**: 30 minutes
3. **Backup Strategy**:
   - Full backup: Daily at 2 AM
   - Incremental: WAL archiving continuous
   - Test restore: Weekly

### Database Migration to Production

```bash
# 1. Create migration script
pg_dump -h staging -U postgres tempus_db --schema-only > schema.sql

# 2. Apply to production
psql -h production -U postgres tempus_db < schema.sql

# 3. Migrate data (for specific tables)
pg_dump -h staging -U postgres tempus_db --data-only -t pricing_schemes > data.sql
psql -h production -U postgres tempus_db < data.sql
```

## Performance Tuning

### Database Optimization

```sql
-- Index for time-range queries
CREATE INDEX CONCURRENTLY idx_rule_versions_vigencia
ON pricing_rule_versions USING gist (vigencia);

-- Index for tenant lookups
CREATE INDEX CONCURRENTLY idx_schemes_tenant
ON pricing_schemes (tenant_id);

-- Vacuum and analyze
VACUUM ANALYZE;
```

### Application-Level Caching

```python
# Redis caching for rules
import redis
from functools import wraps

redis_client = redis.Redis(host='redis', port=6379, db=0)

def cached_rule(ttl=300):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cache_key = f"rule:{args[0]}"
            cached = redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
            result = await func(*args, **kwargs)
            redis_client.setex(cache_key, ttl, json.dumps(result))
            return result
        return wrapper
    return decorator
```

## Troubleshooting

### Common Issues

#### Database Connection Errors

```
Error: connection refused
Solution: Check PostgreSQL is running and accessible
```

#### Migration Failures

```bash
# Check migration status
alembic history --verbose

# Manual fix
docker compose exec db psql -U postgres -d tempus_db
UPDATE alembic_version SET version_num = 'correct_version';
```

#### Memory Issues

```bash
# Check memory usage
docker stats tempus-api

# Adjust worker processes
# In docker-compose.yml:
# command: uvicorn src.interfaces.api.main:app --workers 2
```

## Support

For deployment issues:
- Check [GitHub Issues](https://github.com/JPatronC92/tempus-engine/issues)
- Review [Documentation](https://github.com/JPatronC92/tempus-engine/tree/main/docs)
- Join [GitHub Discussions](https://github.com/JPatronC92/tempus-engine/discussions)
