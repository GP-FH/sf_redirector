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


router.post( '/', function ( req, res ) {

    //  send immediate 200OK to keep chargebee happy and prevent unneccessary retries
    res.status( 200 ).send();

    /*
     *  On subscription creation, a new customer and a new sales order is created in Cin7
     */
    if ( req.body.event_type == 'subscription_created' ) {

        var customer_id = req.body.content.subscription.customer_id;
        var plan = req.body.content.subscription.plan_id;
        var subscription_id = req.body.content.subscription.id;
        var webhook_sub_object = req.body.content.subscription;
        var email = req.body.content.customer.email;
        var coupon = req.body.content.subscription.coupon || false;
        logger.info( 'Subscription created for customer with ID: ' + customer_id + ' for plan: ' + plan );
        logger.info( 'DEBUG: looking at coupon prop' + JSON.stringify( req.body.content ) );

        //  move them from the completers list to the subscribers list in autopilot
        autopilot.autopilot_move_contact_to_new_list( 'contactlist_AAB1C098-225D-48B7-9FBA-0C4A68779072', 'contactlist_1C4F1411-4376-4FEC-8B63-3ADA5FF4EBBD', email );

        //  create coupon for customer
        chargebee.coupon.create( {

            id: customer_id,
            name: customer_id,
            discount_type: "fixed_amount",
            discount_amount: 1000,
            apply_on: "invoice_amount",
            duration_type: "forever",
            max_redemptions: 1

        } ).request( function ( error, result ) {

            if ( error ) {
                logger.error( 'Failed to create coupon in chargebee - reason: ' + JSON.stringify( error ) + '. For customer_id: ' + customer_id );
            }

            //  get customer data using customer_id from newly created subscription event
            chargebee.customer.retrieve( customer_id ).request(

                function ( error, result ) {

                    if ( error ) {
                        logger.error( 'Failed to retrieve customer record from chargebee - reason: ' + JSON.stringify( error ) + '. For customer_id: ' + customer_id );
                    }
                    else {

                        var customer = result.customer;

                        cin7.get_customer_record( 'id', 'email=\'' + customer.email + '\'', function ( err, ret ) {

                            if ( err || !ret.ok ) {
                                logger.error( 'Failed to check if user exists in Cin7 - reason: ' + ( error || ret.msg ) + '. For customer_id: ' + customer_id );
                            }
                            else if ( util.isEmpty( ret.fields ) ) {
                                logger.info( 'Request made to find user in cin7 - no user found. I should create one' );

                                //  get subscription object for new subscription so that the correct shipping address is sent to cin7 customer record
                                chargebee.subscription.retrieve( subscription_id ).request(

                                    function ( error, result ) {

                                        if ( error ) {
                                            logger.error( 'Failed to retrieve subscription record from chargebee - reason: ' + JSON.stringify( error ) + '. For customer_id: ' + customer_id + ' subscription_id: ' + subscription_id );
                                        }
                                        else {
                                            var subscription = result.subscription;
                                            var customer_details = [ {
                                                integrationRef: customer_id,
                                                isActive: true,
                                                type: 'Customer',
                                                firstName: customer.first_name,
                                                lastName: customer.last_name,
                                                email: customer.email,
                                                phone: customer.phone,
                                                address1: subscription.shipping_address.line1,
                                                address2: subscription.shipping_address.line2,
                                                city: subscription.shipping_address.city,
                                                state: null,
                                                postCode: subscription.shipping_address.postcode,
                                                country: 'New Zealand',
                                                group: null,
                                                subGroup: null,
                                                PriceColumn: 'RetailPrice'
                                            } ];

                                            cin7.create_customer_record( customer_details, function ( err, ret ) {

                                                if ( error || !ret.ok ) {
                                                    logger.error( 'Failed to create customer in Cin7 - reason: ' + ( error || ret.msg ) + '. For customer_id: ' + customer_id );
                                                }
                                                else if ( ret.fields[ 0 ].success == false ) {
                                                    logger.error( 'Failed to create customer in Cin7 - reason: ' + ret.fields[ 0 ].errors[ 0 ] + '. For customer_id: ' + customer_id );
                                                }
                                                else {

                                                    logger.info( 'Successfully created customer record in Cin7 for customer_id: ' + customer_id + '.  Returned member_id: ' + ret.fields[ 0 ].id );

                                                    cin7.create_sales_order( ret.fields[ 0 ].id, plan, subscription_id, subscription.cf_topsize, subscription.cf_bottomsize, 'NOT_SET', function ( err, ret ) {

                                                        if ( err || !ret.ok ) {
                                                            logger.error( 'Failed to create sales order in Cin7 - reason: ' + ( error || ret.msg ) + '. For subscription_id: ' + subscription_id );
                                                        }
                                                        else if ( util.isEmpty( ret.fields ) ) {
                                                            logger.error( 'Failed to create sales order in Cin7 - reason: empty_response. For subscription_id: ' + subscription_id );
                                                        }
                                                        else if ( ret.fields[ 0 ].success == false ) {
                                                            logger.error( 'Failed to create sales order in Cin7 - reason: ' + ret.fields[ 0 ].errors[ 0 ] + '. For subscription_id: ' + subscription_id );
                                                        }
                                                        else {

                                                            //  add count to subscription_counter for customer ID
                                                            subscription_counter.set( customer_id, subscription_id );

                                                            //  check if they used a refer_a_friend coupon code - length greater than 8. If so, credit the referrer
                                                            if ( coupon ) {

                                                                if ( coupon.length > 8 ) {

                                                                    logger.info( 'Referral refer a friend coupon received - adding promotional credits to giver' );

                                                                    chargebee.customer.add_promotional_credits( coupon, {
                                                                        amount: 1000,
                                                                        description: "refer_a_friend credits"
                                                                    } ).request( function ( error, result ) {
                                                                        if ( error ) {
                                                                            logger.error( 'Failed to give referral credits to customer in Chargebee with ID: ' + customer_id );
                                                                        }
                                                                    } );

                                                                }
                                                            }

                                                            if ( process.env.ENVIRONMENT == 'prod' ) {
                                                                //  notify Slack
                                                                slack_notifier.send( 'subscription_created', customer, subscription );
                                                            }

                                                        }
                                                    } );
                                                }
                                            } );
                                        }
                                    }
                                );

                            }
                            else {
                                logger.info( 'Request made to find user in cin7 - found. member_id: ' + ret.fields[ 0 ].id + ' I should create a new order now' );

                                //  create a new sales order in cin7
                                cin7.create_sales_order( ret.fields[ 0 ].id, plan, subscription_id, webhook_sub_object.cf_topsize, webhook_sub_object.cf_bottomsize, 'NOT_SET', function ( err, ret ) {

                                    if ( err || !ret.ok ) {
                                        logger.error( 'Failed to create sales order in Cin7 - reason: ' + ( error || ret.msg ) + '. For subscription_id: ' + subscription_id );
                                    }
                                    else if ( util.isEmpty( ret.fields ) ) {
                                        logger.error( 'Failed to create sales order in Cin7 - reason: empty_response. For subscription_id: ' + subscription_id );
                                    }
                                    else if ( ret.fields[ 0 ].success == false ) {
                                        logger.error( 'Failed to create sales order in Cin7 - reason: ' + ret.fields[ 0 ].errors[ 0 ] + '. For subscription_id: ' + subscription_id );
                                    }
                                    else {

                                        //  add count to subscription_counter for customer ID
                                        subscription_counter.set( customer_id, subscription_id );

                                        //  check if they used a refer_a_friend coupon code - length greater than 8. If so, credit the referrer
                                        if ( coupon ) {

                                            if ( coupon.length > 8 ) {

                                                logger.info( 'Referral refer a friend coupon received - adding promotional credits to giver' );

                                                chargebee.customer.add_promotional_credits( coupon, {
                                                    amount: 1000,
                                                    description: "refer_a_friend credits"
                                                } ).request( function ( error, result ) {
                                                    if ( error ) {
                                                        logger.error( 'Failed to give referral credits to customer in Chargebee with ID: ' + customer_id );
                                                    }
                                                } );
                                            }
                                        }

                                        if ( process.env.ENVIRONMENT == 'prod' ) {
                                            //  notify Slack
                                            slack_notifier.send( 'subscription_created', customer, webhook_sub_object );
                                        }

                                    }
                                } );
                            }
                        } );
                    }
                }
            );

        } );


    }
    else if ( req.body.event_type == 'subscription_renewed' ) {

        /*
         *  On subscription renewal check whether it's a delivery month. If so, create a sales order in cin7.
         *  If not a delivery month, increment the subscription count in redis
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

                    //  increment counter for customer_id + check if they are due a box
                    subscription_counter.increment_and_check( customer_id, subscription_id, function ( err, res ) {

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

                                        } );
                                    }
                                } );
                            }
                        }
                    } );
                }
            }
        );
    }
    else if ( req.body.event_type == 'subscription_shipping_address_updated' ) {

        /*
         *  If the customer (or us) updates their shipping adress details, pass the updates on to Cin7.
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
                        logger.error( 'Failed to retrieve sales order ID from Cin7 - reason: ' + ( error || ret.msg ) + '. For subscription_id: ' + subscription_id );
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
                                logger.error( 'Failed to update sales order in Cin7 - reason: ' + ( error || ret.msg ) + '. For subscription_id: ' + subscription_id );
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

module.exports = router;
