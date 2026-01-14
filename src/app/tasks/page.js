'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getCurrentUser } from '@/utils/auth';
import { hasPermission, PERMISSIONS } from '@/utils/permissions';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import DataTable from '@/components/common/DataTable';
import Modal from '@/components/common/Modal';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/utils/api';
import UserAvatar from '@/components/common/UserAvatar';
import { FaPlus, FaEdit, FaTrash, FaCheckCircle, FaClock, FaExclamationCircle, FaUser, FaCalendar, FaFlag } from 'react-icons/fa';
import Notification from '@/components/common/Notification';

export default function TasksPage() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [notification, setNotification] = useState(null);
  const [openStatusMenu, setOpenStatusMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const router = useRouter();
  const user = getCurrentUser();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignee: '',
    projectId: '',
    priority: 'medium',
    status: 'pending',
    dueDate: ''
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchTasks();
    fetchUsers();
  }, [router, statusFilter, priorityFilter, assigneeFilter]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = { limit: 1000 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (assigneeFilter !== 'all') params.assignee = assigneeFilter;
      
      const response = await api.getTasks(params);
      if (response.success) {
        setTasks(response.data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setNotification({
        message: error.message || 'Failed to fetch tasks',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.getUsers({ limit: 1000, status: 'active' });
      if (response.success) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const canAssignTasks = hasPermission(user, PERMISSIONS.ASSIGN_TASKS);

  const handleCreate = () => {
    if (!canAssignTasks) {
      setNotification({
        message: 'You do not have permission to create/assign tasks. Please contact your administrator.',
        type: 'permission'
      });
      return;
    }
    setFormData({
      title: '',
      description: '',
      assignee: '',
      projectId: '',
      priority: 'medium',
      status: 'pending',
      dueDate: ''
    });
    setSelectedTask(null);
    setShowCreateModal(true);
  };

  const handleEdit = (task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title || '',
      description: task.description || '',
      assignee: task.assignee?._id || task.assignee || '',
      projectId: task.projectId?._id || task.projectId || '',
      priority: task.priority || 'medium',
      status: task.status || 'pending',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
    });
    setShowEditModal(true);
  };

  const handleDelete = (task) => {
    setSelectedTask(task);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedTask) {
        const response = await api.updateTask(selectedTask._id || selectedTask.id, formData);
        if (response.success) {
          await fetchTasks();
          setShowEditModal(false);
          setSelectedTask(null);
          setNotification({
            message: 'Task updated successfully',
            type: 'success'
          });
        } else {
          setNotification({
            message: response.message || 'Failed to update task',
            type: 'error'
          });
        }
      } else {
        if (!formData.assignee) {
          setNotification({
            message: 'Please select an assignee',
            type: 'warning'
          });
          return;
        }
        const response = await api.createTask(formData);
        if (response.success) {
          await fetchTasks();
          setShowCreateModal(false);
          setFormData({
            title: '',
            description: '',
            assignee: '',
            projectId: '',
            priority: 'medium',
            status: 'pending',
            dueDate: ''
          });
          setNotification({
            message: 'Task created and assigned successfully',
            type: 'success'
          });
        } else {
          setNotification({
            message: response.message || 'Failed to create task',
            type: 'error'
          });
        }
      }
    } catch (error) {
      console.error('Error saving task:', error);
      const errorMessage = error.message || 'Failed to save task';
      if (errorMessage.includes('permission') || errorMessage.includes('not authorized')) {
        setNotification({
          message: 'You do not have permission to perform this action. Please contact your administrator.',
          type: 'permission'
        });
      } else {
        setNotification({
          message: errorMessage,
          type: 'error'
        });
      }
    }
  };

  const handleConfirmDelete = async () => {
    try {
      const response = await api.deleteTask(selectedTask._id || selectedTask.id);
      if (response.success) {
        await fetchTasks();
        setShowDeleteModal(false);
        setSelectedTask(null);
        setNotification({
          message: 'Task deleted successfully',
          type: 'success'
        });
      } else {
        setNotification({
          message: response.message || 'Failed to delete task',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      const errorMessage = error.message || 'Failed to delete task';
      if (errorMessage.includes('permission') || errorMessage.includes('not authorized')) {
        setNotification({
          message: 'You do not have permission to delete tasks. Please contact your administrator.',
          type: 'permission'
        });
      } else {
        setNotification({
          message: errorMessage,
          type: 'error'
        });
      }
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const task = tasks.find(t => (t._id || t.id) === taskId);
      if (!task) {
        setNotification({
          message: 'Task not found',
          type: 'error'
        });
        return;
      }

      // Check if user can update this task's status
      const isAssignee = task.assignee?._id === user?._id || task.assignee === user?._id;
      if (!isAssignee && !canAssignTasks) {
        setNotification({
          message: 'You can only update the status of tasks assigned to you.',
          type: 'permission'
        });
        setOpenStatusMenu(null);
        return;
      }

      const response = await api.updateTask(taskId, { status: newStatus });
      if (response.success) {
        await fetchTasks();
        setOpenStatusMenu(null);
        setNotification({
          message: 'Task status updated successfully',
          type: 'success'
        });
      } else {
        setNotification({
          message: response.message || 'Failed to update task status',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      const errorMessage = error.message || 'Failed to update task status';
      if (errorMessage.includes('permission') || errorMessage.includes('not authorized') || errorMessage.includes('Required:')) {
        setNotification({
          message: 'You do not have permission to perform this action. Please contact your administrator.',
          type: 'permission'
        });
      } else {
        setNotification({
          message: errorMessage,
          type: 'error'
        });
      }
      setOpenStatusMenu(null);
    }
  };

  const getPriorityBadge = (priority) => {
    const config = {
      high: { color: 'danger', icon: FaExclamationCircle },
      medium: { color: 'warning', icon: FaFlag },
      low: { color: 'secondary', icon: FaFlag }
    };
    const { color, icon: Icon } = config[priority] || config.medium;
    return (
      <span className={`badge bg-${color} d-flex align-items-center gap-1`} style={{ width: 'fit-content' }}>
        <Icon size={12} />
        {priority}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const config = {
      completed: { color: 'success', icon: FaCheckCircle, label: 'Completed' },
      in_progress: { color: 'primary', icon: FaClock, label: 'In Progress' },
      pending: { color: 'secondary', icon: FaClock, label: 'Pending' },
      cancelled: { color: 'danger', icon: FaExclamationCircle, label: 'Cancelled' }
    };
    const { color, icon: Icon, label } = config[status] || config.pending;
    return (
      <span className={`badge bg-${color} d-flex align-items-center gap-1`} style={{ width: 'fit-content' }}>
        <Icon size={12} />
        {label}
      </span>
    );
  };

  const columns = [
    {
      key: 'title',
      label: 'Task',
      render: (value, row) => (
        <div style={{ minWidth: '200px' }}>
          <div className="fw-semibold">{value || '-'}</div>
          {row.description && (
            <small className="text-muted" style={{
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {row.description}
            </small>
          )}
        </div>
      )
    },
    {
      key: 'assignee',
      label: 'Assigned To',
      render: (value) => value ? (
        <div className="d-flex align-items-center gap-2" style={{ minWidth: '150px' }}>
          <UserAvatar user={value} size={28} />
          <span className="small">{value.name || '-'}</span>
        </div>
      ) : (
        <span className="text-muted">-</span>
      )
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (value) => getPriorityBadge(value)
    },
    {
      key: 'status',
      label: 'Status',
      render: (value, row) => {
        const taskId = row._id || row.id;
        const isMenuOpen = openStatusMenu === taskId;
        const isAssignee = row.assignee?._id === user?._id || row.assignee === user?._id;
        const canUpdateStatus = isAssignee || canAssignTasks;
        const currentStatus = value || 'pending';

        if (!canUpdateStatus) {
          return getStatusBadge(currentStatus);
        }

        return (
          <div className="position-relative d-inline-block">
            <button
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (isMenuOpen) {
                  setOpenStatusMenu(null);
                } else {
                  const buttonRect = e.currentTarget.getBoundingClientRect();
                  setMenuPosition({
                    top: buttonRect.bottom + window.scrollY + 4,
                    right: window.innerWidth - buttonRect.right + window.scrollX
                  });
                  setOpenStatusMenu(taskId);
                }
              }}
              style={{
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.25rem 0.5rem',
                cursor: 'pointer',
                border: '1px solid #dee2e6',
                borderRadius: '0.375rem'
              }}
            >
              {getStatusBadge(currentStatus)}
              <span style={{ fontSize: '0.7rem', marginLeft: '4px' }}>
                {isMenuOpen ? '▲' : '▼'}
              </span>
            </button>
            {isMenuOpen && (
              <>
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 9998,
                    backgroundColor: 'transparent'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenStatusMenu(null);
                  }}
                />
                <div
                  style={{
                    position: 'fixed',
                    top: `${menuPosition.top}px`,
                    right: `${menuPosition.right}px`,
                    zIndex: 9999,
                    minWidth: '160px',
                    backgroundColor: 'white',
                    border: '1px solid #dee2e6',
                    borderRadius: '0.375rem',
                    boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.15)',
                    padding: '0.5rem 0',
                    whiteSpace: 'nowrap'
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="btn btn-link text-start w-100 text-decoration-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(taskId, 'pending');
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      color: currentStatus === 'pending' ? '#8B5CF6' : '#212529',
                      fontWeight: currentStatus === 'pending' ? '600' : '400',
                      fontSize: '0.875rem',
                      border: 'none',
                      backgroundColor: 'transparent',
                      width: '100%',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      if (currentStatus !== 'pending') {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <FaClock className="me-2" size={12} />
                    Pending
                  </button>
                  <button
                    type="button"
                    className="btn btn-link text-start w-100 text-decoration-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(taskId, 'in_progress');
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      color: currentStatus === 'in_progress' ? '#8B5CF6' : '#212529',
                      fontWeight: currentStatus === 'in_progress' ? '600' : '400',
                      fontSize: '0.875rem',
                      border: 'none',
                      backgroundColor: 'transparent',
                      width: '100%',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      if (currentStatus !== 'in_progress') {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <FaClock className="me-2" size={12} />
                    In Progress (Not Completed)
                  </button>
                  <button
                    type="button"
                    className="btn btn-link text-start w-100 text-decoration-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(taskId, 'completed');
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      color: currentStatus === 'completed' ? '#8B5CF6' : '#212529',
                      fontWeight: currentStatus === 'completed' ? '600' : '400',
                      fontSize: '0.875rem',
                      border: 'none',
                      backgroundColor: 'transparent',
                      width: '100%',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      if (currentStatus !== 'completed') {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <FaCheckCircle className="me-2" size={12} />
                    Completed
                  </button>
                </div>
              </>
            )}
          </div>
        );
      }
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (value) => value ? (
        <div className="d-flex align-items-center gap-1">
          <FaCalendar className="text-muted" size={12} />
          <small>{new Date(value).toLocaleDateString()}</small>
        </div>
      ) : (
        <span className="text-muted">-</span>
      )
    },
    {
      key: 'createdBy',
      label: 'Created By',
      render: (value) => value ? (
        <div className="d-flex align-items-center gap-2" style={{ minWidth: '120px' }}>
          <UserAvatar user={value} size={24} />
          <small>{value.name || '-'}</small>
        </div>
      ) : (
        <span className="text-muted">-</span>
      )
    }
  ];

  const taskActions = (row) => {
    const canEdit = canAssignTasks || row.assignee?._id === user?._id || row.assignee === user?._id;
    
    return (
      <div className="d-flex gap-2 align-items-center justify-content-end" style={{ minWidth: '120px', flexWrap: 'nowrap' }}>
        {canEdit && (
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => handleEdit(row)}
            aria-label="Edit Task"
            title="Edit Task"
            style={{ minWidth: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <FaEdit />
          </button>
        )}
        {canAssignTasks && (
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={() => handleDelete(row)}
            aria-label="Delete Task"
            title="Delete Task"
            style={{ minWidth: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <FaTrash />
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container-fluid px-3 py-4">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  const filteredTasks = tasks;

  return (
    <DashboardLayout>
      <div className="container-fluid px-3 py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-2">Tasks</h2>
            <p className="text-muted mb-0">Manage and assign tasks to team members</p>
          </div>
          {canAssignTasks && (
            <button
              className="btn btn-primary d-flex align-items-center gap-2"
              onClick={handleCreate}
            >
              <FaPlus />
              Create Task
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label small fw-semibold">Status</label>
                <select
                  className="form-select form-select-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-semibold">Priority</label>
                <select
                  className="form-select form-select-sm"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              {canAssignTasks && (
                <div className="col-md-3">
                  <label className="form-label small fw-semibold">Assignee</label>
                  <select
                    className="form-select form-select-sm"
                    value={assigneeFilter}
                    onChange={(e) => setAssigneeFilter(e.target.value)}
                  >
                    <option value="all">All Users</option>
                    {users.map(u => (
                      <option key={u._id || u.id} value={u._id || u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        <style>{`
          .tasks-table-wrapper .table-responsive {
            overflow-x: auto;
          }
          .tasks-table-wrapper table {
            width: 100%;
            table-layout: auto;
            margin-bottom: 0;
          }
          .tasks-table-wrapper table th:last-child,
          .tasks-table-wrapper table td:last-child {
            min-width: 120px;
            text-align: right;
            padding-right: 16px;
          }
          .tasks-table-wrapper table th {
            white-space: nowrap;
            padding: 12px 16px;
            font-weight: 600;
            background-color: #f8f9fa;
            border-bottom: 2px solid #dee2e6;
            vertical-align: middle;
          }
          .tasks-table-wrapper table td {
            padding: 12px 16px;
            vertical-align: middle;
            border-bottom: 1px solid #dee2e6;
          }
          .tasks-table-wrapper table tbody tr:hover {
            background-color: #f8f9fa;
          }
        `}</style>
        <div className="card tasks-table-wrapper">
          <div className="card-body p-0">
            <DataTable
              columns={columns}
              data={filteredTasks}
              searchable={true}
              pagination={true}
              pageSize={10}
              actions={taskActions}
            />
          </div>
        </div>

        {/* Create Task Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setFormData({
              title: '',
              description: '',
              assignee: '',
              projectId: '',
              priority: 'medium',
              status: 'pending',
              dueDate: ''
            });
          }}
          title="Create New Task"
          size="lg"
        >
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Task Title <span className="text-danger">*</span></label>
              <input
                type="text"
                className="form-control"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="Enter task title"
              />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">Description</label>
              <textarea
                className="form-control"
                rows="4"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter task description"
              />
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-semibold">Assign To <span className="text-danger">*</span></label>
                <select
                  className="form-select"
                  value={formData.assignee}
                  onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                  required
                >
                  <option value="">Select a user</option>
                  {users.map(u => (
                    <option key={u._id || u.id} value={u._id || u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-semibold">Priority</label>
                <select
                  className="form-select"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-semibold">Status</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-semibold">Due Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>
            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({
                    title: '',
                    description: '',
                    assignee: '',
                    projectId: '',
                    priority: 'medium',
                    status: 'pending',
                    dueDate: ''
                  });
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Create Task
              </button>
            </div>
          </form>
        </Modal>

        {/* Edit Task Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTask(null);
          }}
          title="Edit Task"
          size="lg"
        >
          {selectedTask && (
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold">Task Title <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Description</label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">Assign To <span className="text-danger">*</span></label>
                  <select
                    className="form-select"
                    value={formData.assignee}
                    onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                    required
                    disabled={!canAssignTasks}
                  >
                    <option value="">Select a user</option>
                    {users.map(u => (
                      <option key={u._id || u.id} value={u._id || u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                  {!canAssignTasks && (
                    <small className="text-muted">Only users with assign permission can change assignee</small>
                  )}
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">Priority</label>
                  <select
                    className="form-select"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">Status</label>
                  <select
                    className="form-select"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">Due Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedTask(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Task
                </button>
              </div>
            </form>
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedTask(null);
          }}
          title="Delete Task"
        >
          {selectedTask && (
            <div>
              <p>Are you sure you want to delete this task?</p>
              <div className="alert alert-warning">
                <strong>Task:</strong> {selectedTask.title}<br />
                <strong>Assigned To:</strong> {selectedTask.assignee?.name || 'N/A'}<br />
                <strong>Status:</strong> {selectedTask.status || 'N/A'}
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedTask(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleConfirmDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* Notification */}
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
            duration={notification.type === 'permission' ? 7000 : 5000}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
