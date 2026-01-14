const Contact = require('../schemas/contactSchema');
const createAuditLog = require('../utils/createAuditLog');

// @desc    Create contact query
// @route   POST /api/contact
// @access  Public
exports.createContact = async (req, res) => {
  try {
    const { name, email, phone, subject, message, source } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, and message'
      });
    }

    // Auto-generate subject if missing (for "Need Help?" form)
    let finalSubject = subject;
    if (!finalSubject) {
      // Use first 50 characters of message as subject, or default
      finalSubject = message.length > 50 
        ? message.substring(0, 50).trim() + '...' 
        : message.trim();
    }

    // Determine source type
    const sourceType = source || (subject ? 'contact_form' : 'need_help');

    // Create contact query
    const contact = await Contact.create({
      name,
      email,
      phone: phone || '',
      subject: finalSubject,
      message,
      source: sourceType,
      status: 'unresolved'
    });

    res.status(201).json({
      success: true,
      data: contact,
      message: 'Your message has been received. We will get back to you soon.'
    });
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit contact form'
    });
  }
};

// @desc    Get all contact queries
// @route   GET /api/contact
// @access  Private/Admin
exports.getContacts = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10, source } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (source) query.source = source;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Contact.countDocuments(query);

    res.status(200).json({
      success: true,
      count: contacts.length,
      total,
      data: contacts,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single contact query
// @route   GET /api/contact/:id
// @access  Private/Admin
exports.getContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact query not found'
      });
    }

    res.status(200).json({
      success: true,
      data: contact
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update contact query status
// @route   PUT /api/contact/:id
// @access  Private/Admin
exports.updateContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact query not found'
      });
    }

    const { status, notes } = req.body;

    if (status) {
      contact.status = status;
      if (status === 'resolved') {
        contact.resolvedAt = new Date();
        contact.resolvedBy = req.user.id;
      } else if (status === 'unresolved') {
        contact.resolvedAt = null;
        contact.resolvedBy = null;
      }
    }

    if (notes !== undefined) {
      contact.notes = notes;
    }

    await contact.save();

    await createAuditLog(
      'Contact Updated',
      req.user,
      'other',
      contact._id,
      { status: contact.status },
      req
    );

    res.status(200).json({
      success: true,
      data: contact,
      message: 'Contact query updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete contact query
// @route   DELETE /api/contact/:id
// @access  Private/Admin
exports.deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact query not found'
      });
    }

    await contact.deleteOne();

    await createAuditLog(
      'Contact Deleted',
      req.user,
      'other',
      contact._id,
      { name: contact.name, email: contact.email },
      req
    );

    res.status(200).json({
      success: true,
      message: 'Contact query deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

