const express = require("express");
const router = express.Router();
const logger = require("../libs/lib_logger");

/*
 * Add new API methods here!
 */
const sps_check = require('../api/sps_check');
const sps_get = require('../api/sps_get');

router.use('/sps_check', sps_check);
router.use('/sps_get', sps_get);

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
