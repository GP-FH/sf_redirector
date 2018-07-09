const express = require("express");
const router = express.Router();
const logger = require("../libs/lib_logger");
const connect = require('connect-ensure-login');

router.route('/').get(connect.ensureLoggedIn('/hq/login'), async (req,res) => {
  res.render('product_search', { csrfToken: req.csrfToken() });
});

router.route('/').post(async (req, res) => {
  logger.info(`We received something!!! ${JSON.stringify(req.body, null, 4)}`);
});

// error handling for the sub route
router.use( ( err, req, res, next ) => {
  res.end();
  logger.error( JSON.stringify( err ) );
} );

module.exports = router;
