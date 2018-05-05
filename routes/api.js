const express = require("express");
const router = express.Router();
const logger = require("../libs/lib_logger");

/*
 * Add new API methods here!
 */
const sps_check_by_email_sku = require('../api/sps_check_by_email_sku');
const sps_get_by_email = require('../api/sps_get_by_email');

router.use('/sps_check_by_email_sku', sps_check_by_email_sku);
router.use('/sps_get_by_email', sps_get_by_email);

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
