const express = require("express");
const router = express.Router();
const logger = require("../libs/lib_logger");

/*
 * Add new API methods here!
 */
const sps_check = require('../api/sps_check');
const sps_get = require('../api/sps_get');
//const customer_store_profile = require('../api/customer_store_profile');

// router level middleware
const token_check = require("../middleware/mw_verification_token_check").internal_callback_api_check;
router.use(token_check);
router.use('/sps_check', sps_check);
router.use('/sps_get', sps_get);
//router.use('/customer_store_profile', customer_store_profile);

/*
 * handle 404
 */
router.use((req, res, next) => {
  res.status(404).send("NOT FOUND");
})

// error handling for the sub route
router.use( ( err, req, res, next ) => {
  res.end();
  logger.error( JSON.stringify( err ) );
} );

module.exports = router;
