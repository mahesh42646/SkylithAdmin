# Skylith Admin - Deployment Guide

## 📋 Table of Contents
- [Local Development Setup](#local-development-setup)
- [Production Deployment](#production-deployment)
- [Environment Variables](#environment-variables)
- [Nginx Configuration](#nginx-configuration)

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js 18+ 
- MongoDB 5+
- npm or yarn

### 1. Clone Repository
```bash
git clone https://github.com/mahesh42646/SkylithAdmin.git
cd SkylithAdmin
```

### 2. Setup Backend
```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Seed admin user and roles
node scripts/seedRoles.js
node scripts/seedAdmin.js

# Start backend server (runs on port 4002)
node server.js
```

### 3. Setup Frontend
```bash
# From project root
npm install

# Copy environment file
cp .env.example .env.local

# Edit .env.local with your configuration
nano .env.local

# Start development server (runs on port 3002)
npm run dev
```

### 4. Access Application
- **Frontend:** http://localhost:3002
- **Backend API:** http://localhost:4002/api
- **Default Admin:**
  - Email: admin@gmail.com
  - Password: admin@123

---

## 🌐 Production Deployment

### Server Requirements
- Ubuntu 20.04+ or similar Linux distribution
- Node.js 18+
- MongoDB 5+
- Nginx
- PM2 (Process Manager)
- SSL Certificate (Let's Encrypt)

### 1. Server Setup

#### Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Install MongoDB
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### Install Nginx
```bash
sudo apt-get install nginx
```

#### Install PM2
```bash
sudo npm install -g pm2
```

### 2. Deploy Backend

```bash
# Navigate to project directory
cd /var/www/SkylithAdmin/backend

# Install dependencies
npm install --production

# Copy production environment file
cp .env.example .env.production

# Edit production environment
nano .env.production
```

**Update `.env.production` with:**
```env
PORT=4002
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/admin-dashboard-prod
JWT_SECRET=YOUR-STRONG-RANDOM-SECRET-HERE-MIN-64-CHARS
JWT_EXPIRE=7d
FRONTEND_URL=https://skylith.cloud
FRONTEND_URL_ALT=https://www.skylith.cloud
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
API_BASE_URL=https://skylith.cloud/api
```

```bash
# Seed production database
node scripts/seedRoles.js
node scripts/seedAdmin.js

# Start backend with PM2
pm2 start server.js --name "skylith-backend" --env production
pm2 save
pm2 startup
```

### 3. Deploy Frontend

```bash
# Navigate to project root
cd /var/www/SkylithAdmin

# Install dependencies
npm install

# Copy production environment file
cp .env.example .env.production
```

**Update `.env.production` with:**
```env
NEXT_PUBLIC_API_BASE_URL=https://skylith.cloud/api
NEXT_PUBLIC_UPLOAD_BASE_URL=https://skylith.cloud
PORT=3002
```

```bash
# Build for production
npm run build

# Start with PM2
pm2 start npm --name "skylith-frontend" -- start
pm2 save
```

### 4. Configure Nginx

Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/skylith.cloud
```

**Nginx Configuration:**
```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name skylith.cloud www.skylith.cloud;
    return 301 https://$server_name$request_uri;
}

# HTTPS Server Block
server {
    listen 443 ssl http2;
    server_name skylith.cloud www.skylith.cloud;

    # SSL Configuration (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/skylith.cloud/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/skylith.cloud/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Client Max Body Size (for file uploads)
    client_max_body_size 10M;

    # API Backend Proxy
    location /api/ {
        proxy_pass http://localhost:4002/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static Files (uploads)
    location /uploads/ {
        alias /var/www/SkylithAdmin/backend/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Frontend Next.js App
    location / {
        proxy_pass http://localhost:3002;
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
```

**Enable site and restart Nginx:**
```bash
sudo ln -s /etc/nginx/sites-available/skylith.cloud /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. Setup SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain SSL Certificate
sudo certbot --nginx -d skylith.cloud -d www.skylith.cloud

# Test auto-renewal
sudo certbot renew --dry-run
```

### 6. Setup Firewall

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

---

## 🔐 Environment Variables

### Frontend Variables (`NEXT_PUBLIC_*`)

| Variable | Description | Development | Production |
|----------|-------------|-------------|------------|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API endpoint | `http://localhost:4002/api` | `https://skylith.cloud/api` |
| `NEXT_PUBLIC_UPLOAD_BASE_URL` | Static files base URL | `http://localhost:4002` | `https://skylith.cloud` |
| `PORT` | Frontend port | `3002` | `3002` |

### Backend Variables

| Variable | Description | Development | Production |
|----------|-------------|-------------|------------|
| `PORT` | Backend port | `4002` | `4002` |
| `NODE_ENV` | Environment | `development` | `production` |
| `MONGODB_URI` | MongoDB connection | `mongodb://localhost:27017/admin-dashboard` | Your production DB |
| `JWT_SECRET` | JWT secret key | Development secret | **Strong random 64+ char secret** |
| `FRONTEND_URL` | CORS allowed origin | `http://localhost:3002` | `https://skylith.cloud` |

---

## 📊 Monitoring & Maintenance

### PM2 Commands
```bash
# View running processes
pm2 list

# View logs
pm2 logs skylith-backend
pm2 logs skylith-frontend

# Restart services
pm2 restart skylith-backend
pm2 restart skylith-frontend

# Stop services
pm2 stop skylith-backend
pm2 stop skylith-frontend

# Delete services
pm2 delete skylith-backend
pm2 delete skylith-frontend
```

### Database Backup
```bash
# Backup MongoDB
mongodump --db admin-dashboard-prod --out /backup/mongodb/$(date +%Y%m%d)

# Restore MongoDB
mongorestore --db admin-dashboard-prod /backup/mongodb/20240101/admin-dashboard-prod
```

### Update Application
```bash
# Pull latest changes
cd /var/www/SkylithAdmin
git pull origin main

# Update backend
cd backend
npm install
pm2 restart skylith-backend

# Update frontend
cd ..
npm install
npm run build
pm2 restart skylith-frontend
```

---

## 🔧 Troubleshooting

### Backend not starting
1. Check MongoDB is running: `sudo systemctl status mongod`
2. Check logs: `pm2 logs skylith-backend`
3. Verify .env.production file exists
4. Check port 4002 is not in use: `lsof -i :4002`

### Frontend not starting
1. Check build completed: `npm run build`
2. Check logs: `pm2 logs skylith-frontend`
3. Verify .env.production file exists
4. Check port 3002 is not in use: `lsof -i :3002`

### 502 Bad Gateway
1. Check if services are running: `pm2 list`
2. Check Nginx config: `sudo nginx -t`
3. Check Nginx error log: `sudo tail -f /var/log/nginx/error.log`

### CORS Errors
1. Verify FRONTEND_URL in backend .env.production
2. Check CORS origins in backend/server.js
3. Clear browser cache

---

## 📝 Notes

- Always use **HTTPS** in production
- Change **JWT_SECRET** to a strong random value
- Enable **MongoDB authentication** in production
- Set up **regular database backups**
- Monitor **disk space** for uploads folder
- Use **environment-specific** configuration files
- Keep **sensitive data** out of git repository

---

## 🆘 Support

For issues or questions:
- GitHub Issues: https://github.com/mahesh42646/SkylithAdmin/issues
- Email: support@skylith.cloud

---

**Last Updated:** January 2026
