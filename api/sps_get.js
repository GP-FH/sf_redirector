const express = require("express");
const router = express.Router();
const logger = require("../libs/lib_logger");

router.route('/').get(async (req,res) => {
  logger.info(`Received by /sbs_get: ${JSON.stringify(req.body)}`);
  ret = sps.sps_get(req.body.email);
  res.send(ret);
});

// error handling for the sub route
router.use( ( err, req, res, next ) => {
  res.end();
  logger.error( JSON.stringify( err ) );
} );

module.exports = router;
