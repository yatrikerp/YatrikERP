#!/usr/bin/env node

/**
 * YATRIK ERP - Automated Free Hosting Setup
 * This script automates the entire free hosting setup process
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// Utility functions
const log = (message, color = 'reset') => {
    console.log(`${colors[color]}${message}${colors.reset}`);
};

const logHeader = (message) => {
    console.log('\n' + '='.repeat(50));
    log(message, 'magenta');
    console.log('='.repeat(50));
};

const logStep = (message) => {
    log(`\n[STEP] ${message}`, 'cyan');
};

const logSuccess = (message) => {
    log(`[SUCCESS] ${message}`, 'green');
};

const logWarning = (message) => {
    log(`[WARNING] ${message}`, 'yellow');
};

const logError = (message) => {
    log(`[ERROR] ${message}`, 'red');
};

// Check if command exists
const commandExists = (command) => {
    try {
        execSync(`which ${command}`, { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
};

// Check prerequisites
const checkPrerequisites = () => {
    logStep('Checking prerequisites...');
    
    const requiredCommands = ['node', 'npm', 'git'];
    const missing = [];
    
    requiredCommands.forEach(cmd => {
        if (!commandExists(cmd)) {
            missing.push(cmd);
        }
    });
    
    if (missing.length > 0) {
        logError(`Missing required commands: ${missing.join(', ')}`);
        log('Please install the missing commands and try again.');
        process.exit(1);
    }
    
    logSuccess('All prerequisites are installed');
};

// Create environment files
const createEnvironmentFiles = () => {
    logStep('Creating environment files...');
    
    const envFiles = [
        {
            template: 'env.production.template',
            target: '.env',
            description: 'Root environment file'
        },
        {
            template: 'backend/env.production.template',
            target: 'backend/.env',
            description: 'Backend environment file'
        },
        {
            template: 'frontend/env.production.template',
            target: 'frontend/.env',
            description: 'Frontend environment file'
        }
    ];
    
    envFiles.forEach(({ template, target, description }) => {
        if (fs.existsSync(template)) {
            if (!fs.existsSync(target)) {
                fs.copyFileSync(template, target);
                logSuccess(`Created ${description}`);
            } else {
                logWarning(`${description} already exists`);
            }
        } else {
            logError(`Template file ${template} not found`);
        }
    });
};

// Install dependencies
const installDependencies = () => {
    logStep('Installing dependencies...');
    
    try {
        // Install root dependencies
        log('Installing root dependencies...');
        execSync('npm install', { stdio: 'inherit' });
        
        // Install backend dependencies
        log('Installing backend dependencies...');
        execSync('cd backend && npm install', { stdio: 'inherit' });
        
        // Install frontend dependencies
        log('Installing frontend dependencies...');
        execSync('cd frontend && npm install', { stdio: 'inherit' });
        
        logSuccess('All dependencies installed successfully');
    } catch (error) {
        logError('Failed to install dependencies');
        log(error.message);
        process.exit(1);
    }
};

// Build frontend
const buildFrontend = () => {
    logStep('Building frontend...');
    
    try {
        execSync('cd frontend && npm run build', { stdio: 'inherit' });
        logSuccess('Frontend built successfully');
    } catch (error) {
        logError('Failed to build frontend');
        log(error.message);
        process.exit(1);
    }
};

// Generate deployment URLs
const generateDeploymentInfo = () => {
    const timestamp = Date.now();
    const appName = `yatrik-erp-${timestamp}`;
    
    return {
        appName,
        frontendUrl: `https://${appName}.vercel.app`,
        backendUrl: `https://${appName}.railway.app`,
        databaseUrl: `mongodb+srv://yatrik_admin:password@${appName}.mongodb.net/yatrik_erp`
    };
};

// Create deployment configuration files
const createDeploymentConfigs = () => {
    logStep('Creating deployment configuration files...');
    
    const deploymentInfo = generateDeploymentInfo();
    
    // Create Vercel configuration
    const vercelConfig = {
        version: 2,
        name: deploymentInfo.appName,
        builds: [
            {
                src: "frontend/package.json",
                use: "@vercel/static-build",
                config: {
                    distDir: "build"
                }
            }
        ],
        routes: [
            {
                src: "/static/(.*)",
                headers: {
                    "cache-control": "public, max-age=31536000, immutable"
                }
            },
            {
                src: "/(.*)",
                dest: "/index.html"
            }
        ],
        env: {
            "REACT_APP_API_URL": deploymentInfo.backendUrl
        }
    };
    
    fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
    
    // Create Railway configuration
    const railwayConfig = {
        "$schema": "https://railway.app/railway.schema.json",
        "build": {
            "builder": "NIXPACKS"
        },
        "deploy": {
            "startCommand": "npm start",
            "healthcheckPath": "/api/health",
            "healthcheckTimeout": 100,
            "restartPolicyType": "ON_FAILURE",
            "restartPolicyMaxRetries": 10
        }
    };
    
    fs.writeFileSync('railway.json', JSON.stringify(railwayConfig, null, 2));
    
    logSuccess('Deployment configuration files created');
    return deploymentInfo;
};

// Create deployment instructions
const createDeploymentInstructions = (deploymentInfo) => {
    logStep('Creating deployment instructions...');
    
    const instructions = `# YATRIK ERP - Automated Deployment Instructions

## 🚀 Your Free Hosting URLs
- **Frontend**: ${deploymentInfo.frontendUrl}
- **Backend**: ${deploymentInfo.backendUrl}
- **Database**: ${deploymentInfo.databaseUrl}

## 📋 Step-by-Step Deployment

### 1. Database Setup (MongoDB Atlas - FREE)
1. Go to https://www.mongodb.com/atlas
2. Create free account
3. Create M0 Sandbox cluster
4. Name your cluster: ${deploymentInfo.appName}
5. Create database user:
   - Username: yatrik_admin
   - Password: [generate strong password]
6. Whitelist IP: 0.0.0.0/0 (allows all IPs)
7. Get connection string and update backend/.env:
   \`\`\`
   MONGODB_URI=${deploymentInfo.databaseUrl}
   \`\`\`

### 2. Backend Deployment (Railway - FREE)
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your YATRIK ERP repository
5. Set root directory to: \`backend\`
6. Add environment variables:
   \`\`\`
   MONGODB_URI=${deploymentInfo.databaseUrl}
   NODE_ENV=production
   JWT_SECRET=your-super-secure-jwt-secret-32-chars-min
   SESSION_SECRET=your-super-secure-session-secret-32-chars-min
   FRONTEND_URL=${deploymentInfo.frontendUrl}
   PORT=5000
   \`\`\`
7. Click "Deploy"
8. Note your backend URL: ${deploymentInfo.backendUrl}

### 3. Frontend Deployment (Vercel - FREE)
1. Go to https://vercel.com
2. Sign up with GitHub
3. Click "New Project" → "Import Git Repository"
4. Select your YATRIK ERP repository
5. Set root directory to: \`frontend\`
6. Add environment variables:
   \`\`\`
   REACT_APP_API_URL=${deploymentInfo.backendUrl}
   REACT_APP_RAZORPAY_KEY=your_razorpay_key
   \`\`\`
7. Click "Deploy"
8. Your app will be live at: ${deploymentInfo.frontendUrl}

## 🔧 Quick Commands

\`\`\`bash
# Test local setup
npm run dev

# Deploy frontend to Vercel
npm run deploy:frontend

# Deploy backend to Railway
npm run deploy:backend

# Check health
npm run health
\`\`\`

## 🎯 Success Checklist
- [ ] MongoDB Atlas cluster created
- [ ] Backend deployed to Railway
- [ ] Frontend deployed to Vercel
- [ ] Environment variables configured
- [ ] Database connection working
- [ ] API endpoints responding
- [ ] Frontend can communicate with backend

## 💰 Total Cost: $0/month
- Vercel: Free forever
- Railway: $5 credit/month (free tier)
- MongoDB Atlas: Free 512MB

## 🆘 Troubleshooting
- Check logs in respective dashboards
- Verify environment variables
- Test API endpoints individually
- Use browser developer tools

Your YATRIK ERP system is now ready for production! 🚀
`;

    fs.writeFileSync('DEPLOYMENT_INSTRUCTIONS.md', instructions);
    logSuccess('Deployment instructions created');
};

// Create automated deployment scripts
const createDeploymentScripts = () => {
    logStep('Creating automated deployment scripts...');
    
    // Create Vercel deployment script
    const vercelScript = `#!/bin/bash
# Vercel Frontend Deployment Script

echo "🚀 Deploying frontend to Vercel..."

# Install Vercel CLI if not installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Deploy to Vercel
cd frontend
vercel --prod --yes

echo "✅ Frontend deployed to Vercel!"
echo "Your app is live at: https://your-app.vercel.app"
`;

    fs.writeFileSync('deploy-vercel.sh', vercelScript);
    execSync('chmod +x deploy-vercel.sh');
    
    // Create Railway deployment script
    const railwayScript = `#!/bin/bash
# Railway Backend Deployment Script

echo "🚀 Deploying backend to Railway..."

# Install Railway CLI if not installed
if ! command -v railway &> /dev/null; then
    echo "Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Deploy to Railway
cd backend
railway deploy

echo "✅ Backend deployed to Railway!"
echo "Your API is live at: https://your-app.railway.app"
`;

    fs.writeFileSync('deploy-railway.sh', railwayScript);
    execSync('chmod +x deploy-railway.sh');
    
    logSuccess('Deployment scripts created');
};

// Main setup function
const main = () => {
    logHeader('YATRIK ERP - Automated Free Hosting Setup');
    
    try {
        // Step 1: Check prerequisites
        checkPrerequisites();
        
        // Step 2: Create environment files
        createEnvironmentFiles();
        
        // Step 3: Install dependencies
        installDependencies();
        
        // Step 4: Build frontend
        buildFrontend();
        
        // Step 5: Create deployment configurations
        const deploymentInfo = createDeploymentConfigs();
        
        // Step 6: Create deployment instructions
        createDeploymentInstructions(deploymentInfo);
        
        // Step 7: Create deployment scripts
        createDeploymentScripts();
        
        // Success message
        logHeader('Setup Complete! 🎉');
        logSuccess('Your YATRIK ERP is ready for free hosting!');
        log('');
        log('Next steps:', 'yellow');
        log('1. Follow the instructions in DEPLOYMENT_INSTRUCTIONS.md');
        log('2. Set up MongoDB Atlas (free database)');
        log('3. Deploy backend to Railway (free hosting)');
        log('4. Deploy frontend to Vercel (free hosting)');
        log('');
        log('Total cost: $0/month', 'green');
        log('');
        log('Quick start:', 'cyan');
        log('npm run free:setup');
        log('npm run free:deploy');
        
    } catch (error) {
        logError('Setup failed!');
        log(error.message);
        process.exit(1);
    }
};

// Run the setup
if (require.main === module) {
    main();
}

module.exports = { main };
