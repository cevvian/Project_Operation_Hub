# 🐳 Manual Docker Deployment Guide

## Tổng Quan Kiến Trúc

```
┌─────────────── YOUR VPS ────────────────────────────────────────────┐
│                                                                      │
│   Internet ──► Cloudflare ──► Nginx (80/443)                         │
│                                   │                                  │
│                    ┌──────────────┴──────────────┐                   │
│                    ▼                             ▼                   │
│            Frontend (3000)              Backend (4000)               │
│            [Next.js Container]          [NestJS Container]           │
│                                               │                      │
│                                               ▼                      │
│                                      PostgreSQL (5432)               │
│                                      [DB Container]                  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

| Service | Port | Container Name |
|---------|------|----------------|
| Nginx | 80, 443 | nginx-proxy |
| Frontend | 3000 | poh-frontend |
| Backend | 4000 | poh-backend |
| PostgreSQL | 5432 | poh-database |

---

## 📋 Prerequisites

### VPS Requirements
- **OS**: Ubuntu 22.04 LTS
- **RAM**: 2GB+
- **CPU**: 2 cores+
- **Storage**: 20GB+

### Accounts
- [ ] DockerHub account (để push images)
- [ ] Cloudflare account (miễn phí)
- [ ] Domain đã trỏ về Cloudflare

---

## Phase 1: VPS Setup

### 1.1 SSH vào VPS và Update

```bash
ssh root@your-vps-ip

# Update system
apt update && apt upgrade -y

# Install essential packages
apt install -y curl git vim htop ufw
```

### 1.2 Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Add current user to docker group
usermod -aG docker $USER

# Enable Docker on startup
systemctl enable docker
systemctl start docker

# Verify
docker --version
docker compose version
```

### 1.3 Configure Firewall

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
ufw status
```

---

## Phase 2: Build & Push Docker Images (Trên máy Local)

### 2.1 Login DockerHub

```bash
# Trên máy local
docker login
# Nhập username và password DockerHub
```

### 2.2 Build & Push Frontend

```bash
cd /path/to/project-operation-hub-ui

# Build image
docker build --platform linux/amd64 -t anhthu7/poh-frontend:v1.0 .

# Push lên DockerHub
docker push anhthu7/poh-frontend:v1.0

# Tag latest và push
docker tag anhthu7/poh-frontend:v1.0 anhthu7/poh-frontend:latest
docker push anhthu7/poh-frontend:latest
```

### 2.3 Build & Push Backend

```bash
cd /path/to/Project_Operation_Hub

# Build image
docker build --platform linux/amd64 -t anhthu7/poh-backend:v1.0 .

# Push lên DockerHub
docker push anhthu7/poh-backend:v1.0

# Tag latest và push
docker tag anhthu7/poh-backend:v1.0 anhthu7/poh-backend:latest
docker push anhthu7/poh-backend:latest
```

---

## Phase 3: Deploy trên VPS

### 3.1 Tạo thư mục deploy

```bash
# SSH vào VPS
ssh root@your-vps-ip

# Tạo thư mục
mkdir -p /opt/poh
cd /opt/poh
```

### 3.2 Tạo file .env cho Backend

```bash
cat > .env.backend <<'EOF'
# === DATABASE ===
POSTGRES_USER=postgres
POSTGRES_PASSWORD=251204
POSTGRES_DB=project_operation_hub
DB_HOST=poh-database
DB_PORT=5432

# === APPLICATION ===
API_PORT=4000
NODE_ENV=production
APP_FRONTEND_URL=https://yourdomain.com

# === AUTHENTICATION (JWT) ===
JWT_ACCESS_TOKEN_SECRET=your-super-secret-access-token-key-here-make-it-long
JWT_REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-here-make-it-long
JWT_EMAIL_VERIFICATION_SECRET=your-super-secret-email-verification-key
JWT_PASSWORD_RESET_SECRET=your-super-secret-password-reset-key
JWT_ACCESS_TOKEN_EXPIRATION=15m
JWT_REFRESH_TOKEN_EXPIRATION=7d

