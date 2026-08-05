const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const chatController = require('../controllers/chat.controller');

const router = Router();

router.use(authenticate);

router.get('/messages', chatController.getMessages);
router.post('/messages', chatController.sendMessage);
router.delete('/messages', chatController.clearMessages);

router.get('/mention-users', chatController.getMentionUsers);
router.get('/contacts', chatController.getContacts);
router.post('/heartbeat', chatController.heartbeat);

// Legacy route compatibility
router.get('/global', (req, res, next) => { req.query.channelType = 'global'; chatController.getMessages(req, res, next); });
router.post('/global', (req, res, next) => { req.body.channelType = 'global'; chatController.sendMessage(req, res, next); });
router.get('/team', (req, res, next) => { req.query.channelType = 'team'; chatController.getMessages(req, res, next); });
router.post('/team', (req, res, next) => { req.body.channelType = 'team'; chatController.sendMessage(req, res, next); });

module.exports = router;
