# Database Hosting Guide for YATRIK ERP

## 🗄️ Database Hosting Options

Your YATRIK ERP system uses MongoDB as the primary database. Here are the best hosting options:

---

## 🥇 Recommended: MongoDB Atlas (Cloud)

### Why MongoDB Atlas?
- **Fully managed**: No server maintenance required
- **Automatic backups**: Built-in backup and recovery
- **Global clusters**: Deploy close to your users
- **Security**: Enterprise-grade security features
- **Free tier**: 512MB free cluster for development
- **Scalability**: Easy to scale as your business grows

### Setup Steps:

1. **Create Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Sign up for a free account
   - Verify your email

2. **Create Cluster**
   - Click "Build a Database"
   - Choose "M0 Sandbox" (Free tier)
   - Select a region close to your users
   - Choose a cluster name (e.g., "yatrik-erp-cluster")

3. **Configure Security**
   - Create a database user:
     - Username: `yatrik_admin`
     - Password: Generate a strong password
   - Whitelist IP addresses:
     - For development: `0.0.0.0/0` (allows all IPs)
     - For production: Add specific IPs

4. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your actual password

5. **Update Environment Variables**
   ```bash
   MONGODB_URI=mongodb+srv://yatrik_admin:your_password@yatrik-erp-cluster.xxxxx.mongodb.net/yatrik_erp?retryWrites=true&w=majority
   ```

### Pricing:
- **Free Tier**: 512MB storage, shared RAM
- **M2**: $9/month - 2GB storage, shared RAM
- **M5**: $25/month - 5GB storage, shared RAM
- **M10+**: $57+/month - Dedicated RAM

---

## 🥈 Alternative: Self-Hosted MongoDB

### Option 1: VPS with MongoDB

#### Recommended VPS Providers:
- **DigitalOcean**: $5-20/month
- **Linode**: $5-20/month
- **Vultr**: $3.50-20/month
- **AWS EC2**: $8-50/month

#### Setup Steps:

1. **Create VPS Instance**
   - Choose Ubuntu 20.04/22.04 LTS
   - Minimum 1GB RAM, 1 CPU
   - 20GB+ storage

2. **Install MongoDB**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install MongoDB
   wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
   sudo apt update
   sudo apt install -y mongodb-org
   
   # Start MongoDB
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```

3. **Configure MongoDB**
   ```bash
   # Create admin user
   mongo
   use admin
   db.createUser({
     user: "yatrik_admin",
     pwd: "your_secure_password",
     roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase", "readWriteAnyDatabase"]
   })
   ```

4. **Configure Security**
   ```bash
   # Edit MongoDB config
   sudo nano /etc/mongod.conf
   
   # Add security settings
   security:
     authorization: enabled
   
   # Restart MongoDB
   sudo systemctl restart mongod
   ```

5. **Update Environment Variables**
   ```bash
   MONGODB_URI=mongodb://yatrik_admin:your_password@your_vps_ip:27017/yatrik_erp?authSource=admin
   ```

### Option 2: Docker MongoDB

#### Using Docker Compose (Included in your project):
```yaml
# Already included in docker-compose.yml
mongodb:
  image: mongo:7
  container_name: yatrik-mongodb
  restart: unless-stopped
  ports:
    - "27017:27017"
  volumes:
    - mongodb_data:/data/db
  environment:
    MONGO_INITDB_ROOT_USERNAME: admin
    MONGO_INITDB_ROOT_PASSWORD: password
    MONGO_INITDB_DATABASE: yatrik_erp
```

---

## 🥉 Alternative: Other Cloud Databases

### 1. AWS DocumentDB
- **Pros**: Fully managed, compatible with MongoDB
- **Cons**: More expensive, complex setup
- **Cost**: $25+/month
- **Best for**: Enterprise applications

### 2. Google Cloud Firestore
- **Pros**: Serverless, automatic scaling
- **Cons**: Different query language, migration required
- **Cost**: Pay-per-use
- **Best for**: High-scale applications

### 3. Azure Cosmos DB
- **Pros**: Multi-model database, global distribution
- **Cons**: Expensive, complex pricing
- **Cost**: $25+/month
- **Best for**: Enterprise applications

---

## 🔧 Database Configuration

### Production Environment Variables:

**For MongoDB Atlas:**
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/yatrik_erp?retryWrites=true&w=majority
```

**For Self-Hosted MongoDB:**
```bash
MONGODB_URI=mongodb://username:password@your-server-ip:27017/yatrik_erp?authSource=admin
```

**For Docker MongoDB:**
```bash
MONGODB_URI=mongodb://admin:password@mongodb:27017/yatrik_erp?authSource=admin
```

---

## 📊 Database Optimization

### 1. Indexing
```javascript
// Create indexes for better performance
db.bookings.createIndex({ "tripId": 1, "status": 1 })
db.trips.createIndex({ "routeId": 1, "departureTime": 1 })
db.users.createIndex({ "email": 1 }, { unique: true })
```

### 2. Connection Pooling
```javascript
// In your server.js
const mongoOptions = {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  retryWrites: true,
  retryReads: true
};
```

### 3. Monitoring
- **MongoDB Atlas**: Built-in monitoring dashboard
- **Self-hosted**: Use MongoDB Compass or mongostat
- **Alerts**: Set up alerts for connection issues, slow queries

---

## 🔒 Security Best Practices

### 1. Authentication
- Always use strong passwords
- Enable authentication in production
- Use database users with minimal required permissions

### 2. Network Security
- Whitelist specific IP addresses
- Use VPN for database access
- Enable SSL/TLS connections

### 3. Data Encryption
- Enable encryption at rest
- Use encrypted connections (SSL/TLS)
- Encrypt sensitive data fields

---

## 💾 Backup and Recovery

### MongoDB Atlas
- **Automatic backups**: Built-in continuous backups
- **Point-in-time recovery**: Restore to any point in time
- **Backup retention**: 2-3 years depending on plan

### Self-Hosted MongoDB
```bash
# Create backup
mongodump --host localhost:27017 --db yatrik_erp --out /backup/$(date +%Y%m%d)

# Restore backup
mongorestore --host localhost:27017 --db yatrik_erp /backup/20240101/yatrik_erp
```

---

## 📈 Scaling Considerations

### When to Scale:
- **Storage**: When approaching 80% of storage limit
- **Performance**: When queries are slow (>100ms)
- **Connections**: When hitting connection limits

### Scaling Options:
1. **Vertical Scaling**: Upgrade to larger instance
2. **Horizontal Scaling**: Add more replica set members
3. **Sharding**: Distribute data across multiple servers

---

## 🎯 Recommendation for YATRIK ERP

### For Development:
- **MongoDB Atlas M0** (Free tier)
- Easy setup, no maintenance
- Perfect for testing and development

### For Production:
- **MongoDB Atlas M2** ($9/month)
- Reliable, managed service
- Automatic backups and monitoring
- Easy to scale as you grow

### For Enterprise:
- **MongoDB Atlas M10+** ($57+/month)
- Dedicated resources
- Advanced security features
- 24/7 support

---

## 🚀 Quick Start Commands

### Setup MongoDB Atlas:
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create M0 cluster
3. Configure security
4. Get connection string
5. Update environment variables

### Setup Self-Hosted MongoDB:
```bash
# On Ubuntu VPS
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Test Connection:
```bash
# Test MongoDB connection
npm run health
# Should return: {"status":"OK","database":"connected"}
```

Your YATRIK ERP database is now ready for production! 🚀
