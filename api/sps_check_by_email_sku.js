const express = require("express");
const router = express.Router();
const logger = require("../libs/lib_logger");

router.route('/').post(async (req,res) => {
  // do something
});

// error handling for the sub route
router.use( ( err, req, res, next ) => {
  res.end();
  logger.error( JSON.stringify( err ) );
} );

module.exports = router;
