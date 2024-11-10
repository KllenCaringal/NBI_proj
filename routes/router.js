const express = require('express');
const router = express.Router();
const UserCon = require('../controller/user_con'); 
const AuthCon = require('../controller/authen_con'); 

router.get('/register', UserCon.registerPage);
router.post('/register', UserCon.registerUser);
router.get('/verify/:token', UserCon.verifyEmail);

router.get('/login', UserCon.loginPage);
router.post('/login', UserCon.loginUser);
router.get('/logout', UserCon.logoutUser);

router.get('/profile', UserCon.profile);

router.get('/admin-dashboard', UserCon.admin_dashboard);
router.get('/admin-users', UserCon.admin_users);
router.get('/admin-upload', UserCon.admin_upload);
router.get('/admin-notification', UserCon.admin_notification);
router.get('/admin-activity', UserCon.admin_activity);
router.get('/admin-trash', UserCon.admin_trash);

router.get('/user_home', UserCon.user_home);
router.get('/user_message', UserCon.user_message);
router.get('/user_upload', UserCon.user_upload);
router.get('/user_settings', UserCon.user_settings);
router.get('/user_notifications', UserCon.user_notifications);
router.post('/saveUpload', UserCon.saveUpload);

module.exports = router;
