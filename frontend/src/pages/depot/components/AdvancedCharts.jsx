import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { 
	BarChart3, TrendingUp, TrendingDown, Activity, Users, Route, 
	Calendar, Car, Fuel, DollarSign, Clock, MapPin, CheckCircle, Download, Ticket 
} from 'lucide-react';

// Mock chart data - in real app, this would come from API
const generateChartData = (data, type) => {
	switch (type) {
		case 'routes':
			return {
				labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
				datasets: [
					{
						label: 'Active Routes',
						data: [12, 15, 18, 22, 25, 28],
						backgroundColor: 'rgba(233, 30, 99, 0.8)',
						borderColor: 'rgba(233, 30, 99, 1)',
						borderWidth: 2
					},
					{
						label: 'Completed Trips',
						data: [45, 52, 61, 68, 75, 82],
						backgroundColor: 'rgba(0, 188, 212, 0.8)',
						borderColor: 'rgba(0, 188, 212, 1)',
						borderWidth: 2
					}
				]
			};
		case 'performance':
			return {
				labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
				datasets: [
					{
						label: 'On-Time Performance',
						data: [95, 92, 88, 94, 96, 89, 93],
						backgroundColor: 'rgba(0, 168, 107, 0.8)',
						borderColor: 'rgba(0, 168, 107, 1)',
						borderWidth: 2,
						fill: true
					}
				]
			};
		case 'revenue':
			return {
				labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
				datasets: [
					{
						label: 'Revenue (₹)',
						data: [125000, 138000, 142000, 156000],
						backgroundColor: 'rgba(255, 179, 0, 0.8)',
						borderColor: 'rgba(255, 179, 0, 1)',
						borderWidth: 2
					}
				]
			};
		default:
			return { labels: [], datasets: [] };
	}
};

// Custom Canvas-based Chart Component
const CanvasChart = ({ data, type, width, height }) => {
	const canvasRef = useRef(null);
	const [hoveredPoint, setHoveredPoint] = useState(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || !data) return;

		const ctx = canvas.getContext('2d');
		const dpr = window.devicePixelRatio || 1;
		const rect = canvas.getBoundingClientRect();

		canvas.width = rect.width * dpr;
		canvas.height = rect.height * dpr;
		ctx.scale(dpr, dpr);

		// Clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw chart
		drawChart(ctx, data, type, width, height);
	}, [data, type, width, height]);

	const drawChart = (ctx, data, type, width, height) => {
		if (!data.datasets || data.datasets.length === 0) return;

		const padding = 40;
		const chartWidth = width - padding * 2;
		const chartHeight = height - padding * 2;
		const maxValue = Math.max(...data.datasets.flatMap(ds => ds.data));
		const minValue = Math.min(...data.datasets.flatMap(ds => ds.data));

		// Draw grid
		ctx.strokeStyle = '#e2e8f0';
		ctx.lineWidth = 1;
		for (let i = 0; i <= 5; i++) {
			const y = padding + (chartHeight / 5) * i;
			ctx.beginPath();
			ctx.moveTo(padding, y);
			ctx.lineTo(width - padding, y);
			ctx.stroke();
		}

		// Draw data
		data.datasets.forEach((dataset, datasetIndex) => {
			ctx.strokeStyle = dataset.borderColor;
			ctx.fillStyle = dataset.backgroundColor;
			ctx.lineWidth = 2;

			ctx.beginPath();
			data.labels.forEach((label, index) => {
				const x = padding + (chartWidth / (data.labels.length - 1)) * index;
				const y = padding + chartHeight - ((dataset.data[index] - minValue) / (maxValue - minValue)) * chartHeight;

				if (index === 0) {
					ctx.moveTo(x, y);
				} else {
					ctx.lineTo(x, y);
				}
			});
			ctx.stroke();

			// Fill area if specified
			if (dataset.fill) {
				ctx.lineTo(width - padding, padding + chartHeight);
				ctx.lineTo(padding, padding + chartHeight);
				ctx.closePath();
				ctx.fill();
			}
		});

		// Draw labels
		ctx.fillStyle = '#64748b';
		ctx.font = '12px system-ui';
		ctx.textAlign = 'center';
		data.labels.forEach((label, index) => {
			const x = padding + (chartWidth / (data.labels.length - 1)) * index;
			ctx.fillText(label, x, height - 10);
		});
	};

	return (
		<canvas
			ref={canvasRef}
			width={width}
			height={height}
			style={{ width: '100%', height: '100%' }}
			onMouseMove={(e) => {
				// Handle hover effects
				const rect = e.currentTarget.getBoundingClientRect();
				const x = e.clientX - rect.left;
				const y = e.clientY - rect.top;
				// Add hover logic here
			}}
		/>
	);
};

