const express = require('express');
const router = express.Router();

// const {
// 	getAllUsers,
// 	updateMe,
// 	deleteMe,
// 	getUser,
// 	createUser,
// 	updateUser,
// 	deleteUser,
// 	getMe,
// } = require('../controllers/authCtrl');
const {
	signup,
	login,
	logout,
	protect,
	forgotPassword,
	resetPassword,
	updatePassword,
	restrictTo,
} = require('../controllers/authCtrl');

// User Route with the new way

router.get('/logout', logout);
router.post('/signup', signup);
router.post('/login', login);
// router.post('/forgotPassword', forgotPassword);
// router.patch('/resetPassword/:token', resetPassword);

// Protect all routes after this middleware
router.use(protect);

// router.patch('/updatePassword', updatePassword);
// router.get('/me', getMe, getUser);
// router.patch('/updateMe', updateMe);
// router.delete('/deleteMe', deleteMe);

// Protect all routes after this middleware
// router.use(restrictTo('admin'));
// router.route('/').get(getAllUsers).post(createUser);
// router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
