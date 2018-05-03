const express = require("express");
const router = express.Router();
const passport = require('passport');
const logger = require("../libs/lib_logger");


router.route('/').get( async (req,res) => {
  res.render('login');
});

router.route('/').post(passport.authenticate('local', { failureRedirect: '/hq/login' }), async (req,res) => {
  logger.info(`This is what is being received: ${JSON.stringify(req.body, null, 2)}`);
  res.redirect('/hq/hq_home');
});

// error handling for the sub route
router.use( ( err, req, res, next ) => {
  res.end();
  logger.error( JSON.stringify( err ) );
} );

module.exports = router;
