import React, { useEffect, useRef } from 'react';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';
import { motion } from 'framer-motion';

ChartJS.register(...registerables);

const BusAnalytics = ({ data = {} }) => {
  const chartRefs = {
    utilization: useRef(null),
    fuel: useRef(null),
    maintenance: useRef(null),
    performance: useRef(null)
  };

  // Chart configurations
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: 11
          }
        }
      }
    }
  };

  // Utilization Chart Data
  const utilizationData = {
    labels: data.utilizationLabels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Fleet Utilization %',
      data: data.utilizationData || [85, 88, 82, 90, 87, 75, 70],
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true,
      pointRadius: 4,
      pointHoverRadius: 6
    }, {
      label: 'Target %',
      data: data.utilizationTarget || [85, 85, 85, 85, 85, 80, 75],
      borderColor: 'rgb(239, 68, 68)',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderDash: [5, 5],
      tension: 0.4,
      fill: false,
      pointRadius: 0
    }]
  };

  // Fuel Consumption Chart Data
  const fuelData = {
    labels: data.fuelLabels || ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [{
      label: 'Diesel (L)',
      data: data.dieselData || [2800, 2700, 2900, 2750],
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 1
    }, {
      label: 'CNG (kg)',
      data: data.cngData || [400, 380, 420, 390],
      backgroundColor: 'rgba(16, 185, 129, 0.8)',
      borderColor: 'rgb(16, 185, 129)',
      borderWidth: 1
    }, {
      label: 'Electric (kWh)',
      data: data.electricData || [500, 520, 480, 510],
      backgroundColor: 'rgba(251, 146, 60, 0.8)',
      borderColor: 'rgb(251, 146, 60)',
      borderWidth: 1
    }]
  };

  // Maintenance Status Chart Data
  const maintenanceData = {
    labels: ['Scheduled', 'Completed', 'Overdue', 'In Progress'],
    datasets: [{
      data: data.maintenanceStatus || [12, 8, 3, 2],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(251, 146, 60, 0.8)'
      ],
      borderColor: [
        'rgb(59, 130, 246)',
        'rgb(16, 185, 129)',
        'rgb(239, 68, 68)',
        'rgb(251, 146, 60)'
      ],
      borderWidth: 1
    }]
  };

  // Performance Radar Chart Data
  const performanceData = {
    labels: ['Speed Compliance', 'Fuel Efficiency', 'Punctuality', 'Safety Score', 'Passenger Comfort'],
    datasets: [{
      label: 'Current Performance',
      data: data.currentPerformance || [85, 78, 92, 95, 88],
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      pointBackgroundColor: 'rgb(59, 130, 246)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgb(59, 130, 246)'
    }, {
      label: 'Target Performance',
      data: data.targetPerformance || [90, 85, 95, 98, 90],
      borderColor: 'rgb(239, 68, 68)',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      pointBackgroundColor: 'rgb(239, 68, 68)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgb(239, 68, 68)',
      borderDash: [5, 5]
    }]
  };

  const doughnutOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      legend: {
        position: 'bottom'
      }
    }
  };

  const radarOptions = {
    ...chartOptions,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20
        }
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Fleet Utilization Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Fleet Utilization Trend</h4>
        <div className="h-64">
          <Line ref={chartRefs.utilization} data={utilizationData} options={chartOptions} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <p className="text-gray-600">Average</p>
            <p className="text-xl font-bold text-blue-600">{data.avgUtilization || '84.3'}%</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600">Peak</p>
            <p className="text-xl font-bold text-green-600">{data.peakUtilization || '90'}%</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600">Low</p>
            <p className="text-xl font-bold text-red-600">{data.lowUtilization || '70'}%</p>
          </div>
        </div>
      </motion.div>

      {/* Fuel Consumption Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Fuel Consumption by Type</h4>
        <div className="h-64">
          <Bar ref={chartRefs.fuel} data={fuelData} options={chartOptions} />
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <div>
            <p className="text-gray-600">Total Cost</p>
            <p className="text-xl font-bold text-gray-800">${data.totalFuelCost || '45,320'}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-600">Efficiency</p>
            <p className="text-xl font-bold text-green-600">{data.fuelEfficiency || '5.2'} km/L</p>
          </div>
        </div>
      </motion.div>

      {/* Maintenance Status Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Maintenance Status</h4>
        <div className="h-64">
          <Doughnut ref={chartRefs.maintenance} data={maintenanceData} options={doughnutOptions} />
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">Compliance Rate</p>
          <p className="text-2xl font-bold text-green-600">{data.maintenanceCompliance || '88.5'}%</p>
        </div>
      </motion.div>

      {/* Performance Radar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Performance Metrics</h4>
        <div className="h-64">
          <Radar ref={chartRefs.performance} data={performanceData} options={radarOptions} />
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">Overall Score</p>
          <p className="text-2xl font-bold text-blue-600">{data.overallScore || '87.6'}/100</p>
        </div>
      </motion.div>
    </div>
  );
};

export default BusAnalytics;

