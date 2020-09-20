const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
	{
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
		},
		done: {
			type: Boolean,
			default: false,
		},
		project: {
			type: mongoose.Schema.ObjectId,
			ref: 'Task',
		},
		subTasks: [
			{
				type: mongoose.Schema.ObjectId,
				ref: 'Task',
			},
		],
	},
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

taskSchema.virtual('hasSubTasks').get(function () {
	return this.subTasks && this.subTasks.length > 0;
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
