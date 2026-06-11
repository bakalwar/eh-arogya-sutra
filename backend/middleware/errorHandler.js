function errorHandler(err, req, res, next) {
  console.error('[errorHandler]', err);
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    statusCode = 400;
  } else if (err.code === 11000) {
    statusCode = 409;
  } else if (err.statusCode >= 400 && err.statusCode < 600) {
    statusCode = err.statusCode;
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error'
  });
}

module.exports = { errorHandler };
