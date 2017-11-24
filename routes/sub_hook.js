/*
 *
 *  this route handles webhook events sent from Chargebee. Current events handled:
 *  - subscription_created
 *  - subscription_renewed
 *  - subscription_changed
 *  - subscription_cancelled
 *  - subscription_shipping_address_updated
 *  - customer_changed
 *
 */

var express = require( 'express' );
var router = express.Router();
var request = require( 'request' );
var chargebee = require( '../app.js' ).chargebee;
var logger = require( '../libs/lib_logger.js' );
var subscription_counter = require( '../libs/lib_subscription_tracker.js' );
var slack_notifier = require( '../libs/lib_slack.js' );
var cin7 = require( '../libs/lib_cin7.js' );
var autopilot = require( '../libs/lib_autopilot.js' );
var util = require( 'underscore' );
var order = require( '../libs/lib_order.js' );
var coupon = require( '../libs/lib_chargebee_coupon.js' );
var product_plan = require( '../libs/lib_product_plan.js' );

router.post( '/', function ( req, res, next ) {
    res.status( 200 ).send(); // Send immediate 200OK to keep chargebee happy and prevent unneccessary retries

    /*
     *  On subscription creation, a new customer and a new sales order is created in Cin7
     */

    if ( req.body.event_type == 'subscription_created' ) {
        var email = req.body.content.customer.email;
        var coupons = req.body.content.invoice.discounts || false;
        var plan_id = req.body.content.subscription.plan_id;
        var subscription = req.body.content.subscription;
        logger.info( 'Subscription created for customer with ID: ' + req.body.content.customer.id );

        product_plan.product_plan_is_one_off( plan_id )
            .then( ( ret ) => {
                if ( ret.one_off ) {
                    if ( process.env.ENVIRONMENT == 'prod' ) {
                        /*
                         *  Move them from the completers list to the Gift Box Purchasers list in Autopilot
                         */

                        autopilot.autopilot_move_contact_to_new_list( 'contactlist_AAB1C098-225D-48B7-9FBA-0C4A68779072', 'contactlist_E427B712-F86E-4864-80F5-C8C5AC335E17', email );
                    }
                    return order.order_create_new_purchase( subscription );
                }
                else {
                    if ( process.env.ENVIRONMENT == 'prod' ) {
                        /*
                         *  Move them from the completers list to the subscribers list in Autopilot
                         */

                        autopilot.autopilot_move_contact_to_new_list( 'contactlist_AAB1C098-225D-48B7-9FBA-0C4A68779072', 'contactlist_1C4F1411-4376-4FEC-8B63-3ADA5FF4EBBD', email );
                    }

                    return order.order_create_new_subscription( subscription, coupons );
                }
            } )
            .then( ( ret ) => {
                if ( process.env.ENVIRONMENT == 'prod' ) {
                    slack_notifier.send( 'subscription_created', req.body.content.customer, req.body.content.subscription );
                }

                logger.info( 'New order complete: ' + req.body.content.subscription.id );
                res.end();
            } )
            .catch( ( err ) => {
                next( err );
            } );
    }
    else if ( req.body.event_type == 'subscription_renewed' ) {

        /*
         *  On subscription renewal check whether it's delivery time. If so, create a sales order in cin7.
         *  If not a delivery time, increment the subscription count
         */

        var customer_id = req.body.content.subscription.customer_id;
        var plan = req.body.content.subscription.plan_id;
        var subscription_id = req.body.content.subscription.id;
        var subscription = req.body.content.subscription;

        //  get customer for renewed subscription
        chargebee.customer.retrieve( customer_id ).request(

            function ( error, result ) {

                if ( error ) {
                    logger.error( 'Failed to retrieve customer record from chargebee - reason: ' + JSON.stringify( error ) + '. For customer_id: ' + customer_id );
                }
                else {

                    var customer = result.customer;

                    switch ( plan ) {
                    case 'deluxe-box':
                    case 'premium-box':
                        //  increment counter for customer_id + check if they are due a box
                        subscription_counter.increment_and_check_monthly( customer_id, subscription_id, plan, function ( err, res ) {

                            if ( err ) {
                                logger.warn( 'Error occurred in subscription counter that could have stopped a salesorder for customer_id: ' + customer_id + ' with subscription_id: ' + subscription_id );
                            }
                            else {

                                //  if true create order
                                if ( res ) {

                                    cin7.get_customer_record( 'id', 'email=\'' + customer.email + '\'', function ( err, ret ) {

                                        if ( err || !ret.ok ) {
                                            logger.error( 'Failed to check if user exists in Cin7 - reason: ' + ( error || ret.msg ) + '. For customer_id: ' + customer_id );
                                        }
                                        else if ( util.isEmpty( ret.fields ) ) {
                                            logger.error( 'Failed to retrieve member_id from Cin7 - reason: customer does not exist for customer_id: ' + customer_id );
                                        }
                                        else if ( ret.fields[ 0 ].success == false ) {
                                            logger.error( 'Failed to retrieve member_id from Cin7 - reason: ' + ret.fields[ 0 ].errors[ 0 ] + '. For customer_id: ' + customer_id );
                                        }
                                        else {
                                            cin7.create_sales_order( ret.fields[ 0 ].id, plan, subscription_id, subscription.cf_topsize, subscription.cf_bottomsize, subscription.cf_archetype, function ( err, ret ) {

                                                if ( err || !ret.ok ) {
                                                    logger.error( 'Failed to create sales order in Cin7 - reason: ' + ( error || ret.msg ) + '. For subscription_id: ' + subscription_id );
                                                }
                                                else if ( util.isEmpty( ret.fields ) ) {
                                                    logger.error( 'Failed to create sales order in Cin7 - reason: empty_response. For subscription_id: ' + subscription_id );
                                                }
                                                else if ( ret.fields[ 0 ].success == false ) {
                                                    logger.error( 'Failed to create sales order in Cin7 - reason: ' + ret.fields[ 0 ].errors[ 0 ] + '. For subscription_id: ' + subscription_id );
                                                }

                                                logger.info( 'New sales order created on renewal for subscription_id: ' + subscription_id );

                                                slack_notifier.send( 'subscription_renewed_new_order', customer, subscription );

                                            } );
                                        }
                                    } );
                                }
                            }
                        } );
                        break;
                    case 'deluxe-box-weekly':
                    case 'premium-box-weekly':
                        //  increment counter for customer_id + check if they are due a box
                        subscription_counter.increment_and_check_weekly( customer_id, subscription_id, plan, function ( err, res ) {

                            if ( err ) {
                                logger.warn( 'Error occurred in subscription counter that could have stopped a salesorder for customer_id: ' + customer_id + ' with subscription_id: ' + subscription_id );
                            }
                            else {

                                //  if true create order
                                if ( res ) {

                                    cin7.get_customer_record( 'id', 'email=\'' + customer.email + '\'', function ( err, ret ) {

                                        if ( err || !ret.ok ) {
                                            logger.error( 'Failed to check if user exists in Cin7 - reason: ' + ( error || ret.msg ) + '. For customer_id: ' + customer_id );
                                        }
                                        else if ( util.isEmpty( ret.fields ) ) {
                                            logger.error( 'Failed to retrieve member_id from Cin7 - reason: customer does not exist for customer_id: ' + customer_id );
                                        }
                                        else if ( ret.fields[ 0 ].success == false ) {
                                            logger.error( 'Failed to retrieve member_id from Cin7 - reason: ' + ret.fields[ 0 ].errors[ 0 ] + '. For customer_id: ' + customer_id );
                                        }
                                        else {
                                            cin7.create_sales_order( ret.fields[ 0 ].id, plan, subscription_id, subscription.cf_topsize, subscription.cf_bottomsize, subscription.cf_archetype, function ( err, ret ) {

                                                if ( err || !ret.ok ) {
                                                    logger.error( 'Failed to create sales order in Cin7 - reason: ' + ( error || ret.msg ) + '. For subscription_id: ' + subscription_id );
                                                }
                                                else if ( util.isEmpty( ret.fields ) ) {
                                                    logger.error( 'Failed to create sales order in Cin7 - reason: empty_response. For subscription_id: ' + subscription_id );
                                                }
                                                else if ( ret.fields[ 0 ].success == false ) {
                                                    logger.error( 'Failed to create sales order in Cin7 - reason: ' + ret.fields[ 0 ].errors[ 0 ] + '. For subscription_id: ' + subscription_id );
                                                }

                                                logger.info( 'New sales order created on renewal for subscription_id: ' + subscription_id );

                                            } );
                                        }
                                    } );
                                }
                            }
                        } );
                        break;
                    default:
                        logger.error( 'Error - unknown subscription plan received on renewal for subscription with id: ' + subscription_id );
                    }
                }
            }
        );
    }
    else if ( req.body.event_type == 'subscription_shipping_address_updated' ) {

        /*
         *  If the customer (or us) updates their shipping address details, pass the updates on to Cin7.
         *  Note: this handler only handles shipping address updates.
         *
         */

        var customer_id = req.body.content.subscription.customer_id;
        var subscription = req.body.content.subscription;
        var customer = req.body.content.customer;

        cin7.get_customer_record( 'id', 'email=\'' + customer.email + '\'', function ( err, ret ) {

            if ( err || !ret.ok ) {
                logger.error( 'Failed to check if user exists in Cin7 - reason: ' + ( error || ret.msg ) + '. For customer_id: ' + customer_id );
            }
            else if ( util.isEmpty( ret.fields ) ) {
                logger.error( 'Failed to retrieve member_id from Cin7 - reason: customer does not exist for customer_id: ' + customer_id );
            }
            else if ( ret.fields[ 0 ].success == false ) {
                logger.error( 'Failed to retrieve member_id from Cin7 - reason: ' + ret.fields[ 0 ].errors[ 0 ] + '. For customer_id: ' + customer_id );
            }
            else {

                var customer_updates = [ {
                    id: ret.fields[ 0 ].id,
                    integrationRef: customer_id,
                    isActive: true,
                    type: 'Customer',
                    firstName: customer.first_name,
                    address1: subscription.shipping_address.line1,
                    address2: subscription.shipping_address.line2,
                    city: subscription.shipping_address.city,
                    state: null,
                    postCode: subscription.shipping_address.postcode,
                    country: 'New Zealand',
                } ]

                cin7.update_customer_record( customer_updates, function ( err, ret ) {

                    if ( err || !ret.ok ) {
                        logger.error( 'Failed to update user in Cin7 - reason: ' + ( error || ret.msg ) + '. For customer_id: ' + customer_id );
                    }
                    else if ( util.isEmpty( ret.fields ) ) {
                        logger.error( 'Failed to update user in Cin7 - reason: customer does not exist for customer_id: ' + customer_id );
                    }
                    else if ( ret.fields[ 0 ].success == false ) {
                        logger.error( 'Failed to update user in Cin7 - reason: ' + ret.fields[ 0 ].errors[ 0 ] + '. For customer_id: ' + customer_id );
                    }
                    else {
                        logger.info( 'Customer information updated for customer ' + ret.fields[ 0 ].id + '(cin7), ' + customer_id + '(Chargebee)' );
                    }
                } );
            }
        } );

    }
    else if ( req.body.event_type == 'customer_changed' ) {

        /*
         *  If a customer (or us) changes their information (excl shipping info), update their Cin7 customer
         *  record accordingly.
         *
         */

        var customer_id = req.body.content.customer.id;
        var customer = req.body.content.customer;

        cin7.get_customer_record( 'id', 'email=\'' + customer.email + '\'', function ( err, ret ) {

            if ( err || !ret.ok ) {
                logger.error( 'Failed to check if user exists in Cin7 - reason: ' + ( error || ret.msg ) + '. For customer_id: ' + customer_id );
            }
            else if ( util.isEmpty( ret.fields ) ) {
                logger.error( 'Failed to retrieve member_id from Cin7 - reason: customer does not exist for customer_id: ' + customer_id );
            }
            else if ( ret.fields[ 0 ].success == false ) {
                logger.error( 'Failed to retrieve member_id from Cin7 - reason: ' + ret.fields[ 0 ].errors[ 0 ] + '. For customer_id: ' + customer_id );
            }
            else {

                var customer_updates = [ {
                    id: ret.fields[ 0 ].id,
                    integrationRef: customer_id,
                    isActive: true,
                    type: 'Customer',
                    firstName: customer.first_name,
                    lastName: customer.last_name,
                    email: customer.email,
                    phone: customer.phone
                } ];

                cin7.update_customer_record( customer_updates, function ( err, ret ) {

                    if ( err || !ret.ok ) {
                        logger.error( 'Failed to update user in Cin7 - reason: ' + ( error || ret.msg ) + '. For customer_id: ' + customer_id );
                    }
                    else if ( util.isEmpty( ret.fields ) ) {
                        logger.error( 'Failed to update user in Cin7 - reason: customer does not exist for customer_id: ' + customer_id );
                    }
                    else if ( ret.fields[ 0 ].success == false ) {
                        logger.error( 'Failed to update user in Cin7 - reason: ' + ret.fields[ 0 ].errors[ 0 ] + '. For customer_id: ' + customer_id );
                    }
                    else {
                        logger.info( 'Customer information updated for customer ' + ret.fields[ 0 ].id + '(cin7), ' + customer_id + '(Chargebee)' );
                    }
                } );

            }
        } );

    }
    else if ( req.body.event_type == 'subscription_changed' ) {

        /*
         *  This is specifically for handling the adding of an archetype to a subscription. On receiving this event
         *  the archtype is added to the sales order in Cin7
         */

        var customer_id = req.body.content.subscription.customer_id;
        var plan = req.body.content.subscription.plan_id;
        var subscription_id = req.body.content.subscription.id;
        var customer = req.body.content.customer;
        var archetype = req.body.content.subscription.cf_archetype;

        cin7.get_customer_record( 'id', 'email=\'' + customer.email + '\'', function ( err, ret ) {

            if ( err || !ret.ok ) {
                logger.error( 'Failed to check if user exists in Cin7 - reason: ' + ( error || ret.msg ) + '. For customer_id: ' + customer_id );
            }
            else if ( util.isEmpty( ret.fields ) ) {
                logger.error( 'Failed to retrieve member_id from Cin7 - reason: customer does not exist for customer_id: ' + customer_id );
            }
            else if ( ret.fields[ 0 ].success == false ) {
                logger.error( 'Failed to retrieve member_id from Cin7 - reason: ' + ret.fields[ 0 ].errors[ 0 ] + '. For customer_id: ' + customer_id );
            }
            else {

                cin7.get_sales_order( 'id,internalComments', 'internalComments LIKE\'%' + subscription_id + '\'', function ( err, ret ) {

                    if ( err || !ret.ok ) {
                        logger.error( 'Failed to retrieve sales order ID from Cin7 - reason: ' + ( err || ret.msg ) + '. For subscription_id: ' + subscription_id );
                    }
                    else if ( util.isEmpty( ret.fields ) ) {
                        logger.error( 'Failed to retrieve sales order ID from Cin7 - reason: sales order does not exist for subscription_id: ' + subscription_id );
                    }
                    else if ( ret.fields[ 0 ].success == false ) {
                        logger.error( 'Failed to retrieve sales order ID from Cin7 - reason: ' + ret.fields[ 0 ].errors[ 0 ] + '. For subscription_id: ' + subscription_id );
                    }
                    else {

                        var sales_order_updates = [ {
                            id: ret.fields[ 0 ].id,
                            internalComments: 'archetype: ' + archetype + ' ' + ret.fields[ 0 ].internalComments, // add change here
                            currencyCode: 'NZD',
                            taxStatus: 'Incl',
                            taxRate: 0.15
                        } ];

                        cin7.update_sales_order( sales_order_updates, function ( err, ret ) {

                            if ( err || !ret.ok ) {
                                logger.error( 'Failed to update sales order in Cin7 - reason: ' + ( err || ret.msg ) + '. For subscription_id: ' + subscription_id );
                            }
                            else if ( util.isEmpty( ret.fields ) ) {
                                logger.error( 'Failed to update sales order in Cin7 - reason: customer does not exist for customer_id: ' + customer_id );
                            }
                            else if ( ret.fields[ 0 ].success == false ) {
                                logger.error( 'Failed to update sales order in Cin7 - reason: ' + ret.fields[ 0 ].errors[ 0 ] + '. For subscription_id: ' + subscription_id );
                            }
                            else {
                                logger.info( 'Detected addition of archetype: ' + archetype + ' to subscription with ID: ' + subscription_id + '. Updated corresponding Cin7 Sales order' );
                            }
                        } );
                    }
                } );
            }
        } );
    }
    else if ( req.body.event_type == 'subscription_cancelled' ) {

        /*
         *  For notifying in Slack when a subscription has been cancelled
         */

        var customer = req.body.content.customer;
        var subscription = req.body.content.subscription;

        if ( process.env.ENVIRONMENT == 'prod' ) {
            //  notify Slack
            slack_notifier.send( 'subscription_cancelled', customer, subscription );
        }

    }
} );

// error handling for the sub route
router.use( function ( err, req, res, next ) {
    res.end();
    logger.error( JSON.stringify( err ) );
} );

module.exports = router;
