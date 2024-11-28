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
router.get('/api/user', UserCon.getUserData);
router.get('/api/cases', UserCon.getCases);

router.get('/admin-dashboard', UserCon.admin_dashboard);
router.get('/admin-users', UserCon.admin_users);
router.get('/admin-upload', UserCon.admin_upload);
router.get('/admin-notification', UserCon.admin_notification);
router.get('/admin-trash', UserCon.admin_trash);
router.get('/admin-logs', UserCon.admin_logs);

router.get('/settings', UserCon.settings);
router.get('/edit_profile', UserCon.edit_profile);
router.post('/api/updateProfile', UserCon.updateProfile);

router.get('/user_home', UserCon.user_home);
router.get('/download/:filename', UserCon.downloadFile);

router.get('/user_upload', UserCon.user_upload);
router.get('/user_notifications', UserCon.user_notifications);
router.post('/saveUpload', UserCon.saveUpload);

router.get('/help_support', UserCon.helpSupp);
router.post('/help_support', UserCon.submitInquiry);
router.get('/about_us', UserCon.about_us);

router.get('/admin-addcase', UserCon.admin_addcase_page);
router.post('/admin-addcase', UserCon.admin_addcase);

module.exports = router;
