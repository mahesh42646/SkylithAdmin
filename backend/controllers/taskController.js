const Task = require('../schemas/taskSchema');
const User = require('../schemas/userSchema');
const createAuditLog = require('../utils/createAuditLog');

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    const { status, priority, assignee, projectId, search, page = 1, limit = 10 } = req.query;

    // Build query
    const query = {};

    // If user is not admin and doesn't have assign_tasks permission, show only their tasks
    if (req.user.role !== 'admin' && !req.user.permissions?.includes('assign_tasks')) {
      query.assignee = req.user._id;
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignee) query.assignee = assignee;
    if (projectId) query.projectId = projectId;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tasks = await Task.find(query)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email')
      .populate('projectId', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(query);

    res.status(200).json({
      success: true,
      count: tasks.length,
      total,
      data: tasks,
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

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email')
      .populate('projectId', 'title')
      .populate('comments.user', 'name email avatar');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user can view this task
    if (req.user.role !== 'admin' && 
        !req.user.permissions?.includes('assign_tasks') && 
        task.assignee._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this task'
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res) => {
  try {
    const { title, description, assignee, projectId, priority, status, dueDate } = req.body;

    // Check if user has permission to assign tasks
    if (req.user.role !== 'admin' && !req.user.permissions?.includes('assign_tasks')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to create/assign tasks'
      });
    }

    // Validate assignee exists
    const assigneeUser = await User.findById(assignee);
    if (!assigneeUser) {
      return res.status(400).json({
        success: false,
        message: 'Assignee not found'
      });
    }

    const task = await Task.create({
      title,
      description,
      assignee,
      projectId: projectId || null,
      priority: priority || 'medium',
      status: status || 'pending',
      dueDate: dueDate || null,
      createdBy: req.user._id
    });

    await createAuditLog('Task Created', req.user, 'task', task._id, { title, assignee: assigneeUser.name }, req);

    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email')
      .populate('projectId', 'title');

    res.status(201).json({
      success: true,
      data: populatedTask,
      message: 'Task created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check permissions
    const isAdmin = req.user.role === 'admin';
    const hasEditTasks = req.user.permissions?.includes('edit_tasks');
    const hasAssignTasks = req.user.permissions?.includes('assign_tasks');
    const isCreator = task.createdBy.toString() === req.user._id.toString();
    const isAssignee = task.assignee.toString() === req.user._id.toString();
    
    const canEdit = isAdmin || hasEditTasks || (hasAssignTasks && isCreator) || isAssignee;

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this task'
      });
    }

    const { title, description, assignee, projectId, priority, status, dueDate } = req.body;

    // Assignees can only update status, not other fields
    if (isAssignee && !isAdmin && !hasEditTasks && !hasAssignTasks) {
      // Only allow status updates for assignees
      if (title !== undefined || description !== undefined || assignee !== undefined || 
          projectId !== undefined || priority !== undefined || dueDate !== undefined) {
        return res.status(403).json({
          success: false,
          message: 'You can only update the status of tasks assigned to you'
        });
      }
    }

    // Only users with assign_tasks permission can change assignee
    if (assignee && assignee !== task.assignee.toString()) {
      if (!isAdmin && !hasAssignTasks) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to reassign tasks'
        });
      }

      const assigneeUser = await User.findById(assignee);
      if (!assigneeUser) {
        return res.status(400).json({
          success: false,
          message: 'Assignee not found'
        });
      }
      task.assignee = assignee;
    }

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (projectId !== undefined) task.projectId = projectId || null;
    if (priority) task.priority = priority;
    if (status) {
      task.status = status;
      if (status === 'completed' && !task.completedDate) {
        task.completedDate = Date.now();
      } else if (status !== 'completed') {
        task.completedDate = null;
      }
    }
    if (dueDate !== undefined) task.dueDate = dueDate || null;

    task.updatedAt = Date.now();
    await task.save();

    await createAuditLog('Task Updated', req.user, 'task', task._id, { updatedFields: Object.keys(req.body) }, req);

    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email')
      .populate('projectId', 'title');

    res.status(200).json({
      success: true,
      data: populatedTask,
      message: 'Task updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Only admin or task creator with assign_tasks permission can delete
    const canDelete = req.user.role === 'admin' || 
                     (req.user.permissions?.includes('assign_tasks') && task.createdBy.toString() === req.user._id.toString());

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this task'
      });
    }

    await Task.findByIdAndDelete(req.params.id);

    await createAuditLog('Task Deleted', req.user, 'task', task._id, { title: task.title }, req);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user can view this task
    if (req.user.role !== 'admin' && 
        !req.user.permissions?.includes('assign_tasks') && 
        task.assignee.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to comment on this task'
      });
    }

    task.comments.push({
      user: req.user._id,
      comment: req.body.comment
    });

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email')
      .populate('projectId', 'title')
      .populate('comments.user', 'name email avatar');

    res.status(200).json({
      success: true,
      data: populatedTask,
      message: 'Comment added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

