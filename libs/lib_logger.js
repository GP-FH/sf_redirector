/*
 *
 *  lib_logger: this is the logging service. Allows logs of differing severity levels (info, warn, error)
 *  to be sent to paper trail for viewing/searching through. Also gracefully logs and handles exceptions
 *  without killing the service.
 *
 */

let winston = require("winston");
let papertrail = require("winston-papertrail").Papertrail;

let winstonPapertrail = new winston.transports.Papertrail( {
  host: 'logs5.papertrailapp.com',
  port: 41600,
  handleExceptions: true,
  humanReadableUnhandledException: true,
  logFormat: function ( level, message ) {
    return '<<<' + level + '>>> ' + message;
  }
} );

let logger = new winston.Logger( {
  transports: [
    winstonPapertrail
  ],
  exitOnError: false
} );

exports.logger = logger;
