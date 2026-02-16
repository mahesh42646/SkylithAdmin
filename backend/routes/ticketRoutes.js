const express = require('express');
const router = express.Router();
const Contact = require('../schemas/contactSchema');
const { protect, checkPermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

// Raise ticket (create contact from app)
router.post('/raise', protect, checkPermission(PERMISSIONS.RAISE_TICKET), async (req, res) => {
  try {
    const { subject, message, phone } = req.body;
    const user = req.user;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a message'
      });
    }

    const contact = await Contact.create({
      name: user.name,
      email: user.email,
      phone: phone || '',
      subject: subject || (message.length > 50 ? message.substring(0, 50) + '...' : message),
      message: message.trim(),
      source: 'mobile_app',
      raisedBy: user._id,
      status: 'unresolved'
    });

    res.status(201).json({
      success: true,
      data: contact,
      message: 'Ticket raised successfully. We will get back to you soon.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to raise ticket'
    });
  }
});

module.exports = router;
