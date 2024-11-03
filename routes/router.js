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

router.get('/admin', UserCon.admin_page);
router.get('/user', UserCon.user_page);
router.get('/profile', UserCon.profile);

router.get('/admindashboard', UserCon.admin_dashboard);
router.get('/adminusers', UserCon.admin_users);
router.get('/adminupload', UserCon.admin_upload);
router.get('/adminnotification', UserCon.admin_notification);
router.get('/adminrecent', UserCon.admin_recent);
router.get('/admintrash', UserCon.admin_trash);


module.exports = router;
