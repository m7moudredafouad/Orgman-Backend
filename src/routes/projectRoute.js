const express = require('express');
const router = express.Router();
const projectCtrl = require('../controllers/projectCtrl');

router.route('/').get(projectCtrl.getProjects).post(projectCtrl.createProject);

module.exports = router;
