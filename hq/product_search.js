const express = require("express");
const router = express.Router();
const logger = require("../libs/lib_logger");
const connect = require('connect-ensure-login');
const product_search = require("../libs/lib_product_search");

router.route('/').get(connect.ensureLoggedIn('/hq/login'), async (req, res) => {
  res.render('product_search', {csrfToken: req.csrfToken()});
});

router.route('/').post(async (req, res) => {

  logger.info(`HERE IS THE FORM? ${JSON.stringify(req.body, null, 4)}`);

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
  res.render('product_search', {csrfToken: req.csrfToken(), results:test_obj});
});

// error handling for the sub route
router.use( ( err, req, res, next ) => {
  res.end();
  logger.error( JSON.stringify( err ) );
} );

module.exports = router;
