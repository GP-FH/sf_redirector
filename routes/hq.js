const express = require("express");
const router = express.Router();

const shipped_product_search = require('../hq/shipped_product_search');

/* * * * * * * * * * * * * *
 * Put your HQ routes here
 * * * * * * * * * * * * * */
router.use('/shipped_product_search', shipped_product_search);

router.get( '/', async ( req, res, next) => {
  //render hq home
  res.status(200).send("hq_home");
} );

router.get( '/login', async ( req, res, next) => {
  // render hq_login
} );

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