# === GITHUB INTEGRATION ===
GITHUB_TOKEN=your_github_token
GITHUB_ORG=your_org
GITHUB_WEBHOOK_SECRET=your_webhook_secret
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_CALLBACK_URL=https://api.yourdomain.com/auth/github/callback

# === GOOGLE OAUTH ===
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://api.yourdomain.com/auth/google/redirect

# === EMAIL (SMTP) ===
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# === CLOUDINARY ===
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
EOF
```

### 3.3 Tạo file .env cho Frontend

```bash
cat > .env.frontend <<'EOF'
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
EOF
```

### 3.4 Tạo Docker Compose file

```bash
cat > docker-compose.yml <<'EOF'
version: "3.8"

services:
  # ============ DATABASE ============
  database:
    image: postgres:16-alpine
    container_name: poh-database
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-251204}
      POSTGRES_DB: ${POSTGRES_DB:-project_operation_hub}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - poh-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ============ BACKEND ============
  backend:
    image: anhthu7/poh-backend:latest
    container_name: poh-backend
    restart: unless-stopped
    env_file:
      - .env.backend
    ports:
      - "4000:4000"
    depends_on:
      database:
        condition: service_healthy
    networks:
      - poh-network

  # ============ FRONTEND ============
  frontend:
    image: anhthu7/poh-frontend:latest
    container_name: poh-frontend
    restart: unless-stopped
    env_file:
      - .env.frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - poh-network

  # ============ NGINX ============
  nginx:
    image: nginx:alpine
    container_name: poh-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - backend
    networks:
      - poh-network

volumes:
  postgres_data:

networks:
  poh-network:
    driver: bridge
EOF
```

### 3.5 Tạo Nginx Configuration

```bash
mkdir -p nginx/ssl

cat > nginx/nginx.conf <<'EOF'
events {
    worker_connections 1024;
}

http {
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    # Upstream servers
    upstream frontend {
        server poh-frontend:3000;
    }

    upstream backend {
        server poh-backend:4000;
    }

    # ==== HTTP (redirect to HTTPS) ====
    server {
        listen 80;
        server_name yourdomain.com api.yourdomain.com;
        
        # For Cloudflare SSL (return 301 for redirect)
        # If using Cloudflare Flexible SSL, keep this as proxy
        location / {
            return 301 https://$host$request_uri;
        }
    }

    # ==== FRONTEND (yourdomain.com) ====
    server {
        listen 443 ssl http2;
        server_name yourdomain.com;

        # SSL certificates (from Cloudflare Origin CA or Let's Encrypt)
        ssl_certificate /etc/nginx/ssl/origin.pem;
        ssl_certificate_key /etc/nginx/ssl/origin.key;

        # SSL settings
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }

    # ==== BACKEND API (api.yourdomain.com) ====
    server {
        listen 443 ssl http2;
        server_name api.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/origin.pem;
        ssl_certificate_key /etc/nginx/ssl/origin.key;

        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # API rate limiting
        limit_req zone=api burst=20 nodelay;

        location / {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;

            # CORS headers (if needed)
            add_header Access-Control-Allow-Origin "https://yourdomain.com" always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;

            if ($request_method = OPTIONS) {
                return 204;
            }
        }
    }
}
EOF
```

---

## Phase 4: Cloudflare Configuration

### 4.1 Tạo Origin CA Certificate

1. Đăng nhập **Cloudflare Dashboard**
2. Chọn domain → **SSL/TLS** → **Origin Server**
3. Click **Create Certificate**
4. Chọn:
   - RSA (2048)
   - Hostnames: `*.yourdomain.com`, `yourdomain.com`
   - Validity: 15 years
5. Copy **Origin Certificate** và **Private Key**

### 4.2 Save Certificates trên VPS

```bash
# Paste Origin Certificate
cat > /opt/poh/nginx/ssl/origin.pem <<'EOF'
-----BEGIN CERTIFICATE-----
... paste certificate here ...
-----END CERTIFICATE-----
EOF

# Paste Private Key
cat > /opt/poh/nginx/ssl/origin.key <<'EOF'
-----BEGIN PRIVATE KEY-----
... paste private key here ...
-----END PRIVATE KEY-----
EOF

