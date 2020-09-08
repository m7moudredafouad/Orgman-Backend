const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
	title: {
		type: String,
		required: true,
		trim: true,
	},
	prevNodes: {
		type: Number,
		default: 0,
		min: 0,
		max: 4,
		select: false,
	},
	done: {
		type: Boolean,
		default: false,
	},
	subTasks: [
		{
			type: mongoose.Schema.ObjectId,
			ref: 'Task',
		},
	],
});

taskSchema.virtual('hasSubTasks').get(function () {
	return this.subTasks.length > 0;
});

taskSchema.post('findOneAndDelete', async function (doc, next) {
	console.log(doc);
	if (!doc) next();
	for (const id of doc.subTasks) {
		await this.model.findOneAndDelete({ _id: id });
	}
	next();
});

const Task = new mongoose.model('Task', taskSchema);
module.exports = Task;
