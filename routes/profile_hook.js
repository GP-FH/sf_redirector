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

/*
 * Set up router level middleware
 */

const token_check = require("../middleware/mw_verification_token_check").verification_token_check;
const router = express.Router();
router.use(token_check);

const mp = mixpanel.init( process.env.MIXPANEL_TOKEN );
const stylist_campaigns = [ 'HW-01-ATTR', 'MD-01-ATTR' ];

router.get( '/', async function (req, res, next) {
  /*
   * We use Mixpanel to track users as they move throughout our site. Here we trigger
   * an event in Mixpanel to indicate that the user has submitted their user profile
   */

  mp.track( process.env.MIXPANEL_EVENT, {
    distinct_id: req.query.mp_id
  } );

  /*
   * We have influencers and guest stylists. They are given a campaign ID which they
   * should include in any links to our site. If we see a campaign ID in the Query
   * params we receive we pull it out here and make sure we pass it through to be
   * included in the customer record in CB.
   *
   * TODO: move campaign stuff to dedicated lib
   */

  const stylist_idx = stylist_campaigns.indexOf( req.query.campaign );
  let stylist_attr = '';

  if ( stylist_idx != -1 ) {
    stylist_attr = stylist_campaigns[ stylist_idx ];
  }

  /*
   * The cf_palette and cf_keen field in chargebee cap out at 250. These fields can
   * sometimes be longer so this is a temp fix which truncates them. (Not Ideal).
   */

  let palette = req.query.palette;
  let keen = _get_answered_questions([req.query.keen1, req.query.keen2, req.query.keen3]);

  if (!keen || !palette){
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
      /*
       * For existing customers we store profile data when people initially submit as we aren't
       * able to pass it through the checkout flow. Storing this data allows us to pull it out
       * and update the newly created subscription (when we CB hits our hook with a subscription_created)
       * event.
       */
       
      if (req.query.store_profile == 'true'){
        const profile = await _transform_profile_for_storage(req.query, keen, palette);
        await db.db_aux_store_style_profile(profile);
        res.redirect(`https://${process.env.CHARGEBEE_SITE}.chargebee.com/hosted_pages/plans/${req.query.boxtype}`);
      } else{
        const profile = await _transform_profile_for_storage(req.query, keen, palette);
        let checkout = await chargebee.chargebee_request_checkout(profile, redirect_url, stylist_attr);
        res.redirect( checkout.hosted_page.url );
      }
    }
    catch (err) {
      logger.error( err );
      res.redirect( process.env.BASE_URL + '/error' );
    }
  }
} );

/*
 * Route level error handling
 */

router.use( ( err, req, res, next ) => {
  res.end();
  logger.error( JSON.stringify( err ) );
} );

/************************ Private functionz **************************/

/*
 * Transforms received profile information to be a little more palatable
 */

async function _transform_profile_for_storage (qs, keen, palette){
  return {
    ts: new Date().getTime(),
    boxtype: qs.boxtype,
    email: qs.email,
    archetype: _get_answered_questions([qs.fav1, qs.fav2]),
    gender: qs.gender,
    childname: _get_answered_questions([qs.hername, qs.hisname]),
    childage: _get_answered_questions([qs.sheage, qs.heage]),
    topsize: _get_answered_questions([qs.shetopsize, qs.hetopsize]),
    bottomsize: _get_answered_questions([qs.shebottomsize, qs.hebottomsize]),
    jam: _get_answered_questions([qs.jam1, qs.jam2, qs.jam3, qs.jam4, qs.jam5, qs.jam6]),
    doit: _get_answered_questions([qs.doit1, qs.doit2, qs.doit3, qs.doit4, qs.doit5, qs.doit6]),
    palette: palette,
    fave: _get_answered_questions([qs.fav1, qs.fav2]),
    keen: keen,
    something_else: !qs.else ? 'not_yet_defined' : _escape_user_input(qs.else),
    notes: !qs.notes ? 'not_yet_defined' : _escape_user_input(qs.notes),
    internal_notes: 'n/a',
    first_name: qs.fname,
    last_name: qs.lname,
    street_address: qs.streetaddress,
    suburb: qs.suburb,
    city: qs.city,
    phone: qs.phone
  };
}

function _escape_user_input (string){
  const escaped_string = string.replace(/'/g, "\\'");
  return escaped_string;
}

/*
 * Some q params will be '______' because that is how typeform expresses empty variables.
 * This function finds the valid input and returns it
 */

function _get_answered_questions (questions){
  let val = '';
  const reg_exp = /^[a-zA-Z0-9]/;

  for (let i = 0; i < questions.length; i++){
    if (reg_exp.test(questions[i])){
      val = questions[i]
    };
  }

  return val;
}

module.exports = router;
