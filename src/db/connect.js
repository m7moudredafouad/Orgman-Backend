const mongoose = require("mongoose");
const writeToLog = require('./../utils/writeToLog')

mongoose.connect(process.env.MONGODB_URL, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useFindAndModify: false,
}).then().catch(err => {
  console.log('Mongodb Connection Error', err)
  writeToLog('Mongodb Connection Error\n' + err + '\r\n\n');
})