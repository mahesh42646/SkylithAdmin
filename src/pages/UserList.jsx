'use client';

import { useState, useEffect } from 'react';
import { FaUsers, FaSearch, FaFilter, FaUserPlus, FaEdit, FaTrash, FaDownload, FaUserShield, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import UserAvatar from '@/components/common/UserAvatar';
import Modal from '@/components/common/Modal';
import api from '@/utils/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.getUsers({ limit: 100 });
      if (response.success) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'danger';
      case 'management':
        return 'warning';
      case 'team_member':
        return 'primary';
      default:
        return 'secondary';
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'management':
        return 'Management';
      case 'team_member':
        return 'Team Member';
      default:
        return role;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
    admins: users.filter(u => u.role === 'admin').length,
    management: users.filter(u => u.role === 'management').length,
    teamMembers: users.filter(u => u.role === 'team_member').length
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
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-2 d-flex align-items-center gap-2">
            <FaUsers className="text-primary" />
            User List
          </h2>
          <p className="text-muted mb-0">Manage and view all users in the system</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary">
            <FaDownload className="me-2" />
            Export
          </button>
          <button className="btn btn-primary">
            <FaUserPlus className="me-2" />
            Add User
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6 col-lg-2">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="display-6 text-primary mb-2">{stats.total}</div>
              <div className="small text-muted">Total Employees</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-2">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="display-6 text-success mb-2">{stats.active}</div>
              <div className="small text-muted">Active</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-2">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="display-6 text-secondary mb-2">{stats.inactive}</div>
              <div className="small text-muted">Inactive</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-2">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="display-6 text-danger mb-2">{stats.admins}</div>
              <div className="small text-muted">Admins</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-2">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="display-6 text-warning mb-2">{stats.management}</div>
              <div className="small text-muted">Management</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-2">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="display-6 text-info mb-2">{stats.teamMembers}</div>
              <div className="small text-muted">Team Members</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12 col-md-4">
              <label className="form-label fw-semibold">
                <FaSearch className="me-2" />
                Search Users
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Search by name, email, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label fw-semibold">
                <FaFilter className="me-2" />
                Status
              </label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label fw-semibold">
                <FaUserShield className="me-2" />
                Role
              </label>
              <select
                className="form-select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="management">Management</option>
                <option value="team_member">Team Member</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* User Cards Grid */}
      <div className="row g-3">
        {filteredUsers.length === 0 ? (
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <FaUsers size={48} className="text-muted mb-3" />
                <h5 className="text-muted">No users found</h5>
                <p className="text-muted">Try adjusting your search or filters</p>
              </div>
            </div>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div key={user._id || user.id} className="col-12 col-md-6 col-lg-4 col-xl-3">
              <div className="card border-0 shadow-sm h-100 user-card-hover">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-3">
                    <UserAvatar user={user} size={60} />
                    <div className="ms-3 flex-grow-1">
                      <h6 className="mb-1 fw-bold">{user.name}</h6>
                      <small className="text-muted d-block">{user.email}</small>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <span className={`badge bg-${getRoleBadgeColor(user.role)} me-2`}>
                      {getRoleDisplayName(user.role)}
                    </span>
                    {user.subRole && (
                      <span className="badge bg-info">
                        {user.subRole}
                      </span>
                    )}
                  </div>

                  <div className="mb-3">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <small className="text-muted">Status</small>
                      {user.status === 'active' ? (
                        <span className="badge bg-success">
                          <FaCheckCircle className="me-1" />
                          Active
                        </span>
                      ) : (
                        <span className="badge bg-secondary">
                          <FaTimesCircle className="me-1" />
                          Inactive
                        </span>
                      )}
                    </div>
                    {user.department && (
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <small className="text-muted">Department</small>
                        <small className="fw-semibold">{user.department}</small>
                      </div>
                    )}
                    {user.joinDate && (
                      <div className="d-flex align-items-center justify-content-between">
                        <small className="text-muted">Join Date</small>
                        <small>{new Date(user.joinDate).toLocaleDateString()}</small>
                      </div>
                    )}
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-primary flex-fill"
                      onClick={() => handleViewDetails(user)}
                    >
                      <FaEdit className="me-1" />
                      View Details
                    </button>
                    <button className="btn btn-sm btn-outline-danger">
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* User Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="User Details"
        size="lg"
      >
        {selectedUser && (
          <div>
            <div className="d-flex align-items-center mb-4">
              <UserAvatar user={selectedUser} size={80} />
              <div className="ms-3">
                <h4 className="mb-1">{selectedUser.name}</h4>
                <p className="text-muted mb-2">{selectedUser.email}</p>
                <div>
                  <span className={`badge bg-${getRoleBadgeColor(selectedUser.role)} me-2`}>
                    {getRoleDisplayName(selectedUser.role)}
                  </span>
                  {selectedUser.subRole && (
                    <span className="badge bg-info">
                      {selectedUser.subRole}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="row g-3">
              <div className="col-12 col-md-6">
                <div className="border rounded p-3">
                  <small className="text-muted d-block mb-1">Status</small>
                  <div className="fw-semibold">
                    {selectedUser.status === 'active' ? (
                      <span className="text-success">
                        <FaCheckCircle className="me-1" />
                        Active
                      </span>
                    ) : (
                      <span className="text-secondary">
                        <FaTimesCircle className="me-1" />
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="border rounded p-3">
                  <small className="text-muted d-block mb-1">Department</small>
                  <div className="fw-semibold">{selectedUser.department || 'N/A'}</div>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="border rounded p-3">
                  <small className="text-muted d-block mb-1">Join Date</small>
                  <div className="fw-semibold">
                    {selectedUser.joinDate ? new Date(selectedUser.joinDate).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="border rounded p-3">
                  <small className="text-muted d-block mb-1">Permissions</small>
                  <div className="fw-semibold">
                    {selectedUser.permissions?.length || 0} permission(s)
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <style jsx>{`
        .user-card-hover {
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .user-card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 0.5rem 1rem rgba(91, 33, 182, 0.15) !important;
        }
      `}</style>
    </div>
  );
}

