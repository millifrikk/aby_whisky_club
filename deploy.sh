#!/bin/bash

# Åby Whisky Club Production Deployment Script
# Run this script on your Ubuntu Server to deploy the application

set -e  # Exit on any error

# Configuration
APP_NAME="aby-whisky-club"
APP_DIR="/opt/${APP_NAME}"
REPO_URL="git@github.com:millifrikk/aby_whisky_club.git"
DOMAIN="your-domain.com"  # Change this to your actual domain
EMAIL="emil@millicentral.com"  # Change this to your email for Let's Encrypt

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root for security reasons"
fi

# Check if user is in docker group
if ! groups $USER | grep -q '\bdocker\b'; then
    error "User $USER is not in the docker group. Run: sudo usermod -aG docker $USER && newgrp docker"
fi

log "Starting deployment of ${APP_NAME}..."

# Update system
log "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
log "Installing required packages..."
sudo apt install -y git curl wget unzip nginx certbot python3-certbot-nginx

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    log "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    log "Docker installed. Please log out and back in, then re-run this script."
    exit 0
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    log "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Create application directory structure if it doesn't exist
if [ ! -d "$APP_DIR" ]; then
    log "Creating application directory structure..."
    sudo mkdir -p $APP_DIR/{app,data/{postgres,redis,uploads},config/{nginx/{conf.d},ssl,env},logs/{nginx,backend},backups,scripts}
    
    # Set ownership and permissions
    sudo chown -R whisky-club:docker $APP_DIR/app
    sudo chown -R 999:999 $APP_DIR/data
    sudo chown -R root:root $APP_DIR/config
    sudo chown -R whisky-club:docker $APP_DIR/logs
    sudo chown -R whisky-club:docker $APP_DIR/backups
    sudo chown -R whisky-club:docker $APP_DIR/scripts
    
    # Set permissions
    sudo chmod -R 750 $APP_DIR/app
    sudo chmod -R 755 $APP_DIR/data
    sudo chmod -R 644 $APP_DIR/config
    sudo chmod -R 755 $APP_DIR/logs
    sudo chmod -R 755 $APP_DIR/backups
    sudo chmod -R 755 $APP_DIR/scripts
fi

# Clone or update repository
if [ ! -d "$APP_DIR/app/.git" ]; then
    log "Cloning repository..."
    sudo -u whisky-club git clone $REPO_URL $APP_DIR/app
else
    log "Updating repository..."
    cd $APP_DIR/app
    sudo -u whisky-club git fetch origin
    sudo -u whisky-club git reset --hard origin/main
fi

# Copy configuration files
log "Setting up configuration files..."

# Copy nginx configuration
sudo cp $APP_DIR/app/nginx.prod.conf $APP_DIR/config/nginx/nginx.conf
sudo cp $APP_DIR/app/nginx-site.prod.conf $APP_DIR/config/nginx/conf.d/whisky-club.conf

# Update domain in nginx config
sudo sed -i "s/your-domain.com/$DOMAIN/g" $APP_DIR/config/nginx/conf.d/whisky-club.conf

# Copy environment template
if [ ! -f "$APP_DIR/config/env/.env" ]; then
    sudo cp $APP_DIR/app/.env.production $APP_DIR/config/env/.env
    warn "Please edit $APP_DIR/config/env/.env with your actual values!"
    warn "Generate secrets with: openssl rand -base64 64"
    error "Environment file created but not configured. Please configure it and re-run the script."
fi

# Obtain SSL certificate
log "Setting up SSL certificate..."
if [ ! -f "$APP_DIR/config/ssl/fullchain.pem" ]; then
    # Temporarily start nginx for certbot
    sudo systemctl stop nginx 2>/dev/null || true
    sudo certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive
    
    # Copy certificates
    sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $APP_DIR/config/ssl/
    sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $APP_DIR/config/ssl/
    sudo chown root:root $APP_DIR/config/ssl/*.pem
    sudo chmod 600 $APP_DIR/config/ssl/*.pem
fi

# Build and start services
log "Building and starting services..."
cd $APP_DIR/app

# Load environment variables
export $(cat $APP_DIR/config/env/.env | grep -v '^#' | xargs)

# Build and start production containers
sudo docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
sudo docker-compose -f docker-compose.prod.yml build --no-cache
sudo docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
log "Waiting for services to start..."
sleep 30

# Check service health
for service in postgres redis backend frontend nginx; do
    if sudo docker-compose -f docker-compose.prod.yml ps | grep -q "${service}.*Up"; then
        log "✓ $service is running"
    else
        error "✗ $service failed to start"
    fi
done

# Set up log rotation
log "Setting up log rotation..."
sudo tee /etc/logrotate.d/whisky-club > /dev/null <<EOF
$APP_DIR/logs/*/*.log {
    daily
    missingok
    rotate 14
    compress
    notifempty
    create 644 whisky-club docker
    postrotate
        docker kill -s USR1 aby_whisky_nginx_prod 2>/dev/null || true
    endscript
}
EOF

# Set up backup script
log "Setting up backup script..."
sudo tee $APP_DIR/scripts/backup.sh > /dev/null <<'EOF'
#!/bin/bash
BACKUP_DIR="/opt/aby-whisky-club/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Database backup
docker exec aby_whisky_db_prod pg_dump -U whisky_admin aby_whisky_club | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Keep only last 7 days of backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: db_backup_$DATE.sql.gz"
EOF

sudo chmod +x $APP_DIR/scripts/backup.sh
sudo chown whisky-club:docker $APP_DIR/scripts/backup.sh

# Set up daily backup cron
(sudo crontab -l 2>/dev/null; echo "0 2 * * * $APP_DIR/scripts/backup.sh") | sudo crontab -

# Set up SSL renewal cron
(sudo crontab -l 2>/dev/null; echo "0 3 1 * * certbot renew --quiet && cp /etc/letsencrypt/live/$DOMAIN/*.pem $APP_DIR/config/ssl/ && docker restart aby_whisky_nginx_prod") | sudo crontab -

log "Deployment completed successfully!"
log "Application should be available at: https://$DOMAIN"
log ""
log "Next steps:"
log "1. Verify the application is working at https://$DOMAIN"
log "2. Monitor logs: docker-compose -f $APP_DIR/app/docker-compose.prod.yml logs -f"
log "3. Set up monitoring and alerts"
log "4. Review and customize the backup strategy"
log ""
log "Maintenance commands:"
log "- View logs: cd $APP_DIR/app && docker-compose -f docker-compose.prod.yml logs -f"
log "- Restart services: cd $APP_DIR/app && docker-compose -f docker-compose.prod.yml restart"
log "- Update application: cd $APP_DIR/app && git pull && docker-compose -f docker-compose.prod.yml up -d --build"