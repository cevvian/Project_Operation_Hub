# 🚀 Complete Deployment Guide: K3s + Jenkins + ArgoCD

## Mục Lục
1. [Tổng Quan Kiến Trúc](#-tổng-quan-kiến-trúc)
2. [Prerequisites](#-prerequisites)
3. [Phase 1: Setup K3s Cluster](#-phase-1-setup-k3s-cluster)
4. [Phase 2: Setup Jenkins](#-phase-2-setup-jenkins)
5. [Phase 3: Setup ArgoCD](#-phase-3-setup-argocd)
6. [Phase 4: CI/CD Pipeline Hoàn Chỉnh](#-phase-4-cicd-pipeline-hoàn-chỉnh)
7. [Phase 5: Deploy Project Operation Hub](#-phase-5-deploy-project-operation-hub)
8. [Troubleshooting](#-troubleshooting)

---

## 🎯 Tổng Quan Kiến Trúc

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DEVELOPER WORKFLOW                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Developer → Git Push → GitHub/GitLab                                       │
│                              │                                               │
│                              ▼                                               │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                        CI PIPELINE (Jenkins)                          │  │
│   │  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌───────────────────────┐ │  │
│   │  │  Clone  │ → │  Test   │ → │  Build  │ → │ Push to Registry      │ │  │
│   │  │  Code   │   │  Code   │   │  Image  │   │ (DockerHub/Harbor)    │ │  │
│   │  └─────────┘   └─────────┘   └─────────┘   └───────────────────────┘ │  │
│   │                                                       │              │  │
│   │                                       Update Git Manifests           │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                                       │                      │
│                                                       ▼                      │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                        CD PIPELINE (ArgoCD)                           │  │
│   │  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐  │  │
│   │  │   Watch Git      │ → │   Compare State  │ → │   Sync to K8s    │  │  │
│   │  │   Manifests      │   │   (Diff)         │   │   Cluster        │  │  │
│   │  └──────────────────┘   └──────────────────┘   └──────────────────┘  │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                                       │                      │
│                                                       ▼                      │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                        K3s CLUSTER (VPS)                              │  │
│   │  ┌────────────────────────────────────────────────────────────────┐  │  │
│   │  │  Namespaces:                                                    │  │  │
│   │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │  │  │
│   │  │  │  production │  │   staging   │  │ devops (jenkins/argocd) │ │  │  │
│   │  │  └─────────────┘  └─────────────┘  └─────────────────────────┘ │  │  │
│   │  └────────────────────────────────────────────────────────────────┘  │  │
│   │  ┌────────────────────────────────────────────────────────────────┐  │  │
│   │  │  Ingress Controller (Traefik - built into K3s)                  │  │  │
│   │  │  → app.yourdomain.com → Production                              │  │  │
│   │  │  → staging.yourdomain.com → Staging                             │  │  │
│   │  │  → jenkins.yourdomain.com → Jenkins                             │  │  │
│   │  │  → argocd.yourdomain.com → ArgoCD                               │  │  │
│   │  └────────────────────────────────────────────────────────────────┘  │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Separation of Concerns

| Component | Role | Responsibility |
|-----------|------|----------------|
| **GitHub** | Source Control | Store code & K8s manifests |
| **Jenkins** | CI (Continuous Integration) | Build, Test, Push Images |
| **ArgoCD** | CD (Continuous Delivery) | Deploy to K8s, GitOps |
| **K3s** | Runtime | Run containers, networking, storage |
| **Traefik** | Ingress | Route traffic, SSL termination |

---

## 📋 Prerequisites

### VPS Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| **CPU** | 2 cores | 4 cores |
| **RAM** | 4 GB | 8 GB |
| **Storage** | 40 GB SSD | 80 GB SSD |
| **OS** | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| **Network** | Public IP | Public IP + Domain |

### Domain Setup (Recommended)

```
yourdomain.com
├── app.yourdomain.com      → Production app
├── staging.yourdomain.com  → Staging app
├── jenkins.yourdomain.com  → Jenkins UI
├── argocd.yourdomain.com   → ArgoCD UI
└── registry.yourdomain.com → Private Docker Registry (optional)
```

### Accounts Needed

- [ ] **GitHub Account** - Code repository
- [ ] **DockerHub Account** - Container registry (free tier: 1 private repo)
- [ ] **Domain** - Optional but recommended for SSL

---

## 🔧 Phase 1: Setup K3s Cluster

### Step 1.1: Prepare VPS

```bash
# SSH vào VPS
ssh root@your-vps-ip

# Update system
apt update && apt upgrade -y

# Install essential tools
apt install -y curl wget git vim htop

# Disable swap (K8s không thích swap)
swapoff -a
sed -i '/swap/d' /etc/fstab

# Configure firewall
ufw allow 6443/tcp  # K8s API
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 10250/tcp # Kubelet
ufw enable
```

### Step 1.2: Install K3s

```bash
# Install K3s (single node, with Traefik Ingress)
curl -sfL https://get.k3s.io | sh -s - \
  --write-kubeconfig-mode 644 \
  --disable traefik \
  --tls-san your-vps-ip \
  --tls-san yourdomain.com

# Wait for K3s to start
systemctl status k3s

# Verify installation
kubectl get nodes
# Output: NAME   STATUS   ROLES                  AGE   VERSION
#         vps    Ready    control-plane,master   1m    v1.28.x
```

> **Note**: Chúng ta disable Traefik mặc định và sẽ cài version mới hơn sau.

### Step 1.3: Install Traefik (Ingress Controller)

```bash
# Add Traefik Helm repo
curl https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 | bash
helm repo add traefik https://traefik.github.io/charts
helm repo update

# Install Traefik
kubectl create namespace traefik
helm install traefik traefik/traefik \
  --namespace traefik \
  --set ports.web.exposedPort=80 \
  --set ports.websecure.exposedPort=443 \
  --set ingressRoute.dashboard.enabled=true

# Verify
kubectl get pods -n traefik
kubectl get svc -n traefik
```

### Step 1.4: Setup Cert-Manager (SSL/TLS)

```bash
# Install cert-manager for automatic SSL
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Wait for pods to be ready
kubectl wait --for=condition=Ready pods --all -n cert-manager --timeout=300s

# Create ClusterIssuer for Let's Encrypt
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@domain.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: traefik
EOF
```

### Step 1.5: Create Namespaces

```bash
# Create namespaces for different environments
kubectl create namespace production
kubectl create namespace staging
kubectl create namespace devops

# Label for ArgoCD
kubectl label namespace production app=project-operation-hub
kubectl label namespace staging app=project-operation-hub-staging
```

---

## 🔨 Phase 2: Setup Jenkins

### Step 2.1: Tạo Persistent Storage

```bash
# Create PVC for Jenkins data
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: jenkins-pvc
  namespace: devops
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 20Gi
  storageClassName: local-path
EOF
```

### Step 2.2: Deploy Jenkins via Helm

```bash
# Add Jenkins Helm repo
helm repo add jenkins https://charts.jenkins.io
helm repo update

# Create values file
cat > jenkins-values.yaml <<EOF
controller:
  image: jenkins/jenkins
  tag: lts-jdk17
  
  # Admin credentials
  adminUser: admin
  adminPassword: "YourSecurePassword123!"
  
  # Resources
  resources:
    requests:
      cpu: "500m"
      memory: "1Gi"
    limits:
      cpu: "2000m"
      memory: "4Gi"
  
  # Plugins to install
  installPlugins:
    - kubernetes:latest
    - workflow-aggregator:latest
    - git:latest
    - github:latest
    - github-branch-source:latest
    - docker-workflow:latest
    - configuration-as-code:latest
    - job-dsl:latest
    - blueocean:latest
    - credentials-binding:latest
    - pipeline-stage-view:latest
  
  # Ingress
  ingress:
    enabled: true
    ingressClassName: traefik
    hostName: jenkins.yourdomain.com
    annotations:
      cert-manager.io/cluster-issuer: letsencrypt-prod
    tls:
      - secretName: jenkins-tls
        hosts:
          - jenkins.yourdomain.com

  # ServiceAccount for K8s access
  serviceAccount:
    create: true
    name: jenkins

persistence:
  enabled: true
  existingClaim: jenkins-pvc

agent:
  enabled: true
  image: jenkins/inbound-agent
  tag: latest
  resources:
    requests:
      cpu: "200m"
      memory: "256Mi"
    limits:
      cpu: "1000m"
      memory: "1Gi"
EOF

# Install Jenkins
helm install jenkins jenkins/jenkins \
  -n devops \
  -f jenkins-values.yaml

# Get admin password
kubectl exec -n devops -it svc/jenkins -c jenkins -- /bin/cat /run/secrets/additional/chart-admin-password && echo
```

### Step 2.3: Configure Jenkins Credentials

Sau khi Jenkins khởi động, truy cập `jenkins.yourdomain.com` và thêm credentials:

1. **DockerHub Credentials**
   - Navigate: Manage Jenkins → Credentials → Global
   - Add: Username/Password
   - ID: `dockerhub-credentials`

2. **GitHub Token**
   - Navigate: Manage Jenkins → Credentials → Global
   - Add: Secret text
   - ID: `github-token`
   - Secret: Your GitHub Personal Access Token

3. **Kubeconfig** (for kubectl commands)
   - Navigate: Manage Jenkins → Credentials → Global
   - Add: Secret file
   - ID: `kubeconfig`
   - File: `/etc/rancher/k3s/k3s.yaml` from VPS

---

## 🔄 Phase 3: Setup ArgoCD

### Step 3.1: Install ArgoCD

```bash
# Create namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for pods
kubectl wait --for=condition=Ready pods --all -n argocd --timeout=300s
```

### Step 3.2: Configure Ingress for ArgoCD

```bash
cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: argocd-ingress
  namespace: argocd
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    traefik.ingress.kubernetes.io/router.entrypoints: websecure
    traefik.ingress.kubernetes.io/router.tls: "true"
spec:
  ingressClassName: traefik
  tls:
    - hosts:
        - argocd.yourdomain.com
      secretName: argocd-tls
  rules:
    - host: argocd.yourdomain.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: argocd-server
                port:
                  number: 443
EOF
```

### Step 3.3: Get ArgoCD Admin Password

```bash
# Get initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d && echo

# Or using ArgoCD CLI
# Install CLI first
curl -sSL -o argocd-linux-amd64 https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
install -m 555 argocd-linux-amd64 /usr/local/bin/argocd
rm argocd-linux-amd64

# Login
argocd login argocd.yourdomain.com --username admin --password <password>

# Change password
argocd account update-password
```

### Step 3.4: Connect GitHub Repository

```bash
# Add Git repository (SSH method)
argocd repo add git@github.com:your-username/project-operation-hub.git \
  --ssh-private-key-path ~/.ssh/id_rsa

# Or HTTPS with token
argocd repo add https://github.com/your-username/project-operation-hub.git \
  --username your-username \
  --password <github-token>
```

### Step 3.5: Create ArgoCD Application

```bash
cat <<EOF | kubectl apply -f -
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: project-operation-hub-prod
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/your-username/project-operation-hub.git
    targetRevision: main
    path: k8s/production  # Path to K8s manifests
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
---
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: project-operation-hub-staging
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/your-username/project-operation-hub.git
    targetRevision: develop
    path: k8s/staging
  destination:
    server: https://kubernetes.default.svc
    namespace: staging
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
EOF
```

---

## 🔗 Phase 4: CI/CD Pipeline Hoàn Chỉnh

### Repository Structure

```
project-operation-hub/
├── src/                        # Application source code
├── Dockerfile                  # Docker build instructions
├── Jenkinsfile                 # CI Pipeline definition
├── k8s/                        # Kubernetes manifests (for ArgoCD)
│   ├── base/                   # Base manifests
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── ingress.yaml
│   │   └── kustomization.yaml
│   ├── production/             # Production overlays
│   │   ├── kustomization.yaml
│   │   └── patches/
│   └── staging/                # Staging overlays
│       ├── kustomization.yaml
│       └── patches/
└── docker-compose.yml          # Local development
```

### Step 4.1: Create Dockerfile

```dockerfile
# /project-operation-hub-ui/Dockerfile

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

**Lưu ý**: Cần thêm vào `next.config.ts`:

```typescript
// next.config.ts
const nextConfig = {
  output: 'standalone',
  // ... other configs
}
```

### Step 4.2: Create Jenkinsfile

```groovy
// Jenkinsfile
pipeline {
    agent {
        kubernetes {
            yaml '''
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: docker
    image: docker:24-dind
    securityContext:
      privileged: true
    volumeMounts:
    - name: docker-socket
      mountPath: /var/run/docker.sock
  - name: kubectl
    image: bitnami/kubectl:latest
    command:
    - cat
    tty: true
  volumes:
  - name: docker-socket
    hostPath:
      path: /var/run/docker.sock
'''
        }
    }
    
    environment {
        DOCKER_REGISTRY = 'docker.io'
        DOCKER_REPO = 'your-dockerhub-username/project-operation-hub'
        DOCKER_CREDENTIALS = credentials('dockerhub-credentials')
        GITHUB_TOKEN = credentials('github-token')
        IMAGE_TAG = "${env.BUILD_NUMBER}-${env.GIT_COMMIT.take(7)}"
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT_MSG = sh(
                        script: 'git log -1 --pretty=%B',
                        returnStdout: true
                    ).trim()
                }
            }
        }
        
        stage('Install Dependencies') {
            steps {
                container('docker') {
                    sh '''
                        docker run --rm -v $(pwd):/app -w /app node:20-alpine npm ci
                    '''
                }
            }
        }
        
        stage('Lint & Test') {
            steps {
                container('docker') {
                    sh '''
                        docker run --rm -v $(pwd):/app -w /app node:20-alpine npm run lint || true
                        docker run --rm -v $(pwd):/app -w /app node:20-alpine npm run test || true
                    '''
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                container('docker') {
                    sh '''
                        docker build -t ${DOCKER_REPO}:${IMAGE_TAG} .
                        docker tag ${DOCKER_REPO}:${IMAGE_TAG} ${DOCKER_REPO}:latest
                    '''
                }
            }
        }
        
        stage('Push to Registry') {
            steps {
                container('docker') {
                    sh '''
                        echo ${DOCKER_CREDENTIALS_PSW} | docker login -u ${DOCKER_CREDENTIALS_USR} --password-stdin
                        docker push ${DOCKER_REPO}:${IMAGE_TAG}
                        docker push ${DOCKER_REPO}:latest
                    '''
                }
            }
        }
        
        stage('Update K8s Manifests') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                script {
                    def targetPath = env.BRANCH_NAME == 'main' ? 'k8s/production' : 'k8s/staging'
                    
                    sh '''
                        git config user.email "jenkins@yourdomain.com"
                        git config user.name "Jenkins CI"
                        
                        # Update image tag in kustomization
                        cd ${targetPath}
                        sed -i "s|newTag:.*|newTag: ${IMAGE_TAG}|g" kustomization.yaml
                        
                        git add .
                        git commit -m "ci: Update image to ${IMAGE_TAG}"
                        git push https://${GITHUB_TOKEN}@github.com/your-username/project-operation-hub.git HEAD:${BRANCH_NAME}
                    '''
                }
            }
        }
    }
    
    post {
        success {
            echo "✅ Pipeline completed successfully!"
            // Optionally notify Slack/Discord
        }
        failure {
            echo "❌ Pipeline failed!"
            // Optionally notify Slack/Discord
        }
        always {
            container('docker') {
                sh 'docker logout || true'
            }
        }
    }
}
```

### Step 4.3: Create Kubernetes Manifests

**Base Deployment (`k8s/base/deployment.yaml`):**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: project-operation-hub
  labels:
    app: project-operation-hub
spec:
  replicas: 2
  selector:
    matchLabels:
      app: project-operation-hub
  template:
    metadata:
      labels:
        app: project-operation-hub
    spec:
      containers:
        - name: app
          image: your-dockerhub-username/project-operation-hub:latest
          ports:
            - containerPort: 3000
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
          livenessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
          env:
            - name: NODE_ENV
              value: "production"
```

**Base Service (`k8s/base/service.yaml`):**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: project-operation-hub
spec:
  selector:
    app: project-operation-hub
  ports:
    - port: 80
      targetPort: 3000
  type: ClusterIP
```

**Base Ingress (`k8s/base/ingress.yaml`):**

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: project-operation-hub
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: traefik
  tls:
    - hosts:
        - app.yourdomain.com
      secretName: app-tls
  rules:
    - host: app.yourdomain.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: project-operation-hub
                port:
                  number: 80
```

**Base Kustomization (`k8s/base/kustomization.yaml`):**

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - deployment.yaml
  - service.yaml
  - ingress.yaml
```

**Production Overlay (`k8s/production/kustomization.yaml`):**

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: production

resources:
  - ../base

images:
  - name: your-dockerhub-username/project-operation-hub
    newTag: latest  # This gets updated by Jenkins

replicas:
  - name: project-operation-hub
    count: 3

patches:
  - patch: |
      - op: replace
        path: /spec/rules/0/host
        value: app.yourdomain.com
    target:
      kind: Ingress
      name: project-operation-hub
```

**Staging Overlay (`k8s/staging/kustomization.yaml`):**

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: staging

resources:
  - ../base

images:
  - name: your-dockerhub-username/project-operation-hub
    newTag: latest

replicas:
  - name: project-operation-hub
    count: 1

patches:
  - patch: |
      - op: replace
        path: /spec/rules/0/host
        value: staging.yourdomain.com
    target:
      kind: Ingress
      name: project-operation-hub
```

---

## 🎯 Phase 5: Deploy Project Operation Hub

### Complete Workflow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         COMPLETE CI/CD FLOW                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  1. Developer pushes code to GitHub                                       │
│     │                                                                     │
│     ▼                                                                     │
│  2. GitHub Webhook triggers Jenkins                                       │
│     │                                                                     │
│     ▼                                                                     │
│  3. Jenkins Pipeline:                                                     │
│     ├── Clone repository                                                  │
│     ├── Install dependencies                                              │
│     ├── Run linting & tests                                              │
│     ├── Build Docker image                                               │
│     ├── Push image to DockerHub (tag: build-123-abc1234)                 │
│     └── Update k8s/production/kustomization.yaml with new tag           │
│     │                                                                     │
│     ▼                                                                     │
│  4. Jenkins commits & pushes manifest changes to GitHub                   │
│     │                                                                     │
│     ▼                                                                     │
│  5. ArgoCD detects manifest changes (auto-sync enabled)                   │
│     │                                                                     │
│     ▼                                                                     │
│  6. ArgoCD applies new manifests to K3s cluster                          │
│     │                                                                     │
│     ▼                                                                     │
│  7. K3s pulls new image and performs rolling update                       │
│     │                                                                     │
│     ▼                                                                     │
│  8. Application is live at app.yourdomain.com! ✅                         │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

### Step 5.1: Setup GitHub Webhook for Jenkins

1. Go to GitHub Repository → Settings → Webhooks
2. Add webhook:
   - Payload URL: `https://jenkins.yourdomain.com/github-webhook/`
   - Content type: `application/json`
   - Events: `Push events`, `Pull request events`

### Step 5.2: Create Jenkins Pipeline Job

1. Jenkins → New Item → Pipeline
2. Name: `project-operation-hub`
3. Configure:
   - GitHub project: `https://github.com/your-username/project-operation-hub`
   - Pipeline from SCM: Git
   - Repository URL: `https://github.com/your-username/project-operation-hub.git`
   - Credentials: Your GitHub credentials
   - Branch: `*/main`, `*/develop`
   - Script Path: `Jenkinsfile`

### Step 5.3: Verify ArgoCD Sync

```bash
# Check application status
argocd app list

# Output:
# NAME                          CLUSTER                         NAMESPACE   STATUS  HEALTH
# project-operation-hub-prod    https://kubernetes.default.svc  production  Synced  Healthy
# project-operation-hub-staging https://kubernetes.default.svc  staging     Synced  Healthy

# Force sync if needed
argocd app sync project-operation-hub-prod
```

### Step 5.4: Verify Deployment

```bash
# Check pods
kubectl get pods -n production

# Check services
kubectl get svc -n production

# Check ingress
kubectl get ingress -n production

# Test endpoint
curl https://app.yourdomain.com
```

---

## 🛠️ Troubleshooting

### K3s Issues

```bash
# Check K3s logs
journalctl -u k3s -f

# Check node status
kubectl get nodes -o wide

# Check all pods
kubectl get pods -A

# Describe failed pod
kubectl describe pod <pod-name> -n <namespace>
```

### Jenkins Issues

```bash
# Check Jenkins pod logs
kubectl logs -n devops -l app.kubernetes.io/name=jenkins -f

# Restart Jenkins
kubectl rollout restart deployment jenkins -n devops

# Access Jenkins shell
kubectl exec -it -n devops svc/jenkins -- /bin/bash
```

### ArgoCD Issues

```bash
# Check ArgoCD logs
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-server -f

# Check application sync status
argocd app get project-operation-hub-prod

# Force hard refresh
argocd app refresh project-operation-hub-prod --hard

# Delete and resync
argocd app delete project-operation-hub-prod
argocd app sync project-operation-hub-prod
```

### Common Fixes

| Issue | Solution |
|-------|----------|
| Pod stuck in `Pending` | Check resources: `kubectl describe pod` |
| ImagePullBackOff | Check image name and registry credentials |
| CrashLoopBackOff | Check container logs: `kubectl logs` |
| Ingress not working | Verify Traefik is running, check DNS |
| SSL certificate error | Check cert-manager logs and ClusterIssuer |

---

## 📊 Monitoring (Bonus)

### Setup Prometheus + Grafana (Optional)

```bash
# Add Helm repos
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install kube-prometheus-stack
helm install monitoring prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set grafana.ingress.enabled=true \
  --set grafana.ingress.hosts[0]=grafana.yourdomain.com
```

---

## 🎉 Summary

Sau khi hoàn thành guide này, bạn sẽ có:

- ✅ **K3s Cluster** chạy trên VPS
- ✅ **Traefik** xử lý ingress và SSL
- ✅ **Jenkins** cho CI (build, test, push)
- ✅ **ArgoCD** cho CD (GitOps deployment)
- ✅ **Automatic SSL** với Let's Encrypt
- ✅ **Multi-environment** (production + staging)
- ✅ **Zero-downtime deployments** với rolling updates

### Next Steps

1. 📝 Tạo Dockerfile cho project
2. 📝 Setup GitHub repository với đúng structure
3. 🚀 Deploy K3s lên VPS
4. ⚙️ Install Jenkins + ArgoCD
5. 🔗 Setup webhooks và pipelines
6. ✨ Push code và xem magic happen!

---

*Document created: January 2026*
*Author: AI Assistant*
*Version: 1.0*
