const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
	{
		name: {
			required: [true, 'Please tell us you name'],
			type: String,
			minlength: 3,
			maxlength: 30,
			trim: true,
		},
		email: {
			required: [true, 'Email is required'],
			type: String,
			unique: true,
			lowercase: true,
			validate(value) {
				if (!validator.isEmail(value)) {
					throw new Error('Invalid email');
				}
			},
		},
		password: {
			required: [true, 'Password is required'],
			type: String,
			minlength: 8,
			select: false,
		},
		passwordConfirm: {
			required: [true, 'Please confirm your password'],
			type: String,
			select: false,
			validate: {
				validator: function (val) {
					return val === this.password;
				},
				message: "Passwords aren't the same",
			},
		},
		projects: [
			{
				type: mongoose.Schema.ObjectId,
				ref: 'Task',
			},
		],
		passwordChangedAt: Date,
		passwordResetToken: String,
		passwordResetExpires: Date,
		active: {
			type: Boolean,
			default: true,
			select: false,
		},
	},
	{
		timestamps: true,
	}
);

userSchema.methods.correctPassword = async (password, userPassword) => {
	return await bcrypt.compare(password, userPassword);
};

userSchema.methods.changedPasswordAfter = (JWTTimeStamps) => {
	if (this.passwordChangedAt) {
		const changedTimeStamps = parseInt(this.passwordChangedAt.getTime()) / 1000;

		return JWTTimeStamps < changedTimeStamps;
	}
	return false;
};

userSchema.methods.createPasswordResetToken = function () {
	const resetToken = crypto.randomBytes(32).toString('hex');

	this.passwordResetToken = crypto
		.createHash('sha256')
		.update(resetToken)
		.digest('hex');

	this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
	console.log(resetToken);

	return resetToken;
};

userSchema.pre(/^find/, function (next) {
	this.find({ active: true });
	next();
});

userSchema.pre('save', async function (next) {
	if (!this.isModified('password') || this.isNew) return next();
	this.passwordChangedAt = Date.now() - 1000;
	next();
});

userSchema.pre('save', async function (next) {
	if (this.isModified('password')) {
		this.password = await bcrypt.hash(this.password, 12);
		this.passwordConfirm = undefined;
	}
	next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;
