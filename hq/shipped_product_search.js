const express = require("express");
const router = express.Router();

router.route('/').get( async (req,res) => {
  res.status(200).send("shipped_product_search");
});

// error handling for the sub route
router.use( ( err, req, res, next ) => {
  res.end();
  logger.error( JSON.stringify( err ) );
} );

module.exports = router;
