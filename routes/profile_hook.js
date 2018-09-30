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

const country_to_iso = {
  'australia': 'AU', 
  'new zealand': 'NZ'
};

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
   * The cf_palette and cf_designs field in chargebee cap out at 250. These fields can
   * sometimes be longer so this is a temp fix which truncates them. (Not Ideal).
   * NOTE: this may not be necessary anymore -> remove if not
   */

  let palette = req.query.palette;
  let designs = req.query.designs;

  if (!designs || !palette){
    logger.error( 'Error occurred on receiving style profile information - palette or designs* fields undefined' );
    res.redirect( process.env.BASE_URL + '/error' );
  }
  else {
    if ( palette.length > 250 ) {
      logger.warn( 'Had to truncate palette field string for customer: ' + req.query.email );
      palette = palette.substring( 0, 250 );
    }
    if (designs.length > 250 ) {
      logger.warn( 'Had to truncate designs field string for customer: ' + req.query.email );
      designs = designs.substring( 0, 250 );
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
       
      if (req.query.store_profile == 'Yes'){
        const profile = await _transform_profile_for_storage(req.query, designs, palette);
        await db.db_aux_store_style_profile(profile);
        res.redirect(`https://${process.env.CHARGEBEE_SITE}.chargebee.com/hosted_pages/plans/${req.query.boxtype}`);
      } else{
        const profile = await _transform_profile_for_storage(req.query, designs, palette);
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

async function _transform_profile_for_storage (qs, designs, palette){
  return {
    ts: new Date().getTime(),
    boxtype: qs.boxtype,
    email: qs.email,
    gender: qs.gender,
    childname: qs.childname,
    childage: qs.childage,
    topsize: qs.topsize,
    ts_fit: qs.ts_fit,
    bottomsize: qs.bottomsize,
    bs_fit: qs.bs_fit,
    palette: palette,
    style: qs.style,
    pared_to_bold: qs.pared_to_bold,
    pared_to_fun: qs.pared_to_fun,
    vintage_to_fem: qs.vintage_to_fem,
    vintage_to_beachy: qs.vintage_to_beachy,
    avoid_colours: qs.avoid_colours,
    designs: designs,
    do_not_want: _get_answered_questions([qs.do_not_want1, qs.do_not_want2, qs.do_not_want3, qs.do_not_want4]),
    need_most: _get_answered_questions([qs.need_most1, qs.need_most2, qs.need_most3, qs.need_most4]),
    unisex: qs.unisex,
    other_notes: qs.other_notes,
    first_name: qs.firstname,
    last_name: qs.lastname,
    street_address: qs.streetaddress,
    suburb: qs.suburb,
    city: qs.city,
    phone: qs.phone,
    country: _transform_country_to_iso(qs.country),
    postcode:qs.postcode
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

/*
 * Chargebee accepts 2-letter ISO 3166 alpha-2 country codes. This function takes a
 * country name and returns the appropriate ISO code. Returns country code or false
 */
 
function _transform_country_to_iso (country){
  if (typeof country === 'undefined' || country == null){
    throw new VError("Unsupported value received for country field");
  }
  
  let ret = false;
  const l_country = country.toLowerCase();
  
  const keys = Object.keys(country_to_iso);
  const index = keys.indexOf(country);
  
  if (index){
    ret = country_to_iso[keys[index]];
  }
  
  return ret;
}

module.exports = router;
