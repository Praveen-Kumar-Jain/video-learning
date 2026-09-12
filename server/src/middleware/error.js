export function notFound(req, res) {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} was not found` });
}

export function errorHandler(error, req, res, next) {
  console.error(error);
  if (error.name === 'ZodError') return res.status(400).json({ message: 'Validation failed', errors: error.issues });
  if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid resource identifier' });
  if (error.code === 11000) return res.status(409).json({ message: 'A record with that value already exists' });
  res.status(error.status || 500).json({ message: error.message || 'Internal server error' });
}
