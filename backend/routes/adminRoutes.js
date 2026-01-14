const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const AuditLog = require('../schemas/auditLogSchema');
const User = require('../schemas/userSchema');
const Project = require('../schemas/projectSchema');
const Task = require('../schemas/taskSchema');

// All admin routes require admin role
router.use(protect);
router.use(authorize('admin'));

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const totalProjects = await Project.countDocuments();
    const activeProjects = await Project.countDocuments({ status: 'in_progress' });
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: 'completed' });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        totalProjects,
        activeProjects,
        totalTasks,
        completedTasks,
        revenue: 206000 // Mock data
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get audit logs
// @route   GET /api/admin/audit-logs
// @access  Private/Admin
router.get('/audit-logs', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await AuditLog.find()
      .populate('user', 'name email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AuditLog.countDocuments();

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      data: logs,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;

