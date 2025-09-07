import React from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, Clock, Wrench, AlertTriangle, 
  CheckCircle, FileText, DollarSign 
} from 'lucide-react';

const BusTimeline = ({ buses = [] }) => {
  // Sort buses by next maintenance date
  const sortedBuses = [...buses].sort((a, b) => {
    const dateA = new Date(a.nextMaintenance || a.lastMaintenance);
    const dateB = new Date(b.nextMaintenance || b.lastMaintenance);
    return dateA - dateB;
  });

  const getMaintenanceStatus = (bus) => {
    if (!bus.nextMaintenance) return 'unknown';
    
    const nextDate = new Date(bus.nextMaintenance);
    const today = new Date();
    const daysUntil = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) return 'overdue';
    if (daysUntil <= 7) return 'urgent';
    if (daysUntil <= 30) return 'upcoming';
    return 'scheduled';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      case 'urgent': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'upcoming': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'scheduled': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'overdue': return <AlertTriangle className="w-4 h-4" />;
      case 'urgent': return <Clock className="w-4 h-4" />;
      case 'upcoming': return <Calendar className="w-4 h-4" />;
      case 'scheduled': return <CheckCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Not scheduled';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysUntil = (date) => {
    if (!date) return null;
    const nextDate = new Date(date);
    const today = new Date();
    const days = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getMaintenanceType = (bus) => {
    // Determine maintenance type based on various factors
    const mileage = bus.odometerReading || 0;
    const lastMaintenanceDate = new Date(bus.lastMaintenance);
    const daysSinceLastMaintenance = Math.floor((new Date() - lastMaintenanceDate) / (1000 * 60 * 60 * 24));

    if (mileage > 100000 || daysSinceLastMaintenance > 365) {
      return 'Major Service';
    } else if (mileage > 50000 || daysSinceLastMaintenance > 180) {
      return 'Intermediate Service';
    }
    return 'Regular Service';
  };

  const getEstimatedCost = (type) => {
    switch (type) {
      case 'Major Service': return '$2,500 - $3,500';
      case 'Intermediate Service': return '$800 - $1,200';
      case 'Regular Service': return '$300 - $500';
      default: return 'TBD';
    }
  };

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {sortedBuses.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Wrench className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No maintenance schedules available</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          
          {sortedBuses.slice(0, 10).map((bus, index) => {
            const status = getMaintenanceStatus(bus);
            const maintenanceType = getMaintenanceType(bus);
            const daysUntil = getDaysUntil(bus.nextMaintenance);
            
            return (
              <motion.div
                key={bus._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative flex items-start gap-4 group"
              >
                {/* Timeline dot */}
                <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${getStatusColor(status)} border-2`}>
                  {getStatusIcon(status)}
                </div>
                
                {/* Content */}
                <div className="flex-1 pb-6">
                  <div className={`p-4 rounded-lg border ${getStatusColor(status)} hover:shadow-md transition-shadow`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="font-semibold text-gray-800">
                          {bus.busNumber} - {bus.registrationNumber}
                        </h5>
                        <p className="text-sm text-gray-600 mt-1">
                          {maintenanceType}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatDate(bus.nextMaintenance)}
                        </p>
                        {daysUntil !== null && (
                          <p className={`text-xs mt-1 ${
                            daysUntil < 0 ? 'text-red-600 font-bold' : 
                            daysUntil <= 7 ? 'text-orange-600' : 
                            'text-gray-500'
                          }`}>
                            {daysUntil < 0 
                              ? `${Math.abs(daysUntil)} days overdue` 
                              : daysUntil === 0 
                              ? 'Today'
                              : `In ${daysUntil} days`}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1 text-gray-600">
                          <Clock className="w-3 h-3" />
                          Last: {formatDate(bus.lastMaintenance)}
                        </span>
                        <span className="flex items-center gap-1 text-gray-600">
                          <DollarSign className="w-3 h-3" />
                          Est: {getEstimatedCost(maintenanceType)}
                        </span>
                      </div>
                      {bus.odometerReading && (
                        <span className="text-gray-500">
                          {bus.odometerReading.toLocaleString()} km
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
          
          {sortedBuses.length > 10 && (
            <div className="text-center py-2">
              <p className="text-sm text-gray-500">
                +{sortedBuses.length - 10} more scheduled
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BusTimeline;

