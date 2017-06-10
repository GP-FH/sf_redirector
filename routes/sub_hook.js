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
var subscription_counter = require( '../subscription_counter.js' );
var slack_notifier = require( '../libs/lib_slack.js' );
var cin7 = require( '../libs/cin7.js' );
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
    logger.info( 'Subscription created for customer with ID: ' + customer_id + ' for plan: ' + plan );

    //  get customer data using customer_id from newly created subscription event
    chargebee.customer.retrieve( customer_id ).request(

      function ( error, result ) {

        if ( error ) {
          logger.error( 'Failed to retrieve customer record from chargebee - reason: ' + JSON.stringify( error ) + '. For customer_id: ' + customer_id );
        }
        else {

          var customer = result.customer;

          cin7.get_customer_record( 'id', 'integrationRef=\'' + customer_id + '\'', function ( err, ret ) {

            if ( err || !ret.ok ) {
              logger.error( 'Failed to check if user exists in Cin7 - reason: ' + error || ret.msg + '. For customer_id: ' + customer_id );
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
                        logger.error( 'Failed to create customer in Cin7 - reason: ' + error || ret.msg + '. For customer_id: ' + customer_id );
                      }
                      else {

                        logger.info( 'Successfully created customer record in Cin7 for customer_id: ' + customer_id + '.  Returned member_id: ' + ret.fields[ 0 ].id );
                        cin7.create_sales_order( ret.fields[ 0 ].id, plan, subscription_id, subscription.cf_topsize, subscription.cf_bottomsize );

                        //  add count to subscription_counter for customer ID
                        subscription_counter.set( customer_id, subscription_id );

                        //  notify Slack
                        slack_notifier.send( 'subscription_created', customer, subscription );
                      }

                    } );
                  }
                }
              );

            }
            else {
              logger.info( 'Request made to find user in cin7 - found. member_id: ' + ret.fields[ 0 ].id + ' I should create a new order now' );

              //  create a new sales order in cin7
              cin7.create_sales_order( ret.fields[ 0 ].id, plan, subscription_id, webhook_sub_object.cf_topsize, webhook_sub_object.cf_bottomsize );

              //  add count to subscription_counter for customer ID
              subscription_counter.set( customer_id, subscription_id );

              //  notify Slack
              slack_notifier.send( 'subscription_created', customer, webhook_sub_object );
            }
          } );
        }
      }
    );
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
                    authorization: process.env.CIN7_AUTH
                  },
                  json: true
                };

                request( options, function ( error, response, body ) {

                  if ( error ) {
                    logger.error( 'Failed to retrieve member_id from Cin7 - reason: ' + error + '. For customer_id: ' + customer_id );
                  }
                  else if ( response.statusCode != 200 ) {
                    logger.error( 'Failed to retrieve member_id from Cin7 - status code: ' + response.statusCode + '. For customer_id: ' + customer_id );
                  }
                  else if ( body.length == 0 ) {
                    logger.error( 'Failed to retrieve member_id from Cin7 - reason: customer does not exist for customer_id: ' + customer_id );
                  }
                  else if ( body[ 0 ].success == false ) {
                    logger.error( 'Failed to retrieve member_id from Cin7 - reason: ' + body[ 0 ].errors[ 0 ] + '. For customer_id: ' + customer_id );
                  }
                  else {

                    //  create a new sales order in cin7 (waits a second to avoid rate limiting)
                    setTimeout( function () {
                      cin7.create_sales_order( body[ 0 ].id, plan, subscription_id, subscription.cf_topsize, subscription.cf_bottomsize, subscription.cf_archetype );
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
  else if ( req.body.event_type == 'subscription_shipping_address_updated' ) {

    /*
     *  If the customer (or us) updates their shipping adress details, pass the updates on to Cin7.
     *  Note: this handler only handles shipping address updates.
     *
     */

    var customer_id = req.body.content.subscription.customer_id;
    var subscription = req.body.content.subscription;
    var customer = req.body.content.customer;

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
        authorization: process.env.CIN7_AUTH
      },
      json: true
    };

    request( options, function ( error, response, body ) {

      if ( error ) {
        logger.error( 'Failed to retrieve member_id from Cin7 - reason: ' + error + '. For customer_id: ' + customer_id );
      }
      else if ( response.statusCode != 200 ) {
        logger.error( 'Failed to retrieve member_id from Cin7 - status code: ' + response.statusCode + '. For customer_id: ' + customer_id );
      }
      else if ( body.length == 0 ) {
        logger.error( 'Failed to retrieve member_id from Cin7 - reason: customer does not exist for customer_id: ' + customer_id );
      }
      else if ( body[ 0 ].success == false ) {
        logger.error( 'Failed to retrieve member_id from Cin7 - reason: ' + body[ 0 ].errors[ 0 ] + '. For customer_id: ' + customer_id );
      }
      else {

        //  update customer with changes in cin7 (waits a second to avoid rate limiting)
        setTimeout( function () {

          var update_options = {
            method: 'PUT',
            url: 'https://api.cin7.com/api/v1/Contacts',
            headers: {
              'cache-control': 'no-cache',
              'content-type': 'application/json',
              authorization: process.env.CIN7_AUTH
            },
            body: [ {
              id: body[ 0 ].id,
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
            } ],
            json: true
          };

          request( update_options, function ( error, response, body ) {

            if ( error ) {
              logger.error( 'Failed to update customer in Cin7 - reason: ' + error + '. For customer_id: ' + customer_id );
            }
            else if ( body[ 0 ].success == false ) {
              logger.error( 'Failed to update customer in Cin7 - reason: ' + body[ 0 ].errors[ 0 ] + '. For customer_id: ' + customer_id );
            }

            logger.info( 'Customer information updated for customer ' + body[ 0 ].id + '(cin7), ' + customer_id + '(Chargebee)' );

          } );

        }, 1000 );
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
        authorization: process.env.CIN7_AUTH
      },
      json: true
    };

    request( options, function ( error, response, body ) {

      if ( error ) {
        logger.error( 'Failed to retrieve member_id from Cin7 - reason: ' + error + '. For customer_id: ' + customer_id );
      }
      else if ( response.statusCode != 200 ) {
        logger.error( 'Failed to retrieve member_id from Cin7 - status code: ' + response.statusCode + '. For customer_id: ' + customer_id );
      }
      else if ( body.length == 0 ) {
        logger.error( 'Failed to retrieve member_id from Cin7 - reason: customer does not exist for customer_id: ' + customer_id );
      }
      else if ( body[ 0 ].success == false ) {
        logger.error( 'Failed to retrieve member_id from Cin7 - reason: ' + body[ 0 ].errors[ 0 ] + '. For customer_id: ' + customer_id );
      }
      else {

        //  update customer with changes in cin7 (waits a second to avoid rate limiting)
        setTimeout( function () {

          var update_options = {
            method: 'PUT',
            url: 'https://api.cin7.com/api/v1/Contacts',
            headers: {
              'cache-control': 'no-cache',
              'content-type': 'application/json',
              authorization: process.env.CIN7_AUTH
            },
            body: [ {
              id: body[ 0 ].id,
              integrationRef: customer_id,
              isActive: true,
              type: 'Customer',
              firstName: customer.first_name,
              lastName: customer.last_name,
              email: customer.email,
              phone: customer.phone
            } ],
            json: true
          };

          request( update_options, function ( error, response, body ) {

            if ( error ) {
              logger.error( 'Failed to update customer in Cin7 - reason: ' + error + '. For customer_id: ' + customer_id );
            }
            else if ( body[ 0 ].success == false ) {
              logger.error( 'Failed to update customer in Cin7 - reason: ' + body[ 0 ].errors[ 0 ] + '. For customer_id: ' + customer_id );
            }

            logger.info( 'Customer information updated for customer ' + body[ 0 ].id + '(cin7), ' + customer_id + '(Chargebee)' );

          } );

        }, 1000 );
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
    var archetype = req.body.content.subscription.cf_archetype;

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
        authorization: process.env.CIN7_AUTH
      },
      json: true
    };

    request( options, function ( error, response, body ) {

      if ( error ) {
        logger.error( 'Failed to retrieve member_id from Cin7 - reason: ' + error + '. For customer_id: ' + customer_id );
      }
      else if ( response.statusCode != 200 ) {
        logger.error( 'Failed to retrieve member_id from Cin7 - status code: ' + response.statusCode + '. For customer_id: ' + customer_id );
      }
      else if ( body.length == 0 ) {
        logger.error( 'Failed to retrieve member_id from Cin7 - reason: customer does not exist for customer_id: ' + customer_id );
      }
      else if ( body[ 0 ].success == false ) {
        logger.error( 'Failed to retrieve member_id from Cin7 - reason: ' + body[ 0 ].errors[ 0 ] + '. For customer_id: ' + customer_id );
      }
      else {

        setTimeout( function () {
          //  get sales order ID
          var sales_get_options = {
            method: 'GET',
            url: 'https://api.cin7.com/api/v1/SalesOrders',
            qs: {
              fields: 'id,internalComments',
              where: 'internalComments LIKE\'%' + subscription_id + '\''
            },
            headers: {
              'cache-control': 'no-cache',
              authorization: process.env.CIN7_AUTH
            },
            json: true
          };

          request( sales_get_options, function ( error, response, body ) {

            if ( error ) {
              logger.error( 'Failed to retrieve sales order ID from Cin7 - reason: ' + error + '. For subscription_id: ' + subscription_id );
            }
            else if ( response.statusCode != 200 ) {
              logger.error( 'Failed to retrieve sales order ID in Cin7 - status code: ' + response.statusCode + '. For subscription_id: ' + subscription_id );
            }
            else if ( body.length == 0 ) {
              logger.error( 'Failed to retrieve sales order ID from Cin7 - reason: sales order does not exist for subscription_id: ' + subscription_id );
            }
            else if ( body[ 0 ].success == false ) {
              logger.error( 'Failed to retrieve sales order ID from Cin7 - reason: ' + body[ 0 ].errors[ 0 ] + '. For subscription_id: ' + subscription_id );
            }
            else {

              setTimeout( function () {
                //  update the sales order with the archetype
                var sales_put_options = {
                  method: 'PUT',
                  url: 'https://api.cin7.com/api/v1/SalesOrders',
                  headers: {
                    'cache-control': 'no-cache',
                    'content-type': 'application/json',
                    authorization: process.env.CIN7_AUTH
                  },
                  body: [ {
                    id: body[ 0 ].id,
                    internalComments: 'archetype: ' + archetype + ' ' + body[ 0 ].internalComments, // add change here
                    currencyCode: 'NZD',
                    taxStatus: 'Incl',
                    taxRate: 0.15
                  } ],
                  json: true
                };

                request( sales_put_options, function ( error, response, body ) {
                  if ( error ) {
                    logger.error( 'Failed to update sales order in Cin7 - reason: ' + error + '. For subscription_id: ' + subscription_id );
                  }
                  else if ( response.statusCode != 200 ) {
                    logger.error( 'Failed to update sales order in Cin7 - status code: ' + response.statusCode + '. For subscription_id: ' + subscription_id );
                  }
                  else if ( body[ 0 ].success == false ) {
                    logger.error( 'Failed to update sales order in Cin7 - reason: ' + body[ 0 ].errors[ 0 ] + '. For subscription_id: ' + subscription_id );
                  }
                  else {
                    logger.info( 'Detected addition of archetype: ' + archetype + ' to subscription with ID: ' + subscription_id + '. Updated corresponding Cin7 Sales order' );
                  }
                } );
              }, 1000 );
            }
          } );
        }, 1000 );
      }
    } );
  }
  else if ( req.body.event_type == 'subscription_cancelled' ) {

    /*
     *  For notifying in Slack when a subscription has been cancelled
     */

    var customer = req.body.content.customer;
    var subscription = req.body.content.subscription;

    //  notify Slack
    slack_notifier.send( 'subscription_cancelled', customer, subscription );

  }
} );

module.exports = router;
