/*
 *
 *  Stitchfox Redirector: This service keeps chargebee and cin7 in check - see README for more detailed information
 *
 */
var request = require( 'request' );
var logger = require( './log_service.js' );
var chargebee = require( 'chargebee' );
var bodyparser = require( 'body-parser' );
var subscription_counter = require( './subscription_counter.js' );
var order_manager = require( './order_manager.js' );
var app = require( 'express' )();
var https = require( 'https' );
var fs = require( 'fs' );
var sslPath = '/etc/letsencrypt/live/redirect.wowzers.work/';

var options = {
    key: fs.readFileSync( sslPath + 'privkey.pem' ),
    cert: fs.readFileSync( sslPath + 'fullchain.pem' )
};
var server = https.createServer( options, app );

//  set Chargebee creds
chargebee.configure( {
    site: "testcorp-test",
    api_key: "test_htql10oiHR3mKzcuH0QhjIVse2dcugghIf"
} );

app.use( bodyparser.json() );
app.use( bodyparser.urlencoded( {
    extended: true
} ) );

/*
 *  listening for Typeform submits - todos: have firstname and lastname + fill state field with .
 */
app.get( '/', function ( req, res ) {

    //  handles typeform request
    if ( req.get( 'Referer' ) == 'https://stitchform.typeform.com/to/ZD6g1z' ) {

        //  get a new checkout page from Chargebee
        chargebee.hosted_page.checkout_new( {
            subscription: {
                plan_id: req.query.plan_id
            },
            customer: {
                email: req.query.email,
                first_name: req.query.name,
                //last_name: "Doe",
                //locale: "fr-CA",
                phone: req.query.phone,
                cf_im_shopping_for_a: req.query.kid_gender,
                cf_how_old_are_they: req.query.age,
                cf_kid_name: req.query.kid_name,
                cf_what_size_tops: req.query.top_size,
                cf_what_size_bottoms_do_they_wear: req.query.bottom_size,
                cf_whats_their_style: req.query.style
            },
            billing_address: {
                first_name: req.query.name,
                //last_name: "Doe",
                line1: req.query.street_address,
                line2: req.query.suburb,
                city: req.query.city,
                //zip: req.query.postcode,
                country: "NZ",
                phone: req.query.phone
            }
        } ).request( function ( error, result ) {
            if ( error ) {
                logger.error( 'Failed to get chargebee checkout page on form completion - reason: ' + error );
            }
            else {
                var hosted_page = result.hosted_page;
                logger.info( 'Checkout page URL successfully got: ' + hosted_page );
                //  redirect the request to the new, shiny, checkout page
                res.redirect( hosted_page.url );
            }
        } );
    }
} );

/*
 *  listening for webhook events
 */
