const Task = require('../models/task');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const mongoose = require('mongoose');

exports.isMyProject = (req, res, next) => {
	const projectId = req.params.projectId;

	if (!req.user.projects.includes(projectId)) {
		return next(
			new AppError('You dont own this project', 401, 'I Have The Project')
		);
	}

	req.projectId = projectId;
	next();
};

/**
 *
 * @param {Task Array} tasksArray
 * @param {Number} prevNode
 */
// Create helpers
const createNewTasks = async (tasksArray, projectId, prevNode) => {
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
				project: projectId,
			}
		);

		if (task.subTasks && task.subTasks.length > 0) {
			newTempTask.subTasks = await createNewTasks(
				task.subTasks,
				projectId,
				prevNode + 1
			);
		}

		listOfTasksChilds.push(newTempTask);
	}

	try {
		const newlyCreatedTasks = await Task.create(listOfTasksChilds);
		const newlyCreatedIds = new Array();
		newlyCreatedTasks.forEach((fullTask) => {
			newlyCreatedIds.push(fullTask._id);
		});
		return newlyCreatedIds;
	} catch (err) {
		throw new AppError('Creating SubTasks Error', 500, 'Creating SubTasks');
	}
};

const findTasksAndInsertNewTasks = async (newTasks, projectId) => {
	const keys = Object.keys(newTasks);
	let listOfNewIds = new Array();

	for (const key of keys) {
		let task = await Task.findOne(
			{ _id: key, project: { $in: [projectId, null] } },
			{ prevNodes: 1 }
		);
		if (!task) continue;

		listOfNewIds = await createNewTasks(
			newTasks[key],
			projectId,
			task.prevNodes + 1
		);

		await Task.findByIdAndUpdate(key, {
			$push: { subTasks: { $each: listOfNewIds } },
		});
	}
};

// Create a task
exports.create = catchAsync(async (req, res, next) => {
	const projectId = req.projectId;

	if (!mongoose.Types.ObjectId.isValid(projectId)) {
		return next(
			new AppError('Non Valid Project id', 400, 'Find Project To Create Tasks')
		);
	}

	const project = await Task.findOne({ _id: projectId, prevNodes: 0 });

	if (!project) {
		return next(
			new AppError("Project doesn't exist", 404, 'Find Project To Create Tasks')
		);
	}

	await findTasksAndInsertNewTasks(req.body.newTasks, projectId);
	res.status(201).json({
		success: true,
	});
});

// Task find with its childs
exports.findTask = catchAsync(async (req, res, next) => {
	const taskId = req.params.taskId;

	if (!mongoose.Types.ObjectId.isValid(taskId)) {
		return next(new AppError('Task id is not valid', 400, 'Task Finding'));
	}

	const task = await Task.findOne({
		_id: taskId,
		project: req.projectId,
	}).populate({
		path: 'subTasks',
		select: 'title done',
	});

	if (!task) {
		return next(new AppError('Task not found', 404, 'Task Finding'));
	}

	res.status(200).json({
		success: true,
		task,
	});
});

// Task Deletion
exports.delete = catchAsync(async (req, res, next) => {
	const deleteThisIds = req.body.deleteThisIds;
	const projectId = req.projectId;

	if (!deleteThisIds) {
		return next(new AppError('No tasks to delete'), 400, 'Delete Tasks');
	}

	if (!mongoose.Types.ObjectId.isValid(projectId)) {
		return next(new AppError('Non Valid Project id', 400, 'Delete Tasks'));
	}

	for (const id of deleteThisIds) {
		if (!mongoose.Types.ObjectId.isValid(id)) continue;
		if (id === projectId) {
			await Task.findOneAndDelete({ _id: id });
		} else {
			await Task.findOneAndDelete({ _id: id, project: projectId });
		}
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
	const projectId = req.projectId;

	const trimedObject = trimObjectsFromUnknownKeys(updateThisIds);

	Promise.all(
		Object.keys(trimedObject).map(async (key) => {
			if (key === projectId) {
				return await Task.findByIdAndUpdate(key, trimedObject[key]);
			} else {
				return await Task.findOneAndUpdate(
					{ _id: key, project: projectId },
					trimedObject[key]
				);
			}
		})
	);

	res.status(200).json({
		success: true,
	});
});
