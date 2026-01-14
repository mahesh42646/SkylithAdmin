'use client';

import { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaCheckCircle, FaClock, FaTimesCircle, FaEnvelope, FaPhone, FaCalendar } from 'react-icons/fa';
import DataTable from '@/components/common/DataTable';
import Modal from '@/components/common/Modal';
import api from '@/utils/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { refreshUserData } from '@/utils/auth';
import Notification from '@/components/common/Notification';

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [editFormData, setEditFormData] = useState({
    status: '',
    notes: ''
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [openStatusMenu, setOpenStatusMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    // Refresh user data to get latest permissions
    refreshUserData();
    fetchTickets();
  }, [statusFilter, sourceFilter]);

  useEffect(() => {
    const handleClickOutside = () => {
      if (openStatusMenu) {
        setOpenStatusMenu(null);
      }
    };
    
    if (openStatusMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openStatusMenu]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (sourceFilter !== 'all') params.source = sourceFilter;
      const response = await api.getContacts({ ...params, limit: 1000 });
      if (response.success) {
        setTickets(response.data);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      const errorMessage = error.message || 'Unknown error';
      if (errorMessage.includes('not authorized') || errorMessage.includes('permission')) {
        setNotification({
          message: 'You do not have permission to view tickets. Please contact your administrator to request access.',
          type: 'permission'
        });
      } else {
        setNotification({
          message: `Failed to fetch tickets: ${errorMessage}`,
          type: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ticket) => {
    setSelectedTicket(ticket);
    setEditFormData({
      status: ticket.status,
      notes: ticket.notes || ''
    });
    setShowEditModal(true);
  };

  const handleDelete = (ticket) => {
    setSelectedTicket(ticket);
    setShowDeleteModal(true);
  };

  const handleStatusChange = async (ticket, newStatus) => {
    try {
      const response = await api.updateContact(ticket._id || ticket.id, {
        status: newStatus
      });
      if (response.success) {
        await fetchTickets();
        setNotification({
          message: 'Ticket status updated successfully',
          type: 'success'
        });
      } else {
        setNotification({
          message: response.message || 'Failed to update ticket status',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
      const errorMessage = error.message || 'Failed to update ticket status';
      
      // Check if it's a permission error
      if (errorMessage.includes('permission') || errorMessage.includes('not authorized') || errorMessage.includes('Required:')) {
        setNotification({
          message: 'You do not have permission to perform this action. Please contact your administrator to request access.',
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

  const handleUpdateTicket = async (e) => {
    e.preventDefault();
    try {
      const response = await api.updateContact(selectedTicket._id || selectedTicket.id, editFormData);
      if (response.success) {
        await fetchTickets();
        setShowEditModal(false);
        setSelectedTicket(null);
        setNotification({
          message: 'Ticket updated successfully',
          type: 'success'
        });
      } else {
        setNotification({
          message: response.message || 'Failed to update ticket',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
      const errorMessage = error.message || 'Failed to update ticket';
      
      if (errorMessage.includes('permission') || errorMessage.includes('not authorized') || errorMessage.includes('Required:')) {
        setNotification({
          message: 'You do not have permission to perform this action. Please contact your administrator to request access.',
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
      const response = await api.deleteContact(selectedTicket._id || selectedTicket.id);
      if (response.success) {
        await fetchTickets();
        setShowDeleteModal(false);
        setSelectedTicket(null);
        setNotification({
          message: 'Ticket deleted successfully',
          type: 'success'
        });
      } else {
        setNotification({
          message: response.message || 'Failed to delete ticket',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error deleting ticket:', error);
      const errorMessage = error.message || 'Failed to delete ticket';
      
      if (errorMessage.includes('permission') || errorMessage.includes('not authorized') || errorMessage.includes('Required:')) {
        setNotification({
          message: 'You do not have permission to delete tickets. Please contact your administrator to request access.',
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      unresolved: { color: 'danger', icon: FaClock, label: 'Unresolved' },
      in_progress: { color: 'warning', icon: FaClock, label: 'In Progress' },
      resolved: { color: 'success', icon: FaCheckCircle, label: 'Resolved' }
    };
    const config = statusConfig[status] || statusConfig.unresolved;
    const Icon = config.icon;
    
    return (
      <span className={`badge bg-${config.color}`}>
        <Icon className="me-1" /> {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (value, row) => (
        <div style={{ minWidth: '180px', maxWidth: '200px' }}>
          <div className="fw-semibold">{value || '-'}</div>
          <small className="text-muted">{row.email || ''}</small>
        </div>
      )
    },
    {
      key: 'subject',
      label: 'Subject',
      render: (value) => value ? (
        <div style={{ maxWidth: '200px', wordBreak: 'break-word' }} title={value}>
          <div style={{ 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: '1.4'
          }}>
            {value}
          </div>
        </div>
      ) : (
        <span className="text-muted">-</span>
      )
    },
    {
      key: 'message',
      label: 'Message',
      render: (value) => value ? (
        <div style={{ maxWidth: '250px', wordBreak: 'break-word' }} title={value}>
          <div style={{ 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: '1.4'
          }}>
            {value}
          </div>
        </div>
      ) : (
        <span className="text-muted">-</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => getStatusBadge(value)
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (value) => (
        <div>
          <FaCalendar className="me-1 text-muted" />
          <small>{formatDate(value)}</small>
        </div>
      )
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (value) => value ? (
        <a
          href={`tel:${value}`}
          style={{
            color: 'inherit',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#8B5CF6';
            e.currentTarget.style.textDecoration = 'underline';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'inherit';
            e.currentTarget.style.textDecoration = 'none';
          }}
        >
          <FaPhone className="me-1 text-muted" style={{ transform: 'rotate(80deg)' }} />
          <small>{value}</small>
        </a>
      ) : (
        <span className="text-muted">-</span>
      )
    },
    {
      key: 'source',
      label: 'Source',
      render: (value) => {
        const sourceLabels = {
          'contact_form': 'Contact Form',
          'need_help': 'Need Help',
          'other': 'Other'
        };
        const sourceColors = {
          'contact_form': 'primary',
          'need_help': 'info',
          'other': 'secondary'
        };
        return (
          <span className={`badge bg-${sourceColors[value] || 'secondary'}`}>
            {sourceLabels[value] || value || 'N/A'}
          </span>
        );
      }
    }
  ];

  const ticketActions = (row) => {
    const ticketId = row._id || row.id;
    const isMenuOpen = openStatusMenu === ticketId;
    
    return (
      <div className="d-flex gap-2 align-items-center justify-content-end position-relative" style={{ minWidth: '200px', flexWrap: 'nowrap' }}>
        <button
          className="btn btn-sm btn-outline-primary"
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(row);
          }}
          aria-label="Edit Ticket"
          title="Edit Ticket"
          style={{ minWidth: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <FaEdit />
        </button>
        <div className="position-relative" style={{ flexShrink: 0 }}>
          <button
            className="btn btn-sm btn-outline-secondary"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (isMenuOpen) {
                setOpenStatusMenu(null);
              } else {
                const buttonRect = e.currentTarget.getBoundingClientRect();
                setMenuPosition({
                  top: buttonRect.bottom + 4,
                  right: window.innerWidth - buttonRect.right
                });
                setOpenStatusMenu(ticketId);
              }
            }}
            style={{ 
              fontSize: '0.75rem', 
              whiteSpace: 'nowrap',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.25rem 0.5rem',
              cursor: 'pointer'
            }}
          >
            Status {isMenuOpen ? '▲' : '▼'}
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
                  minWidth: '200px',
                  backgroundColor: 'white',
                  border: '1px solid #dee2e6',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  padding: '0.5rem 0',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden'
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  style={{
                    padding: '0.625rem 1rem',
                    border: 'none',
                    backgroundColor: row.status === 'unresolved' ? '#f3f4f6' : 'transparent',
                    width: '100%',
                    textAlign: 'left',
                    cursor: row.status === 'unresolved' ? 'not-allowed' : 'pointer',
                    opacity: row.status === 'unresolved' ? 0.6 : 1,
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    fontSize: '0.875rem',
                    color: row.status === 'unresolved' ? '#6b7280' : '#1f2937',
                    fontWeight: row.status === 'unresolved' ? 'normal' : '500'
                  }}
                  onMouseEnter={(e) => {
                    if (row.status !== 'unresolved') {
                      e.target.style.backgroundColor = '#f3f4f6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (row.status !== 'unresolved') {
                      e.target.style.backgroundColor = 'transparent';
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (row.status !== 'unresolved') {
                      handleStatusChange(row, 'unresolved');
                      setOpenStatusMenu(null);
                    }
                  }}
                  disabled={row.status === 'unresolved'}
                >
                  <FaClock style={{ fontSize: '0.875rem', color: '#ef4444' }} /> Unresolved
                </button>
                <button
                  type="button"
                  style={{
                    padding: '0.625rem 1rem',
                    border: 'none',
                    backgroundColor: row.status === 'in_progress' ? '#f3f4f6' : 'transparent',
                    width: '100%',
                    textAlign: 'left',
                    cursor: row.status === 'in_progress' ? 'not-allowed' : 'pointer',
                    opacity: row.status === 'in_progress' ? 0.6 : 1,
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    fontSize: '0.875rem',
                    color: row.status === 'in_progress' ? '#6b7280' : '#1f2937',
                    fontWeight: row.status === 'in_progress' ? 'normal' : '500'
                  }}
                  onMouseEnter={(e) => {
                    if (row.status !== 'in_progress') {
                      e.target.style.backgroundColor = '#f3f4f6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (row.status !== 'in_progress') {
                      e.target.style.backgroundColor = 'transparent';
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (row.status !== 'in_progress') {
                      handleStatusChange(row, 'in_progress');
                      setOpenStatusMenu(null);
                    }
                  }}
                  disabled={row.status === 'in_progress'}
                >
                  <FaClock style={{ fontSize: '0.875rem', color: '#f59e0b' }} /> In Progress
                </button>
                <button
                  type="button"
                  style={{
                    padding: '0.625rem 1rem',
                    border: 'none',
                    backgroundColor: row.status === 'resolved' ? '#f3f4f6' : 'transparent',
                    width: '100%',
                    textAlign: 'left',
                    cursor: row.status === 'resolved' ? 'not-allowed' : 'pointer',
                    opacity: row.status === 'resolved' ? 0.6 : 1,
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    fontSize: '0.875rem',
                    color: row.status === 'resolved' ? '#6b7280' : '#1f2937',
                    fontWeight: row.status === 'resolved' ? 'normal' : '500'
                  }}
                  onMouseEnter={(e) => {
                    if (row.status !== 'resolved') {
                      e.target.style.backgroundColor = '#f3f4f6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (row.status !== 'resolved') {
                      e.target.style.backgroundColor = 'transparent';
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (row.status !== 'resolved') {
                      handleStatusChange(row, 'resolved');
                      setOpenStatusMenu(null);
                    }
                  }}
                  disabled={row.status === 'resolved'}
                >
                  <FaCheckCircle style={{ fontSize: '0.875rem', color: '#10b981' }} /> Resolved
                </button>
              </div>
            </>
          )}
        </div>
        <button
          className="btn btn-sm btn-outline-danger"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(row);
          }}
          aria-label="Delete Ticket"
          title="Delete Ticket"
          style={{ minWidth: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <FaTrash />
        </button>
      </div>
    );
  };

  const filteredTickets = tickets;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container-fluid py-4">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h3 mb-1">Tickets Management</h1>
            <p className="text-muted mb-0">Manage contact queries and tickets</p>
          </div>
          <div className="d-flex gap-2">
            <select
              className="form-select"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              style={{ width: 'auto' }}
            >
              <option value="all">All Sources</option>
              <option value="contact_form">Contact Form</option>
              <option value="need_help">Need Help</option>
              <option value="other">Other</option>
            </select>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: 'auto' }}
            >
              <option value="all">All Status</option>
              <option value="unresolved">Unresolved</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        <style>{`
          .tickets-table-wrapper .table-responsive {
            overflow-x: auto;
            overflow-y: visible;
          }
          .tickets-table-wrapper table {
            width: 100%;
            table-layout: fixed;
            margin-bottom: 0;
          }
          .tickets-table-wrapper table th:last-child,
          .tickets-table-wrapper table td:last-child {
            position: sticky;
            right: 0;
            background-color: white;
            z-index: 10;
            box-shadow: -2px 0 4px rgba(0,0,0,0.1);
            min-width: 200px;
            width: 200px;
            text-align: right;
            padding-right: 16px;
          }
          .tickets-table-wrapper table tbody tr:hover td:last-child {
            background-color: #f8f9fa;
          }
          .tickets-table-wrapper table td:last-child .position-relative {
            overflow: visible;
          }
          .tickets-table-wrapper table th {
            white-space: nowrap;
            padding: 12px 16px;
            font-weight: 600;
            background-color: #f8f9fa;
            border-bottom: 2px solid #dee2e6;
            vertical-align: middle;
          }
          .tickets-table-wrapper table td {
            padding: 12px 16px;
            vertical-align: middle;
            border-bottom: 1px solid #dee2e6;
          }
          .tickets-table-wrapper table tbody tr:hover {
            background-color: #f8f9fa;
          }
          .tickets-table-wrapper table th:nth-child(1),
          .tickets-table-wrapper table td:nth-child(1) {
            width: 180px;
            min-width: 150px;
          }
          .tickets-table-wrapper table th:nth-child(2),
          .tickets-table-wrapper table td:nth-child(2) {
            width: 200px;
            min-width: 150px;
          }
          .tickets-table-wrapper table th:nth-child(3),
          .tickets-table-wrapper table td:nth-child(3) {
            width: 250px;
            min-width: 200px;
          }
          .tickets-table-wrapper table th:nth-child(4),
          .tickets-table-wrapper table td:nth-child(4) {
            width: 150px;
            min-width: 120px;
          }
          .tickets-table-wrapper table th:nth-child(5),
          .tickets-table-wrapper table td:nth-child(5) {
            width: 180px;
            min-width: 150px;
          }
          .tickets-table-wrapper table th:nth-child(6),
          .tickets-table-wrapper table td:nth-child(6) {
            width: 150px;
            min-width: 120px;
          }
          .tickets-table-wrapper table th:nth-child(7),
          .tickets-table-wrapper table td:nth-child(7) {
            width: 140px;
            min-width: 120px;
          }
        `}</style>
        <div className="tickets-table-wrapper">
          <DataTable
            columns={columns}
            data={filteredTickets}
            searchable={true}
            pagination={true}
            pageSize={10}
            actions={ticketActions}
          />
        </div>

        {/* Edit Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTicket(null);
            setEditFormData({ status: '', notes: '' });
          }}
          title="Edit Ticket"
          size="lg"
        >
          {selectedTicket && (
            <form onSubmit={handleUpdateTicket}>
              <div className="mb-3">
                <label className="form-label fw-semibold">Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={selectedTicket.name}
                  disabled
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={selectedTicket.email}
                  disabled
                />
              </div>
              {selectedTicket.phone && (
                <div className="mb-3">
                  <label className="form-label fw-semibold">Phone</label>
                  <input
                    type="text"
                    className="form-control"
                    value={selectedTicket.phone}
                    disabled
                  />
                </div>
              )}
              <div className="mb-3">
                <label className="form-label fw-semibold">Subject</label>
                <input
                  type="text"
                  className="form-control"
                  value={selectedTicket.subject}
                  disabled
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Message</label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={selectedTicket.message}
                  disabled
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Status *</label>
                <select
                  className="form-select"
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  required
                >
                  <option value="unresolved">Unresolved</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Notes</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  placeholder="Add internal notes about this ticket..."
                />
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedTicket(null);
                    setEditFormData({ status: '', notes: '' });
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Ticket
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
            setSelectedTicket(null);
          }}
          title="Delete Ticket"
        >
          {selectedTicket && (
            <div>
              <p>Are you sure you want to delete this ticket?</p>
              <div className="alert alert-info">
                <strong>Name:</strong> {selectedTicket.name}<br />
                <strong>Email:</strong> {selectedTicket.email}<br />
                <strong>Subject:</strong> {selectedTicket.subject || 'N/A'}<br />
                <strong>Source:</strong> {selectedTicket.source === 'need_help' ? 'Need Help' : selectedTicket.source === 'contact_form' ? 'Contact Form' : selectedTicket.source || 'N/A'}
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedTicket(null);
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

