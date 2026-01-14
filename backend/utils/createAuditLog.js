const AuditLog = require('../schemas/auditLogSchema');

const createAuditLog = async (action, user, resourceType = null, resourceId = null, details = null, req = null) => {
  try {
    await AuditLog.create({
      action,
      user: user._id || user,
      resourceType,
      resourceId,
      details,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.get('user-agent')
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw error, just log it
  }
};

module.exports = createAuditLog;

