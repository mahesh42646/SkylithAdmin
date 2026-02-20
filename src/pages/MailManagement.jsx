'use client';

import { useState, useEffect } from 'react';
import { FaEnvelope, FaEnvelopeOpen, FaTrash, FaReply, FaPaperPlane, FaPlus, FaKey, FaEdit, FaTimes, FaPaperclip } from 'react-icons/fa';
import { getCurrentUser } from '@/utils/auth';
import { hasPermission, PERMISSIONS } from '@/utils/permissions';
import api from '@/utils/api';
import DataTable from '@/components/common/DataTable';
import Modal from '@/components/common/Modal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Notification from '@/components/common/Notification';

export default function MailManagement() {
  const currentUser = getCurrentUser();
  const canManageMailboxes = hasPermission(currentUser, PERMISSIONS.MANAGE_MAILBOXES);
  const canSendMail = hasPermission(currentUser, PERMISSIONS.SEND_MAIL);

  const [activeTab, setActiveTab] = useState('inbox'); // 'inbox', 'compose', 'mailboxes'
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  
  // Inbox state
  const [inbox, setInbox] = useState({ messages: [], total: 0, page: 1, pages: 1 });
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState('INBOX');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Compose state
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeData, setComposeData] = useState({
    to: '',
    subject: '',
    text: '',
    html: ''
  });
  
  // Mailbox management state
  const [mailboxes, setMailboxes] = useState([]);
  const [showMailboxModal, setShowMailboxModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedMailbox, setSelectedMailbox] = useState(null);
  const [mailboxFormData, setMailboxFormData] = useState({
    localPart: '',
    domain: '',
    password: '',
    name: '',
    quotaMb: 2048
  });

  useEffect(() => {
    if (activeTab === 'inbox') {
      fetchFolders();
      fetchInbox();
    } else if (activeTab === 'mailboxes' && canManageMailboxes) {
      fetchMailboxes();
    }
  }, [activeTab, selectedFolder, currentPage]);

  const fetchFolders = async () => {
    try {
      const response = await api.listFolders();
      if (response.success) {
        setFolders(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const fetchInbox = async () => {
    try {
      setLoading(true);
      const response = await api.getInbox({ folder: selectedFolder, page: currentPage, limit: 20 });
      if (response.success) {
        setInbox(response.data);
      }
    } catch (error) {
      setNotification({ message: error.message || 'Failed to fetch inbox', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchMailboxes = async () => {
    try {
      setLoading(true);
      const response = await api.listMailboxes();
      if (response.success) {
        setMailboxes(response.data || []);
      }
    } catch (error) {
      setNotification({ message: error.message || 'Failed to fetch mailboxes', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleViewMessage = async (messageId) => {
    try {
      const response = await api.getMessage(messageId, selectedFolder);
      if (response.success) {
        setSelectedMessage(response.data);
        if (!response.data.seen) {
          await api.markRead(messageId, true, selectedFolder);
          fetchInbox();
        }
      }
    } catch (error) {
      setNotification({ message: error.message || 'Failed to fetch message', type: 'error' });
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      const response = await api.deleteMessage(messageId, selectedFolder);
      if (response.success) {
        setNotification({ message: 'Message deleted', type: 'success' });
        fetchInbox();
        if (selectedMessage && selectedMessage.id === messageId) {
          setSelectedMessage(null);
        }
      }
    } catch (error) {
      setNotification({ message: error.message || 'Failed to delete message', type: 'error' });
    }
  };

  const handleSendMail = async (e) => {
    e.preventDefault();
    try {
      const response = await api.sendMail(composeData);
      if (response.success) {
        setNotification({ message: 'Mail sent successfully', type: 'success' });
        setShowComposeModal(false);
        setComposeData({ to: '', subject: '', text: '', html: '' });
        if (activeTab === 'inbox') fetchInbox();
      }
    } catch (error) {
      setNotification({ message: error.message || 'Failed to send mail', type: 'error' });
    }
  };

  const handleCreateMailbox = async (e) => {
    e.preventDefault();
    try {
      const response = await api.createMailbox(mailboxFormData);
      if (response.success) {
        setNotification({ message: 'Mailbox created successfully', type: 'success' });
        setShowMailboxModal(false);
        setMailboxFormData({ localPart: '', domain: '', password: '', name: '', quotaMb: 2048 });
        fetchMailboxes();
      }
    } catch (error) {
      setNotification({ message: error.message || 'Failed to create mailbox', type: 'error' });
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const newPassword = e.target.newPassword.value;
    if (!newPassword) {
      setNotification({ message: 'Password is required', type: 'error' });
      return;
    }
    try {
      const response = await api.resetMailboxPassword(selectedMailbox, newPassword);
      if (response.success) {
        setNotification({ message: 'Password reset successfully', type: 'success' });
        setShowPasswordModal(false);
        setSelectedMailbox(null);
      }
    } catch (error) {
      setNotification({ message: error.message || 'Failed to reset password', type: 'error' });
    }
  };

  const handleDeleteMailbox = async (email) => {
    if (!window.confirm(`Are you sure you want to delete mailbox ${email}?`)) return;
    try {
      const response = await api.deleteMailbox(email);
      if (response.success) {
        setNotification({ message: 'Mailbox deleted successfully', type: 'success' });
        fetchMailboxes();
      }
    } catch (error) {
      setNotification({ message: error.message || 'Failed to delete mailbox', type: 'error' });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const mailboxColumns = [
    { key: 'username', label: 'Email Address' },
    { key: 'name', label: 'Name' },
    { 
      key: 'quota', 
      label: 'Quota',
      render: (value) => value ? `${Math.round(value / 1024)} MB` : 'Unlimited'
    },
    {
      key: 'active',
      label: 'Status',
      render: (value) => (
        <span className={`badge bg-${value === '1' ? 'success' : 'secondary'}`}>
          {value === '1' ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ];

  return (
    <div className="container-fluid px-3 py-4">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="fw-bold mb-2">Mail Management</h2>
            <p className="text-muted">Manage mailboxes and send/receive emails</p>
          </div>
          <div>
            {activeTab === 'inbox' && canSendMail && (
              <button
                className="btn btn-primary"
                onClick={() => setShowComposeModal(true)}
              >
                <FaPaperPlane className="me-2" />
                Compose
              </button>
            )}
            {activeTab === 'mailboxes' && canManageMailboxes && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  setMailboxFormData({ localPart: '', domain: '', password: '', name: '', quotaMb: 2048 });
                  setShowMailboxModal(true);
                }}
              >
                <FaPlus className="me-2" />
                Create Mailbox
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'inbox' ? 'active' : ''}`}
            onClick={() => setActiveTab('inbox')}
          >
            <FaEnvelope className="me-2" />
            Inbox
          </button>
        </li>
        {canManageMailboxes && (
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'mailboxes' ? 'active' : ''}`}
              onClick={() => setActiveTab('mailboxes')}
            >
              <FaEnvelope className="me-2" />
              Mailboxes
            </button>
          </li>
        )}
      </ul>

      {/* Inbox Tab */}
      {activeTab === 'inbox' && (
        <div className="row">
          <div className="col-md-3">
            <div className="card">
              <div className="card-body">
                <h6 className="card-title">Folders</h6>
                <ul className="list-group list-group-flush">
                  {folders.map((folder) => (
                    <li
                      key={folder.path}
                      className={`list-group-item ${selectedFolder === folder.path ? 'active' : ''}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setSelectedFolder(folder.path);
                        setCurrentPage(1);
                      }}
                    >
                      {folder.name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="col-md-9">
            {loading ? (
              <LoadingSpinner />
            ) : selectedMessage ? (
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-0">{selectedMessage.subject}</h5>
                    <small className="text-muted">
                      From: {selectedMessage.from} | {formatDate(selectedMessage.date)}
                    </small>
                  </div>
                  <div>
                    <button
                      className="btn btn-sm btn-outline-secondary me-2"
                      onClick={() => setSelectedMessage(null)}
                    >
                      <FaTimes />
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDeleteMessage(selectedMessage.id)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  {selectedMessage.html ? (
                    <div dangerouslySetInnerHTML={{ __html: selectedMessage.html }} />
                  ) : (
                    <pre style={{ whiteSpace: 'pre-wrap' }}>{selectedMessage.text}</pre>
                  )}
                  {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                    <div className="mt-3">
                      <h6>Attachments:</h6>
                      <ul>
                        {selectedMessage.attachments.map((att, idx) => (
                          <li key={idx}>{att.filename}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="card-body">
                  {inbox.messages.length === 0 ? (
                    <div className="text-center py-5">
                      <FaEnvelope className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                      <p className="text-muted">No messages in this folder</p>
                    </div>
                  ) : (
                    <>
                      <div className="list-group">
                        {inbox.messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`list-group-item list-group-item-action ${!msg.seen ? 'fw-bold' : ''}`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleViewMessage(msg.id)}
                          >
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="flex-grow-1">
                                <div className="d-flex align-items-center mb-1">
                                  {msg.seen ? (
                                    <FaEnvelopeOpen className="me-2 text-muted" />
                                  ) : (
                                    <FaEnvelope className="me-2 text-primary" />
                                  )}
                                  <span className="fw-bold">{msg.from}</span>
                                </div>
                                <div className="ms-4">
                                  <div>{msg.subject || '(No Subject)'}</div>
                                  <small className="text-muted">{formatDate(msg.date)}</small>
                                </div>
                              </div>
                              {msg.hasAttachments && (
                                <FaPaperclip className="text-muted ms-2" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {inbox.pages > 1 && (
                        <div className="d-flex justify-content-between align-items-center mt-3">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                          >
                            Previous
                          </button>
                          <span>Page {currentPage} of {inbox.pages}</span>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            disabled={currentPage === inbox.pages}
                            onClick={() => setCurrentPage(p => p + 1)}
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mailboxes Tab */}
      {activeTab === 'mailboxes' && canManageMailboxes && (
        <div className="card">
          <div className="card-body">
            {loading ? (
              <LoadingSpinner />
            ) : (
              <DataTable
                columns={mailboxColumns}
                data={mailboxes}
                searchable={true}
                pagination={true}
                actions={(row) => (
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => {
                        setSelectedMailbox(row.username);
                        setShowPasswordModal(true);
                      }}
                      title="Reset Password"
                    >
                      <FaKey />
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDeleteMailbox(row.username)}
                      title="Delete Mailbox"
                    >
                      <FaTrash />
                    </button>
                  </div>
                )}
              />
            )}
          </div>
        </div>
      )}

      {/* Compose Modal */}
      {showComposeModal && (
        <Modal
          isOpen={showComposeModal}
          onClose={() => setShowComposeModal(false)}
          title="Compose Mail"
        >
          <form onSubmit={handleSendMail}>
            <div className="mb-3">
              <label className="form-label">To</label>
              <input
                type="email"
                className="form-control"
                required
                value={composeData.to}
                onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Subject</label>
              <input
                type="text"
                className="form-control"
                required
                value={composeData.subject}
                onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Message</label>
              <textarea
                className="form-control"
                rows="10"
                required
                value={composeData.text}
                onChange={(e) => setComposeData({ ...composeData, text: e.target.value, html: e.target.value.replace(/\n/g, '<br>') })}
              />
            </div>
            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowComposeModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <FaPaperPlane className="me-2" />
                Send
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Mailbox Modal */}
      {showMailboxModal && (
        <Modal
          isOpen={showMailboxModal}
          onClose={() => setShowMailboxModal(false)}
          title="Create Mailbox"
        >
          <form onSubmit={handleCreateMailbox}>
            <div className="mb-3">
              <label className="form-label">Local Part (username)</label>
              <input
                type="text"
                className="form-control"
                required
                value={mailboxFormData.localPart}
                onChange={(e) => setMailboxFormData({ ...mailboxFormData, localPart: e.target.value })}
                placeholder="username"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Domain</label>
              <input
                type="text"
                className="form-control"
                required
                value={mailboxFormData.domain}
                onChange={(e) => setMailboxFormData({ ...mailboxFormData, domain: e.target.value })}
                placeholder="example.com"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-control"
                value={mailboxFormData.name}
                onChange={(e) => setMailboxFormData({ ...mailboxFormData, name: e.target.value })}
                placeholder="Display name"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                required
                value={mailboxFormData.password}
                onChange={(e) => setMailboxFormData({ ...mailboxFormData, password: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Quota (MB)</label>
              <input
                type="number"
                className="form-control"
                value={mailboxFormData.quotaMb}
                onChange={(e) => setMailboxFormData({ ...mailboxFormData, quotaMb: parseInt(e.target.value) || 2048 })}
                min="1"
              />
            </div>
            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowMailboxModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Create
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && (
        <Modal
          isOpen={showPasswordModal}
          onClose={() => {
            setShowPasswordModal(false);
            setSelectedMailbox(null);
          }}
          title={`Reset Password for ${selectedMailbox}`}
        >
          <form onSubmit={handleResetPassword}>
            <div className="mb-3">
              <label className="form-label">New Password</label>
              <input
                type="password"
                name="newPassword"
                className="form-control"
                required
              />
            </div>
            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowPasswordModal(false);
                  setSelectedMailbox(null);
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Reset Password
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
