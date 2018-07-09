const express = require("express");
const router = express.Router();
const logger = require("../libs/lib_logger");
const connect = require('connect-ensure-login');

router.route('/').get(connect.ensureLoggedIn('/hq/login'), async (req,res) => {
  res.render('product_search', {csrfToken: req.csrfToken()});
});

router.route('/').post(async (req, res) => {
  const test_obj = [
    {sku:'BAB-DDD-AAA', brand:'Nature baby', name:'T-Shirt', colour:'red', size:'0m3'},
    {sku:'BAB-DDD-AAA', brand:'Nature baby', name:'T-Shirt', colour:'red', size:'0m3'},
    {sku:'BAB-DDD-AAA', brand:'Nature baby', name:'T-Shirt', colour:'red', size:'0m3'},
    {sku:'BAB-DDD-AAA', brand:'Nature baby', name:'T-Shirt', colour:'red', size:'0m3'},
    {sku:'BAB-DDD-AAA', brand:'Nature baby', name:'T-Shirt', colour:'red', size:'0m3'},
    {sku:'BAB-DDD-AAA', brand:'Nature baby', name:'T-Shirt', colour:'red', size:'0m3'},
    {sku:'BAB-DDD-AAA', brand:'Nature baby', name:'T-Shirt', colour:'red', size:'0m3'},
    {sku:'BAB-DDD-AAA', brand:'Nature baby', name:'T-Shirt', colour:'red', size:'0m3'},
    {sku:'BAB-DDD-AAA', brand:'Nature baby', name:'T-Shirt', colour:'red', size:'0m3'},
    {sku:'BAB-DDD-AAA', brand:'Nature baby', name:'T-Shirt', colour:'red', size:'0m3'}
  ];
  // make lib calls the redirect back to page with payload
  res.redirect('/hq/stylist_home', {results:test_obj});
});

// error handling for the sub route
router.use( ( err, req, res, next ) => {
  res.end();
  logger.error( JSON.stringify( err ) );
} );

module.exports = router;
