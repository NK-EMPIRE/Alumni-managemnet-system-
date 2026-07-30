'use strict';

const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const notificationController = require('../controllers/notification.controller');

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// GET /api/v1/notifications — fetch all notifications for logged-in user
router.get('/', notificationController.getNotifications);

// POST /api/v1/notifications/:id/confirm — confirm LinkedIn match (writes to profile)
router.post('/:id/confirm', notificationController.confirmNotification);

// POST /api/v1/notifications/:id/dismiss — dismiss without profile change
router.post('/:id/dismiss', notificationController.dismissNotification);

// PATCH /api/v1/notifications/:id/read — mark as read
router.patch('/:id/read', notificationController.markRead);

module.exports = router;
