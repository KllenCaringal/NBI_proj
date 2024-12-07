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

router.get('/admin_profile', UserCon.admin_profile);
router.get('/api/admin', UserCon.admingetUserData);
router.get('/api/admincases', UserCon.admingetCases);

router.get('/admin-dashboard', UserCon.admin_dashboard);
router.get('/admin-users', UserCon.admin_users);
router.get('/admin-upload', UserCon.admin_upload);
router.get('/admin-notification', UserCon.admin_notification);
router.get('/user-trash', UserCon.user_trash);
router.get('/admin-logs', UserCon.admin_logs);

router.get('/admin-trash', UserCon.admin_trash);
router.get('/api/admin-trash', UserCon.getAdminTrashItems);
router.post('/api/admin-trash/:id/restore', UserCon.restoreAdminTrashItem);
router.delete('/api/admin-trash/:id', UserCon.deleteAdminTrashItem);
router.delete('/api/admincases/:id', UserCon.deleteAdminCase);

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

router.get('/user-trash', UserCon.user_trash);
router.get('/api/trash', UserCon.getTrashItems);
router.post('/api/trash/:id/restore', UserCon.restoreTrashItem);
router.delete('/api/trash/:id', UserCon.deleteTrashItem);
router.delete('/api/cases/:id', UserCon.deleteCase);

router.get('/api/notifications', UserCon.getNotifications);
router.post('/api/notifications/:id/read', UserCon.markNotificationAsRead);
router.delete('/api/notifications/:id', UserCon.deleteNotification);

router.get('/api/admin-notifications', UserCon.getAdminNotifications);
router.post('/api/admin-notifications/:id/read', UserCon.markAdminNotificationAsRead);
router.delete('/api/admin-notifications/:id', UserCon.deleteAdminNotification);
module.exports = router;
