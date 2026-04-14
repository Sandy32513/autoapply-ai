/**
 * Global error handler middleware.
 * Must have 4 arguments to be recognized by Express as error handler.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size exceeds 5MB limit',
      });
    }
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  const stack = process.env.NODE_ENV === 'development' ? err.stack : undefined;

  console.error(`[Error] ${status} - ${message}`);
  if (stack) console.error(stack);

  res.status(status).json({
    success: false,
    error: message,
    ...(stack && { stack }),
  });
};

module.exports = { errorHandler };