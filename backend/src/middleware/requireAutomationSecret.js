function requireAutomationSecret(req, res, next) {
  const secretHeader = req.headers['x-automation-secret'];
  const expectedSecret = process.env.N8N_SHARED_SECRET;
  
  if (!expectedSecret || !secretHeader || secretHeader !== expectedSecret) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or missing automation secret header'
    });
  }
  next();
}

module.exports = requireAutomationSecret;
