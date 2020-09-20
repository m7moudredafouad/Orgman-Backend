const User = require('../models/user');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const signToken = (id) => {
	return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7h' });
};

const sendToken = (user, statusCode, res) => {
	const token = 'Bearer ' + signToken(user._id);
	const expires = new Date(Date.now() + 7 * 60 * 60 * 1000);

	const cookieOptions = {
		expires,
		httpOnly: true,
	};

	if (process.env.NODE_ENV === 'production') {
		cookieOptions.secure = true;
	}

	res.cookie('jwt', token, cookieOptions);

	user.password = undefined;

	res.status(statusCode).json({
		success: true,
		user,
		token,
		expires: expires.getTime(),
	});
};

exports.signup = catchAsync(async (req, res, next) => {
	const user = await User.create({
		name: req.body.name,
		email: req.body.email,
		password: req.body.password,
		passwordConfirm: req.body.passwordConfirm,
	});

	if (!user) {
		return next(new AppError("Couldn't create a user", 400, 'Signup'));
	}

	sendToken(user, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
	const { email, password } = req.body;

	// Check if email and password exist
	if (!email || !password) {
		return next(
			new AppError('Please provide email and password', 400, 'Login')
		);
	}

	// Check the use with email
	const user = await User.findOne({ email }).select('+password');

	if (!user || !(await user.correctPassword(password, user.password))) {
		return next(new AppError('Invalid data', 401, 'Login'));
	}

	// Everything is right
	sendToken(user, 200, res);
});

exports.logout = (req, res) => {
	res.cookie('jwt', ' ', {
		expires: new Date(Date.now() + 10 * 1000),
		httpOnly: true,
	});

	res.status(200).json({
		status: 'success',
	});
};

exports.protect = catchAsync(async (req, res, next) => {
	let token;
	// 1-) Get the token and check if it exist
	if (req.method === 'OPTIONS') return next();

	if (
		req.header('Authorization') &&
		req.header('Authorization').startsWith('Bearer')
	) {
		token = req.header('Authorization').replace('Bearer ', '');
	}
	// else if (req.cookies.jwt && req.cookies.jwt.startsWith('Bearer')) {
	// 	token = req.cookies.jwt.replace('Bearer ', '');
	// }
	else {
		return next(
			new AppError("You aren't looged in, Please log in", 401, 'Protection')
		);
	}

	// 2-) Validate the token
	const decoded = jwt.verify(token, process.env.JWT_SECRET);

	// 3-) Check if user still exist
	const user = await User.findById(decoded.id);
	if (!user) {
		return next(
			new AppError('The token is no longer exist', 401, 'Protection')
		);
	}

	// 4-) Check if user changed the password after the token was issued
	if (user.changedPasswordAfter(decoded.iat)) {
		return next(
			new AppError(
				'Password was changed recently, Please log in again',
				401,
				'Protection'
			)
		);
	}

	req.user = user;
	next();
});

// exports.restrictTo = (...roles) => {
// 	return (req, res, next) => {
// 		// roles is an array  ['admin', 'lead-guide]

// 		if (!roles.includes(req.user.role)) {
// 			return next(new AppError("You don't have the permission", 403));
// 		}

// 		next();
// 	};
// };

// exports.forgotPassword = async (req, res, next) => {
// 	try {
// 		// 1-) Get user based on email
// 		const user = await User.findOne({ email: req.body.email });
// 		if (!user) {
// 			return next(new AppError('There is no user with email address', 404));
// 		}

// 		// 2-) Generate random reset token
// 		const resetToken = user.createPasswordResetToken();

// 		await user.save();

// 		// 3-) send it to user
// 		// sendResetPasswordEmail(req.body.email, resetToken)

// 		res.status(200).json({
// 			status: 'success',
// 			message: 'Email was sent',
// 		});
// 	} catch (err) {
// 		next(err);
// 	}
// };

// exports.resetPassword = async (req, res, next) => {
// 	try {
// 		// 1-) Get user from the token
// 		const hashedToken = crypto
// 			.createHash('sha256')
// 			.update(req.params.token)
// 			.digest('hex');
// 		const user = await User.findOne({
// 			passwordResetToken: hashedToken,
// 			passwordResetExpires: { $gt: Date.now() },
// 		});

// 		// 2-) if the token hasn't expired and there is a user, Set the new password
// 		if (!user) {
// 			return next(new AppError('Token is invalid or has expired', 400));
// 		}

// 		user.password = req.body.password;
// 		user.passwordConfirm = req.body.passwordConfirm;
// 		user.passwordResetToken = undefined;
// 		user.passwordResetExpires = undefined;

// 		await user.save();

// 		// 3-) Update ChangedPassword for the user
// 		// 4-) log the user in
// 		sendToken(user, 200, res);
// 	} catch (err) {
// 		next(err);
// 	}
// };

// exports.updatePassword = async (req, res, next) => {
// 	try {
// 		// 1-) Get the user
// 		const user = await User.findById(req.user.id).select('+password');

// 		// 2-) Check the posted password

// 		if (!(await user.correctPassword(req.body.oldPassword, user.password))) {
// 			return next(new AppError('Incorrect old password', 401));
// 		}

// 		// 3-) update the password
// 		user.password = req.body.password;
// 		user.passwordConfirm = req.body.passwordConfirm;

// 		// 4-) Login the user with the new token
// 		await user.save();
// 		sendToken(user, 200, res);
// 	} catch (err) {
// 		next(err);
// 	}
// };
