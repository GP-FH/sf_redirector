const express = require("express");
const router = express.Router();
const passport = require('passport');
const Strategy = require('passport-local').Strategy;
const db = require("../libs/lib_db");
const logger = require("../libs/lib_logger");

passport.use(new Strategy((username, password, cb) => {
  logger.info("we getting to the passport method!");
  db.find_user_by_name(username, (err, ret) => {
    if (err) { return cb(err); }
    if (!ret.user) { return cb(null, false); }
    if (ret.user.password != password) { return cb(null, false); }
    return cb(null, ret.user);
  });
}));

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
