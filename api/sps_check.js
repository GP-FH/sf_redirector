const express = require("express");
const router = express.Router();
const logger = require("../libs/lib_logger");
const sps = require("../libs/lib_shipped_product_search");

router.route('/').get(async (req,res) => {
  logger.info(`Received by /sbs_check: ${req.query.email} and ${req.query.sku}`);
  const ret = await sps.sps_check(req.query.email, req.query.sku);
  
  res.send(ret);
});

// error handling for the sub route
router.use( ( err, req, res, next ) => {
  res.end();
  logger.error( JSON.stringify( err ) );
} );

module.exports = router;
