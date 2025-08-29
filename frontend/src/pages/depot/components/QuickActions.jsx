import React, { useState, useCallback, useMemo } from 'react';
import { 
	Plus, Route, Calendar, Users, Car, Fuel, Download, Upload, 
	Settings, Bell, Shield, Database, Cloud, Zap, TrendingUp 
} from 'lucide-react';

const QuickActions = ({ depotData, onAction }) => {
	const [expanded, setExpanded] = useState(false);
	const [selectedAction, setSelectedAction] = useState(null);

	// Advanced action definitions with smart categorization
	const actionGroups = useMemo(() => [
		{
			id: 'operations',
			title: 'Operations',
			icon: Zap,
			actions: [
				{
					id: 'add-route',
					label: 'Add Route',
					description: 'Create new route with stops',
					icon: Route,
					shortcut: 'Ctrl+R',
					priority: 'high',
					requiresPermission: 'route.create'
				},
				{
					id: 'schedule-trip',
					label: 'Schedule Trip',
					description: 'Plan new trip with crew',
					icon: Calendar,
					shortcut: 'Ctrl+T',
					priority: 'high',
					requiresPermission: 'trip.create'
				},
				{
					id: 'assign-crew',
					label: 'Assign Crew',
					description: 'Assign drivers and conductors',
					icon: Users,
					shortcut: 'Ctrl+C',
					priority: 'medium',
					requiresPermission: 'crew.assign'
				}
			]
		},
		{
			id: 'management',
			title: 'Management',
			icon: Settings,
			actions: [
				{
					id: 'add-bus',
					label: 'Add Bus',
					description: 'Register new vehicle',
					icon: Car,
					shortcut: 'Ctrl+B',
					priority: 'medium',
					requiresPermission: 'bus.create'
				},
				{
					id: 'fuel-log',
					label: 'Log Fuel',
					description: 'Record fuel consumption',
					icon: Fuel,
					shortcut: 'Ctrl+F',
					priority: 'low',
					requiresPermission: 'fuel.log'
				}
			]
		},
		{
			id: 'data',
			title: 'Data & Analytics',
			icon: Database,
			actions: [
				{
					id: 'export-data',
					label: 'Export Data',
					description: 'Download reports and data',
					icon: Download,
					shortcut: 'Ctrl+E',
					priority: 'low',
					requiresPermission: 'data.export'
				},
				{
					id: 'import-data',
					label: 'Import Data',
					description: 'Upload bulk data',
					icon: Upload,
					shortcut: 'Ctrl+I',
					priority: 'low',
					requiresPermission: 'data.import'
				}
			]
		}
	], []);

	// Smart action filtering based on permissions and context
	const availableActions = useMemo(() => {
		return actionGroups.map(group => ({
			...group,
			actions: group.actions.filter(action => {
				// Check permissions (simplified for demo)
				if (action.requiresPermission) {
					return true; // Assume permission granted for demo
				}
				return true;
			})
		})).filter(group => group.actions.length > 0);
	}, [actionGroups]);

	// Enhanced action handler with analytics
	const handleAction = useCallback((action) => {
		setSelectedAction(action);
		
		// Track action for analytics
		if (window.gtag) {
			window.gtag('event', 'quick_action_clicked', {
				action_id: action.id,
				action_label: action.label,
				depot_id: depotData?.id
			});
		}
		
		// Execute action
		onAction(action);
		
		// Auto-close after action
		setTimeout(() => {
			setSelectedAction(null);
			setExpanded(false);
		}, 1000);
	}, [onAction, depotData?.id]);

	// Keyboard shortcuts handler
	React.useEffect(() => {
		const handleKeyPress = (event) => {
			if (event.ctrlKey) {
				const action = availableActions
					.flatMap(group => group.actions)
					.find(a => a.shortcut === `Ctrl+${event.key.toUpperCase()}`);
				
				if (action) {
					event.preventDefault();
					handleAction(action);
				}
			}
		};

		document.addEventListener('keydown', handleKeyPress);
		return () => document.removeEventListener('keydown', handleKeyPress);
	}, [availableActions, handleAction]);

	return (
		<div className="erp-quick-actions">
			<div className="erp-quick-actions-header">
				<h3>Quick Actions</h3>
				<button
					onClick={() => setExpanded(!expanded)}
					className="erp-expand-btn"
					title={expanded ? 'Collapse' : 'Expand'}
				>
					<TrendingUp className="h-4 w-4" />
				</button>
			</div>

			<div className={`erp-quick-actions-content ${expanded ? 'expanded' : ''}`}>
				{availableActions.map((group) => (
					<div key={group.id} className="erp-action-group">
						<div className="erp-action-group-header">
							<group.icon className="erp-group-icon" />
							<h4>{group.title}</h4>
						</div>
						
						<div className="erp-action-grid">
							{group.actions.map((action) => (
								<button
									key={action.id}
									onClick={() => handleAction(action)}
									className={`erp-quick-action-btn ${action.priority} ${selectedAction?.id === action.id ? 'selected' : ''}`}
									title={`${action.description} (${action.shortcut})`}
								>
									<div className="erp-action-icon">
										<action.icon className="h-5 w-5" />
									</div>
									<div className="erp-action-content">
										<span className="erp-action-label">{action.label}</span>
										{expanded && (
											<span className="erp-action-description">{action.description}</span>
										)}
									</div>
									{expanded && (
										<span className="erp-action-shortcut">{action.shortcut}</span>
									)}
								</button>
							))}
						</div>
					</div>
				))}
			</div>

			{/* Smart Suggestions */}
			{expanded && (
				<div className="erp-smart-suggestions">
					<div className="erp-suggestion-header">
						<Shield className="h-4 w-4" />
						<h4>Smart Suggestions</h4>
					</div>
					<div className="erp-suggestions-list">
						<div className="erp-suggestion-item">
							<Bell className="h-4 w-4" />
							<span>Set up automated alerts for fuel levels</span>
						</div>
						<div className="erp-suggestion-item">
							<Database className="h-4 w-4" />
							<span>Generate monthly performance report</span>
						</div>
						<div className="erp-suggestion-item">
							<Cloud className="h-4 w-4" />
							<span>Backup depot data to cloud storage</span>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default QuickActions;
