const dotenv = require("dotenv");
dotenv.config();
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
// Load User model
const User = require('../models/User');
const {forwardAuthenticated} = require('../config/auth');

// Login Page
router.get('/login', forwardAuthenticated, (req, res) => res.render('login'));

// Register Page
router.get('/register', forwardAuthenticated, (req, res) => res.render('register'));

// Register
router.post('/register', (req, res) => {
	const {name, phone, blood_group, location, password, password2} = req.body;
	let errors = [];

	if (!name || !phone || !password || !blood_group || !location || !password2) {
		errors.push({msg: 'Please enter all fields'});
	}

	if (password != password2) {
		errors.push({msg: 'Passwords do not match'});
	}

	if (password.length < 6) {
		errors.push({msg: 'Password must be at least 6 characters'});
	}

	if (errors.length > 0) {
		res.render('register', {
			errors,
			name,
			phone,
			blood_group,
			location,
			password,
			password2
		});
	} else {
		User.findOne({phone: phone}).then(user => {
			if (user) {
				errors.push({msg: 'phone already exists'});
				res.render('register', {
					errors,
					name,
					phone,
					blood_group,
					location,
					password,
					password2
				});
			} else {
				const newUser = new User({
					name,
					phone,
					blood_group,
					location,
					password,
					password2
				});

				bcrypt.genSalt(10, (err, salt) => {
					bcrypt.hash(newUser.password, salt, (err, hash) => {
						if (err) throw err;
						newUser.password = hash;
						newUser
								.save()
								.then(user => {
									req.flash(
											'success_msg',
											'You are now registered and can log in'
									);
									res.redirect('/users/login');
								})
								.catch(err => console.log(err));
					});
				});
			}
		});
	}
});

// Login
router.post('/login', (req, res, next) => {
	passport.authenticate('local', {
		successRedirect: '/dashboard',
		failureRedirect: '/users/login',
		failureFlash: true
	})(req, res, next);
});

// Logout
router.get('/logout', (req, res) => {
	req.logout();
	req.flash('success_msg', 'You are logged out');
	res.redirect('/users/login');
});

// Donors by location
router.get('/getByLocation/:location', async (req, res) => {
	const donors = await User.find({location: req.params.location}).select({password: 0}).exec()
	res.json(donors)
});
// Donors by blood group
router.get('/getByBloodGroup/:bloodGroup', async (req, res) => {
	const donors = await User.find({blood_group: req.params.bloodGroup}).select({password: 0}).exec()
	res.json(donors)
});

module.exports = router;
