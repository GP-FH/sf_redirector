const express = require("express");
const router = express.Router();

const shipped_product_search = require('../hq/shipped_product_search');
const login = require('../hq/login');
const hq_home = require('../hq/hq_home');
const stylist_home = require('../hq/stylist_home');

/* * * * * * * * * * * * * *
 * Put your HQ routes here
 * * * * * * * * * * * * * */
router.use('/shipped_product_search', shipped_product_search);
router.use('/login', login);
router.use('/hq_home', hq_home);
router.use('/stylist_home', stylist_home);

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
