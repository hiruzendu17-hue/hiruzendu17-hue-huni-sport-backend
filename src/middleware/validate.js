const Joi = require('joi');

// Generic validation middleware factory
module.exports = (schema) => async (req, res, next) => {
  try {
    if (schema?.body) {
      const { error, value } = schema.body.validate(req.body, { abortEarly: false, stripUnknown: true });
      if (error) {
        return res.status(400).json({ success: false, error: error.details.map((d) => d.message).join(', ') });
      }
      req.body = value;
    }

    if (schema?.query) {
      const { error, value } = schema.query.validate(req.query, { abortEarly: false, stripUnknown: true });
      if (error) {
        return res.status(400).json({ success: false, error: error.details.map((d) => d.message).join(', ') });
      }
      req.query = value;
    }

    if (schema?.params) {
      const { error, value } = schema.params.validate(req.params, { abortEarly: false, stripUnknown: true });
      if (error) {
        return res.status(400).json({ success: false, error: error.details.map((d) => d.message).join(', ') });
      }
      req.params = value;
    }

    return next();
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Validation failed' });
  }
};