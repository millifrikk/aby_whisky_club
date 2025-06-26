# Åby Whisky Club - Production Deployment Guide

## Overview

This guide covers the complete production deployment of the Åby Whisky Club application on Ubuntu Server 24.* with Docker, SSL, and production-grade security.

## Prerequisites

- Ubuntu Server 24.* with sudo access
- Domain name pointing to your server
- User account with Docker permissions
- SSH access to the server

## Quick Start

```bash
# Clone the repository
git clone git@github.com:millifrikk/aby_whisky_club.git
cd aby_whisky_club

# Update deployment script with your domain
sed -i 's/your-domain.com/yourdomain.com/g' deploy.sh

# Run deployment
./deploy.sh
```

## Manual Deployment Steps

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y git curl wget unzip nginx certbot python3-certbot-nginx

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Directory Structure Setup

```bash
# Create application directory
sudo mkdir -p /opt/aby-whisky-club/{app,data/{postgres,redis,uploads},config/{nginx/{conf.d},ssl,env},logs/{nginx,backend},backups,scripts}

# Set ownership and permissions
sudo chown -R whisky-club:docker /opt/aby-whisky-club/app
sudo chown -R 999:999 /opt/aby-whisky-club/data
sudo chown -R root:root /opt/aby-whisky-club/config
sudo chown -R whisky-club:docker /opt/aby-whisky-club/logs
sudo chown -R whisky-club:docker /opt/aby-whisky-club/backups
```

### 3. Application Deployment

```bash
# Clone repository
cd /opt/aby-whisky-club/app
git clone git@github.com:millifrikk/aby_whisky_club.git .

# Copy configuration files
sudo cp nginx.prod.conf /opt/aby-whisky-club/config/nginx/nginx.conf
sudo cp nginx-site.prod.conf /opt/aby-whisky-club/config/nginx/conf.d/whisky-club.conf
sudo cp .env.production /opt/aby-whisky-club/config/env/.env
```

### 4. Environment Configuration

Edit `/opt/aby-whisky-club/config/env/.env`:

```bash
# Generate secure passwords
openssl rand -base64 32  # For database password
openssl rand -base64 32  # For Redis password
openssl rand -base64 64  # For JWT secret

# Update configuration
sudo nano /opt/aby-whisky-club/config/env/.env
```

Required values to update:
- `DB_PASSWORD` - Strong database password
- `REDIS_PASSWORD` - Strong Redis password  
- `JWT_SECRET` - 64+ character JWT secret
- `APP_URL` - Your domain (https://yourdomain.com)
- `VITE_API_URL` - Your API URL (https://yourdomain.com/api)
- `REACT_APP_API_URL` - Your API URL (https://yourdomain.com/api)
- Email settings for notifications

### 5. SSL Certificate Setup

```bash
# Stop nginx if running
sudo systemctl stop nginx

# Obtain SSL certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com --email your-email@domain.com --agree-tos --non-interactive

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/aby-whisky-club/config/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/aby-whisky-club/config/ssl/
sudo chmod 600 /opt/aby-whisky-club/config/ssl/*.pem
```

### 6. Build and Start Services

```bash
cd /opt/aby-whisky-club/app

# Load environment variables
export $(cat /opt/aby-whisky-club/config/env/.env | grep -v '^#' | xargs)

# Build and start production containers
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Check service status
docker-compose -f docker-compose.prod.yml ps
```

## Configuration Files

### Production Docker Compose

The `docker-compose.prod.yml` includes:
- Security hardening (non-root users, read-only filesystems)
- Health checks for all services
- Proper volume mounts for persistent data
- Resource limits and restart policies
- Network isolation

### Nginx Configuration

- SSL/TLS termination with modern ciphers
- Security headers (HSTS, CSP, X-Frame-Options)
- Rate limiting for API endpoints
- Static asset caching
- Reverse proxy to backend services

### Production Dockerfiles

**Backend (`Dockerfile.prod`)**:
- Multi-stage build for optimization
- Security hardening with tini init system
- Production-only dependencies
- Health checks

**Frontend (`Dockerfile.prod`)**:
- React build optimization
- Nginx serving with security headers
- Static asset caching
- Client-side routing support

## Monitoring and Maintenance

### Log Management

```bash
# View all service logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f nginx

# System logs location
/opt/aby-whisky-club/logs/
```

### Health Checks

```bash
# Check service health
curl https://yourdomain.com/health
curl https://yourdomain.com/api/health

# Container health status
docker-compose -f docker-compose.prod.yml ps
```

### Backup Strategy

Automated daily backups configured via cron:

```bash
# Database backup script
/opt/aby-whisky-club/scripts/backup.sh

# Manual backup
docker exec aby_whisky_db_prod pg_dump -U whisky_admin aby_whisky_club | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Updates

```bash
cd /opt/aby-whisky-club/app

# Pull latest changes
git pull origin main

# Rebuild and restart services
docker-compose -f docker-compose.prod.yml up -d --build

# Clean up old images
docker system prune -f
```

## Security Features

### Container Security
- Non-root users in all containers
- Read-only filesystems where possible
- No new privileges
- Security options enabled
- Resource limits configured

### Network Security
- Internal Docker network isolation
- Rate limiting on API endpoints
- HTTPS-only with HSTS
- Modern TLS configuration

### Data Security
- Encrypted passwords using strong algorithms
- Secure session management with Redis
- JWT tokens with secure secrets
- Database access controls

## Troubleshooting

### Common Issues

**Services not starting:**
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend
```

**SSL certificate issues:**
```bash
# Renew certificate
sudo certbot renew --quiet

# Copy new certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/*.pem /opt/aby-whisky-club/config/ssl/
docker restart aby_whisky_nginx_prod
```

**Database connection issues:**
```bash
# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres

# Connect to database
docker exec -it aby_whisky_db_prod psql -U whisky_admin -d aby_whisky_club
```

### Performance Tuning

**Database optimization:**
```sql
-- Check database performance
SELECT * FROM pg_stat_activity;

-- Optimize queries
ANALYZE;
VACUUM;
```

**Container resource monitoring:**
```bash
# Monitor resource usage
docker stats

# View system resources
htop
df -h
```

## Maintenance Schedule

### Daily
- Automated database backups (2:00 AM)
- Log rotation
- Health check monitoring

### Weekly
- Security updates: `sudo apt update && sudo apt upgrade`
- Docker image updates
- Log review

### Monthly
- SSL certificate renewal check
- Full system backup
- Performance review
- Security audit

## Support and Documentation

- **Application logs**: `/opt/aby-whisky-club/logs/`
- **Configuration**: `/opt/aby-whisky-club/config/`
- **Backups**: `/opt/aby-whisky-club/backups/`
- **Scripts**: `/opt/aby-whisky-club/scripts/`

For issues or questions, check the application logs and container status first. The deployment includes comprehensive monitoring and logging to help diagnose problems quickly.