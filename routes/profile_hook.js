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

// router level middleware
const token_check = require("../middleware/mw_verification_token_check").verification_token_check;
const router = express.Router();
router.use(token_check);

const mp = mixpanel.init( process.env.MIXPANEL_TOKEN );
const stylist_campaigns = [ 'HW-01-ATTR', 'MD-01-ATTR' ];

router.get( '/', async function ( req, res, next) {
  if ( req.query.token == process.env.VERIFICATION_TOKEN ) { // TODO: move to middleware
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
    let keen = _get_answered_questions([req.query.keen1, req.query.keen2, req.query.keen3]);

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
       * Here we set the redirect_url top point to the appropriate page based on the boxtype.
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
        const profile = await _transform_profile_for_storage(req.query, keen, palette);
        let checkout = await chargebee.chargebee_request_checkout(profile, redirect_url, stylist_attr);
        res.redirect( checkout.hosted_page.url );
      }
      catch (err) {
        logger.error( err );
        res.redirect( process.env.BASE_URL + '/error' );
      }
    }
  }
  else {
    logger.error( 'Request to profile hook with incorrect verification token made.' );
    res.status( 401 ).send();
  }
} );

// error handling for the sub route
router.use( ( err, req, res, next ) => {
  res.end();
  logger.error( JSON.stringify( err ) );
} );

/************************ Private function **************************/

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
