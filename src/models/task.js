const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  prevNodes: {
    type: Number,
    default: 0
  },
  done: {
    type: Boolean,
    default: false
  },
  subTasks: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Task'
    }
  ]
})

taskSchema.virtual('hasSubTasks').get(function() {
  return this.subTasks.length > 0;
})

// taskSchema.virtual('parentTask', {
//   ref: 'Task',
//   localField: 'subTasks',
//   foreignField: '_id',
// })

const Task = new mongoose.model('Task', taskSchema)
module.exports = Task