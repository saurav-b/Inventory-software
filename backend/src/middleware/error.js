import { fail } from '../lib/http.js';

export function notFound(req, res) {
  return fail(res, 404, `Route not found: ${req.method} ${req.path}`);
}

export function errorHandler(err, req, res, next) {
  // eslint-disable-line no-unused-vars
  console.error(err);
  return fail(res, 500, 'Server error');
}

