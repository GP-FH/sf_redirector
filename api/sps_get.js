const express = require("express");
const router = express.Router();
const logger = require("../libs/lib_logger");
const sps = require("../libs/lib_shipped_product_search");

router.route('/').get(async (req,res) => {
  if (req.query.email == " " || req.query.email == null) return res.send({ok:true, products:false});
  logger.info(`Received: ${req.query.email}`);
  const ret = await sps.sps_get(req.query.email);

  res.send(ret);
});

// error handling for the sub route
router.use( ( err, req, res, next ) => {
  res.end();
  logger.error( JSON.stringify( err ) );
} );

module.exports = router;
