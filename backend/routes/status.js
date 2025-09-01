const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Service definitions with descriptions
const services = {
  'Authentication & Security': {
    '/api/auth': 'User authentication, login, signup, password reset',
    '/api/depotAuth': 'Depot manager authentication and authorization'
  },
  'User Management': {
    '/api/admin': 'Admin panel and user management',
    '/api/users': 'User profile and account management'
  },
  'Booking & Reservations': {
    '/api/booking': 'Ticket booking and reservation system',
    '/api/bookings': 'Booking history and management',
    '/api/seats': 'Seat selection and availability'
  },
  'Transportation Management': {
    '/api/routes': 'Bus routes and stops management',
    '/api/trips': 'Trip scheduling and management',
    '/api/stops': 'Bus stops and locations',
    '/api/tracking': 'Real-time bus tracking and GPS'
  },
  'Staff Management': {
    '/api/driver': 'Driver management and assignments',
    '/api/conductor': 'Conductor management and duties',
    '/api/crew': 'Crew scheduling and management',
    '/api/attendance': 'Staff attendance tracking',
    '/api/duty': 'Duty scheduling and management'
  },
  'Depot Operations': {
    '/api/depot': 'Depot management and operations',
    '/api/depots': 'Multi-depot coordination'
  },
  'Financial Services': {
    '/api/payments': 'Payment processing and transactions',
    '/api/payment': 'Payment gateway integration'
  },
  'Communication & Support': {
    '/api/notifications': 'Push notifications and alerts',
    '/api/support': 'Customer support and help desk',
    '/api/alerts': 'System alerts and announcements'
  },
  'Operations & Maintenance': {
    '/api/fuel': 'Fuel management and tracking',
    '/api/search': 'Search functionality across services'
  },
  'Promotional Services': {
    '/api/promos': 'Promotional offers and discounts'
  }
};

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Status route is working!', timestamp: new Date().toISOString() });
});

// Get service status
router.get('/', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? '🟢 Connected' : '🔴 Disconnected';
    const serverUptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    // Format uptime
    const formatUptime = (seconds) => {
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      
      if (days > 0) return `${days}d ${hours}h ${minutes}m ${secs}s`;
      if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
      if (minutes > 0) return `${minutes}m ${secs}s`;
      return `${secs}s`;
    };

    // Format memory usage
    const formatBytes = (bytes) => {
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      if (bytes === 0) return '0 Bytes';
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };

    const statusData = {
      server: {
        status: '🟢 Running',
        port: process.env.PORT || 5000,
        uptime: formatUptime(serverUptime),
        memory: {
          rss: formatBytes(memoryUsage.rss),
          heapUsed: formatBytes(memoryUsage.heapUsed),
          heapTotal: formatBytes(memoryUsage.heapTotal)
        }
      },
      database: {
        status: dbStatus,
        connection: mongoose.connection.host || 'localhost',
        database: mongoose.connection.name || 'yatrik_erp'
      },
      services: services,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };

    res.json(statusData);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get service status',
      message: error.message
    });
  }
});

