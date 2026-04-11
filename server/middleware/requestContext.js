const { randomUUID } = require("crypto");

const REQUEST_ID_HEADER = "x-request-id";

const attachRequestContext = (req, res, next) => {
  const incomingRequestId = req.get(REQUEST_ID_HEADER);
  const requestId = incomingRequestId || randomUUID();

  req.requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);
  next();
};

module.exports = {
  REQUEST_ID_HEADER,
  attachRequestContext
};