# Set permissions
chmod 600 /opt/poh/nginx/ssl/origin.key
```

### 4.3 Configure DNS Records

Trong Cloudflare Dashboard → DNS:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | @ | your-vps-ip | ☁️ Proxied |
| A | api | your-vps-ip | ☁️ Proxied |
| A | www | your-vps-ip | ☁️ Proxied |

### 4.4 SSL/TLS Settings

Trong Cloudflare → SSL/TLS:
- **SSL mode**: Full (strict)
- **Always Use HTTPS**: ON
- **Minimum TLS Version**: 1.2

---

## Phase 5: Start Deployment

### 5.1 Pull Images và Start

```bash
cd /opt/poh

# Login DockerHub (nếu images private)
docker login

# Pull images
docker compose pull

# Start all services
docker compose up -d

# Check status
docker compose ps
docker compose logs -f
```

### 5.2 Verify Deployment

```bash
# Check containers running
docker ps

# Test locally
curl http://localhost:3000  # Frontend
curl http://localhost:4000  # Backend
curl http://localhost:4000/api/health  # Health check (if exists)

# Check logs
docker compose logs frontend
docker compose logs backend
docker compose logs nginx
```

### 5.3 Test từ Browser

- Frontend: `https://yourdomain.com`
- Backend API: `https://api.yourdomain.com`

---

## 🔄 Update Deployment

Khi có code mới, thực hiện các bước sau:

### Trên máy Local:

```bash
# 1. Build image mới
docker build --platform linux/amd64 -t anhthu7/poh-frontend:v1.1 ./project-operation-hub-ui
docker build --platform linux/amd64 -t anhthu7/poh-backend:v1.1 ./Project_Operation_Hub

# 2. Push lên DockerHub
docker push anhthu7/poh-frontend:v1.1
docker push anhthu7/poh-backend:v1.1

# 3. Update tag latest
docker tag anhthu7/poh-frontend:v1.1 anhthu7/poh-frontend:latest
docker tag anhthu7/poh-backend:v1.1 anhthu7/poh-backend:latest
docker push anhthu7/poh-frontend:latest
docker push anhthu7/poh-backend:latest
```

### Trên VPS:

```bash
cd /opt/poh

# Pull images mới
docker compose pull

# Restart với zero-downtime
docker compose up -d --force-recreate

# Verify
docker compose ps
docker compose logs -f --tail=50
```

---

## 🛠️ Troubleshooting

### Database Connection Error

```bash
# Check database is running
docker compose logs database

# Connect to database
docker exec -it poh-database psql -U postgres -d project_operation_hub

# Check tables
\dt
```

### Nginx Errors

```bash
# Test nginx config
docker exec poh-nginx nginx -t

# Check logs
docker compose logs nginx

# Reload config
docker exec poh-nginx nginx -s reload
```

### Container Crashes

```bash
# Check logs
docker compose logs <service-name>

# Restart specific service
docker compose restart <service-name>

# Full restart
docker compose down && docker compose up -d
```

### Check Disk Space

```bash
# Check disk usage
df -h

# Clean unused images
docker system prune -a
```

---

## 📁 Final Directory Structure

```
/opt/poh/
├── docker-compose.yml
├── .env.backend
├── .env.frontend
└── nginx/
    ├── nginx.conf
    └── ssl/
        ├── origin.pem
        └── origin.key
```

---

## ✅ Deployment Checklist

- [ ] VPS setup với Docker
- [ ] Firewall configured (80, 443)
- [ ] DockerHub login
- [ ] Frontend image built & pushed
- [ ] Backend image built & pushed
- [ ] `.env.backend` configured
- [ ] `.env.frontend` configured
- [ ] `docker-compose.yml` created
- [ ] Nginx config created
- [ ] Cloudflare Origin CA certificates
- [ ] DNS records configured
- [ ] SSL mode: Full (strict)
- [ ] `docker compose up -d`
- [ ] Test https://yourdomain.com
- [ ] Test https://api.yourdomain.com

---

*Last Updated: January 2026*
