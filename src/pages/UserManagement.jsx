'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FaPlus, FaEdit, FaTrash, FaDownload, FaChevronDown, FaChevronUp, FaUserShield, FaCog, FaUsers, FaLayerGroup, FaEye, FaEnvelope, FaPhone, FaCalendar, FaBuilding, FaUser, FaImage, FaFileUpload, FaTimes, FaFile, FaUserEdit, FaClock, FaFileAlt, FaKey, FaTag, FaGift } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/common/DataTable';
import Modal from '@/components/common/Modal';
import UserAvatar from '@/components/common/UserAvatar';
import api from '@/utils/api';
import { PERMISSION_GROUPS, getDefaultPermissions } from '@/utils/permissions';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function UserManagement() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfileUser, setSelectedProfileUser] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [selectedUserFilter, setSelectedUserFilter] = useState('all');
  const [activeView, setActiveView] = useState('userList'); // 'userList', 'roleList', 'subRoleList'
  const [roleSearchTerm, setRoleSearchTerm] = useState('');
  const [subRoleSearchTerm, setSubRoleSearchTerm] = useState('');
  const [roles, setRoles] = useState([]);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [showCreateSubRoleModal, setShowCreateSubRoleModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [showEditSubRoleModal, setShowEditSubRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [editingSubRole, setEditingSubRole] = useState(null);
  const [selectedRoleForSubRole, setSelectedRoleForSubRole] = useState(null);
  const [expandedRoleIndex, setExpandedRoleIndex] = useState(null);
  const [newRoleData, setNewRoleData] = useState({
    name: '',
    displayName: '',
    description: '',
    defaultPermissions: [],
    allowSubRoles: false
  });
  const [newSubRoleData, setNewSubRoleData] = useState({
    name: '',
    description: '',
    permissions: []
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'team_member',
    subRole: '',
    status: 'active',
    department: '',
    dateOfBirth: '',
    permissions: []
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [documentFiles, setDocumentFiles] = useState([]);
  const [existingDocuments, setExistingDocuments] = useState([]);

  // Fetch users and roles from API
  useEffect(() => {
    fetchUsers();
    fetchRoles();
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

  const fetchRoles = async () => {
    try {
      const response = await api.getRoles({ isActive: true });
      if (response.success) {
        setRoles(response.data);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  // Get sub-roles for selected role
  const getSubRolesForRole = (roleName) => {
    if (!roleName) return [];
    const role = roles.find(r => r.name === roleName);
    if (role && role.subRoles && Array.isArray(role.subRoles)) {
      return role.subRoles.filter(sr => sr.isActive !== false);
    }
    return [];
  };

  // Get all available roles (system + custom) from backend
  const getAllRoles = () => {
    // System role names that should always be available
    const systemRoleNames = ['admin', 'management', 'team_member'];

    // Default fallback display names (only used if role not found in backend)
    const systemRoleDefaults = {
      'admin': { displayName: 'Admin' },
      'management': { displayName: 'Management' },
      'team_member': { displayName: 'Team Member' }
    };

    // Get system roles from backend if they exist, otherwise use defaults
    const systemRoles = systemRoleNames.map(roleName => {
      const backendRole = roles.find(r => r.name === roleName);
      if (backendRole) {
        // Use backend data (includes displayName, description, etc.)
        return {
          name: backendRole.name,
          displayName: backendRole.displayName || systemRoleDefaults[roleName].displayName
        };
      }
      // Fallback to default if not in backend
      return {
        name: roleName,
        displayName: systemRoleDefaults[roleName].displayName
      };
    });

    // Get custom roles (non-system roles) from backend
    const customRoles = roles
      .filter(r => !systemRoleNames.includes(r.name))
      .map(r => ({ name: r.name, displayName: r.displayName || r.name }));

    return [...systemRoles, ...customRoles];
  };

  const handleAdd = () => {
    setEditingUser(null);
    const defaultPerms = getDefaultPermissions('team_member');
    setFormData({
      name: '',
      email: '',
      password: '',
      role: '',
      subRole: '',
      status: 'active',
      department: '',
      dateOfBirth: '',
      permissions: defaultPerms
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    setDocumentFiles([]);
    setExistingDocuments([]);
    // Expand all groups for new user
    const allExpanded = {};
    PERMISSION_GROUPS.forEach((_, index) => {
      allExpanded[index] = true;
    });
    setExpandedGroups(allExpanded);
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    // Ensure permissions is always an array
    const userPermissions = Array.isArray(user.permissions)
      ? user.permissions
      : (user.permissions ? [user.permissions] : getDefaultPermissions(user.role));
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '', // Don't show existing password
      role: user.role || 'team_member',
      subRole: user.subRole || '',
      status: user.status || 'active',
      department: user.department || '',
      dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
      permissions: userPermissions
    });
    setAvatarFile(null);
    setAvatarPreview(user.avatar || null);
    setDocumentFiles([]);
    setExistingDocuments(user.documents || []);
    // Expand all groups for editing
    const allExpanded = {};
    PERMISSION_GROUPS.forEach((_, index) => {
      allExpanded[index] = true;
    });
    setExpandedGroups(allExpanded);
    setShowModal(true);
  };

  const handleDelete = async (user) => {
    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      try {
        const response = await api.deleteUser(user._id || user.id);
        if (response.success) {
          setUsers(users.filter(u => (u._id || u.id) !== (user._id || user.id)));
        }
      } catch (error) {
        alert(error.message || 'Failed to delete user');
      }
    }
  };

  const handlePermissionToggle = (permission) => {
    const currentPerms = formData.permissions || [];
    const newPerms = currentPerms.includes(permission)
      ? currentPerms.filter(p => p !== permission)
      : [...currentPerms, permission];
    setFormData({ ...formData, permissions: newPerms });
  };

  const handleRoleChange = (role) => {
    if (role === '__create_new__') {
      // Open create role modal
      setNewRoleData({
        name: '',
        displayName: '',
        description: '',
        defaultPermissions: []
      });
      setShowCreateRoleModal(true);
      return;
    }

    if (!role) {
      setFormData({ ...formData, role: '', subRole: '', permissions: [] });
      return;
    }
    // Get default permissions - check database role first, then fallback
    const roleData = roles.find(r => r.name === role);
    const defaultPerms = roleData?.defaultPermissions?.length > 0
      ? roleData.defaultPermissions
      : getDefaultPermissions(role);
    setFormData({ ...formData, role, subRole: '', permissions: defaultPerms });
  };

  const handleSubRoleChange = (subRole) => {
    if (subRole === '__create_new__') {
      // Open create sub-role modal
      setNewSubRoleData({
        name: '',
        description: '',
        permissions: []
      });
      setShowCreateSubRoleModal(true);
      return;
    }
    setFormData({ ...formData, subRole });
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    try {
      const response = await api.createRole(newRoleData);
      if (response.success) {
        await fetchRoles(); // Refresh roles
        // Auto-select the newly created role if in user form
        if (showCreateRoleModal && !showEditRoleModal) {
          setFormData({
            ...formData,
            role: response.data.name,
            permissions: response.data.defaultPermissions || []
          });
        }
        setShowCreateRoleModal(false);
        setNewRoleData({
          name: '',
          displayName: '',
          description: '',
          defaultPermissions: [],
          allowSubRoles: false
        });
      }
    } catch (error) {
      alert(error.message || 'Failed to create role');
    }
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setNewRoleData({
      name: role.name,
      displayName: role.displayName,
      description: role.description || '',
      defaultPermissions: role.defaultPermissions || [],
      allowSubRoles: role.allowSubRoles !== undefined ? role.allowSubRoles : false
    });
    setShowEditRoleModal(true);
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    try {
      const response = await api.updateRole(editingRole._id, {
        displayName: newRoleData.displayName,
        description: newRoleData.description,
        defaultPermissions: newRoleData.defaultPermissions,
        allowSubRoles: newRoleData.allowSubRoles || false
      });
      if (response.success) {
        await fetchRoles();
        setShowEditRoleModal(false);
        setEditingRole(null);
        setNewRoleData({
          name: '',
          displayName: '',
          description: '',
          defaultPermissions: [],
          allowSubRoles: false
        });
      }
    } catch (error) {
      alert(error.message || 'Failed to update role');
    }
  };

  const handleDeleteRole = async (role) => {
    // Prevent deletion of system roles
    if (['admin', 'management', 'team_member'].includes(role.name)) {
      alert(`System role "${role.displayName}" cannot be deleted.`);
      return;
    }

    const roleId = role._id || role.id;
    if (!roleId) {
      alert('Error: Role ID is missing. Cannot delete this role.');
      console.error('Role object:', role);
      return;
    }

    if (window.confirm(`Are you sure you want to delete role "${role.displayName}"? This will also delete all its sub-roles. This action cannot be undone.`)) {
      try {
        console.log('Deleting role with ID:', roleId, 'Role:', role);

        // Call backend API to delete
        const response = await api.deleteRole(roleId);
        console.log('Delete response:', response);

        if (response && response.success) {
          // Remove from local state immediately for dynamic update
          setRoles(prevRoles => prevRoles.filter(r => {
            const rId = r._id || r.id;
            return rId !== roleId;
          }));

          // Refresh from backend to ensure consistency
          await fetchRoles();

          alert('Role deleted successfully!');
        } else {
          alert(response?.message || 'Failed to delete role');
        }
      } catch (error) {
        console.error('Error deleting role:', error);
        console.error('Error details:', {
          message: error.message,
          roleId: roleId,
          roleName: role.name,
          fullRole: role
        });
        alert(error.message || 'Failed to delete role. Please check the console for details.');
      }
    }
  };

  const handleEditSubRole = (role, subRole) => {
    setSelectedRoleForSubRole(role);
    setEditingSubRole(subRole);
    setNewSubRoleData({
      name: subRole.name,
      description: subRole.description || '',
      permissions: subRole.permissions || []
    });
    setShowEditSubRoleModal(true);
  };

  const handleUpdateSubRole = async (e) => {
    e.preventDefault();
    try {
      const response = await api.updateSubRole(
        selectedRoleForSubRole._id,
        editingSubRole._id,
        {
          description: newSubRoleData.description,
          permissions: newSubRoleData.permissions
        }
      );
      if (response.success) {
        await fetchRoles();
        setShowEditSubRoleModal(false);
        setEditingSubRole(null);
        setSelectedRoleForSubRole(null);
        setNewSubRoleData({
          name: '',
          description: '',
          permissions: []
        });
      }
    } catch (error) {
      alert(error.message || 'Failed to update sub-role');
    }
  };

  const handleDeleteSubRole = async (role, subRole) => {
    if (confirm(`Are you sure you want to delete sub-role "${subRole.name}"?`)) {
      try {
        const response = await api.deleteSubRole(role._id, subRole._id);
        if (response.success) {
          await fetchRoles();
        }
      } catch (error) {
        alert(error.message || 'Failed to delete sub-role');
      }
    }
  };

  const handleCreateSubRole = async (e) => {
    e.preventDefault();
    if (!formData.role) {
      alert('Please select a role first');
      return;
    }
    if (!newSubRoleData.name) {
      alert('Please enter a sub-role name');
      return;
    }
    try {
      // Refresh roles to ensure we have the latest data
      const rolesResponse = await api.getRoles({ isActive: true });
      let currentRoles = [];
      if (rolesResponse.success) {
        currentRoles = rolesResponse.data;
        setRoles(currentRoles);
      } else {
        currentRoles = roles;
      }

      // Find role in the refreshed roles array
      let role = currentRoles.find(r => r.name === formData.role);

      // If role doesn't exist in database, create it first (especially for system roles)
      if (!role || !role._id) {
        const systemRoles = {
          'admin': { displayName: 'Admin', description: 'Full system access' },
          'management': { displayName: 'Management', description: 'Team oversight and management' },
          'team_member': { displayName: 'Team Member', description: 'Regular team member' }
        };

        const systemRoleInfo = systemRoles[formData.role];
        if (systemRoleInfo) {
          // Create the system role first
          const createRoleResponse = await api.createRole({
            name: formData.role,
            displayName: systemRoleInfo.displayName,
            description: systemRoleInfo.description,
            defaultPermissions: getDefaultPermissions(formData.role)
          });

          if (createRoleResponse.success) {
            role = createRoleResponse.data;
            // Refresh roles list
            const refreshedRoles = await api.getRoles({ isActive: true });
            if (refreshedRoles.success) {
              setRoles(refreshedRoles.data);
              currentRoles = refreshedRoles.data;
              // Update role reference
              role = refreshedRoles.data.find(r => r.name === formData.role);
            }
          } else {
            alert('Failed to create role. Please try again.');
            return;
          }
        } else {
          // For custom roles that don't exist, show error
          alert(`Selected role "${formData.role}" not found in database. Please select a role that exists or create a new role first using the "Create New Role" option.`);
          return;
        }
      }

      if (!role || !role._id) {
        alert('Role not found. Please try again.');
        return;
      }

      // Prepare sub-role data
      const subRolePayload = {
        name: newSubRoleData.name.trim(),
        description: newSubRoleData.description || '',
        permissions: newSubRoleData.permissions || []
      };

      console.log('Adding sub-role:', subRolePayload, 'to role ID:', role._id);

      const response = await api.addSubRole(role._id, subRolePayload);

      if (response.success) {
        // Refresh roles to get updated sub-roles
        await fetchRoles();

        // Wait a moment for state to update, then auto-select the newly created sub-role
        setTimeout(() => {
          setFormData(prev => ({
            ...prev,
            subRole: newSubRoleData.name.trim()
          }));
        }, 200);

        setShowCreateSubRoleModal(false);
        setNewSubRoleData({
          name: '',
          description: '',
          permissions: []
        });
        alert('Sub-role created successfully!');
      } else {
        alert(response.message || 'Failed to create sub-role');
      }
    } catch (error) {
      console.error('Error creating sub-role:', error);
      alert(error.message || 'Failed to create sub-role. Please check the console for details.');
    }
  };

  const toggleGroup = (groupIndex) => {
    setExpandedGroups({
      ...expandedGroups,
      [groupIndex]: !expandedGroups[groupIndex]
    });
  };

  const selectAllInGroup = (group) => {
    const groupPerms = group.permissions.map(p => p.key);
    const currentPerms = formData.permissions || [];
    const allSelected = groupPerms.every(perm => currentPerms.includes(perm));

    if (allSelected) {
      // Deselect all in group
      setFormData({
        ...formData,
        permissions: currentPerms.filter(p => !groupPerms.includes(p))
      });
    } else {
      // Select all in group
      const newPerms = [...new Set([...currentPerms, ...groupPerms])];
      setFormData({ ...formData, permissions: newPerms });
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Avatar image must be less than 5MB');
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentsChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert(`${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });
    setDocumentFiles([...documentFiles, ...validFiles]);
  };

  const removeDocument = (index) => {
    setDocumentFiles(documentFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.role) {
      alert('Please select a role');
      return;
    }

    try {
      const files = {};
      if (avatarFile) files.avatar = avatarFile;
      if (documentFiles.length > 0) files.documents = documentFiles;

      if (editingUser) {
        const updateData = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          subRole: formData.subRole || '',
          status: formData.status,
          department: formData.department || '',
          dateOfBirth: formData.dateOfBirth || '',
          permissions: Array.isArray(formData.permissions) ? formData.permissions : []
        };
        // Only include password if provided
        if (formData.password && formData.password.trim()) {
          updateData.password = formData.password;
        }
        const response = await api.updateUser(editingUser._id || editingUser.id, updateData, files);
        if (response.success) {
          await fetchUsers(); // Refresh users list
          setShowModal(false);
          // Reset form
          setFormData({
            name: '',
            email: '',
            password: '',
            role: 'team_member',
            subRole: '',
            status: 'active',
            department: '',
            dateOfBirth: '',
            permissions: []
          });
          setAvatarFile(null);
          setAvatarPreview(null);
          setDocumentFiles([]);
          setExistingDocuments([]);
          setEditingUser(null);
          alert(`User updated successfully! ${updateData.permissions.length} permission(s) assigned.`);
        } else {
          alert(response.message || 'Failed to update user');
        }
      } else {
        if (!formData.password) {
          alert('Password is required for new users');
          return;
        }
        // Ensure all fields including permissions are included
        const userData = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          subRole: formData.subRole || '',
          status: formData.status,
          department: formData.department || '',
          dateOfBirth: formData.dateOfBirth || '',
          permissions: Array.isArray(formData.permissions) ? formData.permissions : []
        };
        const response = await api.createUser(userData, files);
        if (response.success) {
          await fetchUsers(); // Refresh users list
          setShowModal(false);
          // Reset form
          setFormData({
            name: '',
            email: '',
            password: '',
            role: 'team_member',
            subRole: '',
            status: 'active',
            department: '',
            dateOfBirth: '',
            permissions: []
          });
          setAvatarFile(null);
          setAvatarPreview(null);
          setDocumentFiles([]);
          setExistingDocuments([]);
          alert(`User created successfully! ${userData.permissions.length} permission(s) assigned.`);
        } else {
          alert(response.message || 'Failed to create user');
        }
      }
    } catch (error) {
      alert(error.message || 'Failed to save user');
    }
  };

  const handleExport = () => {
    const csv = [
      ['Name', 'Email', 'Role', 'Status', 'Department', 'Join Date'],
      ...users.map(u => [
        u.name,
        u.email,
        u.role,
        u.status,
        u.department || '',
        u.joinDate ? new Date(u.joinDate).toLocaleDateString() : ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
  };

  const handleViewProfile = async (user) => {
    try {
      // Fetch full user data to ensure all fields are available
      const userId = user._id || user.id;
      const response = await api.getUser(userId);
      if (response.success) {
        setSelectedProfileUser(response.data);
        setShowProfileModal(true);
      } else {
        // Fallback to the user data we have
        setSelectedProfileUser(user);
        setShowProfileModal(true);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Fallback to the user data we have
      setSelectedProfileUser(user);
      setShowProfileModal(true);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (value, row) => (
        <div className="d-flex align-items-center gap-2">
          <UserAvatar user={row} size={32} />
          <span>{value}</span>
          <button
            type="button"
            className="btn btn-link p-0"
            onClick={(e) => {
              e.stopPropagation();
              handleViewProfile(row);
            }}
            style={{
              color: '#8B5CF6',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              transition: 'all 0.2s ease',
              marginLeft: '4px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
              e.currentTarget.style.color = '#5B21B6';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#8B5CF6';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title="View Profile"
          >
            <FaEye size={14} />
          </button>
        </div>
      )
    },
    { key: 'email', label: 'Email' },
    {
      key: 'role',
      label: 'Role & Sub-Role',
      render: (value, row) => {
        const roleDisplayName = value === 'admin' ? 'Admin'
          : value === 'management' ? 'Management'
            : value === 'team_member' ? 'Team Member'
              : value;

        const subRole = row.subRole;
        const roleBadgeColor = value === 'admin' ? 'danger' : value === 'management' ? 'warning' : 'primary';

        return (
          <div className="d-flex flex-column gap-1">
            <span className={`badge bg-${roleBadgeColor}`}>
              {roleDisplayName}
            </span>
            {subRole && (
              <span className="badge bg-info" style={{ fontSize: '0.75rem' }}>
                {subRole}
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`badge bg-${value === 'active' ? 'success' : 'secondary'}`}>
          {value}
        </span>
      )
    },
    { key: 'department', label: 'Department' },
    {
      key: 'joinDate',
      label: 'Join Date',
      render: (value) => value ? new Date(value).toLocaleDateString() : '-'
    }
  ];

  const handleEditProfile = (user) => {
    const userId = user._id || user.id;
    router.push(`/profile/${userId}`);
  };

  const actions = (row) => (
    <div className="d-flex gap-2">
      <button
        className="btn btn-sm btn-outline-info"
        onClick={() => handleEditProfile(row)}
        aria-label="Edit Profile"
        title="Edit Profile"
      >
        <FaUserEdit />
      </button>
      <button
        className="btn btn-sm btn-outline-primary"
        onClick={() => handleEdit(row)}
        aria-label="Edit"
        title="Edit User & Permissions"
      >
        <FaEdit />
      </button>
      <button
        className="btn btn-sm btn-outline-danger"
        onClick={() => handleDelete(row)}
        aria-label="Delete"
        title="Delete User"
      >
        <FaTrash />
      </button>
    </div>
  );

  const roleColumns = [
    {
      key: 'displayName',
      label: 'Display Name',
      sortable: true
    },
    {
      key: 'name',
      label: 'Role Name',
      sortable: true
    },
    {
      key: 'description',
      label: 'Description',
      render: (value, row) => row.description || <span className="text-muted">No description</span>
    },
    {
      key: 'subRoles',
      label: 'Sub-Roles',
      render: (value, row) => (
        <span className="badge bg-info">
          {row.subRoles?.length || 0} sub-role(s)
        </span>
      )
    },
    {
      key: 'defaultPermissions',
      label: 'Permissions',
      render: (value, row) => (
        <span className="badge bg-secondary">
          {row.defaultPermissions?.length || 0} permission(s)
        </span>
      )
    }
  ];

  const roleActions = (row) => {
    const isSystemRole = ['admin', 'management', 'team_member'].includes(row.name);

    return (
      <div className="d-flex gap-2">
        <button
          className="btn btn-sm btn-outline-primary"
          onClick={() => handleEditRole(row)}
          aria-label="Edit Role"
          title="Edit Role"
        >
          <FaEdit />
        </button>
        {isSystemRole ? (
          <button
            className="btn btn-sm btn-outline-danger"
            disabled
            aria-label="Delete Role (Disabled)"
            title="System roles cannot be deleted"
            style={{
              opacity: 0.5,
              cursor: 'not-allowed'
            }}
          >
            <FaTrash />
          </button>
        ) : (
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={() => handleDeleteRole(row)}
            aria-label="Delete Role"
            title="Delete Role"
          >
            <FaTrash />
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container-fluid px-3 py-4">
        <LoadingSpinner />
      </div>
    );
  }

  // Filter users based on selected filter
  const filteredUsers = selectedUserFilter === 'all'
    ? users
    : selectedUserFilter === 'active'
      ? users.filter(u => u.status === 'active')
      : selectedUserFilter === 'inactive'
        ? users.filter(u => u.status === 'inactive')
        : selectedUserFilter === 'admin'
          ? users.filter(u => u.role === 'admin')
          : selectedUserFilter === 'management'
            ? users.filter(u => u.role === 'management')
            : selectedUserFilter === 'team_member'
              ? users.filter(u => u.role === 'team_member')
              : users;

  return (
    <div className="container-fluid px-3 py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-2">Employee Management</h2>
          <p className="text-muted">Manage employees and their permissions</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <button
            className={`btn ${activeView === 'userList' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveView('userList')}
          >
            <FaUsers className="me-2" />
            User List
            <span className="badge bg-light text-dark ms-2">{users.length}</span>
          </button>
          <button
            className={`btn ${activeView === 'roleList' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveView('roleList')}
          >
            <FaUserShield className="me-2" />
            Role List
            <span className="badge bg-light text-dark ms-2">{roles.length}</span>
          </button>
          <button
            className={`btn ${activeView === 'subRoleList' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveView('subRoleList')}
          >
            <FaLayerGroup className="me-2" />
            Sub-Role List
            <span className="badge bg-light text-dark ms-2">
              {roles.reduce((total, role) => total + (role.subRoles?.length || 0), 0)}
            </span>
          </button>
          <button className="btn btn-outline-primary" onClick={handleExport}>
            <FaDownload className="me-2" />
            Export CSV
          </button>
          {activeView === 'userList' && (
            <button className="btn btn-primary" onClick={handleAdd}>
              <FaPlus className="me-2" />
              Add Employee
            </button>
          )}
          {activeView === 'roleList' && (
            <button
              className="btn btn-primary"
              onClick={() => {
                setNewRoleData({
                  name: '',
                  displayName: '',
                  description: '',
                  defaultPermissions: [],
                  allowSubRoles: false
                });
                setShowCreateRoleModal(true);
              }}
            >
              <FaPlus className="me-2" />
              Add Role
            </button>
          )}
          {activeView === 'subRoleList' && (
            <button
              className="btn btn-primary"
              onClick={() => {
                if (roles.length === 0) {
                  alert('Please create a role first before adding sub-roles.');
                  return;
                }
                // If there's only one role, auto-select it
                if (roles.length === 1) {
                  setFormData(prev => ({ ...prev, role: roles[0].name }));
                }
                setNewSubRoleData({
                  name: '',
                  description: '',
                  permissions: []
                });
                setShowCreateSubRoleModal(true);
              }}
            >
              <FaPlus className="me-2" />
              Add Sub-Role
            </button>
          )}
        </div>
      </div>

      {/* Filter and Quick Select - Only for User List */}
      {activeView === 'userList' && (
        <div className="row mb-3">
          <div className="col-12 col-md-4">
            <label className="form-label fw-semibold">Filter Users</label>
            <select
              className="form-select"
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
            >
              <option value="all">All Users ({users.length})</option>
              <option value="active">Active Users ({users.filter(u => u.status === 'active').length})</option>
              <option value="inactive">Inactive Users ({users.filter(u => u.status === 'inactive').length})</option>
              <option value="admin">Admins ({users.filter(u => u.role === 'admin').length})</option>
              <option value="management">Management ({users.filter(u => u.role === 'management').length})</option>
              <option value="team_member">Team Members ({users.filter(u => u.role === 'team_member').length})</option>
            </select>
          </div>
          <div className="col-12 col-md-4">
            <label className="form-label fw-semibold">Quick Select User</label>
            <select
              className="form-select"
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  const user = users.find(u => (u._id || u.id) === e.target.value);
                  if (user) {
                    handleEdit(user);
                  }
                  e.target.value = ''; // Reset dropdown
                }
              }}
            >
              <option value="">Select a user to edit...</option>
              {users.map(user => (
                <option key={user._id || user.id} value={user._id || user.id}>
                  {user.name} ({user.email}) - {user.role}
                </option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-4 d-flex align-items-end">
            <div className="text-muted small">
              Showing {filteredUsers.length} of {users.length} users
            </div>
          </div>
        </div>
      )}

      {/* Search Bar for Role List */}
      {activeView === 'roleList' && (
        <div className="row mb-3">
          <div className="col-12 col-md-6">
            <label className="form-label fw-semibold">Search Roles</label>
            <div className="input-group">
              <span className="input-group-text">
                <FaUserShield />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by role name, display name, or description..."
                value={roleSearchTerm}
                onChange={(e) => setRoleSearchTerm(e.target.value)}
              />
              {roleSearchTerm && (
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => setRoleSearchTerm('')}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          <div className="col-12 col-md-6 d-flex align-items-end">
            <div className="text-muted small">
              {roles.filter(role => {
                if (!roleSearchTerm) return true;
                const search = roleSearchTerm.toLowerCase();
                return (
                  role.name?.toLowerCase().includes(search) ||
                  role.displayName?.toLowerCase().includes(search) ||
                  role.description?.toLowerCase().includes(search)
                );
              }).length} role(s) found
            </div>
          </div>
        </div>
      )}

      {/* Search Bar for Sub-Role List */}
      {activeView === 'subRoleList' && (
        <div className="row mb-3">
          <div className="col-12 col-md-6">
            <label className="form-label fw-semibold">Search Sub-Roles</label>
            <div className="input-group">
              <span className="input-group-text">
                <FaLayerGroup />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by sub-role name, description, or parent role..."
                value={subRoleSearchTerm}
                onChange={(e) => setSubRoleSearchTerm(e.target.value)}
              />
              {subRoleSearchTerm && (
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => setSubRoleSearchTerm('')}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          <div className="col-12 col-md-6 d-flex align-items-end">
            <div className="text-muted small">
              {roles.reduce((total, role) => {
                if (!role.subRoles || role.subRoles.length === 0) return total;
                const matchingSubRoles = role.subRoles.filter(subRole => {
                  if (!subRoleSearchTerm) return true;
                  const search = subRoleSearchTerm.toLowerCase();
                  return (
                    subRole.name?.toLowerCase().includes(search) ||
                    subRole.description?.toLowerCase().includes(search) ||
                    role.displayName?.toLowerCase().includes(search) ||
                    role.name?.toLowerCase().includes(search)
                  );
                });
                return total + matchingSubRoles.length;
              }, 0)} sub-role(s) found
            </div>
          </div>
        </div>
      )}

      {/* Conditional Content Based on Active View */}
      {activeView === 'userList' && (
        <DataTable
          columns={columns}
          data={filteredUsers}
          searchable={true}
          pagination={true}
          pageSize={10}
          actions={actions}
        />
      )}

      {activeView === 'roleList' && (
        <DataTable
          columns={roleColumns}
          data={roles.filter(role => {
            if (!roleSearchTerm) return true;
            const search = roleSearchTerm.toLowerCase();
            return (
              role.name?.toLowerCase().includes(search) ||
              role.displayName?.toLowerCase().includes(search) ||
              role.description?.toLowerCase().includes(search)
            );
          })}
          searchable={true}
          pagination={true}
          pageSize={10}
          actions={roleActions}
        />
      )}

      {activeView === 'subRoleList' && (
        <div className="card shadow-sm">
          <div className="card-header bg-info text-white">
            <h5 className="mb-0">All Sub-Roles</h5>
          </div>
          <div className="card-body">
            {roles.filter(r => r.subRoles && r.subRoles.length > 0).length === 0 ? (
              <div className="text-center py-5 text-muted">
                <FaLayerGroup size={48} className="mb-3 opacity-50" />
                <p>No sub-roles found. Create roles and add sub-roles to them.</p>
              </div>
            ) : (
              <div className="row">
                {roles.map((role) =>
                  role.subRoles && role.subRoles.length > 0 && role.subRoles
                    .filter(subRole => {
                      if (!subRoleSearchTerm) return true;
                      const search = subRoleSearchTerm.toLowerCase();
                      return (
                        subRole.name?.toLowerCase().includes(search) ||
                        subRole.description?.toLowerCase().includes(search) ||
                        role.displayName?.toLowerCase().includes(search) ||
                        role.name?.toLowerCase().includes(search)
                      );
                    })
                    .map((subRole) => (
                      <div key={subRole._id} className="col-md-6 col-lg-4 mb-3">
                        <div className="card h-100 border">
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <h6 className="card-title mb-1">{subRole.name}</h6>
                                <small className="text-muted">
                                  <span className="badge bg-primary">{role.displayName || role.name}</span>
                                </small>
                              </div>
                              <div className="dropdown">
                                <button
                                  className="btn btn-sm btn-link p-0"
                                  type="button"
                                  data-bs-toggle="dropdown"
                                >
                                  <FaCog />
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end">
                                  <li>
                                    <button
                                      className="dropdown-item"
                                      onClick={() => handleEditSubRole(role, subRole)}
                                    >
                                      <FaEdit className="me-2" size={12} />
                                      Edit Sub-Role
                                    </button>
                                  </li>
                                  <li>
                                    <hr className="dropdown-divider" />
                                  </li>
                                  <li>
                                    <button
                                      className="dropdown-item text-danger"
                                      onClick={() => handleDeleteSubRole(role, subRole)}
                                    >
                                      <FaTrash className="me-2" size={12} />
                                      Delete Sub-Role
                                    </button>
                                  </li>
                                </ul>
                              </div>
                            </div>
                            {subRole.description && (
                              <p className="card-text small text-muted mb-2">{subRole.description}</p>
                            )}
                            <span className="badge bg-secondary">
                              {subRole.permissions?.length || 0} permissions
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingUser ? 'Edit Employee & Permissions' : 'Add Employee & Set Permissions'}
        size="xl"
      >
        <form onSubmit={handleSubmit}>
          <style>{`
            .user-form-section {
              background: #F9FAFB;
              border-radius: 0.5rem;
              padding: 1.5rem;
              margin-bottom: 1.5rem;
              border: 1px solid #E5E7EB;
            }
            .user-form-section h6 {
              color: #1F2937;
              font-weight: 600;
              margin-bottom: 1rem;
              display: flex;
              align-items: center;
              gap: 0.5rem;
            }
            .avatar-upload-area {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              border: 2px dashed #D1D5DB;
              border-radius: 0.5rem;
              padding: 2rem;
              background: white;
              cursor: pointer;
              transition: all 0.2s ease;
              min-height: 200px;
            }
            .avatar-upload-area:hover {
              border-color: #8B5CF6;
              background: #F9FAFB;
            }
            .avatar-preview {
              width: 120px;
              height: 120px;
              border-radius: 50%;
              object-fit: cover;
              border: 3px solid #8B5CF6;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .document-item {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 0.75rem;
              background: white;
              border: 1px solid #E5E7EB;
              border-radius: 0.375rem;
              margin-bottom: 0.5rem;
            }
            .document-item:hover {
              background: #F9FAFB;
            }
          `}</style>

          {/* User Details Section */}
          <div className="user-form-section">
            <h6>
              <FaUser className="text-primary" />
              User Details
            </h6>

            {/* Profile Picture Upload */}
            <div className="mb-4">
              <label className="form-label fw-semibold mb-3">Profile Picture</label>
              <div className="avatar-upload-area" onClick={() => document.getElementById('avatar-input').click()}>
                {avatarPreview ? (
                  <div className="text-center">
                    <Image 
                      src={
                        avatarPreview.startsWith('data:') || avatarPreview.startsWith('http') 
                          ? avatarPreview 
                          : `http://localhost:4000${avatarPreview.startsWith('/') ? avatarPreview : '/' + avatarPreview}`
                      } 
                      alt="Avatar preview" 
                      className="avatar-preview mb-3" 
                      width={120} 
                      height={120} 
                      unoptimized 
                    />

                    <p className="text-muted small mb-0">Click to change profile picture</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <FaImage size={48} className="text-muted mb-3" />
                    <p className="mb-1 fw-semibold">Upload Profile Picture</p>
                    <p className="text-muted small mb-0">Click to browse or drag and drop</p>
                    <p className="text-muted small">Max size: 5MB (JPG, PNG, GIF)</p>
                  </div>
                )}
                <input
                  type="file"
                  id="avatar-input"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Name <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Enter full name"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Email <span className="text-danger">*</span></label>
                <input
                  type="email"
                  className="form-control"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={!!editingUser}
                  placeholder="user@example.com"
                />
                {editingUser && (
                  <small className="text-muted">Email cannot be changed</small>
                )}
              </div>
            </div>

            <div className="row g-3 mt-2">
              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Password {editingUser && <span className="text-muted small">(leave blank to keep current)</span>}
                  {!editingUser && <span className="text-danger">*</span>}
                </label>
                <input
                  type="password"
                  className="form-control"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                  placeholder={editingUser ? "Enter new password (optional)" : "Enter password"}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  <FaCalendar className="me-1" />
                  Date of Birth
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </div>

          {/* Role & Status Section */}
          <div className="user-form-section">
            <h6>
              <FaLayerGroup className="text-primary" />
              Role & Status
            </h6>
            <div className="mb-3">
              <label className="form-label">Role <span className="text-danger">*</span></label>
              <select
                className="form-select mb-2"
                value={formData.role}
                onChange={(e) => handleRoleChange(e.target.value)}
                required
              >
                <option value="">Select a role...</option>
                {getAllRoles().map(role => (
                  <option key={role.name} value={role.name}>
                    {role.displayName}
                  </option>
                ))}
                <option value="__create_new__" style={{ fontStyle: 'italic', color: '#5B21B6' }}>
                  + Create New Role
                </option>
              </select>
              <small className="text-muted d-block mb-3">Select the primary role for this user</small>

              {formData.role && (
                <div className="border rounded p-3 bg-light">
                  <label className="form-label fw-semibold">
                    Sub-Role for <span className="text-primary">{getAllRoles().find(r => r.name === formData.role)?.displayName || formData.role}</span>
                  </label>
                  <select
                    className="form-select"
                    value={formData.subRole}
                    onChange={(e) => handleSubRoleChange(e.target.value)}
                  >
                    <option value="">No Sub-Role</option>
                    {getSubRolesForRole(formData.role).map((subRole) => (
                      <option key={subRole._id || subRole.id} value={subRole.name}>
                        {subRole.name} {subRole.description && `- ${subRole.description}`}
                      </option>
                    ))}
                    <option value="__create_new__" style={{ fontStyle: 'italic', color: '#5B21B6' }}>
                      + Create New Sub-Role
                    </option>
                  </select>
                  <small className="text-muted d-block mt-2">
                    {getSubRolesForRole(formData.role).length === 0
                      ? 'No sub-roles available for this role. Create one to specify the specialization (e.g., UI/UX, Frontend, Backend)'
                      : 'Optional: Select a sub-role to specify the specialization (e.g., UI/UX, Frontend, Backend)'}
                  </small>
                  {formData.role && formData.subRole && (
                    <div className="mt-3 p-2 bg-white rounded border">
                      <small className="text-muted d-block mb-1">Preview:</small>
                      <div className="d-flex align-items-center gap-2">
                        <span className={`badge bg-${formData.role === 'admin' ? 'danger' : formData.role === 'management' ? 'warning' : 'primary'}`}>
                          {getAllRoles().find(r => r.name === formData.role)?.displayName || formData.role}
                        </span>
                        <span className="text-muted">-</span>
                        <span className="badge bg-info">{formData.subRole}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Status</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Department</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Enter department name"
                />
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div className="user-form-section">
            <h6>
              <FaFileUpload className="text-primary" />
              Documents
            </h6>
            <div className="mb-3">
              <label className="form-label fw-semibold mb-3">Upload Documents</label>
              <div className="border rounded p-3" style={{
                borderStyle: 'dashed',
                borderColor: '#D1D5DB',
                backgroundColor: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#8B5CF6';
                  e.currentTarget.style.backgroundColor = '#F9FAFB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#D1D5DB';
                  e.currentTarget.style.backgroundColor = 'white';
                }}
                onClick={() => document.getElementById('documents-input').click()}>
                <div className="text-center">
                  <FaFileUpload size={32} className="text-muted mb-2" />
                  <p className="mb-1 fw-semibold">Click to upload documents</p>
                  <p className="text-muted small mb-0">PDF, DOC, DOCX, XLS, XLSX, Images, TXT, ZIP</p>
                  <p className="text-muted small">Max size: 10MB per file (up to 10 files)</p>
                </div>
                <input
                  type="file"
                  id="documents-input"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt,.zip"
                  onChange={handleDocumentsChange}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            {/* Existing Documents */}
            {existingDocuments.length > 0 && (
              <div className="mb-3">
                <label className="form-label fw-semibold mb-2">Existing Documents</label>
                {existingDocuments.map((doc, index) => (
                  <div key={index} className="document-item">
                    <div className="d-flex align-items-center gap-2">
                      <FaFile className="text-primary" />
                      <div>
                        <div className="small fw-semibold">{doc.originalName}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {(doc.size / 1024).toFixed(2)} KB
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* New Documents Preview */}
            {documentFiles.length > 0 && (
              <div className="mb-3">
                <label className="form-label fw-semibold mb-2">New Documents to Upload</label>
                {documentFiles.map((file, index) => (
                  <div key={index} className="document-item">
                    <div className="d-flex align-items-center gap-2">
                      <FaFile className="text-success" />
                      <div className="flex-grow-1">
                        <div className="small fw-semibold">{file.name}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {(file.size / 1024).toFixed(2)} KB
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-danger p-0"
                        onClick={() => removeDocument(index)}
                        title="Remove document"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <hr className="my-4" />

          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <label className="form-label fw-bold mb-0">
                <FaUserShield className="me-2 text-primary" />
                Dashboard Permissions
              </label>
              <div className="d-flex align-items-center gap-2">
                <span className={`badge ${formData.permissions?.length > 0 ? 'bg-success' : 'bg-secondary'}`}>
                  {formData.permissions?.length || 0} permission(s) selected
                </span>
              </div>
            </div>
            <div className="border rounded p-3" style={{
              maxHeight: '450px',
              overflowY: 'auto',
              backgroundColor: '#F9FAFB',
              borderColor: '#E5E7EB'
            }}>
              {PERMISSION_GROUPS.map((group, groupIndex) => {
                const isExpanded = expandedGroups[groupIndex];
                const groupPerms = group.permissions.map(p => p.key);
                const selectedInGroup = groupPerms.filter(p => formData.permissions?.includes(p)).length;
                const allSelected = groupPerms.every(perm => formData.permissions?.includes(perm));

                return (
                  <div key={groupIndex} className="mb-3">
                    <div
                      className="d-flex justify-content-between align-items-center p-3 rounded"
                      style={{
                        backgroundColor: isExpanded ? '#E5E7EB' : allSelected ? '#D1FAE5' : '#FFFFFF',
                        cursor: 'pointer',
                        border: allSelected ? '2px solid #10B981' : '1px solid #E5E7EB',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => toggleGroup(groupIndex)}
                      onMouseEnter={(e) => {
                        if (!isExpanded) {
                          e.currentTarget.style.backgroundColor = '#F3F4F6';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isExpanded) {
                          e.currentTarget.style.backgroundColor = allSelected ? '#D1FAE5' : '#FFFFFF';
                        }
                      }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        {isExpanded ? <FaChevronUp size={14} className="text-primary" /> : <FaChevronDown size={14} className="text-primary" />}
                        <strong className="small" style={{ color: '#1F2937' }}>{group.label}</strong>
                        <span className={`badge ${selectedInGroup === group.permissions.length ? 'bg-success' : selectedInGroup > 0 ? 'bg-warning' : 'bg-secondary'} small`}>
                          {selectedInGroup}/{group.permissions.length}
                        </span>
                        {allSelected && (
                          <span className="badge bg-success small">
                            ✓ All Selected
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-link p-0 text-primary"
                        style={{ textDecoration: 'none', fontWeight: '500' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          selectAllInGroup(group);
                        }}
                      >
                        {allSelected ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="ms-4 mt-2 p-2 rounded" style={{ backgroundColor: '#FFFFFF' }}>
                        {group.permissions.map((perm) => {
                          const isChecked = formData.permissions?.includes(perm.key);
                          return (
                            <div key={perm.key} className="form-check mb-2 p-2 rounded" style={{
                              backgroundColor: isChecked ? '#ECFDF5' : 'transparent',
                              transition: 'background-color 0.2s ease'
                            }}>
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`perm-${perm.key}`}
                                checked={isChecked}
                                onChange={() => handlePermissionToggle(perm.key)}
                                style={{ cursor: 'pointer', marginTop: '0.25rem' }}
                              />
                              <label
                                className="form-check-label small"
                                htmlFor={`perm-${perm.key}`}
                                style={{
                                  cursor: 'pointer',
                                  fontWeight: isChecked ? '500' : '400',
                                  color: isChecked ? '#059669' : '#374151'
                                }}
                              >
                                {isChecked && <span className="text-success me-1">✓</span>}
                                {perm.label}
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="alert alert-info mt-3 mb-0" style={{ fontSize: '0.875rem' }}>
              <strong>ℹ️ Important:</strong> Permissions control what features users can access in the dashboard.
              Selected permissions will be saved and applied immediately. Admin role automatically has all permissions.
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingUser ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        isOpen={showEditRoleModal}
        onClose={() => {
          setShowEditRoleModal(false);
          setEditingRole(null);
          setNewRoleData({
            name: '',
            displayName: '',
            description: '',
            defaultPermissions: [],
            allowSubRoles: false
          });
        }}
        title={`Edit Role: ${editingRole?.displayName || editingRole?.name}`}
        size="lg"
      >
        <form onSubmit={handleUpdateRole}>
          <div className="mb-3">
            <label className="form-label">Role Name (unique identifier)</label>
            <input
              type="text"
              className="form-control"
              value={newRoleData.name}
              disabled
            />
            <small className="text-muted">Role name cannot be changed after creation.</small>
          </div>
          <div className="mb-3">
            <label className="form-label">Display Name <span className="text-danger">*</span></label>
            <input
              type="text"
              className="form-control"
              value={newRoleData.displayName}
              onChange={(e) => setNewRoleData({ ...newRoleData, displayName: e.target.value })}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              value={newRoleData.description}
              onChange={(e) => setNewRoleData({ ...newRoleData, description: e.target.value })}
              rows="3"
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Default Permissions</label>
            <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {PERMISSION_GROUPS.map((group) =>
                group.permissions.map((perm) => {
                  const isChecked = newRoleData.defaultPermissions?.includes(perm.key);
                  return (
                    <div key={perm.key} className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const currentPerms = newRoleData.defaultPermissions || [];
                          const newPerms = e.target.checked
                            ? [...currentPerms, perm.key]
                            : currentPerms.filter(p => p !== perm.key);
                          setNewRoleData({ ...newRoleData, defaultPermissions: newPerms });
                        }}
                      />
                      <label className="form-check-label small">{perm.label}</label>
                    </div>
                  );
                })
              )}
            </div>
            <small className="text-muted">These permissions will be assigned to users with this role by default</small>
          </div>
          <div className="mb-3">
            <label className="form-label">Allow Sub-Roles</label>
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="editAllowSubRoles"
                checked={newRoleData.allowSubRoles || false}
                onChange={(e) => setNewRoleData({ ...newRoleData, allowSubRoles: e.target.checked })}
              />
              <label className="form-check-label" htmlFor="editAllowSubRoles">
                {newRoleData.allowSubRoles ? 'Yes - Users can have sub-roles under this role' : 'No - This role does not support sub-roles'}
              </label>
            </div>
            <small className="text-muted d-block mt-2">
              Enable this option if you want to create sub-roles (e.g., UI/UX, Frontend, Backend) for this role
            </small>
          </div>
          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setShowEditRoleModal(false);
                setEditingRole(null);
                setNewRoleData({
                  name: '',
                  displayName: '',
                  description: '',
                  defaultPermissions: [],
                  allowSubRoles: false
                });
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Update Role
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Role Modal */}
      <Modal
        isOpen={showCreateRoleModal}
        onClose={() => setShowCreateRoleModal(false)}
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
          <div className="mb-3">
            <label className="form-label">Default Permissions (Optional)</label>
            <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {PERMISSION_GROUPS.map((group) =>
                group.permissions.map((perm) => {
                  const isChecked = newRoleData.defaultPermissions?.includes(perm.key);
                  return (
                    <div key={perm.key} className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const currentPerms = newRoleData.defaultPermissions || [];
                          const newPerms = e.target.checked
                            ? [...currentPerms, perm.key]
                            : currentPerms.filter(p => p !== perm.key);
                          setNewRoleData({ ...newRoleData, defaultPermissions: newPerms });
                        }}
                      />
                      <label className="form-check-label small">{perm.label}</label>
                    </div>
                  );
                })
              )}
            </div>
            <small className="text-muted">These permissions will be assigned to users with this role by default</small>
          </div>
          <div className="mb-3">
            <label className="form-label">Allow Sub-Roles</label>
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="allowSubRoles"
                checked={newRoleData.allowSubRoles || false}
                onChange={(e) => setNewRoleData({ ...newRoleData, allowSubRoles: e.target.checked })}
              />
              <label className="form-check-label" htmlFor="allowSubRoles">
                {newRoleData.allowSubRoles ? 'Yes - Users can have sub-roles under this role' : 'No - This role does not support sub-roles'}
              </label>
            </div>
            <small className="text-muted d-block mt-2">
              Enable this option if you want to create sub-roles (e.g., UI/UX, Frontend, Backend) for this role
            </small>
          </div>
          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowCreateRoleModal(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Role
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Sub-Role Modal */}
      <Modal
        isOpen={showCreateSubRoleModal}
        onClose={() => setShowCreateSubRoleModal(false)}
        title={`Create New Sub-Role for ${roles.find(r => r.name === formData.role)?.displayName || 'Selected Role'}`}
        size="lg"
      >
        <form onSubmit={handleCreateSubRole}>
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
          <div className="mb-3">
            <label className="form-label">Permissions (Optional)</label>
            <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {PERMISSION_GROUPS.map((group) =>
                group.permissions.map((perm) => {
                  const isChecked = newSubRoleData.permissions?.includes(perm.key);
                  return (
                    <div key={perm.key} className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const currentPerms = newSubRoleData.permissions || [];
                          const newPerms = e.target.checked
                            ? [...currentPerms, perm.key]
                            : currentPerms.filter(p => p !== perm.key);
                          setNewSubRoleData({ ...newSubRoleData, permissions: newPerms });
                        }}
                      />
                      <label className="form-check-label small">{perm.label}</label>
                    </div>
                  );
                })
              )}
            </div>
            <small className="text-muted">These permissions will be assigned to users with this sub-role</small>
          </div>
          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowCreateSubRoleModal(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Sub-Role
            </button>
          </div>
        </form>
      </Modal>

      {/* Profile View Modal */}
      <Modal
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false);
          setSelectedProfileUser(null);
        }}
        title="User Profile"
        size="xl"
      >
        {selectedProfileUser && (
          <div>
            <style>{`
              .profile-info-card {
                background: linear-gradient(135deg, #F9FAFB 0%, #FFFFFF 100%);
                border: 1px solid #E5E7EB;
                border-radius: 0.75rem;
                padding: 1.25rem;
                transition: all 0.2s ease;
                height: 100%;
              }
              .profile-info-card:hover {
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                transform: translateY(-2px);
              }
              .profile-info-icon {
                width: 40px;
                height: 40px;
                border-radius: 0.5rem;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 0.75rem;
              }
              .profile-section-title {
                font-size: 0.75rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #6B7280;
                margin-bottom: 0.5rem;
              }
              .profile-section-value {
                font-size: 0.95rem;
                font-weight: 600;
                color: #1F2937;
                word-break: break-word;
              }
              .permissions-badge {
                display: inline-block;
                padding: 0.25rem 0.5rem;
                margin: 0.125rem;
                background: #EEF2FF;
                color: #5B21B6;
                border-radius: 0.375rem;
                font-size: 0.75rem;
                font-weight: 500;
              }
            `}</style>

            {/* Header Section */}
            <div className="text-center mb-4 pb-4" style={{ borderBottom: '2px solid #E5E7EB' }}>
              <UserAvatar user={selectedProfileUser} size={120} />
              <h4 className="mt-3 mb-1 fw-bold" style={{ color: '#1F2937' }}>{selectedProfileUser.name || 'N/A'}</h4>
              <p className="text-muted mb-0">{selectedProfileUser.email || 'N/A'}</p>
            </div>

            {/* Main Information Grid */}
            <div className="row g-3 mb-4">
              {/* Email */}
              <div className="col-md-6">
                <div className="profile-info-card">
                  <div className="profile-info-icon" style={{ backgroundColor: '#DDD6FE', color: '#5B21B6' }}>
                    <FaEnvelope size={18} />
                  </div>
                  <div className="profile-section-title">Email</div>
                  <div className="profile-section-value">{selectedProfileUser.email || 'N/A'}</div>
                </div>
              </div>

              {/* Status */}
              <div className="col-md-6">
                <div className="profile-info-card">
                  <div className="profile-info-icon" style={{ backgroundColor: selectedProfileUser.status === 'active' ? '#D1FAE5' : '#F3F4F6', color: selectedProfileUser.status === 'active' ? '#059669' : '#6B7280' }}>
                    <FaTag size={18} />
                  </div>
                  <div className="profile-section-title">Status</div>
                  <div className="profile-section-value">
                    <span className={`badge bg-${selectedProfileUser.status === 'active' ? 'success' : 'secondary'}`}>
                      {selectedProfileUser.status || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Join Date */}
              {selectedProfileUser.joinDate && (
                <div className="col-md-6">
                  <div className="profile-info-card">
                    <div className="profile-info-icon" style={{ backgroundColor: '#FEE2E2', color: '#EF4444' }}>
                      <FaCalendar size={18} />
                    </div>
                    <div className="profile-section-title">Join Date</div>
                    <div className="profile-section-value">
                      {new Date(selectedProfileUser.joinDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Role */}
              <div className="col-md-6">
                <div className="profile-info-card">
                  <div className="profile-info-icon" style={{ backgroundColor: '#FEE2E2', color: '#EF4444' }}>
                    <FaUserShield size={18} />
                  </div>
                  <div className="profile-section-title">Role</div>
                  <div className="profile-section-value">
                    <span className={`badge bg-${selectedProfileUser.role === 'admin' ? 'danger' : selectedProfileUser.role === 'management' ? 'warning' : 'primary'} me-2`}>
                      {selectedProfileUser.role === 'admin' ? 'Admin' : selectedProfileUser.role === 'management' ? 'Management' : 'Team Member'}
                    </span>
                    {selectedProfileUser.subRole && (
                      <span className="badge bg-info">
                        {selectedProfileUser.subRole}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Department */}
              {selectedProfileUser.department && (
                <div className="col-md-6">
                  <div className="profile-info-card">
                    <div className="profile-info-icon" style={{ backgroundColor: '#DBEAFE', color: '#2563EB' }}>
                      <FaBuilding size={18} />
                    </div>
                    <div className="profile-section-title">Department</div>
                    <div className="profile-section-value">{selectedProfileUser.department}</div>
                  </div>
                </div>
              )}

              {/* Date of Birth */}
              {selectedProfileUser.dateOfBirth && (
                <div className="col-md-6">
                  <div className="profile-info-card">
                    <div className="profile-info-icon" style={{ backgroundColor: '#FCE7F3', color: '#DB2777' }}>
                      <FaGift size={18} />
                    </div>
                    <div className="profile-section-title">Date of Birth</div>
                    <div className="profile-section-value">
                      {new Date(selectedProfileUser.dateOfBirth).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Last Login */}
              {selectedProfileUser.lastLogin && (
                <div className="col-md-6">
                  <div className="profile-info-card">
                    <div className="profile-info-icon" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
                      <FaClock size={18} />
                    </div>
                    <div className="profile-section-title">Last Login</div>
                    <div className="profile-section-value">
                      {new Date(selectedProfileUser.lastLogin).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Created At */}
              {selectedProfileUser.createdAt && (
                <div className="col-md-6">
                  <div className="profile-info-card">
                    <div className="profile-info-icon" style={{ backgroundColor: '#E0E7FF', color: '#6366F1' }}>
                      <FaCalendar size={18} />
                    </div>
                    <div className="profile-section-title">Account Created</div>
                    <div className="profile-section-value">
                      {new Date(selectedProfileUser.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Permissions Section */}
            {selectedProfileUser.permissions && Array.isArray(selectedProfileUser.permissions) && selectedProfileUser.permissions.length > 0 && (
              <div className="mb-4">
                <div className="profile-info-card">
                  <div className="d-flex align-items-center mb-3">
                    <div className="profile-info-icon" style={{ backgroundColor: '#F3E8FF', color: '#9333EA' }}>
                      <FaKey size={18} />
                    </div>
                    <div>
                      <div className="profile-section-title">Permissions</div>
                      <div className="text-muted small">Total: {selectedProfileUser.permissions.length} permission(s)</div>
                    </div>
                  </div>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {selectedProfileUser.permissions.map((perm, index) => (
                      <span key={index} className="permissions-badge">
                        {perm.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Documents Section */}
            {selectedProfileUser.documents && Array.isArray(selectedProfileUser.documents) && selectedProfileUser.documents.length > 0 && (
              <div className="mb-4">
                <div className="profile-info-card">
                  <div className="d-flex align-items-center mb-3">
                    <div className="profile-info-icon" style={{ backgroundColor: '#DCFCE7', color: '#16A34A' }}>
                      <FaFileAlt size={18} />
                    </div>
                    <div>
                      <div className="profile-section-title">Documents</div>
                      <div className="text-muted small">Total: {selectedProfileUser.documents.length} document(s)</div>
                    </div>
                  </div>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {selectedProfileUser.documents.map((doc, index) => (
                      <div key={index} className="d-flex align-items-center justify-content-between p-2 mb-2 rounded" style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                        <div className="d-flex align-items-center gap-2">
                          <FaFile className="text-primary" />
                          <div>
                            <div className="small fw-semibold">{doc.originalName || doc.filename}</div>
                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                              {(doc.size / 1024).toFixed(2)} KB
                              {doc.uploadedAt && ` • ${new Date(doc.uploadedAt).toLocaleDateString()}`}
                            </div>
                          </div>
                        </div>
                        {doc.path && (
                          <a
                            href={doc.path.startsWith('http') ? doc.path : `http://localhost:4000${doc.path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-primary"
                          >
                            View
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="d-flex justify-content-end gap-2 mt-4 pt-4" style={{ borderTop: '2px solid #E5E7EB' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowProfileModal(false);
                  setSelectedProfileUser(null);
                }}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary d-flex align-items-center gap-2"
                onClick={() => {
                  const userId = selectedProfileUser._id || selectedProfileUser.id;
                  setShowProfileModal(false);
                  router.push(`/profile/${userId}`);
                }}
              >
                <FaEdit />
                Edit Profile
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

