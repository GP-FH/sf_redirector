/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 *  this route handles incoming style profile information as it is submitted by new subscribers.
 *  Information is sent to Chargebee and the new subscriber is redirected to a checkout page
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

const express = require("express");
const mixpanel = require("mixpanel");
const util = require("underscore");

const product_plan =  require("../libs/lib_product_plan");
const chargebee = require("../libs/lib_chargebee");
const logger = require("../libs/lib_logger");
const db = require("../libs/lib_db");

// router level middleware
const token_check = require("../middleware/mw_verification_token_check").verification_token_check;
const router = express.Router();
router.use(token_check);

const mp = mixpanel.init( process.env.MIXPANEL_TOKEN );
const stylist_campaigns = [ 'HW-01-ATTR', 'MD-01-ATTR' ];

router.get( '/', async function (req, res, next) {
  //  trigger event in mixpanel to track user
  mp.track( process.env.MIXPANEL_EVENT, {
    distinct_id: req.query.mp_id
  } );

  //  check for stylist campaign Q param: indicates we should attribute the customer to the stylist
  const stylist_idx = stylist_campaigns.indexOf( req.query.campaign ); // TODO: move campaign stuff to dedicated lib
  let stylist_attr = '';

  if ( stylist_idx != -1 ) {
    stylist_attr = stylist_campaigns[ stylist_idx ];
  }

  /*
   *  the cf_palette and cf_keen field in chargebee cap out at 250. These fields can sometimes be longer so this
   *  is a temp fix
   */
  let palette = req.query.palette;
  let keen = req.query.keen1 || req.query.keen2 || req.query.keen3;

  //  if either of these fields is undefined - alert error. A bit heavy handed but need to enforce field mapping
  if ( !keen || !palette ) {
    logger.error( 'Error occurred on receiving style profile information - palette or keen* fields undefined' );
    res.redirect( process.env.BASE_URL + '/error' );
  }
  else {
    if ( palette.length > 250 ) {
      logger.warn( 'Had to truncate palette field string for customer: ' + req.query.email );
      palette = palette.substring( 0, 250 );
    }
    if ( keen.length > 250 ) {
      logger.warn( 'Had to truncate keen field string for customer: ' + req.query.email );
      keen = keen.substring( 0, 250 );
    }

    /*
     * One off gift boxes point to a different thank-you page post purchase (more relevant copy).
     * Here we set the redirect_url to point to the appropriate page based on the boxtype.
     */

    let redirect_url = '';
    const ret = await product_plan.product_plan_is_one_off ( req.query.boxtype );

    if ( ret.one_off ) {
      redirect_url = 'https://stitchfox.co.nz/gift-thank-you';
    }
    else {
      redirect_url = 'https://stitchfox.co.nz/thank-you';
    }

    try{
      // we store existing customer profile data for pickup post sub creation
      if (req.query.store_profile){
        const profile = await _transform_request_for_storage(req.query, keen, palette);
        await db.db_aux_store_style_profile(profile);
        res.redirect(`https://${process.env.CHARGEBEE_SITE}.chargebee.com/hosted_pages/plans/${req.query.boxtype}`);
      } else{
        let checkout = await chargebee.chargebee_request_checkout(req.query, redirect_url, stylist_attr, keen, palette);
        res.redirect( checkout.hosted_page.url );
      }
    }
    catch (err) {
      logger.error( err );
      res.redirect( process.env.BASE_URL + '/error' );
    }
  }
} );

// error handling for the sub route
router.use( ( err, req, res, next ) => {
  res.end();
  logger.error( JSON.stringify( err ) );
} );

/************************Private function **************************/

async function _transform_request_for_storage (qs, keen, palette){
  return {
    ts:new Date().getTime(),
    email: qs.email,
    archetype: 'not_yet_defined',
    gender: qs.gender,
    childname: qs.hername || qs.hisname,,
    childage: qs.sheage || qs.heage,
    topsize: qs.shetopsize || qs.hetopsize,
    bottomsize: qs.shebottomsize || qs.hebottomsize,
    jam: qs.jam1 || qs.jam2 || qs.jam3 || qs.jam4 || qs.jam5 || qs.jam6,
    doit: qs.doit1 || qs.doit2 || qs.doit3 || qs.doit4 || qs.doit5 || qs.doit6,
    palette: palette,
    fave: qs.fav1 || qs.fav2,
    keen: keen,
    something_else: qs.else,
    notes: qs.notes,
    internal_notes: 'n/a'
  };
}

module.exports = router;
