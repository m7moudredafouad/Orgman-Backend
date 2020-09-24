// Import dependancies
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');

// Import My dependancies
const AppError = require('./src/utils/AppError');
const errorHandler = require('./src/utils/errorHandler');

// Fire The app
const app = express();

// App Configuration
require('dotenv').config();
require('./src/db/connect');
app.set('env', 'development'); // production
app.set('view cache', false); // Set to true in production
app.set('x-powered-by', false);
app.set('trust proxy', true);
app.set('views', path.join(__dirname), 'src', 'templates', 'views');
app.set('port', process.env.PORT || 5000);

// Use Midlewares
app.use(function (req, res, next) {
	res.header('Access-Control-Allow-Origin', process.env.ALLOW_WEBSITE); // update to match the domain you will make the request from
	res.header(
		'Access-Control-Allow-Headers',
		'Origin, X-Requested-With, Content-Type, Accept, Authorization'
	);
	res.header(
		'Access-Control-Allow-Methods',
		'GET, POST, DELETE, PATCH, OPTIONS'
	);
	next();
});
// app.use(express.static(path.join(__dirname, 'public')));
app.use(helmet());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(xss());
app.use(mongoSanitize());

// Import routes
const projectRoute = require('./src/routes/projectRoute');
// const taskRoute = require('./src/routes/taskRoute');
const userRoutes = require('./src/routes/userRoutes');

// Your routes here
app.get('/', (req, res) => {
	if (process.env.NODE_ENV == 'development') {
		res.status(200).json({
			success: true,
			message: 'App is running Yaaaaye 🔥',
			url: req.originalUrl,
			path: req.route.path,
			host: req.hostname,
			fresh: req.fresh,
			method: req.method,
			protocol: req.protocol,
			secure: req.secure,
			ip: req.ip,
			ips: req.ips,
		});
	} else {
		res.status(200).send('Welcome to promanapi');
	}
});
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/projects', projectRoute);
// app.use('/api/v1/projects/:projectId/tasks', taskRoute);
// app.use('/api/v1/tasks', taskRoute);

// Error Handling
app.use((req, __, next) => {
	next(new AppError('Page Not found', 404, 'Getting ' + req.originalUrl));
});

app.use(errorHandler);

process
	.on('unhandledRejection', (err, p) => {
		console.error(err, 'Unhandled Rejection at Promise', p);
	})
	.on('uncaughtException', (err) => {
		console.error(err, 'Uncaught Exception thrown');
		process.exit(1);
	});

// App running
const server = app.listen(app.get('port'), () => {
	console.log('Server is running on http://localhost:' + app.get('port'));
});
