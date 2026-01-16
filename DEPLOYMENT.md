# Deployment Guide

Complete guide for deploying the X Content to PDF Converter to production.

## Table of Contents

1. [Backend Deployment](#backend-deployment)
2. [iOS App Distribution](#ios-app-distribution)
3. [Production Checklist](#production-checklist)
4. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Backend Deployment

### Option 1: Docker Deployment (Recommended)

#### Prerequisites
- Docker and Docker Compose installed
- Server with at least 1GB RAM and 1 CPU core

#### Steps

1. **Clone repository on server:**
```bash
git clone https://github.com/yourusername/X-Converter.git
cd X-Converter
```

2. **Configure environment:**
```bash
# Create production .env
cat > backend/.env << EOF
NODE_ENV=production
PORT=3000
TEMP_DIR=/tmp/x-converter
MAX_PROCESSING_TIME=30000
EOF
```

3. **Build and start:**
```bash
docker-compose up -d
```

4. **Verify deployment:**
```bash
# Check status
docker-compose ps

# Check logs
docker-compose logs -f

# Test health endpoint
curl http://localhost:3000/health
```

#### Updating

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

### Option 2: AWS Deployment

#### AWS ECS with Fargate

1. **Build and push Docker image:**
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build image
docker build -t x-converter:latest .

# Tag image
docker tag x-converter:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/x-converter:latest

# Push image
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/x-converter:latest
```

2. **Create ECS Task Definition:**
```json
{
  "family": "x-converter",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "x-converter",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/x-converter:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3000"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/x-converter",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

3. **Create ECS Service with ALB**

4. **Configure CloudWatch for logging**

#### AWS Lambda (for low-traffic scenarios)

Not recommended due to Puppeteer cold start times and memory requirements.

### Option 3: Google Cloud Run

1. **Build and push:**
```bash
# Configure gcloud
gcloud auth configure-docker

# Build
gcloud builds submit --tag gcr.io/PROJECT-ID/x-converter

# Deploy
gcloud run deploy x-converter \
  --image gcr.io/PROJECT-ID/x-converter \
  --platform managed \
  --region us-central1 \
  --memory 1Gi \
  --timeout 300 \
  --set-env-vars NODE_ENV=production
```

2. **Allow public access:**
```bash
gcloud run services add-iam-policy-binding x-converter \
  --region us-central1 \
  --member="allUsers" \
  --role="roles/run.invoker"
```

### Option 4: DigitalOcean App Platform

1. **Create app.yaml:**
```yaml
name: x-converter
services:
- name: backend
  dockerfile_path: Dockerfile
  source_dir: /
  github:
    repo: yourusername/X-Converter
    branch: main
    deploy_on_push: true
  http_port: 3000
  instance_count: 1
  instance_size_slug: basic-xs
  env:
  - key: NODE_ENV
    value: production
  - key: PORT
    value: "3000"
  health_check:
    http_path: /health
```

2. **Deploy via DigitalOcean dashboard or CLI**

### Option 5: Heroku

1. **Create app:**
```bash
heroku create x-converter-app
```

2. **Add buildpacks:**
```bash
heroku buildpacks:add heroku/nodejs
heroku buildpacks:add jontewks/puppeteer
```

3. **Configure:**
```bash
heroku config:set NODE_ENV=production
heroku config:set PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

4. **Deploy:**
```bash
git push heroku main
```

---

## iOS App Distribution

### Prerequisites

- Apple Developer Account ($99/year)
- Xcode 15+
- Valid signing certificates
- App Store Connect access

### Step 1: Prepare for Distribution

1. **Update version and build numbers:**
   - Main app: General → Identity → Version/Build
   - Share Extension: Ensure version matches

2. **Configure signing:**
   - Automatically manage signing (recommended)
   - Or manual signing with distribution certificate

3. **Update Info.plist:**
   - Correct bundle identifier
   - Privacy descriptions
   - Required device capabilities

4. **App Icons:**
   - Create app icons (1024x1024 for App Store)
   - Add to Assets.xcassets

### Step 2: Archive the App

1. **Select target:**
   - Product → Scheme → Edit Scheme
   - Set Build Configuration to "Release"

2. **Archive:**
   - Product → Archive
   - Wait for build to complete

3. **Validate:**
   - Click "Validate App"
   - Fix any issues

### Step 3: Distribute

#### Option A: TestFlight (Beta Testing)

1. **Upload to App Store Connect:**
   - Click "Distribute App"
   - Select "App Store Connect"
   - Upload

2. **Add testers:**
   - Go to App Store Connect
   - TestFlight tab
   - Add internal/external testers

3. **Submit for review (external testing):**
   - Provide testing information
   - Wait for approval (usually 24-48 hours)

#### Option B: App Store

1. **Create App Store listing:**
   - App Store Connect → My Apps → + (New App)
   - Fill in metadata:
     - Name: X Converter
     - Category: Productivity or Utilities
     - Description
     - Keywords
     - Screenshots (required for all supported device sizes)

2. **Upload build:**
   - Select build from TestFlight

3. **Submit for review:**
   - Complete app review information
   - Export compliance information
   - Advertising identifier usage
   - Submit

4. **Wait for approval:**
   - Typically 24-48 hours
   - May require additional information

#### Option C: Enterprise Distribution

1. **Build with enterprise certificate**

2. **Export IPA:**
   - Organizer → Distribute App
   - Select "Enterprise"
   - Export

3. **Distribute via MDM or web hosting**

### Step 4: Post-Submission

1. **Monitor status in App Store Connect**

2. **Respond to App Review feedback if needed**

3. **Release when approved:**
   - Automatic release
   - Or manual release

---

## Production Checklist

### Backend

- [ ] Environment variables configured
- [ ] SSL/TLS certificate installed (HTTPS)
- [ ] Firewall rules configured
- [ ] Health check endpoint working
- [ ] Logging configured
- [ ] Error monitoring setup (e.g., Sentry)
- [ ] Rate limiting implemented (if needed)
- [ ] CORS properly configured
- [ ] Temp directory cleanup scheduled
- [ ] Backup strategy in place

### iOS App

- [ ] Backend server URL updated to production
- [ ] App icons added
- [ ] Launch screen configured
- [ ] Privacy policy URL added
- [ ] App Store screenshots created
- [ ] App description written
- [ ] Keywords optimized
- [ ] Support URL provided
- [ ] Version number updated
- [ ] All certificates valid

### Security

- [ ] API endpoint uses HTTPS
- [ ] Input validation in place
- [ ] No secrets in code
- [ ] Dependencies up to date
- [ ] Security headers configured
- [ ] Rate limiting (if applicable)

### Legal

- [ ] Privacy policy created
- [ ] Terms of service (if needed)
- [ ] Copyright notices
- [ ] Third-party licenses acknowledged

---

## Monitoring & Maintenance

### Backend Monitoring

#### Metrics to Track

- Request rate
- Response time
- Error rate
- PDF generation success rate
- Memory usage
- CPU usage
- Disk usage (temp directory)

#### Recommended Tools

- **CloudWatch** (AWS)
- **Stackdriver** (Google Cloud)
- **Datadog**
- **New Relic**
- **Prometheus + Grafana**

#### Sample CloudWatch Alarms

```bash
# High error rate
aws cloudwatch put-metric-alarm \
  --alarm-name x-converter-high-error-rate \
  --alarm-description "Alert when error rate exceeds 5%" \
  --metric-name Errors \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold

# High memory usage
aws cloudwatch put-metric-alarm \
  --alarm-name x-converter-high-memory \
  --alarm-description "Alert when memory exceeds 80%" \
  --metric-name MemoryUtilization \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

### iOS App Monitoring

#### Metrics via App Store Connect

- Crashes
- Energy usage
- Download/install rate
- User ratings/reviews

#### Crash Reporting

Consider integrating:
- Firebase Crashlytics
- Sentry
- Bugsnag

### Maintenance Tasks

#### Weekly

- [ ] Review error logs
- [ ] Check server health
- [ ] Monitor disk space

#### Monthly

- [ ] Update dependencies
- [ ] Review performance metrics
- [ ] Analyze user feedback

#### Quarterly

- [ ] Security audit
- [ ] Cost optimization review
- [ ] Feature planning

---

## Scaling Considerations

### Horizontal Scaling

For high traffic:

1. **Load balancer** in front of multiple backend instances
2. **Redis** for caching converted PDFs (optional)
3. **Queue system** (Bull, RabbitMQ) for processing

### Vertical Scaling

Increase server resources:
- More CPU cores for Puppeteer
- More RAM for concurrent conversions
- Faster storage for temp files

### CDN

Serve static files via CDN if applicable

---

## Backup & Disaster Recovery

### Backend

- Database backups (if added in future)
- Configuration backups
- Docker image versioning
- Infrastructure as Code (Terraform/CloudFormation)

### iOS App

- Source code in version control
- Signed IPAs archived
- Certificates and provisioning profiles backed up

---

## Support & Troubleshooting

### Common Production Issues

**High memory usage:**
- Restart service
- Check for memory leaks
- Increase server resources

**Puppeteer timeouts:**
- Check X website availability
- Increase timeout values
- Verify network connectivity

**iOS conversion failures:**
- Check backend server accessibility
- Verify SSL certificate validity
- Review backend logs

### Support Channels

1. GitHub Issues
2. Email support
3. Community forum (if applicable)

---

## Rollback Plan

If deployment fails:

### Backend

```bash
# Docker
docker-compose down
git checkout <previous-commit>
docker-compose up -d

# Or revert to previous Docker image
docker pull <previous-image-tag>
docker-compose up -d
```

### iOS App

1. Remove version from App Store Connect
2. Submit previous version
3. Or fix issues and resubmit

---

## Cost Estimation

### Backend (AWS Example)

- **ECS Fargate:** ~$15-30/month (minimal traffic)
- **ALB:** ~$20/month
- **Data transfer:** Variable
- **CloudWatch:** ~$5/month

**Total: ~$40-60/month**

### iOS

- **Apple Developer:** $99/year
- **TestFlight:** Free
- **App Store:** Free (30% commission on in-app purchases)

---

## Additional Resources

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Apple App Distribution Guide](https://developer.apple.com/app-store/submissions/)
- [Puppeteer Documentation](https://pptr.dev/)
