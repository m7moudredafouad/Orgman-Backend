const Task = require('../models/task');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const mongoose = require('mongoose');

/**
 *
 * @param {Task Array} tasksArray
 * @param {Number} prevNode
 */
// Create helpers
const createNewTasks = async (tasksArray, prevNode) => {
	if (!tasksArray || tasksArray.length <= 0 || prevNode > 4) return;
	let listOfTasksChilds = new Array();

	for (const task of tasksArray) {
		if (!task.title) continue;

		let newTempTask = Object.assign(
			{},
			{
				title: task.title,
				done: !!task.done,
				prevNodes: prevNode,
				subTasks: [],
			}
		);

		if (task.subTasks && task.subTasks.length > 0) {
			newTempTask.subTasks = await createNewTasks(task.subTasks, prevNode + 1);
		}

		listOfTasksChilds.push(newTempTask);
	}

	try {
		const newlyCreatedTasks = await Task.create(listOfTasksChilds);
		const newlyCreatedIds = new Array();
		newlyCreatedTasks.forEach((fullTask) => {
			newlyCreatedIds.push(fullTask._id);
		});
		console.log(newlyCreatedIds);
		return newlyCreatedIds;
	} catch (err) {
		throw new AppError('Creating SubTasks Error', 500, 'Creating SubTasks');
	}
};

const findTasksAndInsertNewTasks = async (newTasks) => {
	const keys = Object.keys(newTasks);
	let listOfNewIds = new Array();

	for (const key of keys) {
		let task = await Task.findById(key, { prevNodes: 1 });
		if (!task) continue;

		console.log(task);

		listOfNewIds = await createNewTasks(newTasks[key], task.prevNodes + 1);

		await Task.findByIdAndUpdate(key, {
			$push: { subTasks: { $each: listOfNewIds } },
		});
	}
};

// Create a task
exports.create = catchAsync(async (req, res) => {
	await findTasksAndInsertNewTasks(req.body.newTasks);
	res.status(201).json({
		success: true,
	});
});

// Task find with its childs
exports.findTask = catchAsync(async (req, res, next) => {
	const taskId = req.params.taskId;

	if (!mongoose.Types.ObjectId.isValid(taskId)) {
		return next(new AppError('Task id is not valid', 400, 'Task find'));
	}

	const task = await Task.findById(taskId).populate({
		path: 'subTasks',
		select: 'title done',
	});

	res.status(200).json({
		success: true,
		task,
	});
});

// Task Deletion
exports.delete = catchAsync(async (req, res, next) => {
	const deleteThisIds = req.body.deleteThisIds;

	if (!deleteThisIds) {
		return next(new AppError('No tasks to delete'), 400, 'Delete Tasks');
	}

	for (const id of deleteThisIds) {
		if (!mongoose.Types.ObjectId.isValid(id)) continue;
		await Task.findOneAndDelete({ _id: id });
	}

	res.status(200).json({
		success: true,
	});
});

// Task Update
const trimObjectsFromUnknownKeys = (object) => {
	const newObject = Object.assign({});
	Object.keys(object).forEach((key) => {
		newObject[key] = {
			title: object[key].title,
			done: object[key].done,
		};

		if (newObject[key].title === undefined) {
			delete newObject[key].title;
		}

		if (newObject[key].done === undefined) {
			delete newObject[key].done;
		}
	});
	return newObject;
};

exports.update = catchAsync(async (req, res) => {
	const updateThisIds = req.body.updateThisIds;

	const trimedObject = trimObjectsFromUnknownKeys(updateThisIds);
	console.log(trimedObject);

	Promise.all(
		Object.keys(trimedObject).map(async (key) => {
			return await Task.findByIdAndUpdate(key, trimedObject[key]);
		})
	);

	res.status(200).json({
		success: true,
	});
});
