const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  addComment
} = require('../controllers/taskController');
const { protect, checkPermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

// All routes require authentication
router.use(protect);

// Get all tasks - users can see their own tasks, admins and users with assign_tasks can see all
router.get('/', getTasks);

// Get single task
router.get('/:id', getTask);

// Create task - requires assign_tasks permission
router.post('/', checkPermission(PERMISSIONS.ASSIGN_TASKS), createTask);

// Update task - users can update their own tasks, admins and users with assign_tasks can update any
router.put('/:id', updateTask);

// Delete task - permission check is done in controller
router.delete('/:id', deleteTask);

// Add comment to task
router.post('/:id/comments', addComment);

module.exports = router;

