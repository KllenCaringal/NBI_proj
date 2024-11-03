const User = require('../models/user_info');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const emailService = require('../services/email_service.js'); 

const users = {
    registerPage: (req, res) => {
        res.render('register', { successMessage: null });
    },

    registerUser: (req, res) => {
        const { user_id, firstname, lastname, age, gender, contact_num, email, sitio, barangay, province, roles, password } = req.body;

        const verificationToken = crypto.randomBytes(32).toString('hex'); 
        const verified = 0; 
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); 

        User.findByEmail(email, (err, existingUser) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).send('Database error.');
            }
            if (existingUser) {
                return res.status(400).send('User already exists.');
            }

            bcrypt.hash(password, 10, (err, hashedPassword) => {
                if (err) {
                    console.error('Error hashing password:', err);
                    return res.status(500).send('Error hashing password.');
                }

                const userData = [
                    user_id, firstname, lastname, age, gender, contact_num, email, 
                    sitio, barangay, province, roles, verificationToken, verified, tokenExpiry, hashedPassword
                ];
                
                User.create(userData, (err, results) => {
                    if (err) {
                        console.error('Error saving user to database:', err);
                        return res.status(500).send('Error saving user to database.');
                    }

                    emailService.sendVerificationEmail(email, verificationToken)
                        .then(() => {
                            res.render('register', { successMessage: 'Registration successful! Please verify your email.' });
                        })
                        .catch(emailErr => {
                            console.error('Error sending verification email:', emailErr);
                            res.status(500).send('Registration successful, but failed to send verification email.');
                        });
                });
            });
        });
    },

    loginPage: (req, res) => {
        res.render('login');
    },

    loginUser: (req, res) => {
        const { user_id, password, role } = req.body;

        // Find user by user_id and role
        User.findByUserIdAndRole(user_id, role, (err, user) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).send('Server error.');
            }

            if (!user) {
                return res.status(400).send('Invalid user ID or role.');
            }

            // Check password
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) {
                    console.error('Error comparing passwords:', err);
                    return res.status(500).send('Server error.');
                }

                if (!isMatch) {
                    return res.status(400).send('Incorrect password.');
                }

                // Save user session
                req.session.user = { 
                    user_id: user.user_id, 
                    role: user.roles, 
                    firstname: user.firstname, 
                    lastname: user.lastname 
                };

                // Log the user's login
                User.logUserLogin({
                    user_id: req.session.user.user_id,
                    role: req.session.user.role,  // Ensure the role is stored correctly
                    firstname: req.session.user.firstname,
                    lastname: req.session.user.lastname
                }, (err) => {
                    if (err) {
                        console.error('Error logging login:', err);
                        return res.status(500).send('Server error logging login.');
                    }

                    // Redirect based on role
                    if (role === 'Admin') {
                        res.redirect('/admin-dashboard');
                    } else if (role === 'User') {
                        res.redirect('/user_home');
                    } else {
                        res.status(400).send('Invalid role.');
                    }
                });
            });
        });
    },

    logoutUser: (req, res) => {
        // Log the user's logout
        if (req.session.user) {
            User.logUserLogout(req.session.user.user_id, (err) => {
                if (err) {
                    console.error('Error logging logout:', err);
                    return res.status(500).send('Error logging out. Please try again.');
                }
            });
        }

        req.session.destroy((err) => {
            if (err) {
                console.error('Error logging out:', err);
                return res.status(500).send('Error logging out. Please try again.');
            }
            res.redirect('/login');
        });
    },

    verifyEmail: (req, res) => {
        const token = req.params.token;

        User.findByVerificationToken(token, (err, user) => {
            if (err) {
                console.error('Error finding user by token:', err);
                return res.status(500).send('Server error.');
            }
            if (!user) {
                return res.status(400).send('Invalid verification token.');
            }

            if (user.token_expiry < new Date()) {
                return res.status(400).send('Verification token has expired.');
            }

            User.verifyUser(user.id, (err) => {
                if (err) {
                    console.error('Error verifying user:', err);
                    return res.status(500).send('Server error during verification.');
                }
                res.redirect('/login?verified=true');
            });
        });
    },

    // Other functions remain unchanged...
    user_page: (req, res) => {
        res.render('user_page', { user: req.session.user });
    },

    profile: (req, res) => {
        res.render('profile');
    },

    admin_dashboard: (req, res) => {
        res.render('admin_dashboard');
    },

    admin_users: (req, res) => {
        res.render('admin_users');
    },

    admin_upload: (req, res) => {
        res.render('admin_upload');
    },

    admin_notification: (req, res) => {
        res.render('admin_notification');
    },

    admin_activity: (req, res) => {
        res.render('admin_activity');
    },

    admin_trash: (req, res) => {
        res.render('admin_trash');
    },

    user_home: (req, res) => {
        res.render('user_home');
    },

    user_message: (req, res) => {
        res.render('user_message');
    },

    user_upload: (req, res) => {
        res.render('user_upload');
    },

    user_settings: (req, res) => {
        res.render('user_settings');
    },

    user_notifications: (req, res) => {
        res.render('user_notifications');
    },
};

module.exports = users;
