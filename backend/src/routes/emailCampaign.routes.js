const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const requireAutomationSecret = require('../middleware/requireAutomationSecret');
const emailController = require('../controllers/emailCampaign.controller');

const router = Router();

// 1. POST /api/v1/email-campaigns (Leader only)
router.post('/', authenticate, (req, res, next) => {
  const userRole = (req.user.role || '').toUpperCase();
  if (userRole !== 'LEADER' && userRole !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Only leaders or admins can launch email campaigns' });
  }
  next();
}, emailController.createCampaign);

// 2. GET /api/v1/email-campaigns/:id (Leader/Admin)
router.get('/:id', authenticate, emailController.getCampaignStatus);

// 3. POST /api/v1/email-campaigns/:id/log (n8n -> AMS, secret protected)
router.post('/:id/log', requireAutomationSecret, emailController.logRecipientResult);

// 4. POST /api/v1/email-campaigns/replies/ingest (n8n -> AMS, secret protected)
router.post('/replies/ingest', requireAutomationSecret, emailController.ingestReply);

// 5. GET /api/v1/email-campaigns/replies (Member/Leader/Admin)
router.get('/replies/all', authenticate, emailController.getReplies);

// 6. POST /api/v1/email-campaigns/replies/:id/review (Member/Leader)
router.post('/replies/:id/review', authenticate, emailController.reviewReply);

module.exports = router;
