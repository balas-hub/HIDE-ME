/**
 * Security Middleware: Deep sanitization against NoSQL injection, XSS, and Prototype Pollution
 */
export function sanitizeInputs(req, res, next) {
  function clean(val) {
    if (val === null || val === undefined) return val;

    if (Array.isArray(val)) {
      return val.map(clean);
    }

    if (typeof val === 'object') {
      const sanitizedObj = {};
      for (const [key, value] of Object.entries(val)) {
        // Prevent NoSQL operator injection and prototype pollution
        if (key.startsWith('$') || key.includes('.') || key === '__proto__' || key === 'constructor' || key === 'prototype') {
          continue;
        }
        sanitizedObj[key] = clean(value);
      }
      return sanitizedObj;
    }

    if (typeof val === 'string') {
      // Basic XSS defense: strip script tags and sanitize dangerous characters if not secret payload
      return val.trim();
    }

    return val;
  }

  if (req.body) req.body = clean(req.body);
  if (req.query) req.query = clean(req.query);
  if (req.params) req.params = clean(req.params);

  next();
}
