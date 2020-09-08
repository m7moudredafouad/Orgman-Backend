const Task = require('../models/task');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// Get All The Projects
exports.getProjects = catchAsync(async (req, res, next) => {
	const tasks = await Task.find({ prevNodes: 0 }, { subTasks: 0 });

	if (tasks.length <= 0)
		return next(new AppError('No tasks were found', 404, 'Getting Tasks'));

	res.status(200).json(tasks);
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

	console.log(newTask);

	res.status(201).json(newTask);
});
