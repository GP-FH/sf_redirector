const express = require("express");
const router = express.Router();
const passport = require('passport');
const Strategy = require('passport-local').Strategy;
const db = require("../libs/lib_db");
const logger = require("../libs/lib_logger");
const bcrypt = require("bcrypt");
const csrf = require('csurf')

passport.use(new Strategy((username, password, cb) => {
  db.find_user_by_name(username)
    .then(async (ret) => {
      if (!ret.user) { return cb(null, false); }
      const match = await bcrypt.compare(password, ret.user.password);
      if (!match) { return cb(null, false); }

      return cb(null, ret.user);
    })
    .catch((err) => {
      return cb(err)
    });
}));

passport.serializeUser(function(user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
  db.find_user_by_id(id)
    .then((ret) => {
      cb(null, ret.user);
    })
    .catch((err) =>{
      return cb(err);
    });
});

const shipped_product_search = require('../hq/shipped_product_search');
const product_search = require('../hq/product_search');
const login = require('../hq/login');
const hq_home = require('../hq/hq_home');
const stylist_home = require('../hq/stylist_home');

router.use(csrf()); // csrf protection (adds crumb to route)

/* * * * * * * * * * * * * *
 * Put your HQ routes here
 * * * * * * * * * * * * * */
router.use('/shipped_product_search', shipped_product_search);
router.use('/product_search', product_search);
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
