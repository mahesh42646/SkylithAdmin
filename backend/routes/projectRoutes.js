const express = require('express');
const router = express.Router();
const { getProjects, getProject } = require('../controllers/projectController');
const { protect, checkPermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

router.use(protect);
router.get('/', checkPermission(PERMISSIONS.VIEW_PROJECTS), getProjects);
router.get('/:id', checkPermission(PERMISSIONS.VIEW_PROJECTS), getProject);

module.exports = router;
