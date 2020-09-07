class AppError extends Error {
    constructor (msg, statusCode, domain) {
        super(msg);
        this.message = msg;
        this.statusCode = statusCode || 500;
        this.success = false;
        this.domain = domain || undefined;
        this.isOperational = true;

        Error.captureStackTrace(this, this.stack)
    }
}

module.exports = AppError;