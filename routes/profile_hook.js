/*
 *
 *  this route handles incoming style profile information as it is submitted by new subscribers.
 *  Information is sent to Chargebee and the new subscriber is redirected to a checkout page
 *
 */

var express = require( 'express' );
var router = express.Router();
var chargebee = require( '../app.js' ).chargebee;
var logger = require( '../libs/lib_logger.js' );
var mixpanel = require( 'mixpanel' );
var mp = mixpanel.init( process.env.MIXPANEL_TOKEN );
var stylist_campaigns = [ 'HW-01-ATTR', 'MD-01-ATTR' ];
var util = require( 'underscore' );

router.get( '/', function ( req, res ) {

    logger.info( 'TMP DEBUG: request received: ' + JSON.stringify( req.body ) + ' ' + JSON.stringify( req.query ) + ' ' + req.url + ' ' + JSON.stringify( req.headers ) );

    //  check for valid source token
    if ( req.query.token == process.env.VERIFICATION_TOKEN ) {

        //  trigger event in mixpanel to track user
        mp.track( process.env.MIXPANEL_EVENT, {
            distinct_id: req.query.mp_id
        } );

        //  check for stylist campaign Q param: indicates we should attribute the customer to the stylist
        var stylist_idx = stylist_campaigns.indexOf( req.query.campaign );
        var stylist_attr = '';
        if ( stylist_idx != -1 ) {
            stylist_attr = stylist_campaigns[ stylist_idx ];
        }

        //  get a new checkout page from Chargebee
        chargebee.hosted_page.checkout_new( {

            subscription: {
                plan_id: req.query.boxtype,
                cf_gender: req.query.gender,
                cf_childname: req.query.hername || req.query.hisname,
                cf_childage: req.query.sheage || req.query.heage,
                cf_topsize: req.query.shetopsize || req.query.hetopsize,
                cf_bottomsize: req.query.shebottomsize || req.query.hebottomsize,
                cf_jam: req.query.jam1 || req.query.jam2 || req.query.jam3 || req.query.jam4 || req.query.jam5 || req.query.jam6,
                cf_doit: req.query.doit1 || req.query.doit2 || req.query.doit3 || req.query.doit4 || req.query.doit5 || req.query.doit6,
                cf_palette: req.query.palette,
                cf_fave: req.query.fav1 || req.query.fav2,
                cf_keen: req.query.keen1 || req.query.keen2 || req.query.keen3,
                cf_else: req.query.else
            },
            customer: {
                email: req.query.email,
                first_name: req.query.fname,
                last_name: req.query.lname,
                phone: req.query.phone //,
                //cf_stylist_attr: stylist_attr
            },
            billing_address: {
                first_name: req.query.fname,
                last_name: req.query.lname,
                line1: req.query.streetaddress,
                line2: req.query.suburb,
                city: req.query.city,
                country: "NZ",
                phone: req.query.phone
            }
        } ).request( function ( error, result ) {

            if ( error ) {
                logger.error( 'Failed to get chargebee checkout page on form completion - reason: ' + JSON.stringify( error ) );
                res.redirect( process.env.BASE_URL + '/error' );
            }
            else {

                var hosted_page = result.hosted_page;
                logger.info( 'Checkout page URL successfully got: ' + JSON.stringify( hosted_page ) );

                //  redirect the request to the new, shiny, checkout page
                res.redirect( hosted_page.url );
            }
        } );
    }
    else {
        logger.error( 'Incorrect token passed' );
        res.redirect( process.env.BASE_URL + '/error' )
    }
} );

module.exports = router;
