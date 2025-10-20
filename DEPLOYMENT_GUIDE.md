# YATRIK ERP Deployment Guide for yatrikerp.live

This guide will help you deploy your YATRIK ERP application to yatrikerp.live using Docker.

## Prerequisites

1. **Domain Setup**: Ensure yatrikerp.live is pointing to your server's IP address
2. **Server Requirements**: 
   - Ubuntu 20.04+ or CentOS 8+
   - Docker and Docker Compose installed
   - At least 2GB RAM and 20GB storage
   - Ports 80, 443, and 5000 open

## Quick Deployment

### 1. Prepare Your Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again to apply docker group changes
```

### 2. Upload Your Project

```bash
# Clone or upload your project to the server
git clone <your-repo-url> /opt/yatrik-erp
cd /opt/yatrik-erp

# Or use SCP to upload files
# scp -r ./YATRIK\ ERP/ user@your-server:/opt/yatrik-erp/
```

### 3. Configure Environment

```bash
# Copy environment template
cp env.example .env

# Edit environment variables
nano .env
```

**Important Environment Variables to Set:**

```env
NODE_ENV=production
MONGODB_URI=mongodb://your-mongodb-connection-string
JWT_SECRET=your_secure_jwt_secret_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

### 4. Build and Deploy

```bash
# Build and start the application
docker-compose up -d --build

# Check if containers are running
docker-compose ps

# View logs
docker-compose logs -f yatrik-erp
```

### 5. SSL Certificate Setup (Optional but Recommended)

```bash
# Install Certbot for Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d yatrikerp.live -d www.yatrikerp.live

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Production Configuration

### Database Setup

**Option 1: External MongoDB (Recommended)**
- Use MongoDB Atlas or another cloud MongoDB service
- Update `MONGODB_URI` in your `.env` file

**Option 2: Local MongoDB Container**
- Uncomment the MongoDB service in `docker-compose.yml`
- Set appropriate MongoDB credentials

### Nginx Configuration

The included `nginx.conf` provides:
- Reverse proxy to your application
- Rate limiting for API endpoints
- Security headers
- Gzip compression
- Health checks

### Monitoring and Logs

```bash
# View application logs
docker-compose logs -f yatrik-erp

# View nginx logs
docker-compose logs -f nginx

# Monitor resource usage
docker stats
```

### Backup Strategy

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p /opt/backups
docker-compose exec mongodb mongodump --out /data/backup_$DATE
docker cp yatrik-mongodb:/data/backup_$DATE /opt/backups/
EOF

chmod +x backup.sh
```

## Domain Configuration

### DNS Settings

Point your domain to your server:
- A record: `yatrikerp.live` → `YOUR_SERVER_IP`
- CNAME record: `www.yatrikerp.live` → `yatrikerp.live`

### Firewall Configuration

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Or iptables
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
```

## Maintenance Commands

```bash
# Update application
git pull
docker-compose down
docker-compose up -d --build

# Restart services
docker-compose restart

# Stop services
docker-compose down

# View resource usage
docker system df
docker system prune  # Clean up unused resources
```

## Troubleshooting

### Common Issues

1. **Application won't start**
   ```bash
   docker-compose logs yatrik-erp
   ```

2. **Database connection issues**
   - Check MongoDB URI in `.env`
   - Ensure MongoDB is accessible from container

3. **Frontend not loading**
   - Check if frontend build completed successfully
   - Verify nginx configuration

4. **SSL certificate issues**
   ```bash
   sudo certbot certificates
   sudo certbot renew --dry-run
   ```

### Health Checks

```bash
# Check application health
curl http://localhost:5000/api/health

# Check nginx
curl http://yatrikerp.live/health
```

## Performance Optimization

1. **Enable Redis caching** (uncomment Redis service in docker-compose.yml)
2. **Configure CDN** for static assets
3. **Set up monitoring** with tools like Prometheus + Grafana
4. **Implement log rotation** for log files

## Security Considerations

1. **Change default passwords** and secrets
2. **Enable firewall** and configure properly
3. **Regular security updates**
4. **Monitor logs** for suspicious activity
5. **Use HTTPS** in production
6. **Implement proper backup** strategy

## Support

For issues or questions:
1. Check application logs: `docker-compose logs -f`
2. Verify environment configuration
3. Check server resources and connectivity
4. Review nginx configuration

Your YATRIK ERP application should now be accessible at https://yatrikerp.live!
