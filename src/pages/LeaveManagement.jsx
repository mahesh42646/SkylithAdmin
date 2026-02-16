'use client';

import { useState, useEffect } from 'react';
import {
  FaUmbrellaBeach,
  FaCheckCircle,
  FaTimesCircle,
  FaFilter,
  FaTimes,
  FaClock,
  FaUser,
  FaCalendarAlt
} from 'react-icons/fa';
import { getCurrentUser } from '@/utils/auth';
import { hasPermission, PERMISSIONS } from '@/utils/permissions';
import api from '@/utils/api';
import DataTable from '@/components/common/DataTable';
import Modal from '@/components/common/Modal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Notification from '@/components/common/Notification';

export default function LeaveManagement() {
  const currentUser = getCurrentUser();
  const canManage = hasPermission(currentUser, PERMISSIONS.MANAGE_LEAVES);

  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingLeave, setRejectingLeave] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchLeaves();
  }, [selectedUser, statusFilter]);

  const fetchUsers = async () => {
    try {
      const response = await api.getUsers({ limit: 1000 });
      if (response.success) setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const params = {
        ...(selectedUser && { userId: selectedUser }),
        ...(statusFilter && { status: statusFilter })
      };
      const response = await api.getLeaves(params);
      if (response.success) setLeaves(response.data);
    } catch (error) {
      setNotification({ message: error.message || 'Failed to fetch leaves', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (leave) => {
    try {
      const response = await api.approveLeave(leave._id);
      if (response.success) {
        setNotification({ message: 'Leave approved successfully', type: 'success' });
        fetchLeaves();
      }
    } catch (error) {
      setNotification({ message: error.message || 'Failed to approve', type: 'error' });
    }
  };

  const handleRejectClick = (leave) => {
    setRejectingLeave(leave);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectingLeave) return;
    try {
      const response = await api.rejectLeave(rejectingLeave._id, rejectionReason);
      if (response.success) {
        setNotification({ message: 'Leave rejected', type: 'success' });
        setShowRejectModal(false);
        setRejectingLeave(null);
        fetchLeaves();
      }
    } catch (error) {
      setNotification({ message: error.message || 'Failed to reject', type: 'error' });
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { color: 'warning', label: 'Pending' },
      approved: { color: 'success', label: 'Approved' },
      rejected: { color: 'danger', label: 'Rejected' }
    };
    const { color, label } = config[status] || config.pending;
    return <span className={`badge bg-${color}`}>{label}</span>;
  };

  const getTypeBadge = (type) => {
    const labels = { annual: 'Annual', sick: 'Sick', casual: 'Casual', unpaid: 'Unpaid', other: 'Other' };
    return <span className="badge bg-secondary">{labels[type] || type}</span>;
  };

  const columns = [
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
            <div className="text-muted small">{value?.email || ''}</div>
          </div>
        </div>
      )
    },
    {
      key: 'startDate',
      label: 'Start Date',
      render: (value) => new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    },
    {
      key: 'endDate',
      label: 'End Date',
      render: (value) => new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    },
    {
      key: 'type',
      label: 'Type',
      render: (value) => getTypeBadge(value)
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (value) => <span className="text-truncate d-inline-block" style={{ maxWidth: 150 }}>{value || '-'}</span>
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => getStatusBadge(value)
    }
  ];

  const actions = (row) => (
    row.status === 'pending' && canManage && (
      <div className="d-flex gap-2">
        <button className="btn btn-sm btn-success" onClick={() => handleApprove(row)} title="Approve">
          <FaCheckCircle />
        </button>
        <button className="btn btn-sm btn-danger" onClick={() => handleRejectClick(row)} title="Reject">
          <FaTimesCircle />
        </button>
      </div>
    )
  );

  if (loading && leaves.length === 0) {
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
            <FaUmbrellaBeach className="me-2" />
            Leave Management
          </h2>
          <p className="text-muted">Approve or reject leave requests</p>
        </div>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h6 className="fw-bold mb-3"><FaFilter className="me-2" />Filters</h6>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label fw-semibold">Employee</label>
              <select
                className="form-select"
                value={selectedUser || ''}
                onChange={(e) => setSelectedUser(e.target.value || null)}
              >
                <option value="">All Employees</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>{u.name} - {u.email}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold">Status</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <button
                className="btn btn-secondary w-100"
                onClick={() => { setSelectedUser(null); setStatusFilter(''); }}
              >
                <FaTimes className="me-2" />Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <DataTable
            columns={columns}
            data={leaves}
            searchable
            pagination
            pageSize={15}
            actions={actions}
          />
        </div>
      </div>

      <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="Reject Leave">
        {rejectingLeave && (
          <>
            <p className="mb-2">
              Reject leave for <strong>{rejectingLeave.user?.name}</strong>?
            </p>
            <div className="mb-3">
              <label className="form-label">Reason (optional)</label>
              <textarea
                className="form-control"
                rows="3"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
              />
            </div>
            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-secondary" onClick={() => setShowRejectModal(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleRejectConfirm}>Reject Leave</button>
            </div>
          </>
        )}
      </Modal>

      {notification && (
        <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
      )}
    </div>
  );
}
