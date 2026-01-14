'use client';

import { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaUsers, FaClock, FaSync } from 'react-icons/fa';
import api from '@/utils/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function LiveTracking() {
  const [allUsers, setAllUsers] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [inactiveUsers, setInactiveUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [filter, setFilter] = useState('all'); // all, active, inactive

  useEffect(() => {
    loadLocations();
    const interval = setInterval(() => {
      loadLocations();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadLocations = async () => {
    try {
      const response = await api.getActiveLocations();
      if (response.success) {
        setAllUsers(response.data || []);
        setActiveUsers(response.activeUsers || []);
        setInactiveUsers(response.inactiveUsers || []);
        setGroups(response.groups || []);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error loading locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (distanceFromPunchIn) => {
    if (!distanceFromPunchIn) return 'success';
    if (distanceFromPunchIn < 50) return 'success';
    if (distanceFromPunchIn < 100) return 'warning';
    return 'danger';
  };

  if (loading) {
    return (
      <div className="container-fluid px-3 py-4">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container-fluid px-3 py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-2">
            <FaMapMarkerAlt className="me-2" />
            Live Employee Tracking
          </h2>
          <p className="text-muted">Real-time location monitoring</p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <small className="text-muted">
            <FaClock className="me-1" />
            Last updated: {lastUpdate.toLocaleTimeString()}
          </small>
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={loadLocations}
          >
            <FaSync className="me-1" />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card border-primary">
            <div className="card-body text-center">
              <FaUsers className="text-primary" size={32} />
              <h3 className="mt-2 mb-0">{allUsers.length}</h3>
              <p className="text-muted mb-0">Total Employees</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-success">
            <div className="card-body text-center">
              <FaMapMarkerAlt className="text-success" size={32} />
              <h3 className="mt-2 mb-0">{activeUsers.length}</h3>
              <p className="text-muted mb-0">Active (Punched In)</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-danger">
            <div className="card-body text-center">
              <FaUsers className="text-danger" size={32} />
              <h3 className="mt-2 mb-0">{inactiveUsers.length}</h3>
              <p className="text-muted mb-0">Inactive</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-warning">
            <div className="card-body text-center">
              <FaMapMarkerAlt className="text-warning" size={32} />
              <h3 className="mt-2 mb-0">{groups.length}</h3>
              <p className="text-muted mb-0">Location Groups</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="btn-group w-100" role="group">
            <button
              type="button"
              className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('all')}
            >
              All Users ({allUsers.length})
            </button>
            <button
              type="button"
              className={`btn ${filter === 'active' ? 'btn-success' : 'btn-outline-success'}`}
              onClick={() => setFilter('active')}
            >
              Active ({activeUsers.length})
            </button>
            <button
              type="button"
              className={`btn ${filter === 'inactive' ? 'btn-danger' : 'btn-outline-danger'}`}
              onClick={() => setFilter('inactive')}
            >
              Inactive ({inactiveUsers.length})
            </button>
          </div>
        </div>
      </div>

      {allUsers.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <FaMapMarkerAlt size={48} className="text-muted mb-3" />
            <h5 className="text-muted">No users found</h5>
            <p className="text-muted">Add users to the platform to see them here</p>
          </div>
        </div>
      ) : (
        <div className="row">
          {/* Grouped Employees */}
          {groups.length > 0 && (
            <div className="col-md-6 mb-4">
              <div className="card">
                <div className="card-header bg-warning bg-opacity-10">
                  <h5 className="mb-0">
                    <FaUsers className="me-2" />
                    Employees Grouped by Location
                  </h5>
                </div>
                <div className="card-body">
                  {groups.map((group, i) => (
                    <div key={i} className="mb-3 p-3 border rounded">
                      <h6 className="text-primary mb-2">
                        Group {i + 1} ({group.employees.length} employees within 100m)
                      </h6>
                      <ul className="list-unstyled mb-0">
                        {group.employees.map((emp) => (
                          <li key={emp.userId} className="mb-2">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <strong>{emp.name}</strong>
                                <br />
                                <small className="text-muted">{emp.department}</small>
                              </div>
                              <div className="text-end">
                                <span className={`badge bg-${getStatusColor(emp.distanceFromPunchIn)}`}>
                                  {Math.round(emp.distanceFromPunchIn || 0)}m
                                </span>
                                <br />
                                <small className="text-muted">
                                  {new Date(emp.timestamp).toLocaleTimeString()}
                                </small>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                      <a
                        href={`https://www.google.com/maps?q=${group.center.latitude},${group.center.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-primary mt-2"
                      >
                        <FaMapMarkerAlt className="me-1" />
                        View on Map
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* All Employees List */}
          <div className={groups.length > 0 ? 'col-md-6 mb-4' : 'col-12 mb-4'}>
            <div className="card">
              <div className="card-header bg-primary bg-opacity-10">
                <h5 className="mb-0">
                  <FaUsers className="me-2" />
                  {filter === 'all' ? 'All Employees' : filter === 'active' ? 'Active Employees' : 'Inactive Employees'}
                </h5>
              </div>
              <div className="card-body" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {(filter === 'all' ? allUsers : filter === 'active' ? activeUsers : inactiveUsers).map((user) => (
                  <div key={user.userId} className="mb-3 p-3 border rounded">
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center mb-2">
                          <h6 className="mb-0 me-2">{user.name}</h6>
                          {user.status === 'active' ? (
                            <span className="badge bg-success">Active</span>
                          ) : (
                            <span className="badge bg-secondary">Inactive</span>
                          )}
                          {user.isTracking && (
                            <span className="badge bg-info ms-1">📡 Tracking</span>
                          )}
                        </div>
                        <p className="text-muted mb-1 small">{user.email}</p>
                        <p className="mb-1">
                          <span className="badge bg-secondary">{user.department || 'No Department'}</span>
                          <span className="badge bg-dark ms-1">{user.role}</span>
                        </p>
                      </div>
                      <div className="text-end">
                        {user.hasPunchedIn && user.attendanceStatus && (
                          <span className={`badge ${
                            user.attendanceStatus === 'present' ? 'bg-success' :
                            user.attendanceStatus === 'late' ? 'bg-warning' :
                            user.attendanceStatus === 'late_half_day' ? 'bg-danger' :
                            user.attendanceStatus === 'half_day' ? 'bg-info' :
                            'bg-secondary'
                          }`}>
                            {user.attendanceStatus.replace('_', ' ').toUpperCase()}
                          </span>
                        )}
                        {user.hasPunchedIn && (
                          <div className="mt-2">
                            {user.isTracking ? (
                              <>
                                <span className={`badge bg-${getStatusColor(user.distanceFromPunchIn || 0)}`}>
                                  📍 {Math.round(user.distanceFromPunchIn || 0)}m
                                </span>
                                <div className="small text-muted mt-1">
                                  {(user.distanceFromPunchIn || 0) < 50 ? 'At work location' : 
                                   (user.distanceFromPunchIn || 0) < 100 ? 'Nearby' : 
                                   (user.distanceFromPunchIn || 0) < 1000 ? `${Math.round(user.distanceFromPunchIn || 0)}m away` :
                                   `${((user.distanceFromPunchIn || 0) / 1000).toFixed(1)}km away`}
                                </div>
                              </>
                            ) : (
                              <span className="badge bg-secondary">
                                📍 No tracking data
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {user.hasPunchedIn && (
                      <div className="mt-2 pt-2 border-top">
                        <div className="row g-2 small">
                          <div className="col-6">
                            <strong>Punch In:</strong><br />
                            {user.punchInTime ? new Date(user.punchInTime).toLocaleTimeString() : 'N/A'}
                          </div>
                          <div className="col-6">
                            <strong>Punch Out:</strong><br />
                            {user.punchOutTime ? new Date(user.punchOutTime).toLocaleTimeString() : 'Not yet'}
                          </div>
                        </div>
                        {user.location && user.timestamp && (
                          <div className="mt-2">
                            <small className="text-muted">
                              <FaClock className="me-1" />
                              Last update: {new Date(user.timestamp).toLocaleString()}
                            </small>
                            <div className="mt-1">
                              <a
                                href={`https://www.google.com/maps?q=${user.location.latitude},${user.location.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-outline-primary"
                              >
                                <FaMapMarkerAlt className="me-1" />
                                View Location
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {!user.hasPunchedIn && (
                      <div className="mt-2 pt-2 border-top">
                        <small className="text-muted">
                          Not punched in today
                        </small>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="card mt-4">
        <div className="card-body">
          <h6 className="mb-3">Distance Legend:</h6>
          <div className="d-flex gap-3 flex-wrap">
            <div>
              <span className="badge bg-success me-2">0-50m</span>
              <span className="text-muted">At work location</span>
            </div>
            <div>
              <span className="badge bg-warning me-2">50-100m</span>
              <span className="text-muted">Nearby</span>
            </div>
            <div>
              <span className="badge bg-danger me-2">&gt;100m</span>
              <span className="text-muted">Away from work location</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
