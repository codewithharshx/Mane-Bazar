const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  if (process.env.NODE_ENV !== "test") {
    console.error(err);
  }

  res.status(statusCode).json({
    message: err.message || "Something went wrong",
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack
  });
};

const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found: ${req.originalUrl}`));
};

module.exports = {
  errorHandler,
  notFound
};
