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
const os = require("os");
const bodyparser = require("body-parser");
const express = require("express");
const https = require("https");
const fs = require("fs");
const logger = require("./libs/lib_logger");
const path = require( 'path' );
const express_session = require('express-session');
const passport = require('passport');

/*
 * Initialize routes
 */
const sub_hook = require("./routes/sub_hook");
const profile_hook = require("./routes/profile_hook");
const health_check = require("./routes/health_check");
const hq = require("./routes/hq");
const api = require("./routes/api");

/*
 * Initialize Application level middleware
 */
const request_logger = require("./middleware/mw_request_logger").request_logger;

const app = express();

app.use( '/static', express.static( '/home/dev/redirect_node/current/public' ) );
app.set( 'views', '/home/dev/redirect_node/current/views');
app.set( 'view engine', 'hbs' );

app.use( bodyparser.json());
app.use( bodyparser.urlencoded( {
    extended: true
} ) );
app.use(request_logger);
app.use(express_session({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());


/*
 *  map endpoints to route files
 */
app.use("/sub_hook", sub_hook);
app.use("/profile_hook", profile_hook);
app.use("/health_check", health_check);
app.use("/hq", hq);
app.use("/api", api);

/*
 * App level error handlers
 */
app.use( function ( err, req, res, next ) {
  logger.error( 'Error: ' + err.message + '. Status: ' + err.status );
} );

/*
 * Dev environment is currently a single server and terminates SSL itself.
 * Production servers are behind a load balancer
 */
if (process.env.ENVIRONMENT == 'dev'){
  const ssl_path = process.env.SSL_PATH;
  const key = process.env.SSL_KEY;
  const cert = process.env.SSL_CERT;
  const options = {
      key: fs.readFileSync( ssl_path + key ),
      cert: fs.readFileSync( ssl_path + cert )
  };

  const server = https.createServer( options, app );

  server.listen(443, () => {
    logger.info(`${os.hostname()} started and listening`);
  } );
}else{
  app.listen(80, () => {
    logger.info(`${os.hostname()} started and listening`);
    console.log(`${os.hostname()} started and listening`);
  });
}
