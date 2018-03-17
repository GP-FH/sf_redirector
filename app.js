/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 *  Stitchfox Redirector: This service bridges Typeform->TradeGecko->Chargebee->Slack->Squarespace.
 *  See README for more detailed information
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

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
 * Initialize routes
 */
const sub_hook = require("./routes/sub_hook");
const profile_hook = require("./routes/profile_hook");

/*
 * Initialize middleware
 */
const request_logger = require("./middleware/mw_request_logger").request_logger;
const token_check = require("./middleware/mw_verification_token_check").verification_token_check;

const app = express();

app.use( bodyparser.json() );
app.use( bodyparser.urlencoded( {
    extended: true
} ) );
app.use(request_logger);
app.use(token_check);

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
 * Dev environment is currently a single server and terminates SSL itself.
 * Production servers are behind a load balancer
 */
if (process.env.ENVIRONMENT != 'dev'){
  const ssl_path = process.env.SSL_PATH;
  const key = process.env.SSL_KEY;
  const cert = process.env.SSL_CERT;
  const options = {
      key: fs.readFileSync( ssl_path + key ),
      cert: fs.readFileSync( ssl_path + cert )
  };

  const server = https.createServer( options, app );

  server.listen(443, () => {
    logger.info( 'Development server started and listening' );
  } );
}else{
  app.listen(80, () => {
    logger.info( 'Production server started and listening' );
  });
}
