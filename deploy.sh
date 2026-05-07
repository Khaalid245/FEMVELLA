#!/bin/bash

# Femvelle Production Deployment Script
# This script sets up the production environment on a fresh server

set -e

echo "🚀 Setting up Femvelle Production Environment"
echo "============================================="

# Update system
echo "📦 Updating system packages..."
apt-get update && apt-get upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker $USER

# Install Docker Compose
echo "🔧 Installing Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create deployment directory
echo "📁 Creating deployment directory..."
mkdir -p /opt/femvelle
cd /opt/femvelle

# Clone repository (replace with your actual repository)
echo "📥 Cloning repository..."
git clone https://github.com/your-username/femvelle.git .

# Set up environment variables
echo "⚙️ Setting up environment variables..."
cp .env.prod.example .env
echo "Please edit .env file with your production values"
echo "Press any key to continue after editing..."
read -n 1

# Create necessary directories
echo "📂 Creating directories..."
mkdir -p logs ssl backups
chmod 755 logs ssl backups

# Set up SSL certificates
echo "🔒 Setting up SSL certificates..."
chmod +x ssl/setup-ssl.sh
./ssl/setup-ssl.sh

# Build and start services
echo "🏗️ Building and starting services..."
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 30

# Run database migrations
echo "🗄️ Running database migrations..."
docker-compose -f docker-compose.prod.yml exec -T django python manage.py migrate

# Create superuser
echo "👤 Creating superuser..."
docker-compose -f docker-compose.prod.yml exec -T django python manage.py createsuperuser

# Collect static files
echo "📦 Collecting static files..."
docker-compose -f docker-compose.prod.yml exec -T django python manage.py collectstatic --noinput

# Set up backup cron job
echo "💾 Setting up backup cron job..."
cat > /etc/cron.d/femvelle-backup << EOF
0 2 * * * root cd /opt/femvelle && docker-compose -f docker-compose.prod.yml run --rm backup
EOF

# Set up log rotation
echo "📝 Setting up log rotation..."
cat > /etc/logrotate.d/femvelle << EOF
/opt/femvelle/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        docker-compose -f /opt/femvelle/docker-compose.prod.yml restart django celery
    endscript
}
EOF

# Configure firewall
echo "🔥 Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp  # Grafana (restrict to internal IPs in production)
ufw allow 9090/tcp  # Prometheus (restrict to internal IPs in production)
ufw --force enable

# Set up monitoring alerts
echo "📊 Setting up monitoring..."
# This would typically involve configuring alertmanager rules
# For now, we'll just ensure the monitoring stack is running

# Health check
echo "🏥 Running health checks..."
sleep 10
curl -f http://localhost/health/ || echo "⚠️ Health check failed - please investigate"

# Final setup
echo "🎯 Final setup..."
chown -R root:root /opt/femvelle
chmod -R 755 /opt/femvelle

echo ""
echo "✅ Femvelle production deployment completed!"
echo ""
echo "🌐 Your application should be available at:"
echo "   - Frontend: https://femvelle.com"
echo "   - API: https://api.femvelle.com"
echo "   - Admin: https://api.femvelle.com/admin/"
echo "   - Monitoring: https://monitoring.femvelle.com/grafana/"
echo ""
echo "📋 Next steps:"
echo "   1. Configure DNS records to point to this server"
echo "   2. Test all functionality"
echo "   3. Set up monitoring alerts"
echo "   4. Configure backup verification"
echo "   5. Set up log monitoring"
echo ""
echo "📚 Important files:"
echo "   - Environment: /opt/femvelle/.env"
echo "   - Logs: /opt/femvella/logs/"
echo "   - SSL: /opt/femvelle/ssl/"
echo "   - Backups: /opt/femvelle/backups/"