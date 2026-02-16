const Project = require('../schemas/projectSchema');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private (VIEW_PROJECTS)
exports.getProjects = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    const query = {};

    const andParts = [];
    if (req.user.role !== 'admin' && req.user.role !== 'management') {
      andParts.push({
        $or: [
          { createdBy: req.user._id },
          { teamMembers: req.user._id }
        ]
      });
    }
    if (search) {
      andParts.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      });
    }
    if (andParts.length > 0) query.$and = andParts;

    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const projects = await Project.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Project.countDocuments(query);

    res.status(200).json({
      success: true,
      count: projects.length,
      total,
      data: projects,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('teamMembers', 'name email avatar');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const isMember = project.createdBy._id.toString() === req.user._id.toString() ||
      project.teamMembers?.some(m => m._id.toString() === req.user._id.toString());
    const hasAccess = req.user.role === 'admin' || req.user.role === 'management' || isMember;

    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
