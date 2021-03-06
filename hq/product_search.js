const express = require("express");
const router = express.Router();
const logger = require("../libs/lib_logger");
const connect = require('connect-ensure-login');
const product_search = require("../libs/lib_product_search");

router.route('/').get(connect.ensureLoggedIn('/hq/login'), async (req, res) => {
  res.render('product_search', {csrfToken: req.csrfToken()});
});

router.route('/').post(async (req, res, next) => {
  try{
    let email = '' || req.body.customer_email_input;

    const args = {
      tags: req.body.style_tags_input || null,
      sizes: {
        bottom: req.body.size_select_input_bottom || null,
        top: req.body.size_select_input_top || null
      },
      email: email
    };

    const ret = await product_search.search_products(args);

    res.render('product_search', {csrfToken: req.csrfToken(), filter_results:ret, results:true});
  }catch (err){
    logger.error(JSON.stringify( err ));
    res.render('product_search', {csrfToken: req.csrfToken(), error: err.message});
  }
});

// error handling for the sub route
router.use( ( err, req, res, next ) => {
  res.end();
  logger.error( JSON.stringify( err ) );
} );

module.exports = router;
