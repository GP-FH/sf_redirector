const express = require("express");
const router = express.Router();
const passport = require('passport');
const logger = require("../libs/lib_logger");


router.route('/').get( async (req,res) => {
  res.render('login');
});

router.route('/').post(passport.authenticate('local', { failureRedirect: '/hq/login' }), (req,res) => {
  logger.info(`hello`);
  res.redirect('/hq/hq_home');
});

// error handling for the sub route
router.use( ( err, req, res, next ) => {
  res.end();
  logger.error( JSON.stringify( err ) );
} );

module.exports = router;