// Get HTML dashboard
router.get('/dashboard', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>YATRIK ERP - Service Status Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .header {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        
        .header h1 {
            color: #E91E63;
            font-size: 2.5rem;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .header p {
            color: #666;
            font-size: 1.1rem;
        }
        
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .status-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .status-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
        }
        
        .status-card h3 {
            color: #E91E63;
            font-size: 1.3rem;
            margin-bottom: 15px;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 10px;
        }
        
        .service-item {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 8px;
            border-left: 4px solid #00BCD4;
        }
        
        .service-endpoint {
            font-weight: 600;
            color: #333;
            font-family: 'Courier New', monospace;
            font-size: 0.9rem;
        }
        
        .service-description {
            color: #666;
            font-size: 0.85rem;
            margin-top: 4px;
        }
        
        .system-status {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            margin-bottom: 30px;
        }
        
        .system-status h2 {
            color: #E91E63;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .status-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #f0f0f0;
        }
        
        .status-row:last-child {
            border-bottom: none;
        }
        
        .status-label {
            font-weight: 600;
            color: #333;
        }
        
        .status-value {
            color: #666;
            font-family: 'Courier New', monospace;
        }
        
        .footer {
            text-align: center;
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.9rem;
        }
        
        .refresh-btn {
            background: linear-gradient(45deg, #E91E63, #FF4081);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 1rem;
            font-weight: 600;
            transition: transform 0.2s ease;
            margin: 20px auto;
            display: block;
        }
        
        .refresh-btn:hover {
            transform: scale(1.05);
        }
        
        @media (max-width: 768px) {
            .status-grid {
                grid-template-columns: 1fr;
            }
            
            .header h1 {
                font-size: 2rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚌 YATRIK ERP</h1>
            <p>Comprehensive Bus Transportation Management System</p>
            <button class="refresh-btn" onclick="location.reload()">🔄 Refresh Status</button>
        </div>
        
        <div class="system-status">
            <h2>🖥️ System Status</h2>
            <div id="systemStatus">Loading...</div>
        </div>
        
        <div class="status-grid" id="servicesGrid">
            <div class="status-card">
                <h3>🔐 Authentication & Security</h3>
                <div class="service-item">
                    <div class="service-endpoint">/api/auth</div>
                    <div class="service-description">User authentication, login, signup, password reset</div>
                </div>
                <div class="service-item">
                    <div class="service-endpoint">/api/depotAuth</div>
                    <div class="service-description">Depot manager authentication and authorization</div>
                </div>
            </div>
            
            <div class="status-card">
                <h3>👥 User Management</h3>
                <div class="service-item">
                    <div class="service-endpoint">/api/admin</div>
                    <div class="service-description">Admin panel and user management</div>
                </div>
                <div class="service-item">
                    <div class="service-endpoint">/api/users</div>
                    <div class="service-description">User profile and account management</div>
                </div>
            </div>
            
            <div class="status-card">
                <h3>🎫 Booking & Reservations</h3>
                <div class="service-item">
                    <div class="service-endpoint">/api/booking</div>
                    <div class="service-description">Ticket booking and reservation system</div>
                </div>
                <div class="service-item">
                    <div class="service-endpoint">/api/bookings</div>
                    <div class="service-description">Booking history and management</div>
                </div>
                <div class="service-item">
                    <div class="service-endpoint">/api/seats</div>
                    <div class="service-description">Seat selection and availability</div>
                </div>
            </div>
            
            <div class="status-card">
                <h3>🚌 Transportation Management</h3>
                <div class="service-item">
                    <div class="service-endpoint">/api/routes</div>
                    <div class="service-description">Bus routes and stops management</div>
                </div>
                <div class="service-item">
                    <div class="service-endpoint">/api/trips</div>
                    <div class="service-description">Trip scheduling and management</div>
                </div>
                <div class="service-item">
                    <div class="service-endpoint">/api/stops</div>
                    <div class="service-description">Bus stops and locations</div>
                </div>
                <div class="service-item">
                    <div class="service-endpoint">/api/tracking</div>
                    <div class="service-description">Real-time bus tracking and GPS</div>
                </div>
            </div>
            
            <div class="status-card">
                <h3>👨‍💼 Staff Management</h3>
                <div class="service-item">
                    <div class="service-endpoint">/api/driver</div>
                    <div class="service-description">Driver management and assignments</div>
                </div>
                <div class="service-item">
                    <div class="service-endpoint">/api/conductor</div>
                    <div class="service-description">Conductor management and duties</div>
                </div>
                <div class="service-item">
                    <div class="service-endpoint">/api/crew</div>
                    <div class="service-description">Crew scheduling and management</div>
                </div>
                <div class="service-item">
                    <div class="service-endpoint">/api/attendance</div>
                    <div class="service-description">Staff attendance tracking</div>
                </div>
                <div class="service-item">
                    <div class="service-endpoint">/api/duty</div>
                    <div class="service-description">Duty scheduling and management</div>
                </div>
            </div>
            
            <div class="status-card">
                <h3>🏢 Depot Operations</h3>
                <div class="service-item">
                    <div class="service-endpoint">/api/depot</div>
                    <div class="service-description">Depot management and operations</div>
                </div>
                <div class="service-item">
                    <div class="service-endpoint">/api/depots</div>
                    <div class="service-description">Multi-depot coordination</div>
                </div>
            </div>
            
            <div class="status-card">
                <h3>💰 Financial Services</h3>
                <div class="service-item">
                    <div class="service-endpoint">/api/payments</div>
                    <div class="service-description">Payment processing and transactions</div>
                </div>
                <div class="service-item">
                    <div class="service-endpoint">/api/payment</div>
                    <div class="service-description">Payment gateway integration</div>
                </div>
            </div>
            
            <div class="status-card">
                <h3>📢 Communication & Support</h3>
                <div class="service-item">
                    <div class="service-endpoint">/api/notifications</div>
                    <div class="service-description">Push notifications and alerts</div>
                </div>
                <div class="service-item">
                    <div class="service-endpoint">/api/support</div>
                    <div class="service-description">Customer support and help desk</div>
                </div>
                <div class="service-item">
                    <div class="service-endpoint">/api/alerts</div>
                    <div class="service-description">System alerts and announcements</div>
                </div>
            </div>
            
            <div class="status-card">
                <h3>🔧 Operations & Maintenance</h3>
                <div class="service-item">
                    <div class="service-endpoint">/api/fuel</div>
                    <div class="service-description">Fuel management and tracking</div>
                </div>
                <div class="service-item">
                    <div class="service-endpoint">/api/search</div>
                    <div class="service-description">Search functionality across services</div>
                </div>
            </div>
            
            <div class="status-card">
                <h3>🎁 Promotional Services</h3>
                <div class="service-item">
                    <div class="service-endpoint">/api/promos</div>
                    <div class="service-description">Promotional offers and discounts</div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>YATRIK ERP - Comprehensive Bus Transportation Management System</p>
            <p>Last updated: <span id="lastUpdate"></span></p>
        </div>
    </div>

    <script>
        // Update system status
        async function updateSystemStatus() {
            try {
                const response = await fetch('/api/status');
                const data = await response.json();
                
                const systemStatusHtml = \`
                    <div class="status-row">
                        <span class="status-label">Server Status:</span>
                        <span class="status-value">\${data.server.status}</span>
                    </div>
                    <div class="status-row">
                        <span class="status-label">Port:</span>
                        <span class="status-value">\${data.server.port}</span>
                    </div>
                    <div class="status-row">
                        <span class="status-label">Uptime:</span>
                        <span class="status-value">\${data.server.uptime}</span>
                    </div>
                    <div class="status-row">
                        <span class="status-label">Memory Usage:</span>
                        <span class="status-value">\${data.server.memory.heapUsed} / \${data.server.memory.heapTotal}</span>
                    </div>
                    <div class="status-row">
                        <span class="status-label">Database:</span>
                        <span class="status-value">\${data.database.status}</span>
                    </div>
                    <div class="status-row">
                        <span class="status-label">Database Name:</span>
                        <span class="status-value">\${data.database.database}</span>
                    </div>
                    <div class="status-row">
                        <span class="status-label">Version:</span>
                        <span class="status-value">\${data.version}</span>
                    </div>
                \`;
                
                document.getElementById('systemStatus').innerHTML = systemStatusHtml;
                document.getElementById('lastUpdate').textContent = new Date().toLocaleString();
            } catch (error) {
                document.getElementById('systemStatus').innerHTML = '<div style="color: red;">Error loading system status</div>';
            }
        }
        
        // Update status on page load
        updateSystemStatus();
        
        // Auto-refresh every 30 seconds
        setInterval(updateSystemStatus, 30000);
    </script>
</body>
</html>
  `;
  
  res.send(html);
});

module.exports = router;
