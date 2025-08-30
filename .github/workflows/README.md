# GitHub Actions Workflows

This repository contains three GitHub Actions workflows for CI/CD, testing, and security scanning.

## 🔄 Workflows Overview

### 1. **Deploy Docker App to Azure** (`deploy.yml`)
- **Trigger**: Push to `master`/`main` branches
- **Purpose**: Build Docker image and deploy to Azure Web App for Containers
- **Features**: 
  - Multi-stage Docker build with caching
  - Push to Azure Container Registry
  - Deploy to Azure Web App
  - Health check after deployment

### 2. **Test Application** (`test.yml`)
- **Trigger**: Pull requests and pushes to feature branches
- **Purpose**: Run unit tests and generate coverage reports
- **Features**:
  - Node.js 20.x setup
  - Prisma client generation
  - Test execution with coverage
  - Codecov integration

### 3. **Security Scan** (`security.yml`)
- **Trigger**: Weekly schedule (Mondays) and manual dispatch
- **Purpose**: Security vulnerability scanning
- **Features**:
  - Trivy vulnerability scanner
  - npm audit
  - Snyk security checks
  - GitHub Security tab integration

## 🔐 Required Secrets

### Azure Container Registry
```bash
REGISTRY_USERNAME=your-acr-username
REGISTRY_PASSWORD=your-acr-password
```

### Azure Web App
```bash
AZUREAPPSERVICE_CLIENTID=your-client-id
AZUREAPPSERVICE_TENANTID=your-tenant-id
AZUREAPPSERVICE_SECRET=your-client-secret
AZUREAPPSERVICE_SUBSCRIPTIONID=your-subscription-id
```

### Security Tools (Optional)
```bash
SNYK_TOKEN=your-snyk-token
```

## 🚀 Deployment Process

1. **Build Stage**: 
   - Checkout code
   - Setup Docker Buildx
   - Login to Azure Container Registry
   - Build and push Docker image with tags

2. **Deploy Stage**:
   - Login to Azure
   - Deploy to Azure Web App for Containers
   - Health check verification

## 📊 Monitoring

- **Deployment Status**: Check Actions tab for build/deploy status
- **Security Issues**: View in GitHub Security tab
- **Test Coverage**: Available in Codecov
- **Container Health**: Built-in health check endpoint

## 🔧 Customization

### Environment Variables
Update the `env` section in `deploy.yml`:
```yaml
env:
  REGISTRY: your-registry.azurecr.io
  IMAGE_NAME: your-app-name
  AZURE_WEBAPP_NAME: your-webapp-name
```

### Branch Protection
Consider enabling branch protection rules:
- Require status checks to pass
- Require branches to be up to date
- Restrict pushes to protected branches

## 📝 Notes

- All workflows use minimal permissions
- Docker builds are cached for faster builds
- Security scans run weekly to catch vulnerabilities
- Health checks ensure deployment success
- Workflows are designed to be production-ready 