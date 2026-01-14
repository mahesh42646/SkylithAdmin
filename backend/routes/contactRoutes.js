const express = require('express');
const router = express.Router();
const {
  createContact,
  getContacts,
  getContact,
  updateContact,
  deleteContact
} = require('../controllers/contactController');
const { protect, authorize, checkPermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

// Public route - anyone can submit a contact form
router.post('/', createContact);

// Protected routes - Permission-based access
router.use(protect);
router.get('/', checkPermission(PERMISSIONS.VIEW_TICKETS), getContacts);
router.get('/:id', checkPermission(PERMISSIONS.VIEW_TICKETS), getContact);
router.put('/:id', checkPermission(PERMISSIONS.MANAGE_TICKETS), updateContact);
router.delete('/:id', checkPermission(PERMISSIONS.MANAGE_TICKETS), deleteContact);

module.exports = router;

