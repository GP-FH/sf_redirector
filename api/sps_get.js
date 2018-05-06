const express = require("express");
const router = express.Router();
const logger = require("../libs/lib_logger");
const sps = require("../libs/lib_shipped_product_search");

router.route('/').get(async (req,res) => {
  logger.info(`Received by /sbs_get: ${req.query.email}`);
  const ret = await sps.sps_get(req.query.email);
  logger.info(JSON.stringify(`returned to sps_get: ${ret}`));
  res.send(ret.products);
});

// error handling for the sub route
router.use( ( err, req, res, next ) => {
  res.end();
  logger.error( JSON.stringify( err ) );
} );

module.exports = router;
