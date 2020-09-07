const fs = require('fs');
const path = require('path');

let date = new Date();
let dirname = path.join('log', date.toLocaleDateString().split('/').join('_'));
let filename = path.join(dirname, date.getUTCHours() + '.log');

const appendLogger = (data) => {
    fs.appendFile(filename, data, (err) => {
        if (err) return console.log('Error: writing logger', err)
    })
}

const writetoLog = (data) => {
    fs.exists(dirname, (exists) => {
        if (exists) { return appendLogger(data) }
    
        fs.mkdir(dirname, (err) => {
            if (err) return console.log(err)
            appendLogger(data)
        })
    })
}

module.exports = writetoLog;