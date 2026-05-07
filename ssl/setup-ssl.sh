#!/bin/bash

# SSL Certificate Setup Script for Femvelle
# This script sets up SSL certificates using Let's Encrypt

set -e

DOMAIN="femvelle.com"
EMAIL="admin@femvelle.com"
WEBROOT="/var/www/certbot"

echo "Setting up SSL certificates for Femvelle..."

# Install certbot if not already installed
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

# Create webroot directory
mkdir -p $WEBROOT

# Stop nginx temporarily
docker compose -f docker-compose.prod.yml stop nginx

# Generate certificates
echo "Generating SSL certificates..."
certbot certonly \
    --standalone \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --domains $DOMAIN,www.$DOMAIN,api.$DOMAIN,monitoring.$DOMAIN

# Copy certificates to ssl directory
mkdir -p ./ssl
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ./ssl/$DOMAIN.crt
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ./ssl/$DOMAIN.key

# Set proper permissions
chmod 644 ./ssl/$DOMAIN.crt
chmod 600 ./ssl/$DOMAIN.key

# Start nginx
docker compose -f docker-compose.prod.yml start nginx

# Setup auto-renewal
echo "Setting up auto-renewal..."
cat > /etc/cron.d/certbot-renew << EOF
0 12 * * * /usr/bin/certbot renew --quiet --deploy-hook "cd /opt/femvelle && docker compose -f docker-compose.prod.yml restart nginx"
EOF

echo "SSL certificates have been set up successfully!"
echo "Certificates are valid for: $DOMAIN, www.$DOMAIN, api.$DOMAIN, monitoring.$DOMAIN"