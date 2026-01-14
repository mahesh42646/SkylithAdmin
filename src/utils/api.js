// API Configuration
// Change this to switch between local and production API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4002/api';

// Helper function to get auth token
const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('currentUser');
  if (user) {
    try {
      const userData = JSON.parse(user);
      return userData.token || null;
    } catch {
      return null;
    }
  }
  return null;
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    if (response.status === 401) {
      // Unauthorized - clear storage and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('currentUser');
        window.location.href = '/login';
      }
    }
    throw new Error(data.message || 'An error occurred');
  }
  
  return data;
};

// API request wrapper
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    },
    ...options
  };

  // Remove headers from options to avoid duplication
  delete config.headers.headers;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  return handleResponse(response);
};

// API methods
export const api = {
  // Auth
  login: (email, password) => 
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  register: (userData) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),

  getMe: () => apiRequest('/auth/me'),

  logout: () => apiRequest('/auth/logout', { method: 'POST' }),

  // Users
  getUsers: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/users${queryString ? `?${queryString}` : ''}`);
  },

  getUser: (id) => apiRequest(`/users/${id}`),

  createUser: (userData, files = null) => {
    if (files && (files.avatar || files.documents)) {
      // Use FormData for file uploads
      const formData = new FormData();
      
      // Add text fields
      Object.keys(userData).forEach(key => {
        if (key !== 'avatar' && key !== 'documents') {
          if (Array.isArray(userData[key])) {
            formData.append(key, JSON.stringify(userData[key]));
          } else {
            formData.append(key, userData[key] || '');
          }
        }
      });
      
      // Add files
      if (files.avatar) {
        formData.append('avatar', files.avatar);
      }
      if (files.documents && files.documents.length > 0) {
        Array.from(files.documents).forEach(file => {
          formData.append('documents', file);
        });
      }
      
      const token = getAuthToken();
      return fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: formData
      }).then(handleResponse);
    } else {
      // Regular JSON request
      return apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
    }
  },

  updateUser: (id, userData, files = null) => {
    if (files && (files.avatar || files.documents)) {
      // Use FormData for file uploads
      const formData = new FormData();
      
      // Add text fields
      Object.keys(userData).forEach(key => {
        if (key !== 'avatar' && key !== 'documents') {
          if (Array.isArray(userData[key])) {
            formData.append(key, JSON.stringify(userData[key]));
          } else {
            formData.append(key, userData[key] || '');
          }
        }
      });
      
      // Add files
      if (files.avatar) {
        formData.append('avatar', files.avatar);
      }
      if (files.documents && files.documents.length > 0) {
        Array.from(files.documents).forEach(file => {
          formData.append('documents', file);
        });
      }
      
      const token = getAuthToken();
      return fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'PUT',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: formData
      }).then(handleResponse);
    } else {
      // Regular JSON request
      return apiRequest(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(userData)
      });
    }
  },

  deleteUser: (id) =>
    apiRequest(`/users/${id}`, {
      method: 'DELETE'
    }),

  uploadAvatar: (id, file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const token = getAuthToken();
    return fetch(`${API_BASE_URL}/users/${id}/avatar`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: formData
    }).then(handleResponse);
  },

  // Admin
  getStats: () => apiRequest('/admin/stats'),

  getAuditLogs: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/admin/audit-logs${queryString ? `?${queryString}` : ''}`);
  },

  // Projects (placeholder for future implementation)
  getProjects: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/projects${queryString ? `?${queryString}` : ''}`);
  },

  // Tasks
  getTasks: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/tasks${queryString ? `?${queryString}` : ''}`);
  },

  getTask: (id) => apiRequest(`/tasks/${id}`),

  createTask: (taskData) =>
    apiRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData)
    }),

  updateTask: (id, taskData) =>
    apiRequest(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData)
    }),

  deleteTask: (id) =>
    apiRequest(`/tasks/${id}`, {
      method: 'DELETE'
    }),

  addTaskComment: (id, comment) =>
    apiRequest(`/tasks/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment })
    }),

  // Roles
  getRoles: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/roles${queryString ? `?${queryString}` : ''}`);
  },

  getRole: (id) => apiRequest(`/roles/${id}`),

  createRole: (roleData) =>
    apiRequest('/roles', {
      method: 'POST',
      body: JSON.stringify(roleData)
    }),

  updateRole: (id, roleData) =>
    apiRequest(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(roleData)
    }),

  deleteRole: (id) =>
    apiRequest(`/roles/${id}`, {
      method: 'DELETE'
    }),

  addSubRole: (roleId, subRoleData) =>
    apiRequest(`/roles/${roleId}/sub-roles`, {
      method: 'POST',
      body: JSON.stringify(subRoleData)
    }),

  updateSubRole: (roleId, subRoleId, subRoleData) =>
    apiRequest(`/roles/${roleId}/sub-roles/${subRoleId}`, {
      method: 'PUT',
      body: JSON.stringify(subRoleData)
    }),

  deleteSubRole: (roleId, subRoleId) =>
    apiRequest(`/roles/${roleId}/sub-roles/${subRoleId}`, {
      method: 'DELETE'
    }),

  // Contact/Tickets
  getContacts: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/contact${queryString ? `?${queryString}` : ''}`);
  },

  getContact: (id) => apiRequest(`/contact/${id}`),

  updateContact: (id, contactData) =>
    apiRequest(`/contact/${id}`, {
      method: 'PUT',
      body: JSON.stringify(contactData)
    }),

  deleteContact: (id) =>
    apiRequest(`/contact/${id}`, {
      method: 'DELETE'
    }),

  // Attendance
  getAttendance: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/attendance${queryString ? `?${queryString}` : ''}`);
  },

  getTodayAttendance: () => apiRequest('/attendance/today'),

  getMyAttendance: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/attendance/my-attendance${queryString ? `?${queryString}` : ''}`);
  },

  getAttendanceById: (id) => apiRequest(`/attendance/${id}`),

  getAttendanceSummary: (userId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/attendance/summary/${userId}${queryString ? `?${queryString}` : ''}`);
  },

  punchIn: (data) =>
    apiRequest('/attendance/punch-in', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  punchOut: (data) =>
    apiRequest('/attendance/punch-out', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateAttendance: (id, attendanceData) =>
    apiRequest(`/attendance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(attendanceData)
    }),

  deleteAttendance: (id) =>
    apiRequest(`/attendance/${id}`, {
      method: 'DELETE'
    }),

  // Location Tracking
  getActiveLocations: () => apiRequest('/location/active'),
  
  trackLocation: (data) =>
    apiRequest('/location/track', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Health check
  healthCheck: () => apiRequest('/health')
};

export default api;

