import React, { useState } from 'react';
import { 
  Plus, 
  Users, 
  FileText, 
  Settings, 
  Route, 
  Bus, 
  Clock, 
  MapPin,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  ChevronRight,
  Activity,
  Zap,
  Target,
  Calendar,
  BarChart3
} from 'lucide-react';

const QuickActions = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const actionCategories = {
    all: {
      title: 'All Actions',
      icon: Zap,
      color: 'var(--erp-pink)'
    },
    routes: {
      title: 'Route Management',
      icon: Route,
      color: 'var(--erp-blue)'
    },
    fleet: {
      title: 'Fleet Operations',
      icon: Bus,
      color: 'var(--erp-green)'
    },
    scheduling: {
      title: 'Trip Scheduling',
      icon: Clock,
      color: 'var(--erp-amber)'
    },
    analytics: {
      title: 'Analytics & Reports',
      icon: BarChart3,
      color: 'var(--erp-purple)'
    }
  };

  const quickActions = [
    {
      id: 1,
      title: 'Add New Route',
      description: 'Create a new transport route',
      icon: Plus,
      category: 'routes',
      shortcut: 'Ctrl + R',
      action: () => console.log('Add new route'),
      priority: 'high'
    },
    {
      id: 2,
      title: 'Assign Crew',
      description: 'Assign drivers and conductors to trips',
      icon: Users,
      category: 'fleet',
      shortcut: 'Ctrl + C',
      action: () => console.log('Assign crew'),
      priority: 'high'
    },
    {
      id: 3,
      title: 'Schedule Trip',
      description: 'Create new trip schedule',
      icon: Clock,
      category: 'scheduling',
      shortcut: 'Ctrl + T',
      action: () => console.log('Schedule trip'),
      priority: 'medium'
    },
    {
      id: 4,
      title: 'Generate Report',
      description: 'Create operational reports',
      icon: FileText,
      category: 'analytics',
      shortcut: 'Ctrl + G',
      action: () => console.log('Generate report'),
      priority: 'medium'
    },
    {
      id: 5,
      title: 'Fleet Maintenance',
      description: 'Schedule vehicle maintenance',
      icon: Bus,
      category: 'fleet',
      shortcut: 'Ctrl + M',
      action: () => console.log('Fleet maintenance'),
      priority: 'medium'
    },
    {
      id: 6,
      title: 'Route Optimization',
      description: 'Optimize existing routes',
      icon: Route,
      category: 'routes',
      shortcut: 'Ctrl + O',
      action: () => console.log('Route optimization'),
      priority: 'low'
    },
    {
      id: 7,
      title: 'Performance Analytics',
      description: 'View performance metrics',
      icon: TrendingUp,
      category: 'analytics',
      shortcut: 'Ctrl + P',
      action: () => console.log('Performance analytics'),
      priority: 'low'
    },
    {
      id: 8,
      title: 'System Settings',
      description: 'Configure system parameters',
      icon: Settings,
      category: 'all',
      shortcut: 'Ctrl + S',
      action: () => console.log('System settings'),
      priority: 'low'
    }
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'var(--erp-red)';
      case 'medium': return 'var(--erp-amber)';
      case 'low': return 'var(--erp-green)';
      default: return 'var(--erp-gray-500)';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return AlertCircle;
      case 'medium': return Clock;
      case 'low': return CheckCircle;
      default: return Activity;
    }
  };

  const filteredActions = selectedCategory === 'all' 
    ? quickActions 
    : quickActions.filter(action => action.category === selectedCategory);

  return (
    <div className="quick-actions-container">
      {/* Header */}
      <div className="quick-actions-header">
        <h3>Quick Actions Panel</h3>
        <p>Access frequently used operations with keyboard shortcuts</p>
      </div>

      {/* Category Filter */}
      <div className="quick-actions-categories">
        {Object.entries(actionCategories).map(([key, category]) => {
          const IconComponent = category.icon;
          return (
            <button
              key={key}
              className={`category-btn ${selectedCategory === key ? 'active' : ''}`}
              onClick={() => setSelectedCategory(key)}
              style={{ '--category-color': category.color }}
            >
              <IconComponent className="h-4 w-4" />
              {category.title}
            </button>
          );
        })}
      </div>

      {/* Actions Grid */}
      <div className="quick-actions-grid">
        {filteredActions.map((action) => {
          const IconComponent = action.icon;
          const PriorityIcon = getPriorityIcon(action.priority);
          
          return (
            <div key={action.id} className="quick-action-card" onClick={action.action}>
              <div className="action-header">
                <div className="action-icon" style={{ backgroundColor: actionCategories[action.category].color }}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <div className="action-priority" style={{ color: getPriorityColor(action.priority) }}>
                  <PriorityIcon className="h-3 w-3" />
                </div>
              </div>
              
              <div className="action-content">
                <h4>{action.title}</h4>
                <p>{action.description}</p>
                <div className="action-shortcut">
                  <span>{action.shortcut}</span>
                </div>
              </div>
              
              <div className="action-arrow">
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="shortcuts-help">
        <h4>Keyboard Shortcuts</h4>
        <div className="shortcuts-grid">
          {quickActions.slice(0, 6).map((action) => (
            <div key={action.id} className="shortcut-item">
              <span className="shortcut-key">{action.shortcut}</span>
              <span className="shortcut-label">{action.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Actions */}
      <div className="recent-actions">
        <h4>Recent Actions</h4>
        <div className="recent-list">
          <div className="recent-item">
            <div className="recent-icon">
              <Plus className="h-4 w-4" />
            </div>
            <div className="recent-details">
              <span>New route "Mumbai-Goa Coastal" created</span>
              <small>2 minutes ago</small>
            </div>
          </div>
          <div className="recent-item">
            <div className="recent-icon">
              <Users className="h-4 w-4" />
            </div>
            <div className="recent-details">
              <span>Crew assigned to Trip T001</span>
              <small>15 minutes ago</small>
            </div>
          </div>
          <div className="recent-item">
            <div className="recent-icon">
              <FileText className="h-4 w-4" />
            </div>
            <div className="recent-details">
              <span>Monthly report generated</span>
              <small>1 hour ago</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
