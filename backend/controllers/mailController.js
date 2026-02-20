const { PERMISSIONS } = require('../utils/permissions');
const mailcowApi = require('../services/mailcowApiService');
const smtpService = require('../services/smtpMailService');
const imapService = require('../services/imapMailService');

// Mailbox management
exports.listMailboxes = async (req, res, next) => {
  try {
    const mailboxes = await mailcowApi.listMailboxes();
    res.status(200).json({ success: true, data: mailboxes });
  } catch (error) {
    next(error);
  }
};

exports.createMailbox = async (req, res, next) => {
  try {
    const { localPart, domain, password, name, quotaMb } = req.body;

    if (!localPart || !domain || !password) {
      return res.status(400).json({
        success: false,
        message: 'localPart, domain and password are required'
      });
    }

    const result = await mailcowApi.createMailbox({
      localPart,
      domain,
      password,
      name,
      quotaMb
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.resetMailboxPassword = async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'email and newPassword are required'
      });
    }
    const result = await mailcowApi.resetMailboxPassword(email, newPassword);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.deleteMailbox = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'email is required'
      });
    }
    const result = await mailcowApi.deleteMailbox(email);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// Mail operations
exports.sendMail = async (req, res, next) => {
  try {
    const { to, subject, text, html, from } = req.body;
    if (!to || !subject || (!text && !html)) {
      return res.status(400).json({
        success: false,
        message: 'to, subject and text or html are required'
      });
    }

    const info = await smtpService.sendMail({ from, to, subject, text, html });
    res.status(200).json({ success: true, data: { messageId: info.messageId } });
  } catch (error) {
    next(error);
  }
};

exports.getInbox = async (req, res, next) => {
  try {
    const { folder = 'INBOX', page = 1, limit = 20 } = req.query;
    const numericPage = parseInt(page, 10) || 1;
    const numericLimit = parseInt(limit, 10) || 20;

    const inbox = await imapService.getInbox({
      folder,
      page: numericPage,
      limit: numericLimit
    });

    res.status(200).json({ success: true, data: inbox });
  } catch (error) {
    next(error);
  }
};

exports.getMessage = async (req, res, next) => {
  try {
    const { folder = 'INBOX' } = req.query;
    const uid = parseInt(req.params.id, 10);
    if (!uid) {
      return res.status(400).json({
        success: false,
        message: 'Valid message id (uid) is required'
      });
    }

    const message = await imapService.getMessage({ folder, uid });
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    res.status(200).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};

exports.deleteMessage = async (req, res, next) => {
  try {
    const { folder = 'INBOX', id } = req.body;
    const uid = parseInt(id, 10);
    if (!uid) {
      return res.status(400).json({
        success: false,
        message: 'Valid message id (uid) is required'
      });
    }
    await imapService.deleteMessage({ folder, uid });
    res.status(200).json({ success: true, message: 'Message deleted' });
  } catch (error) {
    next(error);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    const { folder = 'INBOX', id, read } = req.body;
    const uid = parseInt(id, 10);
    if (!uid || typeof read !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'id (uid) and read boolean are required'
      });
    }
    await imapService.markRead({ folder, uid, seen: read });
    res.status(200).json({ success: true, message: 'Message updated' });
  } catch (error) {
    next(error);
  }
};

exports.listFolders = async (req, res, next) => {
  try {
    const folders = await imapService.listFolders();
    res.status(200).json({ success: true, data: folders });
  } catch (error) {
    next(error);
  }
};

