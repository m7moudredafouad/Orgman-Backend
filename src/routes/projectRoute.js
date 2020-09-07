const express = require('express');
const router = express.Router();
const taskCtrl = require('../controllers/projectCtrl')



router.get('/', taskCtrl.getProjects)
router.post('/create', taskCtrl.createProject)

module.exports = router;