// KPI Card Component
const KPICard = ({ title, value, change, icon: Icon, color = 'primary' }) => {
	const isPositive = change >= 0;
	
	return (
		<div className="erp-kpi-card">
			<div className="erp-kpi-header">
				<div className={`erp-kpi-icon ${color}`}>
					<Icon className="h-5 w-5 text-white" />
				</div>
				<div className="erp-kpi-trend">
					{isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
					<span className={isPositive ? 'positive' : 'negative'}>
						{Math.abs(change)}%
					</span>
				</div>
			</div>
			<div className="erp-kpi-content">
				<h3>{title}</h3>
				<p className="value">{value}</p>
			</div>
		</div>
	);
};

// Advanced Analytics Dashboard
const AdvancedCharts = ({ routesData, tripsData, bookingsData }) => {
	const [selectedChart, setSelectedChart] = useState('routes');
	const [timeRange, setTimeRange] = useState('month');
	const [chartType, setChartType] = useState('line');
	const [isLoading, setIsLoading] = useState(false);

	// Memoized chart data
	const chartData = useMemo(() => {
		return generateChartData(routesData, selectedChart);
	}, [routesData, selectedChart]);

	// Performance metrics calculation
	const performanceMetrics = useMemo(() => {
		if (!tripsData || !bookingsData) return {};

		const totalTrips = tripsData.length;
		const completedTrips = tripsData.filter(t => t.status === 'completed').length;
		const onTimeTrips = tripsData.filter(t => t.status === 'completed' && !t.delay).length;
		const totalBookings = bookingsData.length;
		const confirmedBookings = bookingsData.filter(b => b.status === 'confirmed').length;

		return {
			completionRate: totalTrips > 0 ? Math.round((completedTrips / totalTrips) * 100) : 0,
			onTimeRate: completedTrips > 0 ? Math.round((onTimeTrips / completedTrips) * 100) : 0,
			bookingConfirmationRate: totalBookings > 0 ? Math.round((confirmedBookings / totalBookings) * 100) : 0,
			averageOccupancy: totalTrips > 0 ? Math.round(bookingsData.reduce((acc, b) => acc + (b.passengerCount || 0), 0) / totalTrips) : 0
		};
	}, [tripsData, bookingsData]);

	// Smart insights generation
	const insights = useMemo(() => {
		const insights = [];
		
		if (performanceMetrics.completionRate < 90) {
			insights.push({
				type: 'warning',
				message: 'Trip completion rate is below target. Review scheduling.',
				icon: Clock
			});
		}
		
		if (performanceMetrics.onTimeRate < 85) {
			insights.push({
				type: 'danger',
				message: 'On-time performance needs improvement. Check route optimization.',
				icon: Route
			});
		}
		
		if (performanceMetrics.bookingConfirmationRate > 95) {
			insights.push({
				type: 'success',
				message: 'Excellent booking confirmation rate!',
				icon: CheckCircle
			});
		}

		return insights;
	}, [performanceMetrics]);

	// Chart refresh handler
	const refreshChart = useCallback(async () => {
		setIsLoading(true);
		// Simulate API call
		await new Promise(resolve => setTimeout(resolve, 1000));
		setIsLoading(false);
	}, []);

	// Export chart data
	const exportChartData = useCallback(() => {
		const dataStr = JSON.stringify(chartData, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(dataBlob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `${selectedChart}-chart-data.json`;
		link.click();
		URL.revokeObjectURL(url);
	}, [chartData, selectedChart]);

	return (
		<div className="erp-advanced-charts">
			{/* Header with Controls */}
			<div className="erp-charts-header">
				<div className="erp-charts-title">
					<BarChart3 className="erp-charts-icon" />
					<h3>Advanced Analytics</h3>
				</div>
				
				<div className="erp-charts-controls">
					<select
						value={selectedChart}
						onChange={(e) => setSelectedChart(e.target.value)}
						className="erp-chart-select"
					>
						<option value="routes">Routes Analysis</option>
						<option value="performance">Performance Metrics</option>
						<option value="revenue">Revenue Trends</option>
					</select>
					
					<select
						value={timeRange}
						onChange={(e) => setTimeRange(e.target.value)}
						className="erp-chart-select"
					>
						<option value="week">This Week</option>
						<option value="month">This Month</option>
						<option value="quarter">This Quarter</option>
						<option value="year">This Year</option>
					</select>
					
					<button
						onClick={refreshChart}
						disabled={isLoading}
						className="erp-btn-ghost"
						title="Refresh data"
					>
						<Activity className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
						Refresh
					</button>
					
					<button
						onClick={exportChartData}
						className="erp-btn-ghost"
						title="Export data"
					>
						<Download className="h-4 w-4" />
						Export
					</button>
				</div>
			</div>

			{/* KPI Overview */}
			<div className="erp-kpi-grid">
				<KPICard
					title="Trip Completion Rate"
					value={`${performanceMetrics.completionRate || 0}%`}
					change={2.5}
					icon={CheckCircle}
					color="success"
				/>
				<KPICard
					title="On-Time Performance"
					value={`${performanceMetrics.onTimeRate || 0}%`}
					change={-1.2}
					icon={Clock}
					color="warning"
				/>
				<KPICard
					title="Booking Confirmation"
					value={`${performanceMetrics.bookingConfirmationRate || 0}%`}
					change={3.8}
					icon={Ticket}
					color="primary"
				/>
				<KPICard
					title="Average Occupancy"
					value={`${performanceMetrics.averageOccupancy || 0}%`}
					change={1.5}
					icon={Users}
					color="info"
				/>
			</div>

			{/* Chart Display */}
			<div className="erp-chart-container">
				<div className="erp-chart-header">
					<h4>{selectedChart === 'routes' ? 'Routes Analysis' : selectedChart === 'performance' ? 'Performance Metrics' : 'Revenue Trends'}</h4>
					<div className="erp-chart-actions">
						<select
							value={chartType}
							onChange={(e) => setChartType(e.target.value)}
							className="erp-chart-type-select"
						>
							<option value="line">Line Chart</option>
							<option value="bar">Bar Chart</option>
							<option value="area">Area Chart</option>
						</select>
					</div>
				</div>
				
				<div className="erp-chart-content">
					<CanvasChart
						data={chartData}
						type={chartType}
						width={800}
						height={400}
					/>
				</div>
			</div>

			{/* Smart Insights */}
			{insights.length > 0 && (
				<div className="erp-insights-section">
					<h4>Smart Insights</h4>
					<div className="erp-insights-grid">
						{insights.map((insight, index) => (
							<div key={index} className={`erp-insight-card ${insight.type}`}>
								<insight.icon className="erp-insight-icon" />
								<p>{insight.message}</p>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

export default AdvancedCharts;
