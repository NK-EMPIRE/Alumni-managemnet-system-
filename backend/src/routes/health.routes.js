const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../constants');

const router = Router();
router.use(authenticate);

// Placeholder — Feature 2 will fill these in
router.get('/db-summary', authorize(ROLES.ADMIN), (req, res) => {
  res.json({ success: false, message: 'Health feature not yet implemented' });
});

router.get('/db-detail', authorize(ROLES.ADMIN), (req, res) => {
  res.json({ success: false, message: 'Health feature not yet implemented' });
});

router.post('/notify', authorize(ROLES.ADMIN), (req, res) => {
  res.json({ success: false, message: 'Health feature not yet implemented' });
});

module.exports = router;
