const Task = require('../models/task');
const User = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const mongoose = require('mongoose');

// Get All The Projects
exports.getProjects = catchAsync(async (req, res, next) => {
	const tasks = await Task.find(
		{ _id: { $in: [...req.user.projects] }, prevNodes: 0 },
		{ subTasks: 0 }
	);

	res.status(200).json({
		success: true,
		tasks,
	});
});

exports.getAProject = catchAsync(async (req, res, next) => {
	const projectId = req.params.projectId;

	if (!req.user.projects.includes(projectId)) {
		return next(new AppError('Not Authorized', 401, 'Project Finding'));
	}

	const project = await Task.findOne({
		_id: projectId,
		prevNodes: 0,
	}).populate({
		path: 'subTasks',
		select: 'title done',
	});

	if (!project) {
		return next(new AppError('Project not found', 404, 'Project Finding'));
	}

	res.status(200).json({
		success: true,
		task: project,
	});
});

// Project Creation
exports.createProject = catchAsync(async (req, res, next) => {
	const { title, done } = req.body;

	if (!title)
		return next(new AppError('Title is required', 400, 'Creating Project'));

	const newTask = await Task.create({
		title: title,
		done: !!done,
	});

	await User.findByIdAndUpdate(req.user._id, {
		$push: { projects: newTask._id },
	});

	res.status(201).json({
		success: true,
		task: newTask,
	});
});
