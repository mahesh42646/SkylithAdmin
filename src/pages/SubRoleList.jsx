'use client';

import { useState, useEffect } from 'react';
import { FaLayerGroup, FaSearch, FaPlus, FaEdit, FaTrash, FaUserShield, FaUsers } from 'react-icons/fa';
import Modal from '@/components/common/Modal';
import api from '@/utils/api';
import { PERMISSION_GROUPS } from '@/utils/permissions';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function SubRoleList() {
  const [roles, setRoles] = useState([]);
  const [subRoles, setSubRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedSubRole, setSelectedSubRole] = useState(null);
  const [selectedParentRole, setSelectedParentRole] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSubRoleData, setNewSubRoleData] = useState({
    name: '',
    description: '',
    permissions: []
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
        // Flatten all sub-roles with their parent role info
        const allSubRoles = [];
        response.data.forEach(role => {
          if (role.subRoles && role.subRoles.length > 0) {
            role.subRoles.forEach(subRole => {
              allSubRoles.push({
                ...subRole,
                parentRole: role
              });
            });
          }
        });
        setSubRoles(allSubRoles);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (subRole) => {
    setSelectedSubRole(subRole);
    setSelectedParentRole(subRole.parentRole);
    setShowDetailsModal(true);
  };

  const handleCreateSubRole = () => {
    if (roles.length === 0) {
      alert('No roles available. Please create a role first.');
      return;
    }
    setNewSubRoleData({
      name: '',
      description: '',
      permissions: []
    });
    setShowCreateModal(true);
  };

  const handleSubmitSubRole = async (e) => {
    e.preventDefault();
    if (!newSubRoleData.name) {
      alert('Please enter a sub-role name');
      return;
    }
    // This would need to be implemented with role selection
    alert('Please select a parent role first. This feature will be implemented in the full form.');
  };

  const handleDeleteSubRole = async (subRole) => {
    if (confirm(`Are you sure you want to delete sub-role "${subRole.name}"?`)) {
      try {
        const response = await api.deleteSubRole(subRole.parentRole._id, subRole._id);
        if (response.success) {
          await fetchRoles();
        }
      } catch (error) {
        alert(error.message || 'Failed to delete sub-role');
      }
    }
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

  const filteredSubRoles = subRoles.filter(subRole => {
    const matchesSearch = 
      subRole.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subRole.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subRole.parentRole?.displayName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || subRole.parentRole?.name === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: subRoles.length,
    byRole: roles.reduce((acc, role) => {
      acc[role.name] = role.subRoles?.length || 0;
      return acc;
    }, {})
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
            <FaLayerGroup className="text-primary" />
            Sub-Role List
          </h2>
          <p className="text-muted mb-0">Manage sub-roles and their specializations</p>
        </div>
        <button className="btn btn-primary" onClick={handleCreateSubRole}>
          <FaPlus className="me-2" />
          Create Sub-Role
        </button>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="display-6 text-primary mb-2">{stats.total}</div>
              <div className="small text-muted">Total Sub-Roles</div>
            </div>
          </div>
        </div>
        {Object.entries(stats.byRole).map(([roleName, count]) => (
          <div key={roleName} className="col-12 col-md-6 col-lg-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body text-center">
                <div className={`display-6 text-${getRoleColor(roleName)} mb-2`}>{count}</div>
                <div className="small text-muted">{roleName}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12 col-md-8">
              <label className="form-label fw-semibold">
                <FaSearch className="me-2" />
                Search Sub-Roles
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Search by sub-role name, description, or parent role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label fw-semibold">
                <FaUserShield className="me-2" />
                Filter by Role
              </label>
              <select
                className="form-select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                {roles.map(role => (
                  <option key={role._id} value={role.name}>
                    {role.displayName || role.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Role Cards Grid */}
      <div className="row g-3">
        {filteredSubRoles.length === 0 ? (
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <FaLayerGroup size={48} className="text-muted mb-3" />
                <h5 className="text-muted">No sub-roles found</h5>
                <p className="text-muted">Try adjusting your search or filters, or create a new sub-role</p>
              </div>
            </div>
          </div>
        ) : (
          filteredSubRoles.map((subRole) => (
            <div key={subRole._id} className="col-12 col-md-6 col-lg-4 col-xl-3">
              <div className="card border-0 shadow-sm h-100 subrole-card-hover">
                <div className="card-body">
                  <div className="mb-3">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h6 className="mb-0 fw-bold">{subRole.name}</h6>
                      <span className="badge bg-info">{subRole.name}</span>
                    </div>
                    {subRole.description && (
                      <p className="text-muted small mb-2">{subRole.description}</p>
                    )}
                  </div>

                  <div className="mb-3">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <FaUserShield className="text-muted" size={14} />
                      <small className="text-muted">Parent Role</small>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className={`badge bg-${getRoleColor(subRole.parentRole?.name)}`}>
                        {subRole.parentRole?.displayName || subRole.parentRole?.name}
                      </span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">Permissions</small>
                      <span className="badge bg-secondary">
                        {subRole.permissions?.length || 0}
                      </span>
                    </div>
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-primary flex-fill"
                      onClick={() => handleViewDetails(subRole)}
                    >
                      <FaEdit className="me-1" />
                      View Details
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDeleteSubRole(subRole)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Sub-Role Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Sub-Role Details"
        size="lg"
      >
        {selectedSubRole && selectedParentRole && (
          <div>
            <div className="mb-4">
              <h5 className="mb-2">{selectedSubRole.name}</h5>
              <p className="text-muted mb-3">{selectedSubRole.description || 'No description'}</p>
              <div className="d-flex gap-2">
                <span className="badge bg-info">{selectedSubRole.name}</span>
                <span className={`badge bg-${getRoleColor(selectedParentRole.name)}`}>
                  {selectedParentRole.displayName || selectedParentRole.name}
                </span>
              </div>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-12 col-md-6">
                <div className="border rounded p-3">
                  <small className="text-muted d-block mb-1">Parent Role</small>
                  <div className="fw-semibold">{selectedParentRole.displayName || selectedParentRole.name}</div>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="border rounded p-3">
                  <small className="text-muted d-block mb-1">Permissions</small>
                  <div className="fw-semibold">{selectedSubRole.permissions?.length || 0}</div>
                </div>
              </div>
            </div>

            {selectedSubRole.permissions && selectedSubRole.permissions.length > 0 && (
              <div>
                <h6 className="mb-3">Assigned Permissions</h6>
                <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {PERMISSION_GROUPS.map((group) =>
                    group.permissions
                      .filter(perm => selectedSubRole.permissions.includes(perm.key))
                      .map((perm) => (
                        <div key={perm.key} className="mb-2">
                          <div className="d-flex align-items-center">
                            <FaUsers className="text-primary me-2" size={12} />
                            <span className="small">{perm.label}</span>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create Sub-Role Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Sub-Role"
        size="lg"
      >
        <form onSubmit={handleSubmitSubRole}>
          <div className="mb-3">
            <label className="form-label">Sub-Role Name <span className="text-danger">*</span></label>
            <input
              type="text"
              className="form-control"
              value={newSubRoleData.name}
              onChange={(e) => setNewSubRoleData({ ...newSubRoleData, name: e.target.value })}
              required
              placeholder="e.g., Team Lead"
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              value={newSubRoleData.description}
              onChange={(e) => setNewSubRoleData({ ...newSubRoleData, description: e.target.value })}
              rows="3"
              placeholder="Brief description of this sub-role"
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
              Create Sub-Role
            </button>
          </div>
        </form>
      </Modal>

      <style jsx>{`
        .subrole-card-hover {
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .subrole-card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 0.5rem 1rem rgba(91, 33, 182, 0.15) !important;
        }
      `}</style>
    </div>
  );
}

