export function ok(res, data) {
  return res.json({ ok: true, data });
}

export function fail(res, status, message, details) {
  return res.status(status).json({ ok: false, error: { message, details } });
}

export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

