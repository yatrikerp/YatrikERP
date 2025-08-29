import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
	Bell, AlertCircle, CheckCircle, AlertTriangle, Info, X, 
	Settings, Filter, Archive, Trash2, Star, Clock, Shield 
} from 'lucide-react';

// Smart notification system with AI-powered categorization
const SmartNotifications = ({ depotData, alerts = [] }) => {
	const [notifications, setNotifications] = useState([]);
	const [showSettings, setShowSettings] = useState(false);
	const [filterType, setFilterType] = useState('all');
	const [sortBy, setSortBy] = useState('priority');
	const [showArchived, setShowArchived] = useState(false);
	const [notificationSettings, setNotificationSettings] = useState({
		email: true,
		push: true,
		sound: false,
		desktop: true,
		priority: 'high'
	});

	// Generate smart notifications based on depot data
	useEffect(() => {
		const smartNotifications = [
			// System notifications
			{
				id: 'system-1',
				type: 'info',
				title: 'System Update Available',
				message: 'New YATRIK ERP features are ready to install',
				priority: 'low',
				timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
				category: 'system',
				read: false,
				archived: false,
				actionable: true,
				actions: [
					{ label: 'Update Now', action: 'update-system' },
					{ label: 'Remind Later', action: 'remind-later' }
				]
			},
			// Performance notifications
			{
				id: 'perf-1',
				type: 'warning',
				title: 'Performance Alert',
				message: '3 routes showing delays. Consider route optimization.',
				priority: 'medium',
				timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
				category: 'performance',
				read: false,
				archived: false,
				actionable: true,
				actions: [
					{ label: 'View Routes', action: 'view-routes' },
					{ label: 'Optimize Now', action: 'optimize-routes' }
				]
			},
			// Safety notifications
			{
				id: 'safety-1',
				type: 'danger',
				title: 'Safety Check Required',
				message: 'Bus MH-01-AB-1234 due for maintenance check',
				priority: 'high',
				timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
				category: 'safety',
				read: false,
				archived: false,
				actionable: true,
				actions: [
					{ label: 'Schedule Check', action: 'schedule-maintenance' },
					{ label: 'Mark Complete', action: 'mark-complete' }
				]
			},
			// Success notifications
			{
				id: 'success-1',
				type: 'success',
				title: 'Excellent Performance',
				message: 'All routes completed on time today!',
				priority: 'low',
				timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
				category: 'performance',
				read: true,
				archived: false,
				actionable: false
			}
		];

		// Add external alerts
		const externalAlerts = alerts.map((alert, index) => ({
			id: `external-${index}`,
			type: alert.type,
			title: alert.message,
			message: `Priority: ${alert.priority}`,
			priority: alert.priority === 'high' ? 'high' : alert.priority === 'medium' ? 'medium' : 'low',
			timestamp: new Date(),
			category: 'external',
			read: false,
			archived: false,
			actionable: false
		}));

		setNotifications([...smartNotifications, ...externalAlerts]);
	}, [alerts]);

	// Filtered and sorted notifications
	const filteredNotifications = useMemo(() => {
		let filtered = notifications.filter(notification => {
			if (filterType !== 'all' && notification.type !== filterType) return false;
			if (!showArchived && notification.archived) return false;
			return true;
		});

		// Sort by priority and timestamp
		filtered.sort((a, b) => {
			const priorityOrder = { high: 3, medium: 2, low: 1 };
			if (sortBy === 'priority') {
				const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
				if (priorityDiff !== 0) return priorityDiff;
			}
			return new Date(b.timestamp) - new Date(a.timestamp);
		});

		return filtered;
	}, [notifications, filterType, showArchived, sortBy]);

	// Notification actions
	const markAsRead = useCallback((id) => {
		setNotifications(prev => 
			prev.map(n => n.id === id ? { ...n, read: true } : n)
		);
	}, []);

	const archiveNotification = useCallback((id) => {
		setNotifications(prev => 
			prev.map(n => n.id === id ? { ...n, archived: true } : n)
		);
	}, []);

	const deleteNotification = useCallback((id) => {
		setNotifications(prev => prev.filter(n => n.id !== id));
	}, []);

	const handleAction = useCallback((notification, action) => {
		console.log('Notification action:', { notification, action });
		// Handle different actions
		switch (action) {
			case 'update-system':
				// Trigger system update
				break;
			case 'view-routes':
				// Navigate to routes tab
				break;
			case 'optimize-routes':
				// Open route optimization
				break;
			case 'schedule-maintenance':
				// Open maintenance scheduling
				break;
			default:
				break;
		}
		
		// Mark as read after action
		markAsRead(notification.id);
	}, [markAsRead]);

	// Notification statistics
	const stats = useMemo(() => {
		const total = notifications.length;
		const unread = notifications.filter(n => !n.read).length;
		const highPriority = notifications.filter(n => n.priority === 'high' && !n.read).length;
		const archived = notifications.filter(n => n.archived).length;

		return { total, unread, highPriority, archived };
	}, [notifications]);

	// Smart notification grouping
	const groupedNotifications = useMemo(() => {
		const groups = {};
		filteredNotifications.forEach(notification => {
			const category = notification.category;
			if (!groups[category]) {
				groups[category] = [];
			}
			groups[category].push(notification);
		});
		return groups;
	}, [filteredNotifications]);

	// Get notification icon
	const getNotificationIcon = (type) => {
		switch (type) {
			case 'success': return CheckCircle;
			case 'warning': return AlertTriangle;
			case 'danger': return AlertCircle;
			case 'info': return Info;
			default: return Bell;
		}
	};

	// Get priority color
	const getPriorityColor = (priority) => {
		switch (priority) {
			case 'high': return 'text-red-600 bg-red-100';
			case 'medium': return 'text-yellow-600 bg-yellow-100';
			case 'low': return 'text-green-600 bg-green-100';
			default: return 'text-gray-600 bg-gray-100';
		}
	};

	// Format timestamp
	const formatTimestamp = (timestamp) => {
		const now = new Date();
		const diff = now - timestamp;
		const minutes = Math.floor(diff / (1000 * 60));
		const hours = Math.floor(diff / (1000 * 60 * 60));
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));

		if (minutes < 1) return 'Just now';
		if (minutes < 60) return `${minutes}m ago`;
		if (hours < 24) return `${hours}h ago`;
		return `${days}d ago`;
	};

	return (
		<div className="erp-smart-notifications">
			{/* Header with Statistics */}
			<div className="erp-notifications-header">
				<div className="erp-notifications-title">
					<Bell className="erp-notifications-icon" />
					<h3>Smart Notifications</h3>
					{stats.unread > 0 && (
						<span className="erp-notification-badge">{stats.unread}</span>
					)}
				</div>
				
				<div className="erp-notifications-controls">
					<button
						onClick={() => setShowSettings(!showSettings)}
						className="erp-btn-ghost"
						title="Notification settings"
					>
						<Settings className="h-4 w-4" />
					</button>
					
					<button
						onClick={() => setShowArchived(!showArchived)}
						className={`erp-btn-ghost ${showArchived ? 'active' : ''}`}
						title={showArchived ? 'Hide archived' : 'Show archived'}
					>
						<Archive className="h-4 w-4" />
					</button>
				</div>
			</div>

			{/* Statistics Bar */}
			<div className="erp-notifications-stats">
				<div className="erp-stat-item">
					<span className="erp-stat-label">Total</span>
					<span className="erp-stat-value">{stats.total}</span>
				</div>
				<div className="erp-stat-item">
					<span className="erp-stat-label">Unread</span>
					<span className="erp-stat-value unread">{stats.unread}</span>
				</div>
				<div className="erp-stat-item">
					<span className="erp-stat-label">High Priority</span>
					<span className="erp-stat-value high-priority">{stats.highPriority}</span>
				</div>
				<div className="erp-stat-item">
					<span className="erp-stat-label">Archived</span>
					<span className="erp-stat-value archived">{stats.archived}</span>
				</div>
			</div>

			{/* Filters */}
			<div className="erp-notifications-filters">
				<select
					value={filterType}
					onChange={(e) => setFilterType(e.target.value)}
					className="erp-filter-select"
				>
					<option value="all">All Types</option>
					<option value="info">Information</option>
					<option value="success">Success</option>
					<option value="warning">Warnings</option>
					<option value="danger">Alerts</option>
				</select>
				
				<select
					value={sortBy}
					onChange={(e) => setSortBy(e.target.value)}
					className="erp-filter-select"
				>
					<option value="priority">Sort by Priority</option>
					<option value="timestamp">Sort by Time</option>
				</select>
			</div>

			{/* Notifications List */}
			<div className="erp-notifications-list">
				{Object.entries(groupedNotifications).map(([category, categoryNotifications]) => (
					<div key={category} className="erp-notification-group">
						<div className="erp-notification-group-header">
							<h4 className="erp-category-title">
								{category.charAt(0).toUpperCase() + category.slice(1)}
							</h4>
							<span className="erp-category-count">{categoryNotifications.length}</span>
						</div>
						
						{categoryNotifications.map((notification) => {
							const Icon = getNotificationIcon(notification.type);
							
							return (
								<div
									key={notification.id}
									className={`erp-notification-item ${notification.read ? 'read' : 'unread'} ${notification.archived ? 'archived' : ''}`}
								>
									<div className="erp-notification-icon">
										<Icon className={`h-5 w-5 ${notification.type === 'success' ? 'text-green-600' : notification.type === 'warning' ? 'text-yellow-600' : notification.type === 'danger' ? 'text-red-600' : 'text-blue-600'}`} />
									</div>
									
									<div className="erp-notification-content">
										<div className="erp-notification-header">
											<h5 className="erp-notification-title">{notification.title}</h5>
											<div className="erp-notification-meta">
												<span className={`erp-priority-badge ${getPriorityColor(notification.priority)}`}>
													{notification.priority}
												</span>
												<span className="erp-timestamp">
													<Clock className="h-3 w-3" />
													{formatTimestamp(notification.timestamp)}
												</span>
											</div>
										</div>
										
										<p className="erp-notification-message">{notification.message}</p>
										
										{/* Actionable notifications */}
										{notification.actionable && notification.actions && (
											<div className="erp-notification-actions">
												{notification.actions.map((action, index) => (
													<button
														key={index}
														onClick={() => handleAction(notification, action.action)}
														className="erp-action-btn"
													>
														{action.label}
													</button>
												))}
											</div>
										)}
									</div>
									
									<div className="erp-notification-controls">
										{!notification.read && (
											<button
												onClick={() => markAsRead(notification.id)}
												className="erp-control-btn"
												title="Mark as read"
											>
												<CheckCircle className="h-4 w-4" />
											</button>
										)}
										
										<button
											onClick={() => archiveNotification(notification.id)}
											className="erp-control-btn"
											title="Archive"
										>
											<Archive className="h-4 w-4" />
										</button>
										
										<button
											onClick={() => deleteNotification(notification.id)}
											className="erp-control-btn delete"
											title="Delete"
										>
											<Trash2 className="h-4 w-4" />
										</button>
									</div>
								</div>
							);
						})}
					</div>
				))}
				
				{filteredNotifications.length === 0 && (
					<div className="erp-empty-notifications">
						<Bell className="erp-empty-icon" />
						<h4>No notifications</h4>
						<p>You're all caught up!</p>
					</div>
				)}
			</div>

			{/* Settings Panel */}
			{showSettings && (
				<div className="erp-notification-settings">
					<div className="erp-settings-header">
						<h4>Notification Settings</h4>
						<button
							onClick={() => setShowSettings(false)}
							className="erp-close-btn"
						>
							<X className="h-4 w-4" />
						</button>
					</div>
					
					<div className="erp-settings-content">
						<div className="erp-setting-group">
							<label>Email Notifications</label>
							<input
								type="checkbox"
								checked={notificationSettings.email}
								onChange={(e) => setNotificationSettings(prev => ({ ...prev, email: e.target.checked }))}
								className="erp-setting-checkbox"
							/>
						</div>
						
						<div className="erp-setting-group">
							<label>Push Notifications</label>
							<input
								type="checkbox"
								checked={notificationSettings.push}
								onChange={(e) => setNotificationSettings(prev => ({ ...prev, push: e.target.checked }))}
								className="erp-setting-checkbox"
							/>
						</div>
						
						<div className="erp-setting-group">
							<label>Sound Alerts</label>
							<input
								type="checkbox"
								checked={notificationSettings.sound}
								onChange={(e) => setNotificationSettings(prev => ({ ...prev, sound: e.target.checked }))}
								className="erp-setting-checkbox"
							/>
						</div>
						
						<div className="erp-setting-group">
							<label>Desktop Notifications</label>
							<input
								type="checkbox"
								checked={notificationSettings.desktop}
								onChange={(e) => setNotificationSettings(prev => ({ ...prev, desktop: e.target.checked }))}
								className="erp-setting-checkbox"
							/>
						</div>
						
						<div className="erp-setting-group">
							<label>Minimum Priority</label>
							<select
								value={notificationSettings.priority}
								onChange={(e) => setNotificationSettings(prev => ({ ...prev, priority: e.target.value }))}
								className="erp-setting-select"
							>
								<option value="low">Low</option>
								<option value="medium">Medium</option>
								<option value="high">High</option>
							</select>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default SmartNotifications;
