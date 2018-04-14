const express = require("express");
const router = express.Router();

/*router.get( '/', async function ( req, res, next) {
  // render shipped product search
  res.status(200).send("shipped_product_search");
} );*/

router.route('/').get(async (req,res) => {
    res.send("shipped_product_search");
});

// error handling for the sub route
router.use( function ( err, req, res, next ) {
  res.end();
  logger.error( JSON.stringify( err ) );
} );

module.exports = router;