app.post( '/', function ( req, res ) {

    //  send immediate 200OK to keep chargebee happy and prevent unneccessary retries
    res.status( 200 ).send();

    /*
     *  Handle subscription_created events:
     *
     *  On subscription creation, a new customer and a new sales order is created in Cin7
     */
    if ( req.body.event_type == 'subscription_created' ) {
        var customer_id = req.body.content.subscription.customer_id;
        var plan = req.body.content.subscription.plan_id;
        logger.info( 'Subscription created for customer with ID: ' + customer_id + ' for plan: ' + plan );

        //  get customer data using id of newly created subscription from event
        chargebee.customer.retrieve( customer_id ).request(
            function ( error, result ) {
                if ( error ) {
                    logger.error( 'Failed to retrieve customer record from chargebee - reason: ' + error + '. For customer_id: ' + customer_id );
                }
                else {
                    var customer = result.customer;
                    var card = result.card;

                    //  create customer record in cin7
                    var req_options = {
                        method: 'POST',
                        url: 'https://api.cin7.com/api/v1/Contacts',
                        headers: {
                            'cache-control': 'no-cache',
                            'content-type': 'application/json',
                            authorization: 'Basic U3RpdGNoZm94Tlo6ZDczMzNmNmM5MTQxNDgxNjhlMmQ5NzIwNTYxYzQ2OTM='
                        },
                        body: [ {
                            integrationRef: customer_id,
                            isActive: true,
                            type: 'Customer',
                            firstName: customer.billing_address.first_name,
                            lastName: customer.billing_address.last_name,
                            email: customer.email,
                            phone: customer.phone,
                            address1: customer.billing_address.line1,
                            address2: null,
                            city: customer.billing_address.city,
                            state: null,
                            postCode: customer.billing_address.postcode,
                            country: 'New Zealand',
                            group: null,
                            subGroup: null,
                            PriceColumn: 'RetailPrice'
                        } ],
                        json: true
                    };

                    request( req_options, function ( error, response, body ) {
                        if ( error ) {
                            logger.error( 'Failed to create customer in Cin7 - reason: ' + error + '. For customer_id: ' + customer_id );
                        }
                        else if ( body[ 0 ].success == false ) {
                            logger.error( 'Failed to create customer in Cin7 - reason: ' + body[ 0 ].errors[ 0 ] + '. For customer_id: ' + customer_id );
                        }
                        else {
                            logger.info( 'Successfully created customer record in Cin7 for customer_id: ' + customer_id + '.  Returned member_id: ' + body[ 0 ].id );

                            //  create a new sales order in cin7 (waits a second to avoid rate limiting)
                            setTimeout( function () {
                                order_manager.create( body[ 0 ].id, plan )
                            }, 1000 );

                            //  add count to subscription_counter for customer ID of 1
                            subscription_counter.set( customer_id );
                        }
                    } );
                }
            }
        );
    }
    else if ( req.body.event_type == 'subscription_renewed' ) {
        var customer_id = req.body.content.subscription.customer_id;
        var plan = req.body.content.subscription.plan_id;

        //  get customer for renewed subscription
        chargebee.customer.retrieve( customer_id ).request(
            function ( error, result ) {
                if ( error ) {
                    logger.error( 'Failed to retrieve customer record from chargebee - reason: ' + error + '. For customer_id: ' + customer_id );
                }
                else {
                    var customer = result.customer;
                    var card = result.card;

                    //  increment counter for customer_id + check if they are due a box
                    subscription_counter.increment_and_check( customer_id, function ( err, res ) {

                        if ( err ) {
                            logger.warn( 'Error occurred in subscription counter that could have stopped a salesorder for customer_id: ' + customer_id );
                        }
                        else {
                            //  if true create order
                            if ( res ) {
                                //  get cin7 member ID
                                var options = {
                                    method: 'GET',
                                    url: 'https://api.cin7.com/api/v1/Contacts',
                                    qs: {
                                        fields: 'id',
                                        where: 'integrationRef=\'' + customer_id + '\''
                                    },
                                    headers: {
                                        'cache-control': 'no-cache',
                                        authorization: 'Basic U3RpdGNoZm94Tlo6ZDczMzNmNmM5MTQxNDgxNjhlMmQ5NzIwNTYxYzQ2OTM='
                                    },
                                    json: true
                                };

                                request( options, function ( error, response, body ) {
                                    if ( error ) {
                                        logger.error( 'Failed to retrieve member_id from Cin7 - reason: ' + error + '. For customer_id: ' + customer_id );
                                    }
                                    else if ( body[ 0 ].success == false ) {
                                        logger.error( 'Failed to retrieve member_id from Cin7 - reason: ' + body[ 0 ].errors[ 0 ] + '. For customer_id: ' + customer_id );
                                    }
                                    else {
                                        //  create a new sales order in cin7 (waits a second to avoid rate limiting)
                                        setTimeout( function () {
                                            order_manager.create( body[ 0 ].id, plan )
                                        }, 1000 );
                                    }
                                } );
                            }
                        }
                    } );
                }
            }
        );
    }
    // other events to think about: subscription_changed + to reflect changes to customers in cin7: customer_changed
} );

server.listen( 443, function () {
    logger.info( 'Server started and listening' );
} );
