const express = require('express');
const router = express.Router();
const { protect, checkPermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');
const mailController = require('../controllers/mailController');

// All mail routes require authentication
router.use(protect);

// Mailbox management - require MANAGE_MAILBOXES or admin role
router.get(
  '/mailbox/list',
  (req, res, next) => {
    if (req.user.role === 'admin' || req.user.permissions?.includes(PERMISSIONS.MANAGE_MAILBOXES)) {
      return next();
    }
    return res.status(403).json({ success: false, message: 'Permission denied' });
  },
  mailController.listMailboxes
);

router.post(
  '/mailbox/create',
  (req, res, next) => {
    if (req.user.role === 'admin' || req.user.permissions?.includes(PERMISSIONS.MANAGE_MAILBOXES)) {
      return next();
    }
    return res.status(403).json({ success: false, message: 'Permission denied' });
  },
  mailController.createMailbox
);

router.post(
  '/mailbox/reset-password',
  (req, res, next) => {
    if (req.user.role === 'admin' || req.user.permissions?.includes(PERMISSIONS.MANAGE_MAILBOXES)) {
      return next();
    }
    return res.status(403).json({ success: false, message: 'Permission denied' });
  },
  mailController.resetMailboxPassword
);

router.post(
  '/mailbox/remove',
  (req, res, next) => {
    if (req.user.role === 'admin' || req.user.permissions?.includes(PERMISSIONS.MANAGE_MAILBOXES)) {
      return next();
    }
    return res.status(403).json({ success: false, message: 'Permission denied' });
  },
  mailController.deleteMailbox
);

// Mail operations - require VIEW_MAIL or SEND_MAIL
router.post(
  '/mail/send',
  (req, res, next) => {
    if (req.user.role === 'admin' || req.user.permissions?.includes(PERMISSIONS.SEND_MAIL) || req.user.permissions?.includes(PERMISSIONS.VIEW_MAIL)) {
      return next();
    }
    return res.status(403).json({ success: false, message: 'Permission denied' });
  },
  mailController.sendMail
);

router.get(
  '/mail/inbox',
  (req, res, next) => {
    if (req.user.role === 'admin' || req.user.permissions?.includes(PERMISSIONS.VIEW_MAIL)) {
      return next();
    }
    return res.status(403).json({ success: false, message: 'Permission denied' });
  },
  mailController.getInbox
);

router.get(
  '/mail/message/:id',
  (req, res, next) => {
    if (req.user.role === 'admin' || req.user.permissions?.includes(PERMISSIONS.VIEW_MAIL)) {
      return next();
    }
    return res.status(403).json({ success: false, message: 'Permission denied' });
  },
  mailController.getMessage
);

router.post(
  '/mail/delete',
  (req, res, next) => {
    if (req.user.role === 'admin' || req.user.permissions?.includes(PERMISSIONS.VIEW_MAIL)) {
      return next();
    }
    return res.status(403).json({ success: false, message: 'Permission denied' });
  },
  mailController.deleteMessage
);

router.post(
  '/mail/mark-read',
  (req, res, next) => {
    if (req.user.role === 'admin' || req.user.permissions?.includes(PERMISSIONS.VIEW_MAIL)) {
      return next();
    }
    return res.status(403).json({ success: false, message: 'Permission denied' });
  },
  mailController.markRead
);

router.get(
  '/mail/folders',
  (req, res, next) => {
    if (req.user.role === 'admin' || req.user.permissions?.includes(PERMISSIONS.VIEW_MAIL)) {
      return next();
    }
    return res.status(403).json({ success: false, message: 'Permission denied' });
  },
  mailController.listFolders
);

module.exports = router;

