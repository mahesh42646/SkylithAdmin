'use client';

import { useState, useEffect } from 'react';
import { FaUserShield, FaSearch, FaPlus, FaEdit, FaTrash, FaChevronDown, FaChevronUp, FaUsers, FaLock } from 'react-icons/fa';
import Modal from '@/components/common/Modal';
import api from '@/utils/api';
import { PERMISSION_GROUPS, getDefaultPermissions } from '@/utils/permissions';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function RoleList() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRoles, setExpandedRoles] = useState({});
  const [selectedRole, setSelectedRole] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleData, setNewRoleData] = useState({
    name: '',
    displayName: '',
    description: '',
    defaultPermissions: []
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await api.getRoles({ isActive: true });
      if (response.success) {
        setRoles(response.data);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = (roleId) => {
    setExpandedRoles(prev => ({
      ...prev,
      [roleId]: !prev[roleId]
    }));
  };

  const handleViewDetails = (role) => {
    setSelectedRole(role);
    setShowDetailsModal(true);
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    try {
      const response = await api.createRole(newRoleData);
      if (response.success) {
        await fetchRoles();
        setShowCreateModal(false);
        setNewRoleData({
          name: '',
          displayName: '',
          description: '',
          defaultPermissions: []
        });
      }
    } catch (error) {
      alert(error.message || 'Failed to create role');
    }
  };

  const handleDeleteRole = async (role) => {
    if (confirm(`Are you sure you want to delete role "${role.displayName}"? This will also delete all its sub-roles.`)) {
      try {
        const response = await api.deleteRole(role._id);
        if (response.success) {
          await fetchRoles();
        }
      } catch (error) {
        alert(error.message || 'Failed to delete role');
      }
    }
  };

  const isSystemRole = (roleName) => {
    return ['admin', 'management', 'team_member'].includes(roleName);
  };

  const getRoleColor = (roleName) => {
    switch (roleName) {
      case 'admin':
        return 'danger';
      case 'management':
        return 'warning';
      case 'team_member':
        return 'primary';
      default:
        return 'info';
    }
  };

  const filteredRoles = roles.filter(role =>
    role.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: roles.length,
    systemRoles: roles.filter(r => isSystemRole(r.name)).length,
    customRoles: roles.filter(r => !isSystemRole(r.name)).length,
    totalSubRoles: roles.reduce((sum, role) => sum + (role.subRoles?.length || 0), 0)
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
            <FaUserShield className="text-primary" />
            Role List
          </h2>
          <p className="text-muted mb-0">Manage roles and their permissions</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <FaPlus className="me-2" />
          Create Role
        </button>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="display-6 text-primary mb-2">{stats.total}</div>
              <div className="small text-muted">Total Roles</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="display-6 text-warning mb-2">{stats.systemRoles}</div>
              <div className="small text-muted">System Roles</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="display-6 text-info mb-2">{stats.customRoles}</div>
              <div className="small text-muted">Custom Roles</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="display-6 text-success mb-2">{stats.totalSubRoles}</div>
              <div className="small text-muted">Total Sub-Roles</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <label className="form-label fw-semibold">
            <FaSearch className="me-2" />
            Search Roles
          </label>
          <input
            type="text"
            className="form-control"
            placeholder="Search by role name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Role Cards */}
      <div className="row g-3">
        {filteredRoles.length === 0 ? (
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <FaUserShield size={48} className="text-muted mb-3" />
                <h5 className="text-muted">No roles found</h5>
                <p className="text-muted">Try adjusting your search or create a new role</p>
              </div>
            </div>
          </div>
        ) : (
          filteredRoles.map((role) => (
            <div key={role._id} className="col-12 col-md-6 col-lg-4">
              <div className="card border-0 shadow-sm h-100 role-card-hover">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <h5 className="mb-0 fw-bold">{role.displayName || role.name}</h5>
                        {isSystemRole(role.name) && (
                          <FaLock className="text-muted" size={14} title="System Role" />
                        )}
                      </div>
                      <small className="text-muted d-block mb-2">{role.name}</small>
                      {role.description && (
                        <p className="text-muted small mb-0">{role.description}</p>
                      )}
                    </div>
                    <span className={`badge bg-${getRoleColor(role.name)}`}>
                      {role.name}
                    </span>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <small className="text-muted">Sub-Roles</small>
                      <span className="badge bg-info">
                        {role.subRoles?.length || 0}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">Default Permissions</small>
                      <span className="badge bg-secondary">
                        {role.defaultPermissions?.length || 0}
                      </span>
                    </div>
                  </div>

                  {role.subRoles && role.subRoles.length > 0 && (
                    <div className="mb-3">
                      <button
                        className="btn btn-sm btn-outline-primary w-100"
                        onClick={() => toggleRole(role._id)}
                      >
                        {expandedRoles[role._id] ? (
                          <>
                            <FaChevronUp className="me-2" />
                            Hide Sub-Roles
                          </>
                        ) : (
                          <>
                            <FaChevronDown className="me-2" />
                            Show Sub-Roles ({role.subRoles.length})
                          </>
                        )}
                      </button>
                      {expandedRoles[role._id] && (
                        <div className="mt-2 border rounded p-2 bg-light">
                          {role.subRoles.map((subRole, idx) => (
                            <div key={subRole._id || idx} className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                              <div>
                                <div className="small fw-semibold">{subRole.name}</div>
                                {subRole.description && (
                                  <div className="small text-muted">{subRole.description}</div>
                                )}
                              </div>
                              <span className="badge bg-info small">{subRole.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-primary flex-fill"
                      onClick={() => handleViewDetails(role)}
                    >
                      <FaEdit className="me-1" />
                      View Details
                    </button>
                    {!isSystemRole(role.name) && (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteRole(role)}
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Role Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Role Details"
        size="lg"
      >
        {selectedRole && (
          <div>
            <div className="mb-4">
              <h5 className="mb-2">{selectedRole.displayName || selectedRole.name}</h5>
              <p className="text-muted mb-3">{selectedRole.description || 'No description'}</p>
              <div className="d-flex gap-2">
                <span className={`badge bg-${getRoleColor(selectedRole.name)}`}>
                  {selectedRole.name}
                </span>
                {isSystemRole(selectedRole.name) && (
                  <span className="badge bg-secondary">
                    <FaLock className="me-1" />
                    System Role
                  </span>
                )}
              </div>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-12 col-md-6">
                <div className="border rounded p-3">
                  <small className="text-muted d-block mb-1">Sub-Roles</small>
                  <div className="fw-semibold">{selectedRole.subRoles?.length || 0}</div>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="border rounded p-3">
                  <small className="text-muted d-block mb-1">Default Permissions</small>
                  <div className="fw-semibold">{selectedRole.defaultPermissions?.length || 0}</div>
                </div>
              </div>
            </div>

            {selectedRole.subRoles && selectedRole.subRoles.length > 0 && (
              <div className="mb-4">
                <h6 className="mb-3">Sub-Roles</h6>
                <div className="list-group">
                  {selectedRole.subRoles.map((subRole, idx) => (
                    <div key={subRole._id || idx} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <div className="fw-semibold">{subRole.name}</div>
                          {subRole.description && (
                            <small className="text-muted">{subRole.description}</small>
                          )}
                        </div>
                        <span className="badge bg-info">{subRole.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create Role Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Role"
        size="lg"
      >
        <form onSubmit={handleCreateRole}>
          <div className="mb-3">
            <label className="form-label">Role Name (unique identifier) <span className="text-danger">*</span></label>
            <input
              type="text"
              className="form-control"
              value={newRoleData.name}
              onChange={(e) => setNewRoleData({ 
                ...newRoleData, 
                name: e.target.value.toLowerCase().replace(/\s+/g, '_') 
              })}
              required
              placeholder="e.g., senior_developer"
            />
            <small className="text-muted">Lowercase, use underscores (e.g., senior_developer)</small>
          </div>
          <div className="mb-3">
            <label className="form-label">Display Name <span className="text-danger">*</span></label>
            <input
              type="text"
              className="form-control"
              value={newRoleData.displayName}
              onChange={(e) => setNewRoleData({ ...newRoleData, displayName: e.target.value })}
              required
              placeholder="e.g., Senior Developer"
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              value={newRoleData.description}
              onChange={(e) => setNewRoleData({ ...newRoleData, description: e.target.value })}
              rows="3"
              placeholder="Brief description of this role"
            />
          </div>
          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Role
            </button>
          </div>
        </form>
      </Modal>

      <style jsx>{`
        .role-card-hover {
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .role-card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 0.5rem 1rem rgba(91, 33, 182, 0.15) !important;
        }
      `}</style>
    </div>
  );
}

