const express = require('express');
const router = express.Router();
const projectCtrl = require('../controllers/projectCtrl');
const taskCtrl = require('../controllers/taskCtrl');
const authCtrl = require('../controllers/authCtrl');

router.use(authCtrl.protect);

router.get('/:projectId', projectCtrl.getAProject);
router.route('/').get(projectCtrl.getProjects).post(projectCtrl.createProject);

// Task Routes
router.get(
	'/:projectId/tasks/:taskId',
	taskCtrl.isMyProject,
	taskCtrl.findTask
);

router
	.route('/:projectId/tasks')
	.post(taskCtrl.isMyProject, taskCtrl.create)
	.delete(taskCtrl.isMyProject, taskCtrl.delete)
	.patch(taskCtrl.isMyProject, taskCtrl.update);

module.exports = router;
