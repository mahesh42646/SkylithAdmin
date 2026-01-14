'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser, refreshUserData, setCurrentUser } from '@/utils/auth';
import { hasPermission, PERMISSIONS } from '@/utils/permissions';
import UserAvatar from '@/components/common/UserAvatar';
import api from '@/utils/api';
import Notification from '@/components/common/Notification';
import { FaUser, FaLock, FaBell, FaCog, FaImage, FaFileUpload, FaTimes, FaFile, FaCalendar, FaBuilding, FaEnvelope, FaSave, FaSpinner } from 'react-icons/fa';

export default function Settings({ editingUserId = null }) {
  const currentUser = getCurrentUser();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [notification, setNotification] = useState(null);
  const [user, setUser] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [documentFiles, setDocumentFiles] = useState([]);
  const [existingDocuments, setExistingDocuments] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    dateOfBirth: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    notifications: {
      email: true,
      push: true,
      sms: false
    }
  });

  const canEditOthers = hasPermission(currentUser, PERMISSIONS.EDIT_USERS);
  const isEditingOther = editingUserId && editingUserId !== currentUser?._id && editingUserId !== currentUser?.id;
  const canEdit = !isEditingOther || canEditOthers;

  useEffect(() => {
    fetchUserData();
  }, [editingUserId]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const userId = editingUserId || currentUser?._id || currentUser?.id;
      if (!userId) return;

      const response = await api.getUser(userId);
      if (response.success) {
        const userData = response.data;
        setUser(userData);
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          department: userData.department || '',
          dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth).toISOString().split('T')[0] : '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          notifications: {
            email: true,
            push: true,
            sms: false
          }
        });
        // Normalize avatar URL to absolute path so Next/Image hits backend not Next dev server
        const normalizedAvatar = userData.avatar
          ? (userData.avatar.startsWith('data:') || userData.avatar.startsWith('http')
              ? userData.avatar
              : `${process.env.NEXT_PUBLIC_UPLOAD_BASE_URL}${userData.avatar.startsWith('/') ? userData.avatar : '/' + userData.avatar}`)
          : null;
        setAvatarPreview(normalizedAvatar);
        setExistingDocuments(userData.documents || []);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setNotification({
        message: error.message || 'Failed to load user data',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Ensure avatar src always points to the backend host
  const resolveAvatarSrc = (src) => {
    if (!src) return null;
    // If it's already a data URL or full URL, use as-is
    if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://')) {
      return src;
    }
    // Normalize path and prepend backend URL
    const normalizedPath = src.startsWith('/') ? src : `/${src}`;
    const fullUrl = `${process.env.NEXT_PUBLIC_UPLOAD_BASE_URL}${normalizedPath}`;
    console.log('Resolved avatar URL:', fullUrl, 'from:', src);
    return fullUrl;
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setNotification({
          message: 'Avatar image must be less than 5MB',
          type: 'error'
        });
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
        setNotification({
          message: `${file.name} is too large. Maximum size is 10MB.`,
          type: 'error'
        });
        return false;
      }
      return true;
    });
    setDocumentFiles([...documentFiles, ...validFiles]);
  };

  const removeDocument = (index) => {
    setDocumentFiles(documentFiles.filter((_, i) => i !== index));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) {
      setNotification({
        message: 'You do not have permission to edit this profile',
        type: 'permission'
      });
      return;
    }

    try {
      setSaving(true);
      const userId = editingUserId || currentUser?._id || currentUser?.id;
      
      const updateData = {
        name: formData.name,
        email: formData.email,
        department: formData.department || '',
        dateOfBirth: formData.dateOfBirth || ''
      };

      const files = {};
      if (avatarFile) files.avatar = avatarFile;
      if (documentFiles.length > 0) files.documents = documentFiles;

      const response = await api.updateUser(userId, updateData, files);
      
      if (response.success) {
        // If editing own profile, refresh user data
        if (!isEditingOther) {
          await refreshUserData();
          const updatedUser = getCurrentUser();
          setUser(updatedUser);
        } else {
          await fetchUserData();
        }
        
        setAvatarFile(null);
        setDocumentFiles([]);
        setNotification({
          message: 'Profile updated successfully!',
          type: 'success'
        });
      } else {
        setNotification({
          message: response.message || 'Failed to update profile',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setNotification({
        message: error.message || 'Failed to update profile',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      setNotification({
        message: 'New passwords do not match',
        type: 'error'
      });
      return;
    }

    if (formData.newPassword.length < 6) {
      setNotification({
        message: 'Password must be at least 6 characters',
        type: 'error'
      });
      return;
    }

    try {
      setSaving(true);
      const userId = editingUserId || currentUser?._id || currentUser?.id;
      
      const response = await api.updateUser(userId, {
        password: formData.newPassword
      });
      
      if (response.success) {
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setNotification({
          message: 'Password updated successfully!',
          type: 'success'
        });
      } else {
        setNotification({
          message: response.message || 'Failed to update password',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error updating password:', error);
      setNotification({
        message: error.message || 'Failed to update password',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FaUser },
    { id: 'security', label: 'Security', icon: FaLock },
    { id: 'notifications', label: 'Notifications', icon: FaBell },
    ...(currentUser?.role === 'admin' ? [{ id: 'system', label: 'System Settings', icon: FaCog }] : [])
  ];

  if (loading) {
    return (
      <div className="container-fluid px-3 py-4">
        <div className="text-center py-5">
          <FaSpinner className="fa-spin" size={32} />
          <p className="mt-3 text-muted">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-3 py-4">
      <style>{`
        .settings-section {
          background: #F9FAFB;
          border-radius: 0.5rem;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          border: 1px solid #E5E7EB;
        }
        .settings-section h6 {
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
          min-height: 180px;
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
        .tab-button {
          border: none;
          background: transparent;
          padding: 0.75rem 1rem;
          width: 100%;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
          border-left: 3px solid transparent;
        }
        .tab-button:hover {
          background: #F3F4F6;
        }
        .tab-button.active {
          background: #EEF2FF;
          border-left-color: #8B5CF6;
          color: #8B5CF6;
          font-weight: 600;
        }
      `}</style>

      <div className="mb-4">
        <h2 className="fw-bold mb-2">
          {isEditingOther ? `Edit Profile - ${user?.name || 'User'}` : 'Settings'}
        </h2>
        <p className="text-muted">
          {isEditingOther ? 'Edit user profile information' : 'Manage your account settings and preferences'}
        </p>
      </div>

      <div className="row">
        <div className="col-12 col-lg-3 mb-4">
          <div className="card shadow-sm">
            <div className="card-body p-0">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    className={`tab-button d-flex align-items-center gap-2 ${
                      activeTab === tab.id ? 'active' : ''
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-9">
          <div className="card shadow-sm">
            <div className="card-body">
              {activeTab === 'profile' && (
                <form onSubmit={handleProfileSubmit}>
                  <div className="settings-section">
                    <h6>
                      <FaUser className="text-primary" />
                      Profile Information
                    </h6>

                    {/* Profile Picture */}
                    <div className="mb-4">
                      <p className="form-p fw-semibold mb-3">Profile Picture</p>
                      <div className="avatar-upload-area" onClick={() => canEdit && document.getElementById('avatar-input').click()}>
                        {avatarPreview ? (
                          <div className="text-center">
                            <img 
                              src={resolveAvatarSrc(avatarPreview)}
                              alt="Avatar preview" 
                              className="avatar-preview mb-3" 
                              width={120} 
                              height={120}
                              onError={(e) => {
                                console.error('Image failed to load:', e.target.src);
                                // Show a placeholder or hide the broken image
                                e.target.onerror = null; // Prevent infinite loop
                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="120"%3E%3Crect width="120" height="120" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="sans-serif" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E';
                              }}
                            />
                            {canEdit && (
                              <p className="text-muted small mb-0">Click to change profile picture</p>
                            )}
                          </div>
                        ) : (
                          <div className="text-center">
                            <FaImage size={48} className="text-muted mb-3" />
                            {canEdit ? (
                              <>
                                <p className="mb-1 fw-semibold">Upload Profile Picture</p>
                                <p className="text-muted small mb-0">Click to browse or drag and drop</p>
                                <p className="text-muted small">Max size: 5MB (JPG, PNG, GIF)</p>
                              </>
                            ) : (
                              <p className="text-muted small">No profile picture</p>
                            )}
                          </div>
                        )}
                        {canEdit && (
                          <input
                            type="file"
                            id="avatar-input"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            style={{ display: 'none' }}
                          />
                        )}
                      </div>
                    </div>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Full Name <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          disabled={!canEdit}
                          placeholder="Enter full name"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          <FaEnvelope className="me-1" />
                          Email <span className="text-danger">*</span>
                        </label>
                        <input
                          type="email"
                          className="form-control"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          disabled={!canEdit || !isEditingOther}
                          placeholder="user@example.com"
                        />
                        {!isEditingOther && (
                          <small className="text-muted">Email cannot be changed</small>
                        )}
                      </div>
                    </div>

                    <div className="row g-3 mt-2">
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
                          disabled={!canEdit}
                          max={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          <FaBuilding className="me-1" />
                          Department
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          disabled={!canEdit}
                          placeholder="Enter department"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Documents Section */}
                  {canEdit && (
                    <div className="settings-section">
                      <h6>
                        <FaFileUpload className="text-primary" />
                        Documents
                      </h6>
                      <div className="mb-3">
                        <label className="form-label fw-semibold mb-3">Upload Documents</label>
                        <div
                          className="border rounded p-3"
                          style={{
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
                          onClick={() => document.getElementById('documents-input').click()}
                        >
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
                  )}

                  {canEdit && (
                    <div className="d-flex justify-content-end gap-2 mt-4">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setAvatarFile(null);
                          setDocumentFiles([]);
                          fetchUserData();
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary d-flex align-items-center gap-2"
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <FaSpinner className="fa-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <FaSave />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </form>
              )}

              {activeTab === 'security' && (
                <form onSubmit={handlePasswordSubmit}>
                  <div className="settings-section">
                    <h6>
                      <FaLock className="text-primary" />
                      Change Password
                    </h6>

                    {!isEditingOther && (
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Current Password</label>
                        <input
                          type="password"
                          className="form-control"
                          value={formData.currentPassword}
                          onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                          placeholder="Enter current password"
                        />
                      </div>
                    )}

                    <div className="mb-3">
                      <label className="form-label fw-semibold">New Password</label>
                      <input
                        type="password"
                        className="form-control"
                        value={formData.newPassword}
                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                        required
                        placeholder="Enter new password"
                        minLength={6}
                      />
                      <small className="text-muted">Password must be at least 6 characters</small>
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold">Confirm New Password</label>
                      <input
                        type="password"
                        className="form-control"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                        placeholder="Confirm new password"
                        minLength={6}
                      />
                    </div>

                    <div className="d-flex justify-content-end gap-2 mt-4">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' })}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary d-flex align-items-center gap-2"
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <FaSpinner className="fa-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <FaLock />
                            Update Password
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {activeTab === 'notifications' && (
                <form onSubmit={(e) => { e.preventDefault(); setNotification({ message: 'Notification preferences saved!', type: 'success' }); }}>
                  <div className="settings-section">
                    <h6>
                      <FaBell className="text-primary" />
                      Notification Preferences
                    </h6>

                    <div className="mb-3">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={formData.notifications.email}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              notifications: { ...formData.notifications, email: e.target.checked }
                            })
                          }
                        />
                        <label className="form-check-label fw-semibold">Email Notifications</label>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={formData.notifications.push}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              notifications: { ...formData.notifications, push: e.target.checked }
                            })
                          }
                        />
                        <label className="form-check-label fw-semibold">Push Notifications</label>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={formData.notifications.sms}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              notifications: { ...formData.notifications, sms: e.target.checked }
                            })
                          }
                        />
                        <label className="form-check-label fw-semibold">SMS Notifications</label>
                      </div>
                    </div>

                    <div className="d-flex justify-content-end gap-2 mt-4">
                      <button type="submit" className="btn btn-primary d-flex align-items-center gap-2">
                        <FaSave />
                        Save Preferences
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {activeTab === 'system' && currentUser?.role === 'admin' && (
                <form onSubmit={(e) => { e.preventDefault(); setNotification({ message: 'System settings saved!', type: 'success' }); }}>
                  <div className="settings-section">
                    <h6>
                      <FaCog className="text-primary" />
                      System Settings
                    </h6>

                    <div className="mb-3">
                      <label className="form-label fw-semibold">Site Name</label>
                      <input type="text" className="form-control" defaultValue="Admin Dashboard" />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold">Maintenance Mode</label>
                      <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" />
                        <label className="form-check-label">Enable maintenance mode</label>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold">Session Timeout (minutes)</label>
                      <input type="number" className="form-control" defaultValue="30" />
                    </div>

                    <div className="d-flex justify-content-end gap-2 mt-4">
                      <button type="submit" className="btn btn-primary d-flex align-items-center gap-2">
                        <FaSave />
                        Save System Settings
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

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
