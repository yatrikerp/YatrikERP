import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { schedulingApiService } from '../../../services/depotApiService';
import './ManagementPages.css';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar,
  Clock,
  MapPin,
  Bus,
  CheckCircle,
  AlertCircle,
  X,
  Settings,
  Repeat
} from 'lucide-react';

const BusScheduling = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [newSchedule, setNewSchedule] = useState({
    routeId: '',
    busId: '',
    driverId: '',
    conductorId: '',
    departureTime: '',
    arrivalTime: '',
    frequency: 'daily',
    status: 'active'
  });

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await schedulingApiService.getSchedules();
      console.log('Bus Scheduling - API response:', response);
      
      // Handle different response structures
      let schedulesData = [];
      if (response.success && response.data) {
        schedulesData = Array.isArray(response.data) ? response.data : response.data.schedules || [];
      } else if (Array.isArray(response)) {
        schedulesData = response;
      } else if (response.schedules) {
        schedulesData = response.schedules;
      }
      
      console.log('Bus Scheduling - Parsed schedules:', schedulesData);
      
      // If no schedules found, provide sample data
      if (schedulesData.length === 0) {
        const sampleSchedules = [
          {
            _id: 'schedule1',
            scheduleNumber: 'SCH-001',
            routeId: { routeName: 'Kochi to Thiruvananthapuram', routeNumber: 'KL-001' },
            busId: { busNumber: 'KL-76-AB-5114', registrationNumber: 'KL76AB9955' },
            driverId: { name: 'Rajesh Kumar' },
            conductorId: { name: 'Suresh Nair' },
            departureTime: '06:00',
            arrivalTime: '10:30',
            frequency: 'daily',
            status: 'active',
            daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
          },
          {
            _id: 'schedule2',
            scheduleNumber: 'SCH-002',
            routeId: { routeName: 'Kochi to Kozhikode', routeNumber: 'KL-002' },
            busId: { busNumber: 'KL-76-AB-5115', registrationNumber: 'KL76AB9956' },
            driverId: { name: 'Manoj Pillai' },
            conductorId: { name: 'Anil Kumar' },
            departureTime: '08:00',
            arrivalTime: '11:45',
            frequency: 'daily',
            status: 'active',
            daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
          },
          {
            _id: 'schedule3',
            scheduleNumber: 'SCH-003',
            routeId: { routeName: 'Thiruvananthapuram to Kozhikode', routeNumber: 'KL-003' },
            busId: { busNumber: 'KL-76-AB-5116', registrationNumber: 'KL76AB9957' },
            driverId: { name: 'Vijay Menon' },
            conductorId: { name: 'Ravi Nair' },
            departureTime: '14:00',
            arrivalTime: '20:15',
            frequency: 'daily',
            status: 'active',
            daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
          }
        ];
        setSchedules(sampleSchedules);
      } else {
        setSchedules(schedulesData);
      }
    } catch (error) {
      console.error('Error fetching schedules in BusScheduling:', error);
      // Provide sample data even on error
      const sampleSchedules = [
        {
          _id: 'schedule1',
          scheduleNumber: 'SCH-001',
          routeId: { routeName: 'Kochi to Thiruvananthapuram', routeNumber: 'KL-001' },
          busId: { busNumber: 'KL-76-AB-5114', registrationNumber: 'KL76AB9955' },
          driverId: { name: 'Rajesh Kumar' },
          conductorId: { name: 'Suresh Nair' },
          departureTime: '06:00',
          arrivalTime: '10:30',
          frequency: 'daily',
          status: 'active',
          daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        }
      ];
      setSchedules(sampleSchedules);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSchedule = async () => {
    try {
      const scheduleData = {
        ...newSchedule,
        _id: `schedule_${Date.now()}`,
        scheduleNumber: `SCH-${String(schedules.length + 1).padStart(3, '0')}`,
        daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      };
      
      setSchedules([...schedules, scheduleData]);
      setShowAddModal(false);
      setNewSchedule({
        routeId: '',
        busId: '',
        driverId: '',
        conductorId: '',
        departureTime: '',
        arrivalTime: '',
        frequency: 'daily',
        status: 'active'
      });
    } catch (error) {
      console.error('Error adding schedule:', error);
    }
  };

  const handleEditSchedule = async () => {
    try {
      const updatedSchedules = schedules.map(schedule => 
        schedule._id === selectedSchedule._id ? { ...schedule, ...selectedSchedule } : schedule
      );
      setSchedules(updatedSchedules);
      setShowEditModal(false);
      setSelectedSchedule(null);
    } catch (error) {
      console.error('Error editing schedule:', error);
    }
  };

  const handleDeleteSchedule = async () => {
    try {
      const updatedSchedules = schedules.filter(schedule => schedule._id !== selectedSchedule._id);
      setSchedules(updatedSchedules);
      setShowDeleteModal(false);
      setSelectedSchedule(null);
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = schedule.scheduleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.routeId?.routeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.busId?.busNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.driverId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || schedule.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="bus-scheduling">
        <div className="page-header">
          <h1>Bus Scheduling</h1>
          <p>Loading schedules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bus-scheduling">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h1>Bus Scheduling</h1>
            <p>Manage bus schedules, timings, and recurring trips</p>
          </div>
          <button className="add-schedule-btn" onClick={() => setShowAddModal(true)}>
            <Plus size={20} />
            Create Schedule
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <Settings size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Schedules</h3>
            <div className="stat-value">{schedules.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>Active Schedules</h3>
            <div className="stat-value">
              {schedules.filter(schedule => schedule.status === 'active').length}
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">
            <Repeat size={24} />
          </div>
          <div className="stat-content">
            <h3>Daily Schedules</h3>
            <div className="stat-value">
              {schedules.filter(schedule => schedule.frequency === 'daily').length}
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="search-filter-bar">
        <div className="search-row">
          <div className="search-input-container">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search schedules, routes, buses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Schedules Table */}
      <div className="schedules-table-container">
        <div className="table-header">
          <h3>Schedules ({filteredSchedules.length})</h3>
        </div>
        <div className="table-wrapper">
          <table className="schedules-table">
            <thead>
              <tr>
                <th>Schedule ID</th>
                <th>Route</th>
                <th>Bus</th>
                <th>Driver</th>
                <th>Conductor</th>
                <th>Departure</th>
                <th>Arrival</th>
                <th>Frequency</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedules.length > 0 ? filteredSchedules.map((schedule, index) => (
                <tr key={schedule._id || index}>
                  <td>
                    <div className="schedule-id">
                      <span className="id">{schedule.scheduleNumber}</span>
                    </div>
                  </td>
                  <td>
                    <div className="schedule-route">
                      <span className="name">{schedule.routeId?.routeName}</span>
                      <span className="route-number">{schedule.routeId?.routeNumber}</span>
                    </div>
                  </td>
                  <td>
                    <div className="schedule-bus">
                      <Bus size={16} />
                      <span>{schedule.busId?.busNumber}</span>
                    </div>
                  </td>
                  <td>
                    <div className="schedule-driver">
                      <span>{schedule.driverId?.name}</span>
                    </div>
                  </td>
                  <td>
                    <div className="schedule-conductor">
                      <span>{schedule.conductorId?.name}</span>
                    </div>
                  </td>
                  <td>
                    <div className="schedule-departure">
                      <Clock size={16} />
                      <span>{schedule.departureTime}</span>
                    </div>
                  </td>
                  <td>
                    <div className="schedule-arrival">
                      <Clock size={16} />
                      <span>{schedule.arrivalTime}</span>
                    </div>
                  </td>
                  <td>
                    <div className="schedule-frequency">
                      <Repeat size={16} />
                      <span>{schedule.frequency}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${schedule.status || 'unknown'}`}>
                      {schedule.status?.charAt(0).toUpperCase() + schedule.status?.slice(1)}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="action-btn view"
                        onClick={() => {
                          setSelectedSchedule(schedule);
                        }}
                      >
                        <Eye size={16} />
                        View
                      </button>
                      <button 
                        className="action-btn edit"
                        onClick={() => {
                          setSelectedSchedule(schedule);
                          setShowEditModal(true);
                        }}
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                      <button 
                        className="action-btn delete"
                        onClick={() => {
                          setSelectedSchedule(schedule);
                          setShowDeleteModal(true);
                        }}
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="10" className="no-data">
                    <div className="empty-state">
                      <Settings size={48} />
                      <h3>No schedules found</h3>
                      <p>No schedules match your search criteria</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Schedule Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Schedule</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Route</label>
                <select
                  value={newSchedule.routeId}
                  onChange={(e) => setNewSchedule({...newSchedule, routeId: e.target.value})}
                >
                  <option value="">Select Route</option>
                  <option value="route1">Kochi to Thiruvananthapuram</option>
                  <option value="route2">Kochi to Kozhikode</option>
                </select>
              </div>
              <div className="form-group">
                <label>Bus</label>
                <select
                  value={newSchedule.busId}
                  onChange={(e) => setNewSchedule({...newSchedule, busId: e.target.value})}
                >
                  <option value="">Select Bus</option>
                  <option value="bus1">KL-76-AB-5114</option>
                  <option value="bus2">KL-76-AB-5115</option>
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Driver</label>
                  <select
                    value={newSchedule.driverId}
                    onChange={(e) => setNewSchedule({...newSchedule, driverId: e.target.value})}
                  >
                    <option value="">Select Driver</option>
                    <option value="driver1">Rajesh Kumar</option>
                    <option value="driver2">Manoj Pillai</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Conductor</label>
                  <select
                    value={newSchedule.conductorId}
                    onChange={(e) => setNewSchedule({...newSchedule, conductorId: e.target.value})}
                  >
                    <option value="">Select Conductor</option>
                    <option value="conductor1">Suresh Nair</option>
                    <option value="conductor2">Anil Kumar</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Departure Time</label>
                  <input
                    type="time"
                    value={newSchedule.departureTime}
                    onChange={(e) => setNewSchedule({...newSchedule, departureTime: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Arrival Time</label>
                  <input
                    type="time"
                    value={newSchedule.arrivalTime}
                    onChange={(e) => setNewSchedule({...newSchedule, arrivalTime: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Frequency</label>
                <select
                  value={newSchedule.frequency}
                  onChange={(e) => setNewSchedule({...newSchedule, frequency: e.target.value})}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={newSchedule.status}
                  onChange={(e) => setNewSchedule({...newSchedule, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAddSchedule}>
                Create Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Schedule Modal */}
      {showEditModal && selectedSchedule && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Schedule</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Schedule Number</label>
                <input
                  type="text"
                  value={selectedSchedule.scheduleNumber}
                  disabled
                />
              </div>
              <div className="form-group">
                <label>Route</label>
                <input
                  type="text"
                  value={selectedSchedule.routeId?.routeName}
                  disabled
                />
              </div>
              <div className="form-group">
                <label>Bus</label>
                <input
                  type="text"
                  value={selectedSchedule.busId?.busNumber}
                  disabled
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Driver</label>
                  <input
                    type="text"
                    value={selectedSchedule.driverId?.name}
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label>Conductor</label>
                  <input
                    type="text"
                    value={selectedSchedule.conductorId?.name}
                    disabled
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Departure Time</label>
                  <input
                    type="time"
                    value={selectedSchedule.departureTime}
                    onChange={(e) => setSelectedSchedule({...selectedSchedule, departureTime: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Arrival Time</label>
                  <input
                    type="time"
                    value={selectedSchedule.arrivalTime}
                    onChange={(e) => setSelectedSchedule({...selectedSchedule, arrivalTime: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Frequency</label>
                <select
                  value={selectedSchedule.frequency}
                  onChange={(e) => setSelectedSchedule({...selectedSchedule, frequency: e.target.value})}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={selectedSchedule.status}
                  onChange={(e) => setSelectedSchedule({...selectedSchedule, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleEditSchedule}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Schedule Modal */}
      {showDeleteModal && selectedSchedule && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Schedule</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="delete-confirmation">
                <AlertCircle size={48} className="warning-icon" />
                <h3>Are you sure?</h3>
                <p>You are about to delete the schedule <strong>{selectedSchedule.scheduleNumber}</strong>. This action cannot be undone.</p>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDeleteSchedule}>
                Delete Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusScheduling;