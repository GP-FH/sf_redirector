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
    if (req.body.sub_search){
      const args = {
        sub_id: req.body.search_input
      };

      const ret = await product_search.search_products(args);

      res.render('product_search', {csrfToken: req.csrfToken(), sub_results:ret});
    }else if (req.body.filter_search){
      logger.info(`it's a filter search! ${JSON.stringify(req.body)}`);
      const args = {
        tags: req.body.style_tags_input.split(','),
        sizes: {
          bottom: req.body.size_select_input_bottom,
          top: req.body.size_select_input_top
        }
      };

      const ret = await product_search.search_products(args);

      res.render('product_search', {csrfToken: req.csrfToken(), filter_results:ret});
    }
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
