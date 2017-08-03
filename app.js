/*
 *
 *  Stitchfox Redirector: This service bridges typeform->cin7->chargebee.
 *  See README for more detailed information
 *
 */

require( 'dotenv' ).config( {
    path: '/home/dev/redirect_node/current/config/config.env'
} );
var logger = require( './libs/lib_logger.js' );
var chargebee = require( 'chargebee' );
var bodyparser = require( 'body-parser' );
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

var Bottleneck = require( 'bottleneck' );
var throttled_queue = new Bottleneck( 1, 1000, 0, Bottleneck.strategy.LEAK, true );
exports.throttled_queue = throttled_queue;

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
