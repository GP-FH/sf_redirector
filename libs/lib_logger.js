/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 *  lib_logger: this is the logging service. Allows logs of differing severity levels (info, warn, error)
 *  to be sent to paper trail for viewing/searching through. Also gracefully logs and handles exceptions
 *  without killing the service.
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

const winston = require("winston");
const papertrail = require("winston-papertrail").Papertrail;
const os = require("os");
require('winston-loggly-bulk');

const winstonPapertrail = new winston.transports.Papertrail( {
  host: 'logs5.papertrailapp.com',
  port: 41600,
  handleExceptions: true,
  humanReadableUnhandledException: true,
  logFormat: function ( level, message ) {
    return '<<<' + level + '>>> ' + message;
  }
} );

const role = process.env.ROLE;
const hostname = os.hostname();



const logger = new winston.Logger( {
  transports: [
    winstonPapertrail,
    new winston.transports.Console() 
  ],
  exitOnError: false
} );

logger.add(winston.transports.Loggly, {
  inputToken: "7dd23f3c-e8d0-4c86-a916-dad068e42b9f",
  subdomain: "stitchfox",
  tags: [role, hostname],
  json:true,
  handleExceptions: true,
  humanReadableUnhandledException: true
});


module.exports = logger;
