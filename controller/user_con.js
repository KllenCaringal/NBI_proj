const User = require('../models/user_info');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const emailService = require('../services/email_service.js');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads'); 
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Use the original filename
    }
});
const upload = multer({ storage: storage }).single('profile_pic');

const uploadFileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Use the original filename
    }
});
const fileUpload = multer({ storage: uploadFileStorage }).single('upload_file');

const adminCaseStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/admin_cases');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Use the original filename
    }
});
const adminCaseUpload = multer({ storage: adminCaseStorage }).single('file');

const users = {
    registerPage: (req, res) => {
        res.render('register', { successMessage: null });
    },

    registerUser: (req, res) => {
        upload(req, res, (err) => {
            if (err) {
                console.error('Error uploading file:', err);
                return res.status(500).send('Error uploading file.');
            }
    
            // Extract form data
            const { user_id, firstname, lastname, age, gender, contact_num, email, sitio, barangay, province, roles, password } = req.body;
            const verificationToken = crypto.randomBytes(32).toString('hex');
            const verified = 0;
            const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
            
            // Define profilePicPath within the scope of upload function
            const profilePicPath = req.file ? '/images/' + req.file.filename : null;
    
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
                        sitio, barangay, province, roles, verificationToken, verified, tokenExpiry, hashedPassword, profilePicPath
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
        });
    },

    loginPage: (req, res) => {
        res.render('login');
    },

    loginUser: (req, res) => {
        const { user_id, password } = req.body;

        User.findByUserId(user_id, (err, user) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).send('Server error.');
            }

            if (!user) {
                return res.status(400).send('Invalid user ID.');
            }

            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) {
                    console.error('Error comparing passwords:', err);
                    return res.status(500).send('Server error.');
                }

                if (!isMatch) {
                    return res.status(400).send('Incorrect password.');
                }

                req.session.user = { 
                    user_id: user.user_id, 
                    role: user.roles, 
                    firstname: user.firstname, 
                    lastname: user.lastname 
                };

                User.logUserLogin({
                    user_id: req.session.user.user_id,
                    role: req.session.user.role,
                    firstname: req.session.user.firstname,
                    lastname: req.session.user.lastname
                }, (err) => {
                    if (err) {
                        console.error('Error logging login:', err);
                        return res.status(500).send('Server error logging login.');
                    }

                    if (user.roles === 'admin') {
                        res.redirect('/admin-dashboard');
                    } else if (user.roles === 'user') {
                        res.redirect('/user_home');
                    } else {
                        console.error('Role mismatch: Invalid role:', user.roles);
                        res.status(400).send('Invalid role.');
                    }
                });
            });
        });
    },

    logoutUser: (req, res) => {
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

    downloadFile: (req, res) => {
        const filename = req.params.filename;
        const sanitizedFilename = path.basename(filename);
        const filePath = path.join(__dirname, '..', 'public', 'uploads', sanitizedFilename);
        console.log('Attempting to access file:', filePath);

        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                console.error("File not found:", err);
                return res.status(404).send('File not found');
            }
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error("Error getting file stats:", err);
                    return res.status(500).send('Error accessing file');
                }
                res.setHeader('Content-Length', stats.size);
                res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFilename}"`);

                const fileStream = fs.createReadStream(filePath);

                fileStream.on('error', (err) => {
                    console.error("Error streaming file:", err);
                    if (!res.headersSent) {
                        res.status(500).send('Error downloading file');
                    }
                });

                fileStream.pipe(res);
            });
        });
    },

    downloadFile: (req, res) => {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, '..', 'public', 'admin_cases', filename);

        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                console.error("File not found:", err);
                return res.status(404).send('File not found');
            }

            res.download(filePath, filename, (err) => {
                if (err) {
                    console.error("Error downloading file:", err);
                    res.status(500).send('Error downloading file');
                }
            });
        });
    },

    user_page: (req, res) => {
        res.render('user_page', { user: req.session.user });
    },
    
    admin_dashboard: (req, res) => {
        res.render('admin_dashboard');
    },

    admin_users: (req, res) => {
        User.getAllUsers((err, users) => {
          if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).send('Server error');
          }
          res.render('admin_users', { users });
        });
      },

      admin_upload: (req, res) => {
        User.getAllUploads((err, uploads) => {
            if (err) {
                return res.status(500).send('Error retrieving uploads');
            }
            // Process the file paths to ensure they're correct
            const processedUploads = uploads.map(upload => ({
                ...upload,
                // Remove the leading slash if it exists
                file_path: upload.file_path ? upload.file_path.replace(/^\/uploads\//, '') : null
            }));
            res.render('admin_upload', { uploads: processedUploads });
        });
    },

    admin_notification: (req, res) => {
        res.render('admin_notification');
    },

    admin_trash: (req, res) => {
        res.render('admin_trash');
    },

    user_home: (req, res) => {
        if (!req.session.user) {
            return res.redirect('/login');
        }
    
        User.getUserCases(req.session.user.user_id, (err, cases) => {
            if (err) {
                console.error('Error fetching user cases:', err);
                return res.status(500).send('Error fetching cases');
            }
            
            const processedCases = cases.map(caseItem => {
                const result = {
                    ...caseItem,
                    file_name: caseItem.file_path ? path.basename(caseItem.file_path) : null
                };
    
                // Try to read file contents if file exists
                if (caseItem.file_path) {
                    try {
                        const filePath = path.join(__dirname, '..', 'public', caseItem.file_path);
                        const fileContent = fs.readFileSync(filePath, 'utf8');
                        result.fileContent = fileContent;
                    } catch (error) {
                        console.error(`Error reading file ${caseItem.file_path}:`, error);
                        result.fileContent = null;
                    }
                }
    
                return result;
            });
    
            res.render('user_home', { cases: processedCases });
        });
    },
    
    user_upload: (req, res) => {
        res.render('user_upload', { successMessage: null });
    },

     saveUpload: (req, res) => {
        fileUpload(req, res, (err) => {
            if (err) {
                console.error('Error uploading file:', err);
                return res.status(500).send('Error uploading file.');
            }

            const { user_id, case_title, concern, date_sent, date_of_need} = req.body;
            const filePath = req.file ? '/uploads/' + req.file.originalname : null; // Use originalname

            const uploadData = [
               user_id, case_title, concern, date_sent, date_of_need, filePath
            ];

            User.addUpload(uploadData, (err, results) => {
                if (err) {
                    console.error('Error saving upload:', err);
                    return res.status(500).send('Error saving upload.');
                }
                res.render('user_upload', { successMessage: 'File uploaded successfully!' });
            });
        });
    },

    user_notifications: (req, res) => {
        res.render('user_notifications');
    },

    admin_logs: async (req, res) => {
        try {
            const logs = await User.getLogs();
            res.render('admin_logs', { logs });
        } catch (error) {
            console.error('Error fetching logs:', error);
            res.status(500).send('An error occurred while fetching logs.');
        }
    },

    profile: (req, res) => {
        if (!req.session.user) {
            console.log('User not logged in, redirecting to login');
            return res.redirect('/login');
        }
        res.render('profile');
    },

    getUserData: (req, res) => {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const userId = req.session.user.user_id;

        User.findByUserId(userId, (err, user) => {
            if (err) {
                console.error('Error fetching user data:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json(user);
        });
    },

    getCases: (req, res) => {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const userId = req.session.user.user_id;
        const userRole = req.session.user.roles;

        if (userRole === 'admin') {
            User.getAllUploads((err, cases) => {
                if (err) {
                    console.error('Error fetching all cases:', err);
                    return res.status(500).json({ error: 'Internal Server Error' });
                }
                res.json(cases);
            });
        } else {
            User.getUserUploads(userId, (err, cases) => {
                if (err) {
                    console.error('Error fetching user cases:', err);
                    return res.status(500).json({ error: 'Internal Server Error' });
                }
                res.json(cases);
            });
        }
    },

    settings: (req, res) => {
        res.render('settings');
    },

    updateProfile: (req, res) => {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
    
        const userId = req.session.user.user_id;
        const updatedData = {
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            gender: req.body.gender,
            contact_num: req.body.contact,
            sitio: req.body.sitio,
            barangay: req.body.barangay,
            province: req.body.province
        };
    
        User.updateProfile(userId, updatedData, (err, result) => {
            if (err) {
                console.error('Error updating profile:', err);
                return res.status(500).json({ error: 'Error updating profile' });
            }
            res.json({ message: 'Profile updated successfully' });
        });
    },

    edit_profile: (req, res) => {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        User.findByUserId(req.session.user.user_id, (err, user) => {
            if (err) {
                console.error('Error fetching user data:', err);
                return res.status(500).send('Server error');
            }
            if (!user) {
                return res.status(404).send('User not found');
            }
            res.render('edit_profile', { user: user });
        });
    },

    helpSupp: (req, res) => {
        res.render('helpSupp');
    },

    submitInquiry: (req, res) => {
        const { user_id, firstname, lastname, email, inquiry_type, reference, message } = req.body;
        const reportData = {
            user_id,
            firstname,
            lastname,
            email,
            inquiry_type,
            reference: reference || null,
            message,
        };
    
        User.addReport(reportData, (err, results) => {
            if (err) {
                console.error("Error inserting inquiry into reports table:", err);
                return res.status(500).send('An error occurred while submitting your inquiry.');
            }
            res.redirect('/help_support');
        });
    },
    
    about_us:(req, res) => {
        res.render('about_us');
    },

    admin_addcase_page: (req, res) => {
        User.getAllUsers((err, users) => {
            if (err) {
                console.error('Error fetching users:', err);
                return res.status(500).send('Server error');
            }
            res.render('admin_addcase', { users });
        });
    },

    admin_addcase: (req, res) => {
        adminCaseUpload(req, res, (err) => {
            if (err) {
                console.error('Error uploading file:', err);
                return res.status(500).send('Error uploading file.');
            }

            const { title, user_id, description } = req.body;
            const filePath = req.file ? '/admin_cases/' + req.file.originalname : null; // Use originalname

            const caseData = {
                title,
                user_id,
                description,
                file_path: filePath,
                created_at: new Date()
            };

            User.addAdminCase(caseData, (err, result) => {
                if (err) {
                    console.error('Error adding case:', err);
                    return res.status(500).send('Error adding case.');
                }
                res.redirect('/admin-addcase');
            });
        });
    },

};

module.exports = users;
