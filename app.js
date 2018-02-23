/*
 *
 *  Stitchfox Redirector: This service bridges typeform->cin7->chargebee.
 *  See README for more detailed information
 *
 */

const dotenv = require("dotenv");
dotenv.config( {
    path: '/home/dev/redirect_node/current/config/config.env'
} );
const bodyparser = require("body-parser");
const express = require("express");
const https = require("https");
const fs = require("fs");
const logger = require("./libs/lib_logger");

/*
 *  initialize routes
 */
const sub_hook = require("./routes/sub_hook");
const profile_hook = require("./routes/profile_hook");

const app = express();
const ssl_path = process.env.SSL_PATH;
const key = process.env.SSL_KEY;
const cert = process.env.SSL_CERT;
const options = {
    key: fs.readFileSync( ssl_path + key ),
    cert: fs.readFileSync( ssl_path + cert )
};
const server = https.createServer( options, app );

app.use( bodyparser.json() );
app.use( bodyparser.urlencoded( {
    extended: true
} ) );

/*
 *  map endpoints to route files
 */
app.use( '/sub_hook', sub_hook );
app.use( '/profile_hook', profile_hook );

/*
 * App level error handlers
 */

// development error handler
// will print stacktrace
if ( process.env.ENVIRONMENT == 'dev' ) {
  app.use( function ( err, req, res, next ) {
    res.status( err.status || 500 );
    logger.error( 'ERROR: ' + err + 'MESSAGE: ' + err.message );
  } );
}

// production error handler
// no stacktraces leaked to user
app.use( function ( err, req, res, next ) {
  logger.error( 'Error: ' + err.message + '. Status: ' + err.status );
} );

/*
 *  start the engine
 */
server.listen( 443, () => {
  logger.info( 'Server started and listening' );
} );
