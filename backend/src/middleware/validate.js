const { validationResult } = require('express-validator');
const { ValidationError } = require('./errorHandler');

function validate(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
      value: e.value
    }));

    return next(new ValidationError(formatted));
  }

  next();
}

module.exports = validate;