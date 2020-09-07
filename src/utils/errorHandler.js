const writetoLog = require('./writeToLog')

const errorHandler = (err, req, res, next) => {
    const status = err.statusCode || 500;
    const msg = err.message || 'Server error';

    const ErrorObj = {
        success: err.success,
        statusCode: status,
        isOperational: err.isOperational || false,
        request: req.method + " " + req.originalUrl,
        domain: err.domain || undefined,
        message: '🔥Error🔥: ' + msg,
        date: new Date().toGMTString(),
        stack: err.stack,
    }

    // Logging the error to the log.txt file
    let data = JSON.stringify(ErrorObj, null, 2) + '\r\n\n';
    writetoLog(data)

    if (process.env.NODE_ENV !== 'development') {
        delete ErrorObj.domain;
        delete ErrorObj.request;
        delete ErrorObj.isOperational;
        delete ErrorObj.stack;
        delete ErrorObj.date;
    }

    res.status(status).json(ErrorObj);
}


module.exports = errorHandler