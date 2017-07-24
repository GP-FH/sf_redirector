/*
 *
 *  lib_logger: this is the logging service. Allows logs of differing severity levels (info, warn, error)
 *  to be sent to paper trail for viewing/searching through. Also gracefully logs and handles exceptions
 *  without killing the service.
 * 
 */

var winston = require( 'winston' );
var papertrail = require( 'winston-papertrail' ).Papertrail;

var winstonPapertrail = new winston.transports.Papertrail( {
    host: 'logs5.papertrailapp.com',
    port: 41600,
    handleExceptions: true,
    humanReadableUnhandledException: true,
    logFormat: function ( level, message ) {
        return '<<<' + level + '>>> ' + message;
    }
} );

var logger = new winston.Logger( {

    transports: [
        winstonPapertrail
    ],
    exitOnError: false

} );

module.exports = logger;