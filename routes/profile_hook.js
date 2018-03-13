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

const router = express.Router();
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
              let checkout = await chargebee.chargebee_request_checkout(req.query, redirect_url, stylist_attr, keen, palette);
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
router.use( function ( err, req, res, next ) {
  res.end();
  logger.error( JSON.stringify( err ) );
} );

module.exports = router;
