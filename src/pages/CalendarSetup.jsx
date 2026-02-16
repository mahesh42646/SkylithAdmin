'use client';

import { useState, useEffect } from 'react';
import { FaCalendarAlt, FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import { getCurrentUser } from '@/utils/auth';
import { hasPermission, PERMISSIONS } from '@/utils/permissions';
import api from '@/utils/api';
import Modal from '@/components/common/Modal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Notification from '@/components/common/Notification';

export default function CalendarSetup() {
  const user = getCurrentUser();
  const canManage = user && hasPermission(user, PERMISSIONS.MANAGE_CALENDAR);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({ date: '', type: 'public_holiday', name: '', description: '' });
  const [notification, setNotification] = useState(null);

  const getStartEnd = () => {
    const start = new Date(currentMonth.year, currentMonth.month - 2, 1);
    const end = new Date(currentMonth.year, currentMonth.month + 4, 0);
    return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
  };

  useEffect(() => {
    fetchEvents();
  }, [currentMonth]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getStartEnd();
      const response = await api.getCalendar({ startDate, endDate });
      if (response.success) setEvents(response.data);
    } catch (error) {
      setNotification({ message: error.message || 'Failed to fetch events', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (event = null) => {
    const isEdit = event && event._id;
    setEditingEvent(isEdit ? event : null);
    const dateVal = event?.date
      ? (typeof event.date === 'string' ? event.date : new Date(event.date).toISOString().split('T')[0])
      : new Date(currentMonth.year, currentMonth.month, 15).toISOString().split('T')[0];
    setFormData({
      date: dateVal,
      type: event?.type || 'public_holiday',
      name: event?.name || '',
      description: event?.description || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEvent) {
        await api.updateCalendarEvent(editingEvent._id, formData);
        setNotification({ message: 'Event updated', type: 'success' });
      } else {
        await api.createCalendarEvent(formData);
        setNotification({ message: 'Event created', type: 'success' });
      }
      setShowModal(false);
      fetchEvents();
    } catch (error) {
      setNotification({ message: error.message || 'Failed to save', type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await api.deleteCalendarEvent(id);
      setNotification({ message: 'Event deleted', type: 'success' });
      fetchEvents();
    } catch (error) {
      setNotification({ message: error.message || 'Failed to delete', type: 'error' });
    }
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const prevMonth = () => {
    if (currentMonth.month === 0) setCurrentMonth({ year: currentMonth.year - 1, month: 11 });
    else setCurrentMonth({ ...currentMonth, month: currentMonth.month - 1 });
  };

  const nextMonth = () => {
    if (currentMonth.month === 11) setCurrentMonth({ year: currentMonth.year + 1, month: 0 });
    else setCurrentMonth({ ...currentMonth, month: currentMonth.month + 1 });
  };

  const eventsByDate = events.reduce((acc, e) => {
    const d = new Date(e.date).toISOString().split('T')[0];
    if (!acc[d]) acc[d] = [];
    acc[d].push(e);
    return acc;
  }, {});

  const renderCalendarGrid = () => {
    const firstDay = new Date(currentMonth.year, currentMonth.month, 1);
    const lastDay = new Date(currentMonth.year, currentMonth.month + 1, 0);
    const startPadding = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const cells = [];
    for (let i = 0; i < startPadding; i++) cells.push(<div key={`pad-${i}`} className="calendar-cell empty" />);

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayEvents = eventsByDate[dateStr] || [];
      cells.push(
        <div key={d} className="calendar-cell">
          <div className="d-flex justify-content-between align-items-start">
            <span className="fw-semibold">{d}</span>
            {canManage && (
              <button className="btn btn-sm btn-outline-primary p-1" onClick={() => handleOpenModal({ date: dateStr, type: 'public_holiday', name: '', description: '' })} title="Add event">
                <FaPlus size={10} />
              </button>
            )}
          </div>
          <div className="mt-1 small">
            {dayEvents.map((ev) => (
              <div key={ev._id} className="d-flex align-items-center justify-content-between mb-1 p-1 rounded" style={{ backgroundColor: '#E0E7FF' }}>
                <span className="text-truncate" style={{ maxWidth: '120px' }}>{ev.name}</span>
                {canManage && (
                  <div>
                    <button className="btn btn-link p-0 me-1" onClick={() => handleOpenModal(ev)}><FaEdit size={12} /></button>
                    <button className="btn btn-link p-0 text-danger" onClick={() => handleDelete(ev._id)}><FaTrash size={12} /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return cells;
  };

  return (
    <div className="container-fluid px-3 py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-2">
              <FaCalendarAlt className="me-2" />
              {canManage ? 'Calendar Setup' : 'Calendar'}
            </h2>
            <p className="text-muted">{canManage ? 'Set public holidays and events for upcoming months' : 'View holidays and events'}</p>
          </div>
          {canManage && (
            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
              <FaPlus className="me-2" />Add Holiday / Event
            </button>
          )}
        </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <button className="btn btn-outline-secondary" onClick={prevMonth}>&larr; Prev</button>
            <h5 className="mb-0">{monthNames[currentMonth.month]} {currentMonth.year}</h5>
            <button className="btn btn-outline-secondary" onClick={nextMonth}>Next &rarr;</button>
          </div>
          <div className="calendar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="fw-bold text-muted small text-center py-2">{d}</div>
            ))}
            {loading ? <div className="col-span-7 text-center py-4"><LoadingSpinner /></div> : renderCalendarGrid()}
          </div>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingEvent ? 'Edit Event' : 'Add Holiday / Event'}>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Date</label>
            <input type="date" className="form-control" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Type</label>
            <select className="form-select" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
              <option value="public_holiday">Public Holiday</option>
              <option value="optional_holiday">Optional Holiday</option>
              <option value="company_event">Company Event</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label">Name</label>
            <input type="text" className="form-control" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Diwali" required />
          </div>
          <div className="mb-3">
            <label className="form-label">Description (optional)</label>
            <textarea className="form-control" rows="2" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>
          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editingEvent ? 'Update' : 'Add'}</button>
          </div>
        </form>
      </Modal>

      {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
    </div>
  );
}
