/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 * mw_request_logger.js: this middleware function logs all incoming requests received
 * by the stitchfox redirector
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
const logger = require("../libs/lib_logger");

const request_logger = (req, res, next) => {
  logger.info(`INCOMING_REQUEST: Payload: ${JSON.stringify( req.query, null, 4 )}. Query String: ${req.url}. Headers: ${JSON.stringify( req.headers, null, 4 )}`
  );

  next();
};

exports.request_logger = request_logger;
