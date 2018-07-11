const express = require("express");
const router = express.Router();
const logger = require("../libs/lib_logger");
const connect = require('connect-ensure-login');

router.route('/').get(connect.ensureLoggedIn('/hq/login'), async (req,res) => {
  res.render('product_search', {csrfToken: req.csrfToken()});
});

router.route('/').post(async (req, res) => {
  // store query in DB with some metadata and random generated pKey. pass pKey in q param of redirect. Query DB and pass results on through.
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
  res.render('/', {results:test_obj});
});

// error handling for the sub route
router.use( ( err, req, res, next ) => {
  res.end();
  logger.error( JSON.stringify( err ) );
} );

module.exports = router;
