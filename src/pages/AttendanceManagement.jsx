'use client';

import { useState, useEffect } from 'react';
import { FaClock, FaCalendar, FaUsers, FaDownload, FaEdit, FaTrash, FaChartLine, FaFilter, FaTimes, FaCheckCircle, FaTimesCircle, FaExclamationCircle, FaCoffee, FaUmbrellaBeach } from 'react-icons/fa';
import { getCurrentUser } from '@/utils/auth';
import { hasPermission, PERMISSIONS } from '@/utils/permissions';
import api from '@/utils/api';
import DataTable from '@/components/common/DataTable';
import Modal from '@/components/common/Modal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Notification from '@/components/common/Notification';
import StatCard from '@/components/common/StatCard';

export default function AttendanceManagement() {
  const currentUser = getCurrentUser();
  const canManage = hasPermission(currentUser, PERMISSIONS.MANAGE_ATTENDANCE);

  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`; // First day of current month
  });
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // Today's date
  });
  const [statusFilter, setStatusFilter] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState(null);
  const [viewingAttendance, setViewingAttendance] = useState(null);
  const [notification, setNotification] = useState(null);
  const [statistics, setStatistics] = useState({
    present: 0,
    absent: 0,
    late: 0,
    half_day: 0,
    leave: 0,
    holiday: 0
  });
  const [summary, setSummary] = useState(null);

  const [formData, setFormData] = useState({
    status: '',
    notes: '',
    punchInTime: '',
    punchOutTime: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchAttendance();
  }, [startDate, endDate, statusFilter, selectedUser]);

  const fetchUsers = async () => {
    try {
      const response = await api.getUsers({ limit: 1000 });
      if (response.success) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const params = {
        startDate,
        endDate,
        showAllUsers: 'true', // Show all users, even those without attendance records
        ...(selectedUser && { userId: selectedUser }),
        ...(statusFilter && { status: statusFilter })
      };

      const response = await api.getAttendance(params);
      if (response.success) {
        setAttendance(response.data);
        calculateStatistics(response.data);
      }

      // Fetch summary if user is selected
      if (selectedUser) {
        const summaryResponse = await api.getAttendanceSummary(selectedUser, {
          startDate,
          endDate
        });
        if (summaryResponse.success) {
          setSummary(summaryResponse.data);
        }
      } else {
        setSummary(null);
      }
    } catch (error) {
      setNotification({
        message: error.message || 'Failed to fetch attendance',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (data) => {
    const stats = {
      present: 0,
      absent: 0,
      late: 0,
      half_day: 0,
      leave: 0,
      holiday: 0
    };

    data.forEach(record => {
      if (stats.hasOwnProperty(record.status)) {
        stats[record.status]++;
      }
    });

    setStatistics(stats);
  };

  const handleView = async (record) => {
    try {
      // Fetch full attendance details including populated user data
      const response = await api.getAttendanceById(record._id);
      if (response.success) {
        setViewingAttendance(response.data);
        setShowViewModal(true);
      }
    } catch (error) {
      setNotification({
        message: error.message || 'Error loading attendance details',
        type: 'error'
      });
    }
  };

  const handleEdit = (record) => {
    setEditingAttendance(record);
    setFormData({
      status: record.status || '',
      notes: record.notes || '',
      punchInTime: record.punchIn?.time ? new Date(record.punchIn.time).toISOString().slice(0, 16) : '',
      punchOutTime: record.punchOut?.time ? new Date(record.punchOut.time).toISOString().slice(0, 16) : ''
    });
    setShowEditModal(true);
  };

  const handleDelete = async (record) => {
    if (!canManage) {
      setNotification({
        message: 'You do not have permission to delete attendance',
        type: 'error'
      });
      return;
    }

    if (window.confirm(`Are you sure you want to delete this attendance record for ${record.user?.name}?`)) {
      try {
        const response = await api.deleteAttendance(record._id);
        if (response.success) {
          setNotification({
            message: 'Attendance deleted successfully',
            type: 'success'
          });
          fetchAttendance();
        }
      } catch (error) {
        setNotification({
          message: error.message || 'Failed to delete attendance',
          type: 'error'
        });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canManage) {
      setNotification({
        message: 'You do not have permission to edit attendance',
        type: 'error'
      });
      return;
    }

    try {
      const updateData = {
        status: formData.status,
        notes: formData.notes
      };

      if (formData.punchInTime) {
        updateData.punchIn = {
          time: new Date(formData.punchInTime).toISOString()
        };
      }

      if (formData.punchOutTime) {
        updateData.punchOut = {
          time: new Date(formData.punchOutTime).toISOString()
        };
      }

      const response = await api.updateAttendance(editingAttendance._id, updateData);
      if (response.success) {
        setNotification({
          message: 'Attendance updated successfully',
          type: 'success'
        });
        setShowEditModal(false);
        fetchAttendance();
      }
    } catch (error) {
      setNotification({
        message: error.message || 'Failed to update attendance',
        type: 'error'
      });
    }
  };

  const handleExportCSV = () => {
    const csv = [
      ['Date', 'Name', 'Email', 'Status', 'Punch In', 'Punch Out', 'Working Hours', 'Notes'],
      ...attendance.map(record => [
        new Date(record.date).toLocaleDateString(),
        record.user?.name || 'N/A',
        record.user?.email || 'N/A',
        record.status || 'N/A',
        record.punchIn?.time ? new Date(record.punchIn.time).toLocaleString() : 'N/A',
        record.punchOut?.time ? new Date(record.punchOut.time).toLocaleString() : 'N/A',
        record.workingHours || '0',
        record.notes || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${startDate}_${endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      present: { color: 'success', icon: FaCheckCircle, label: 'Present' },
      absent: { color: 'danger', icon: FaTimesCircle, label: 'Absent' },
      late: { color: 'warning', icon: FaExclamationCircle, label: 'Late' },
      half_day: { color: 'info', icon: FaCoffee, label: 'Half Day' },
      late_half_day: { color: 'danger', icon: FaExclamationCircle, label: 'Late & Half' },
      leave: { color: 'primary', icon: FaUmbrellaBeach, label: 'Leave' },
      holiday: { color: 'secondary', icon: FaCalendar, label: 'Holiday' }
    };

    const config = statusConfig[status] || statusConfig.absent;
    const Icon = config.icon;

    return (
      <span className={`badge bg-${config.color} d-inline-flex align-items-center gap-1`}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  const columns = [
    {
      key: 'date',
      label: 'Date',
      render: (value) => new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      sortable: true
    },
    {
      key: 'user',
      label: 'Employee',
      render: (value) => (
        <div className="d-flex align-items-center gap-2">
          {value?.avatar && (
            <img 
              src={`${process.env.NEXT_PUBLIC_UPLOAD_BASE_URL}${value.avatar}`} 
              alt={value.name}
              className="rounded-circle"
              width="32"
              height="32"
              style={{ objectFit: 'cover' }}
            />
          )}
          <div>
            <div className="fw-semibold">{value?.name || 'N/A'}</div>
            <div className="text-muted small">{value?.email || 'N/A'}</div>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value, row) => (
        <div>
          {getStatusBadge(value)}
          {row.locationMismatch && (
            <span className="badge bg-warning text-dark ms-1 small" title={`${row.locationDistance}m from punch in`}>
              📍 {Math.round(row.locationDistance)}m
            </span>
          )}
        </div>
      ),
      sortable: true
    },
    {
      key: 'punchIn',
      label: 'Punch In',
      render: (value) => value?.time ? (
        <div className="small">
          <div>{new Date(value.time).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          })}</div>
        </div>
      ) : <span className="text-muted">-</span>
    },
    {
      key: 'punchOut',
      label: 'Punch Out',
      render: (value) => value?.time ? (
        <div className="small">
          <div>{new Date(value.time).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          })}</div>
        </div>
      ) : <span className="text-muted">-</span>
    },
    {
      key: 'workingHours',
      label: 'Hours',
      render: (value) => (
        <span className="badge bg-dark">
          {value ? `${value.toFixed(2)}h` : '0h'}
        </span>
      ),
      sortable: true
    },
    {
      key: 'isEdited',
      label: 'Edited',
      render: (value, row) => value ? (
        <span className="badge bg-warning text-dark" title={`Edited by ${row.editedBy?.name || 'Admin'}`}>
          Yes
        </span>
      ) : <span className="text-muted">-</span>
    }
  ];

  const actions = (row) => (
    <div className="d-flex gap-2">
      <button
        className="btn btn-sm btn-outline-info"
        onClick={() => handleView(row)}
        title="View Details"
      >
        <FaChartLine />
      </button>
      <button
        className="btn btn-sm btn-outline-primary"
        onClick={() => handleEdit(row)}
        disabled={!canManage}
        title="Edit Attendance"
      >
        <FaEdit />
      </button>
      <button
        className="btn btn-sm btn-outline-danger"
        onClick={() => handleDelete(row)}
        disabled={!canManage}
        title="Delete Attendance"
      >
        <FaTrash />
      </button>
    </div>
  );

  // View Attendance Modal Component
  const ViewAttendanceModal = () => {
    if (!viewingAttendance) return null;

    const formatDateTime = (date) => {
      if (!date) return 'Not marked';
      return new Date(date).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    };

    const getStatusBadge = (status) => {
      const badges = {
        present: { class: 'bg-success', icon: <FaCheckCircle />, text: 'Present' },
        late: { class: 'bg-warning text-dark', icon: <FaExclamationCircle />, text: 'Late' },
        half_day: { class: 'bg-info', icon: <FaCoffee />, text: 'Half Day' },
        late_half_day: { class: 'bg-danger', icon: <FaExclamationCircle />, text: 'Late & Half Day' },
        absent: { class: 'bg-danger', icon: <FaTimesCircle />, text: 'Absent' },
        leave: { class: 'bg-primary', icon: <FaUmbrellaBeach />, text: 'Leave' },
        holiday: { class: 'bg-secondary', icon: <FaUmbrellaBeach />, text: 'Holiday' }
      };
      const badge = badges[status] || badges.absent;
      return (
        <span className={`badge ${badge.class} fs-6`}>
          {badge.icon} {badge.text}
        </span>
      );
    };

    const punchInLoc = viewingAttendance.punchIn?.location;
    const punchOutLoc = viewingAttendance.punchOut?.location;

    return (
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Attendance Details"
        size="lg"
      >
        <div className="attendance-view">
          {/* User Info */}
          <div className="card mb-3">
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h6 className="text-muted mb-2">Employee</h6>
                  <h5 className="fw-bold">{viewingAttendance.user?.name || 'Unknown'}</h5>
                  <p className="text-muted mb-0">{viewingAttendance.user?.email}</p>
                  <small className="badge bg-secondary mt-2">
                    {viewingAttendance.user?.department || 'N/A'}
                  </small>
                </div>
                <div className="col-md-6 text-md-end">
                  <h6 className="text-muted mb-2">Date</h6>
                  <h5 className="fw-bold">
                    {new Date(viewingAttendance.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h5>
                  <div className="mt-2">{getStatusBadge(viewingAttendance.status)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-3 mb-3">
            {/* Punch In Card */}
            <div className="col-md-6">
              <div className="card border-success h-100">
                <div className="card-header bg-success bg-opacity-10 border-success">
                  <h6 className="mb-0 text-success">
                    <FaCheckCircle className="me-2" />
                    Punch In
                  </h6>
                </div>
                <div className="card-body">
                  <p className="mb-2">
                    <strong>Time:</strong> {formatDateTime(viewingAttendance.punchIn?.time)}
                  </p>
                  {punchInLoc && (
                    <>
                      <p className="mb-2 small">
                        <strong>Location:</strong><br />
                        {punchInLoc.address || 'Unknown address'}
                      </p>
                      <p className="mb-2 small text-muted">
                        Lat: {punchInLoc.latitude?.toFixed(6)}, Lng: {punchInLoc.longitude?.toFixed(6)}
                      </p>
                    </>
                  )}
                  {viewingAttendance.punchIn?.image && (
                    <div className="mt-3">
                      <img
                        src={`${process.env.NEXT_PUBLIC_UPLOAD_BASE_URL}${viewingAttendance.punchIn.image}`}
                        alt="Punch In"
                        className="img-fluid rounded border"
                        style={{ maxHeight: '200px', objectFit: 'cover', width: '100%' }}
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="sans-serif" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Punch Out Card */}
            <div className="col-md-6">
              <div className="card border-danger h-100">
                <div className="card-header bg-danger bg-opacity-10 border-danger">
                  <h6 className="mb-0 text-danger">
                    <FaTimesCircle className="me-2" />
                    Punch Out
                  </h6>
                </div>
                <div className="card-body">
                  <p className="mb-2">
                    <strong>Time:</strong> {formatDateTime(viewingAttendance.punchOut?.time)}
                  </p>
                  {punchOutLoc && (
                    <>
                      <p className="mb-2 small">
                        <strong>Location:</strong><br />
                        {punchOutLoc.address || 'Unknown address'}
                      </p>
                      <p className="mb-2 small text-muted">
                        Lat: {punchOutLoc.latitude?.toFixed(6)}, Lng: {punchOutLoc.longitude?.toFixed(6)}
                      </p>
                    </>
                  )}
                  {viewingAttendance.punchOut?.image && (
                    <div className="mt-3">
                      <img
                        src={`${process.env.NEXT_PUBLIC_UPLOAD_BASE_URL}${viewingAttendance.punchOut.image}`}
                        alt="Punch Out"
                        className="img-fluid rounded border"
                        style={{ maxHeight: '200px', objectFit: 'cover', width: '100%' }}
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="sans-serif" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Working Hours & Location Info */}
          <div className="card mb-3">
            <div className="card-body">
              <div className="row text-center">
                <div className="col-md-4">
                  <h6 className="text-muted mb-1">Working Hours</h6>
                  <h4 className="fw-bold mb-0">
                    {viewingAttendance.activeHours || viewingAttendance.workingHours || 0} hours
                  </h4>
                </div>
                <div className="col-md-4">
                  <h6 className="text-muted mb-1">Location Distance</h6>
                  <h4 className="mb-0">
                    {viewingAttendance.locationDistance ? (
                      <span className={`badge ${viewingAttendance.locationMismatch ? 'bg-warning text-dark' : 'bg-success'}`}>
                        {Math.round(viewingAttendance.locationDistance)}m
                      </span>
                    ) : (
                      <span className="badge bg-secondary">N/A</span>
                    )}
                  </h4>
                  {viewingAttendance.locationWarning && (
                    <small className="text-warning d-block mt-1">⚠️ {viewingAttendance.locationWarning}</small>
                  )}
                </div>
                <div className="col-md-4">
                  <h6 className="text-muted mb-1">Edited</h6>
                  <h4 className="mb-0">
                    {viewingAttendance.isEdited ? (
                      <span className="badge bg-warning text-dark">
                        Yes by {viewingAttendance.editedBy?.name || 'Admin'}
                      </span>
                    ) : (
                      <span className="badge bg-secondary">No</span>
                    )}
                  </h4>
                </div>
              </div>
            </div>
          </div>

          {/* Map */}
          {(punchInLoc || punchOutLoc) && (
            <div className="card mb-3">
              <div className="card-header">
                <h6 className="mb-0">Location Map</h6>
              </div>
              <div className="card-body">
                <div className="map-container" style={{ height: '300px', borderRadius: '8px', overflow: 'hidden' }}>
                  {/* Simple embedded Google Maps */}
                  {punchInLoc && (
                    <iframe
                      width="100%"
                      height="300"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${punchInLoc.latitude},${punchInLoc.longitude}&zoom=15`}
                    ></iframe>
                  )}
                  {!punchInLoc && punchOutLoc && (
                    <iframe
                      width="100%"
                      height="300"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${punchOutLoc.latitude},${punchOutLoc.longitude}&zoom=15`}
                    ></iframe>
                  )}
                </div>
                <div className="mt-2 d-flex gap-2 justify-content-center">
                  {punchInLoc && (
                    <a
                      href={`https://www.google.com/maps?q=${punchInLoc.latitude},${punchInLoc.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline-success"
                    >
                      <FaChartLine className="me-1" />
                      View Punch In Location
                    </a>
                  )}
                  {punchOutLoc && (
                    <a
                      href={`https://www.google.com/maps?q=${punchOutLoc.latitude},${punchOutLoc.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline-danger"
                    >
                      <FaChartLine className="me-1" />
                      View Punch Out Location
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {viewingAttendance.notes && (
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">Notes</h6>
              </div>
              <div className="card-body">
                <p className="mb-0">{viewingAttendance.notes}</p>
              </div>
            </div>
          )}
        </div>
      </Modal>
    );
  };

  if (loading && attendance.length === 0) {
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
            <FaClock className="me-2" />
            Attendance Management
          </h2>
          <p className="text-muted">Track and manage employee attendance</p>
        </div>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-outline-primary"
            onClick={handleExportCSV}
            disabled={attendance.length === 0}
          >
            <FaDownload className="me-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-2">
          <StatCard
            title="Present"
            value={summary?.present || statistics.present}
            icon={FaCheckCircle}
            color="success"
            trend={null}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-2">
          <StatCard
            title="Absent"
            value={summary?.absent || statistics.absent}
            icon={FaTimesCircle}
            color="danger"
            trend={null}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-2">
          <StatCard
            title="Late"
            value={summary?.late || statistics.late}
            icon={FaExclamationCircle}
            color="warning"
            trend={null}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-2">
          <StatCard
            title="Half Day"
            value={summary?.half_day || statistics.half_day}
            icon={FaCoffee}
            color="info"
            trend={null}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-2">
          <StatCard
            title="Leave"
            value={summary?.leave || statistics.leave}
            icon={FaUmbrellaBeach}
            color="primary"
            trend={null}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-2">
          <StatCard
            title="Total Hours"
            value={summary?.totalWorkingHours?.toFixed(1) || '0'}
            icon={FaClock}
            color="dark"
            trend={null}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h6 className="fw-bold mb-3">
            <FaFilter className="me-2" />
            Filters
          </h6>
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label fw-semibold">Employee</label>
              <select
                className="form-select"
                value={selectedUser || ''}
                onChange={(e) => setSelectedUser(e.target.value || null)}
              >
                <option value="">All Employees</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.name} - {user.email}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label fw-semibold">Start Date</label>
              <input
                type="date"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label fw-semibold">End Date</label>
              <input
                type="date"
                className="form-control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label fw-semibold">Status</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="half_day">Half Day</option>
                <option value="leave">Leave</option>
                <option value="holiday">Holiday</option>
              </select>
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <button
                className="btn btn-secondary w-100"
                onClick={() => {
                  setSelectedUser(null);
                  const today = new Date();
                  const year = today.getFullYear();
                  const month = String(today.getMonth() + 1).padStart(2, '0');
                  const day = String(today.getDate()).padStart(2, '0');
                  setStartDate(`${year}-${month}-01`);
                  setEndDate(`${year}-${month}-${day}`);
                  setStatusFilter('');
                }}
              >
                <FaTimes className="me-2" />
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="card shadow-sm">
        <div className="card-body">
          <DataTable
            columns={columns}
            data={attendance}
            searchable={true}
            pagination={true}
            pageSize={15}
            actions={actions}
          />
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Edit Attendance - ${editingAttendance?.user?.name}`}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Status</label>
            <select
              className="form-select"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              required
            >
              <option value="">Select Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="half_day">Half Day</option>
              <option value="leave">Leave</option>
              <option value="holiday">Holiday</option>
            </select>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Punch In Time</label>
              <input
                type="datetime-local"
                className="form-control"
                value={formData.punchInTime}
                onChange={(e) => setFormData({ ...formData, punchInTime: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Punch Out Time</label>
              <input
                type="datetime-local"
                className="form-control"
                value={formData.punchOutTime}
                onChange={(e) => setFormData({ ...formData, punchOutTime: e.target.value })}
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Notes</label>
            <textarea
              className="form-control"
              rows="3"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any notes or reasons for editing..."
            />
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowEditModal(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Update Attendance
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <ViewAttendanceModal />

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}
