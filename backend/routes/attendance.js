const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver');
const Conductor = require('../models/Conductor');
const Duty = require('../models/Duty');
const { auth, requireRole } = require('../middleware/auth');
const { validateAttendanceData } = require('../middleware/validation');

// Mark attendance for conductors and drivers (self-service)
router.post('/mark', auth, async (req, res) => {
  try {
    const { status, location, timestamp } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    let employee;
    let employeeType;
    
    // Find employee based on user role
    if (req.user.role === 'driver') {
      employee = await Driver.findById(req.user.driverId);
      employeeType = 'driver';
    } else if (req.user.role === 'conductor') {
      employee = await Conductor.findById(req.user.conductorId);
      employeeType = 'conductor';
    } else {
      return res.status(403).json({
        success: false,
        message: 'Only drivers and conductors can mark attendance'
      });
    }
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const attendanceDate = timestamp ? new Date(timestamp) : new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    attendanceDate.setHours(0, 0, 0, 0);
    
    // Check if attendance already exists for today
    const existingAttendance = employee.attendance.find(a => {
      const attDate = new Date(a.date);
      attDate.setHours(0, 0, 0, 0);
      return attDate.getTime() === today.getTime();
    });

    if (existingAttendance) {
      // Update existing attendance
      existingAttendance.status = status;
      if (status === 'present' && !existingAttendance.checkInTime) {
        existingAttendance.checkInTime = new Date();
      } else if (status === 'logout' && !existingAttendance.checkOutTime) {
        existingAttendance.checkOutTime = new Date();
      }
      existingAttendance.location = location || existingAttendance.location;
      existingAttendance.updatedAt = new Date();
      existingAttendance.updatedBy = req.user.id;
    } else {
      // Create new attendance entry
      const attendanceData = {
        date: today,
        status,
        checkInTime: status === 'present' ? new Date() : null,
        checkOutTime: status === 'logout' ? new Date() : null,
        location: location || null,
        notes: `Marked via trip management system`,
        enteredBy: req.user.id,
        entryType: 'trip_system'
      };
      
      employee.attendance.push(attendanceData);
    }

    await employee.save();

    // Log activity
    await employee.logActivity(
      'attendance_marked',
      `Attendance marked: ${status}`,
      location,
      'attendance',
      null
    );

    res.json({
      success: true,
      message: 'Attendance marked successfully',
      data: {
        status,
        location,
        timestamp: new Date(),
        employeeType,
        employeeName: employee.name
      }
    });

  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get attendance overview (admin/depot manager only)
router.get('/overview', auth, requireRole(['admin', 'depot_manager']), async (req, res) => {
  try {
    const { depotId, date, startDate, endDate } = req.query;
    
    let query = {};
    
    // Filter by depot
    if (req.user.role === 'depot_manager') {
      query.depotId = req.user.depotId;
    } else if (depotId) {
      query.depotId = depotId;
    }
    
    let dateFilter = {};
    
    // Filter by specific date
    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);
      dateFilter = { date: { $gte: targetDate, $lt: nextDate } };
    }
    
    // Filter by date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter = { date: { $gte: start, $lte: end } };
    }
    
    // Get driver attendance stats
    const driverStats = await Driver.aggregate([
      { $match: query },
      { $unwind: '$attendance' },
      { $match: dateFilter },
      {
        $group: {
          _id: '$attendance.status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get conductor attendance stats
    const conductorStats = await Conductor.aggregate([
      { $match: query },
      { $unwind: '$attendance' },
      { $match: dateFilter },
      {
        $group: {
          _id: '$attendance.status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get today's attendance if no date specified
    if (!date && !startDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todayFilter = { date: { $gte: today, $lt: tomorrow } };
      
      const todayDriverStats = await Driver.aggregate([
        { $match: query },
        { $unwind: '$attendance' },
        { $match: todayFilter },
        {
          $group: {
            _id: '$attendance.status',
            count: { $sum: 1 }
          }
        }
      ]);
      
      const todayConductorStats = await Conductor.aggregate([
        { $match: query },
        { $unwind: '$attendance' },
        { $match: todayFilter },
        {
          $group: {
            _id: '$attendance.status',
            count: { $sum: 1 }
          }
        }
      ]);
      
      // Get total employees
      const totalDrivers = await Driver.countDocuments(query);
      const totalConductors = await Conductor.countDocuments(query);
      
      const overview = {
        today: {
          drivers: {
            total: totalDrivers,
            present: todayDriverStats.find(s => s._id === 'present')?.count || 0,
            absent: todayDriverStats.find(s => s._id === 'absent')?.count || 0,
            late: todayDriverStats.find(s => s._id === 'late')?.count || 0,
            halfDay: todayDriverStats.find(s => s._id === 'half-day')?.count || 0,
            leave: todayDriverStats.find(s => s._id === 'leave')?.count || 0
          },
          conductors: {
            total: totalConductors,
            present: todayConductorStats.find(s => s._id === 'present')?.count || 0,
            absent: todayConductorStats.find(s => s._id === 'absent')?.count || 0,
            late: todayConductorStats.find(s => s._id === 'late')?.count || 0,
            halfDay: todayConductorStats.find(s => s._id === 'half-day')?.count || 0,
            leave: todayConductorStats.find(s => s._id === 'leave')?.count || 0
          }
        },
        period: {
          drivers: driverStats,
          conductors: conductorStats
        }
      };
      
      res.json({
        success: true,
        data: overview
      });
    } else {
      // Return period stats
      const overview = {
        period: {
          drivers: driverStats,
          conductors: conductorStats
        }
      };
      
      res.json({
        success: true,
        data: overview
      });
    }

  } catch (error) {
    console.error('Get attendance overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get detailed attendance report (admin/depot manager only)
router.get('/report', auth, requireRole(['admin', 'depot_manager']), async (req, res) => {
  try {
    const { 
      depotId, 
      startDate, 
      endDate, 
      status, 
      employeeType, 
      search,
      page = 1,
      limit = 50
    } = req.query;
    
    let query = {};
    
    // Filter by depot
    if (req.user.role === 'depot_manager') {
      query.depotId = req.user.depotId;
    } else if (depotId) {
      query.depotId = depotId;
    }
    
    // Filter by employee type
    if (employeeType === 'driver') {
      query = { ...query, model: 'Driver' };
    } else if (employeeType === 'conductor') {
      query = { ...query, model: 'Conductor' };
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { employeeCode: { $regex: search, $options: 'i' } },
        { driverId: { $regex: search, $options: 'i' } },
        { conductorId: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Date range filter
    const start = new Date(startDate || new Date().setDate(new Date().getDate() - 30));
    const end = new Date(endDate || new Date());
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get driver attendance
    const driverQuery = { ...query };
    delete driverQuery.model;
    
    const drivers = await Driver.find(driverQuery)
      .select('name driverId employeeCode depotId attendance')
      .populate('depotId', 'depotName depotCode');
    
    // Get conductor attendance
    const conductorQuery = { ...query };
    delete conductorQuery.model;
    
    const conductors = await Conductor.find(conductorQuery)
      .select('name conductorId employeeCode depotId attendance')
      .populate('depotId', 'depotName depotCode');
    
    // Process attendance data
    const processAttendance = (employees, type) => {
      return employees.map(emp => {
        const periodAttendance = emp.attendance.filter(a => 
          a.date >= start && a.date <= end
        );
        
        if (status) {
          return periodAttendance.filter(a => a.status === status);
        }
        
        return periodAttendance.map(att => ({
          employeeId: emp._id,
          employeeName: emp.name,
          employeeCode: emp.employeeCode,
          employeeType: type,
          depotName: emp.depotId?.depotName || 'N/A',
          depotCode: emp.depotId?.depotCode || 'N/A',
          date: att.date,
          status: att.status,
          checkInTime: att.checkInTime,
          checkOutTime: att.checkOutTime,
          location: att.location,
          notes: att.notes
        }));
      }).flat();
    };
    
    let allAttendance = [
      ...processAttendance(drivers, 'driver'),
      ...processAttendance(conductors, 'conductor')
    ];
    
    // Sort by date (newest first)
    allAttendance.sort((a, b) => b.date - a.date);
    
    // Apply pagination
    const total = allAttendance.length;
    const paginatedAttendance = allAttendance.slice(skip, skip + parseInt(limit));
    
    res.json({
      success: true,
      data: paginatedAttendance,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get attendance report error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get employee attendance history (admin/depot manager only)
router.get('/employee/:employeeId', auth, requireRole(['admin', 'depot_manager']), async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate, status, limit = 100 } = req.query;
    
    // Try to find in drivers first
    let employee = await Driver.findById(employeeId)
      .select('name driverId employeeCode depotId attendance')
      .populate('depotId', 'depotName depotCode');
    
    let employeeType = 'driver';
    
    // If not found in drivers, try conductors
    if (!employee) {
      employee = await Conductor.findById(employeeId)
        .select('name conductorId employeeCode depotId attendance')
        .populate('depotId', 'depotName depotCode');
      employeeType = 'conductor';
    }
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    // Check depot access for depot managers
    if (req.user.role === 'depot_manager' && employee.depotId._id.toString() !== req.user.depotId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this employee'
      });
    }
    
    let attendance = employee.attendance;
    
    // Filter by date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      attendance = attendance.filter(a => a.date >= start && a.date <= end);
    }
    
    // Filter by status
    if (status) {
      attendance = attendance.filter(a => a.status === 'present').length;
    }
    
    // Sort by date (newest first) and limit
    attendance.sort((a, b) => b.date - a.date);
    attendance = attendance.slice(0, parseInt(limit));
    
    // Calculate statistics
    const totalDays = attendance.length;
    const presentDays = attendance.filter(a => a.status === 'present').length;
    const absentDays = attendance.filter(a => a.status === 'absent').length;
    const lateDays = attendance.filter(a => a.status === 'late').length;
    const halfDays = attendance.filter(a => a.status === 'half-day').length;
    const leaveDays = attendance.filter(a => a.status === 'leave').length;
    
    const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
    
    const result = {
      employee: {
        id: employee._id,
        name: employee.name,
        employeeCode: employee.employeeCode,
        type: employeeType,
        depotName: employee.depotId?.depotName || 'N/A',
        depotCode: employee.depotId?.depotCode || 'N/A'
      },
      statistics: {
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        halfDays,
        leaveDays,
        attendanceRate: Math.round(attendanceRate * 100) / 100
      },
      attendance: attendance.map(att => ({
        date: att.date,
        status: att.status,
        checkInTime: att.checkInTime,
        checkOutTime: att.checkOutTime,
        location: att.location,
        notes: att.notes
      }))
    };
    
    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get employee attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Manual attendance entry (admin/depot manager only)
router.post('/manual', auth, requireRole(['admin', 'depot_manager']), validateAttendanceData, async (req, res) => {
  try {
    const { employeeId, employeeType, date, status, checkInTime, checkOutTime, location, notes } = req.body;
    
    let employee;
    
    // Find employee
    if (employeeType === 'driver') {
      employee = await Driver.findById(employeeId);
    } else if (employeeType === 'conductor') {
      employee = await Conductor.findById(employeeId);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee type'
      });
    }
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    // Check depot access for depot managers
    if (req.user.role === 'depot_manager' && employee.depotId.toString() !== req.user.depotId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this employee'
      });
    }
    
    // Check if attendance already exists for this date
    const existingAttendance = employee.attendance.find(a => {
      const attDate = new Date(a.date);
      const targetDate = new Date(date);
      return attDate.getTime() === targetDate.getTime();
    });
    
    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already exists for this date'
      });
    }
    
    // Add attendance
    const attendanceData = {
      date: new Date(date),
      status,
      checkInTime: checkInTime ? new Date(checkInTime) : null,
      checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
      location: location || null,
      notes: notes || null,
      enteredBy: req.user.id,
      entryType: 'manual'
    };
    
    employee.attendance.push(attendanceData);
    await employee.save();
    
    // Log activity
    await employee.logActivity(
      'attendance_manual_entry',
      `Manual attendance entry: ${status}`,
      location,
      'attendance',
      null
    );
    
    res.json({
      success: true,
      message: 'Attendance entry added successfully',
      data: attendanceData
    });

  } catch (error) {
    console.error('Manual attendance entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update attendance entry (admin/depot manager only)
router.put('/:attendanceId', auth, requireRole(['admin', 'depot_manager']), async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { status, checkInTime, checkOutTime, location, notes } = req.body;
    
    // Find employee with this attendance
    let employee = await Driver.findOne({ 'attendance._id': attendanceId });
    let employeeType = 'driver';
    
    if (!employee) {
      employee = await Conductor.findOne({ 'attendance._id': attendanceId });
      employeeType = 'conductor';
    }
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }
    
    // Check depot access for depot managers
    if (req.user.role === 'depot_manager' && employee.depotId.toString() !== req.user.depotId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this employee'
      });
    }
    
    // Find and update attendance
    const attendance = employee.attendance.id(attendanceId);
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }
    
    // Update fields
    if (status) attendance.status = status;
    if (checkInTime) attendance.checkInTime = new Date(checkInTime);
    if (checkOutTime) attendance.checkOutTime = new Date(checkOutTime);
    if (location !== undefined) attendance.location = location;
    if (notes !== undefined) attendance.notes = notes;
    
    attendance.updatedBy = req.user.id;
    attendance.updatedAt = new Date();
    
    await employee.save();
    
    // Log activity
    await employee.logActivity(
      'attendance_updated',
      `Attendance updated: ${status}`,
      location,
      'attendance',
      null
    );
    
    res.json({
      success: true,
      message: 'Attendance updated successfully',
      data: attendance
    });

  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete attendance entry (admin only)
router.delete('/:attendanceId', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { attendanceId } = req.params;
    
    // Find employee with this attendance
    let employee = await Driver.findOne({ 'attendance._id': attendanceId });
    let employeeType = 'driver';
    
    if (!employee) {
      employee = await Conductor.findOne({ 'attendance._id': attendanceId });
      employeeType = 'conductor';
    }
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }
    
    // Remove attendance
    employee.attendance = employee.attendance.filter(a => a._id.toString() !== attendanceId);
    await employee.save();
    
    // Log activity
    await employee.logActivity(
      'attendance_deleted',
      'Attendance record deleted',
      null,
      'attendance',
      null
    );
    
    res.json({
      success: true,
      message: 'Attendance record deleted successfully'
    });

  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get attendance analytics (admin/depot manager only)
router.get('/analytics', auth, requireRole(['admin', 'depot_manager']), async (req, res) => {
  try {
    const { depotId, startDate, endDate, groupBy = 'day' } = req.query;
    
    let query = {};
    
    // Filter by depot
    if (req.user.role === 'depot_manager') {
      query.depotId = req.user.depotId;
    } else if (depotId) {
      query.depotId = depotId;
    }
    
    // Date range filter
    const start = new Date(startDate || new Date().setDate(new Date().getDate() - 30));
    const end = new Date(endDate || new Date());
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    
    let groupStage;
    if (groupBy === 'day') {
      groupStage = {
        $dateToString: { format: '%Y-%m-%d', date: '$attendance.date' }
      };
    } else if (groupBy === 'week') {
      groupStage = {
        $dateToString: { format: '%Y-W%U', date: '$attendance.date' }
      };
    } else if (groupBy === 'month') {
      groupStage = {
        $dateToString: { format: '%Y-%m', date: '$attendance.date' }
      };
    }
    
    // Driver attendance analytics
    const driverAnalytics = await Driver.aggregate([
      { $match: query },
      { $unwind: '$attendance' },
      { $match: { 'attendance.date': { $gte: start, $lte: end } } },
      {
        $group: {
          _id: groupStage,
          totalDrivers: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$attendance.status', 'present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$attendance.status', 'absent'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$attendance.status', 'late'] }, 1, 0] } },
          halfDay: { $sum: { $cond: [{ $eq: ['$attendance.status', 'half-day'] }, 1, 0] } },
          leave: { $sum: { $cond: [{ $eq: ['$attendance.status', 'leave'] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Conductor attendance analytics
    const conductorAnalytics = await Conductor.aggregate([
      { $match: query },
      { $unwind: '$attendance' },
      { $match: { 'attendance.date': { $gte: start, $lte: end } } },
      {
        $group: {
          _id: groupStage,
          totalConductors: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$attendance.status', 'present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$attendance.status', 'absent'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$attendance.status', 'late'] }, 1, 0] } },
          halfDay: { $sum: { $cond: [{ $eq: ['$attendance.status', 'half-day'] }, 1, 0] } },
          leave: { $sum: { $cond: [{ $eq: ['$attendance.status', 'leave'] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Calculate attendance rates
    const calculateRates = (analytics) => {
      return analytics.map(day => {
        const total = day.present + day.absent + day.late + day.halfDay + day.leave;
        const presentRate = total > 0 ? (day.present / total) * 100 : 0;
        const absentRate = total > 0 ? (day.absent / total) * 100 : 0;
        const lateRate = total > 0 ? (day.late / total) * 100 : 0;
        
        return {
          ...day,
          presentRate: Math.round(presentRate * 100) / 100,
          absentRate: Math.round(absentRate * 100) / 100,
          lateRate: Math.round(lateRate * 100) / 100
        };
      });
    };
    
    const result = {
      drivers: calculateRates(driverAnalytics),
      conductors: calculateRates(conductorAnalytics),
      summary: {
        totalDrivers: driverAnalytics.reduce((sum, day) => sum + day.totalDrivers, 0),
        totalConductors: conductorAnalytics.reduce((sum, day) => sum + day.totalConductors, 0),
        avgDriverAttendance: driverAnalytics.length > 0 ? 
          driverAnalytics.reduce((sum, day) => sum + day.present, 0) / driverAnalytics.length : 0,
        avgConductorAttendance: conductorAnalytics.length > 0 ? 
          conductorAnalytics.reduce((sum, day) => sum + day.present, 0) / conductorAnalytics.length : 0
      }
    };
    
    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get attendance analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
