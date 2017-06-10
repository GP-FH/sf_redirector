/*
 *
 *  Stitchfox Redirector: This service keeps chargebee and cin7 in check - see README for more detailed information
 *
 */

require( 'dotenv' ).config( {
  path: '/home/dev/redirect_node/current/config/config.env'
} );
var request = require( 'request' );
var logger = require( './log_service.js' );
var chargebee = require( 'chargebee' );
var bodyparser = require( 'body-parser' );
var subscription_counter = require( './subscription_counter.js' );
var slack_notifier = require( './slack_notifier.js' );
var order_manager = require( './order_manager.js' );
var app = require( 'express' )();
var https = require( 'https' );
var fs = require( 'fs' );
var ssl_path = process.env.SSL_PATH;
var key = process.env.SSL_KEY;
var cert = process.env.SSL_CERT;
var options = {
  key: fs.readFileSync( ssl_path + key ),
  cert: fs.readFileSync( ssl_path + cert )
};
var server = https.createServer( options, app );

chargebee.configure( {
  site: process.env.CHARGEBEE_SITE,
  api_key: process.env.CHARGEBEE_API_KEY
} );

exports.chargebee = chargebee;

app.use( bodyparser.json() );
app.use( bodyparser.urlencoded( {
  extended: true
} ) );

/*
 *  initialize routes
 */
var sub_hook = require( './routes/sub_hook' );
var profile_hook = require( './routes/profile_hook' );

/*
 *  map endpoints to route files
 */
app.use( '/sub_hook', sub_hook );
app.use( '/profile_hook', profile_hook );

/*
 *  start the engine
 */
server.listen( 443, function () {

  logger.info( 'Server started and listening' );

} );

module.exports = app;
