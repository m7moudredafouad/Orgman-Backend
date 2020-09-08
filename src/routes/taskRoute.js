const express = require('express');
const router = express.Router();
const taskCtrl = require('../controllers/taskCtrl');

router.get('/:taskId', taskCtrl.findTask);
router
	.route('/')
	.post(taskCtrl.create)
	.patch(taskCtrl.update)
	.delete(taskCtrl.delete);

module.exports = router;
