const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const chatController = require('../controllers/chat.controller');

const router = Router();

router.use(authenticate);

router.get('/messages', chatController.getMessages);
router.post('/messages', chatController.sendMessage);

module.exports = router;
