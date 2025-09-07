const mongoose = require('mongoose');

const busScheduleSchema = new mongoose.Schema({
  // Basic schedule information
  scheduleName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },

  // Bus and route information
  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    required: true
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: true
  },
  depotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Depot',
    required: true
  },

  // Schedule timing
  departureTime: {
    type: String, // HH:MM format
    required: true
  },
  arrivalTime: {
    type: String, // HH:MM format
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },

  // Schedule frequency
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'custom'],
    default: 'daily'
  },
  daysOfWeek: [{
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  }],
  customDates: [{
    type: Date
  }],

  // Staff assignments
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
  },
  conductorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conductor'
  },

  // Schedule status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'completed'],
    default: 'active'
  },

  // Pricing and capacity
  baseFare: {
    type: Number,
    required: true
  },
  maxCapacity: {
    type: Number,
    required: true
  },
  availableSeats: {
    type: Number,
    default: function() {
      return this.maxCapacity;
    }
  },

  // Schedule validity
  validFrom: {
    type: Date,
    required: true,
    default: Date.now
  },
  validUntil: {
    type: Date
  },

  // Recurring schedule settings
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrencePattern: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly']
  },
  recurrenceInterval: {
    type: Number,
    default: 1 // Every 1 day/week/month/year
  },

  // Special conditions
  specialInstructions: {
    type: String,
    trim: true
  },
  weatherDependent: {
    type: Boolean,
    default: false
  },
  holidaySchedule: {
    type: Boolean,
    default: false
  },

  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Performance tracking
  totalTrips: {
    type: Number,
    default: 0
  },
  onTimePercentage: {
    type: Number,
    default: 0
  },
  averageOccupancy: {
    type: Number,
    default: 0
  },

  // Notifications
  notificationSettings: {
    sendAlerts: {
      type: Boolean,
      default: true
    },
    alertBefore: {
      type: Number,
      default: 30 // minutes before departure
    },
    notifyOnDelay: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance
busScheduleSchema.index({ busId: 1, status: 1 });
busScheduleSchema.index({ routeId: 1, status: 1 });
busScheduleSchema.index({ depotId: 1, status: 1 });
busScheduleSchema.index({ departureTime: 1, daysOfWeek: 1 });
busScheduleSchema.index({ validFrom: 1, validUntil: 1 });
busScheduleSchema.index({ createdBy: 1 });

// Virtual for next occurrence
busScheduleSchema.virtual('nextOccurrence').get(function() {
  if (!this.isRecurring) return null;
  
  const now = new Date();
  const today = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayName = dayNames[today];
  
  if (this.daysOfWeek.includes(todayName)) {
    const [hours, minutes] = this.departureTime.split(':').map(Number);
    const todayDeparture = new Date(now);
    todayDeparture.setHours(hours, minutes, 0, 0);
    
    if (todayDeparture > now) {
      return todayDeparture;
    }
  }
  
  // Find next occurrence
  for (let i = 1; i <= 7; i++) {
    const nextDay = new Date(now);
    nextDay.setDate(now.getDate() + i);
    const nextDayName = dayNames[nextDay.getDay()];
    
    if (this.daysOfWeek.includes(nextDayName)) {
      const [hours, minutes] = this.departureTime.split(':').map(Number);
      nextDay.setHours(hours, minutes, 0, 0);
      return nextDay;
    }
  }
  
  return null;
});

// Method to check if schedule is active for a specific date
busScheduleSchema.methods.isActiveForDate = function(date) {
  const checkDate = new Date(date);
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[checkDate.getDay()];
  
  // Check if date is within validity period
  if (this.validFrom && checkDate < this.validFrom) return false;
  if (this.validUntil && checkDate > this.validUntil) return false;
  
  // Check if it's a recurring schedule
  if (this.isRecurring) {
    return this.daysOfWeek.includes(dayName);
  }
  
  // Check custom dates
  if (this.customDates && this.customDates.length > 0) {
    return this.customDates.some(customDate => 
      customDate.toDateString() === checkDate.toDateString()
    );
  }
  
  return false;
};

// Static method to get schedules for a specific date
busScheduleSchema.statics.getSchedulesForDate = function(date, depotId = null) {
  const query = {
    status: 'active',
    $or: [
      { isRecurring: true },
      { customDates: { $in: [new Date(date)] } }
    ]
  };
  
  if (depotId) {
    query.depotId = depotId;
  }
  
  return this.find(query)
    .populate('busId', 'busNumber busType registrationNumber capacity')
    .populate('routeId', 'routeName routeNumber startingPoint endingPoint')
    .populate('driverId', 'name phone licenseNumber')
    .populate('conductorId', 'name phone employeeId')
    .populate('depotId', 'depotName location')
    .sort({ departureTime: 1 });
};

module.exports = mongoose.model('BusSchedule', busScheduleSchema);
