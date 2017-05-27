/*
 *
 *  Stitchfox Redirector: This service keeps chargebee and cin7 in check - see README for more detailed information
 *
 */

require( 'dotenv' ).config( {
  path: '/home/dev/redirect_node/current/config/config.env'
} );
var request = require( 'request' );
var logger = require( './log_service.js' );
var chargebee = require( 'chargebee' );
var bodyparser = require( 'body-parser' );
var subscription_counter = require( './subscription_counter.js' );
var slack_notifier = require( './slack_notifier.js' );
var order_manager = require( './order_manager.js' );
var app = require( 'express' )();
var https = require( 'https' );
var fs = require( 'fs' );
var ssl_path = process.env.SSL_PATH;
var key = process.env.SSL_KEY;
var cert = process.env.SSL_CERT;
var options = {
  key: fs.readFileSync( ssl_path + key ),
  cert: fs.readFileSync( ssl_path + cert )
};
var server = https.createServer( options, app );

//  set Chargebee creds
chargebee.configure( {
  site: process.env.CHARGEBEE_SITE,
  api_key: process.env.CHARGEBEE_API_KEY
} );

app.use( bodyparser.json() );
app.use( bodyparser.urlencoded( {
  extended: true
} ) );

/*
 *  listening for Typeform submits
 */
app.get( '/', function ( req, res ) {

  logger.info( 'TMP DEBUG: request received: ' + JSON.stringify( req.body ) + ' ' + JSON.stringify( req.query ) + ' ' + req.url + ' ' + JSON.stringify( req.headers ) );

  //  only bother with requests coming from the correct typeform TODO: will need to ditch this/add allowance for autopilot
  if ( req.get( 'Referer' ).includes( process.env.TYPEFORM_REFERRING_URL ) ) {

    //  get a new checkout page from Chargebee
    chargebee.hosted_page.checkout_new( {

      subscription: {
        plan_id: req.query.boxtype
      },
      customer: {
        email: req.query.email,
        first_name: req.query.fname,
        last_name: req.query.lname,
        phone: req.query.phone,
        cf_gender: req.query.gender,
        cf_childname: req.query.hername || req.query.hisname,
        cf_childage: req.query.sheage || req.query.heage,
        cf_size: req.query.size,
        cf_jam: req.query.jam1 || req.query.jam2 || req.query.jam3 || req.query.jam4 || req.query.jam5 || req.query.jam6,
        cf_doit: req.query.doit1 || req.query.doit2 || req.query.doit3 || req.query.doit4 || req.query.doit5 || req.query.doit6,
        cf_palette: req.query.palette,
        cf_fave: req.query.fav1 || req.query.fav2,
        cf_keen: req.query.keen1 || req.query.keen2 || req.query.keen3,
        cf_else: req.query.else
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
} );

/*
 *  listening for webhook events
 */
app.post( '/', function ( req, res ) {

  //  send immediate 200OK to keep chargebee happy and prevent unneccessary retries
  res.status( 200 ).send();

  /*
   *  On subscription creation, a new customer and a new sales order is created in Cin7
   */
  if ( req.body.event_type == 'subscription_created' ) {

    var customer_id = req.body.content.subscription.customer_id;
    var plan = req.body.content.subscription.plan_id;
    var subscription_id = req.body.content.subscription.id;
    logger.info( 'Subscription created for customer with ID: ' + customer_id + ' for plan: ' + plan );

    //  get customer data using customer_id from newly created subscription event
    chargebee.customer.retrieve( customer_id ).request(

      function ( error, result ) {

        if ( error ) {
          logger.error( 'Failed to retrieve customer record from chargebee - reason: ' + JSON.stringify( error ) + '. For customer_id: ' + customer_id );
        }
        else {

          var customer = result.customer;

          //  check if customer record exists in cin7
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
              logger.error( 'Failed to check if user exists in Cin7 - reason: ' + error + '. For customer_id: ' + customer_id );
            }
            else if ( response.statusCode != 200 ) {
              logger.error( 'Failed to check if user exists in Cin7 - reason: status code ' + response.statusCode + '. For customer_id: ' + customer_id );
            }
            else if ( body.length == 0 ) {
              logger.info( 'Request made to find user in cin7 - no user found. I should create one' );

              //  get subscription object for new subscription so that the correct shipping address is sent to cin7 customer record
              chargebee.subscription.retrieve( subscription_id ).request(

                function ( error, result ) {

                  if ( error ) {
                    logger.error( 'Failed to retrieve subscription record from chargebee - reason: ' + JSON.stringify( error ) + '. For customer_id: ' + customer_id + ' subscription_id: ' + subscription_id );
                  }
                  else {

                    var subscription = result.subscription;

                    //  create customer record in cin7
                    var req_options = {
                      method: 'POST',
                      url: 'https://api.cin7.com/api/v1/Contacts',
                      headers: {
                        'cache-control': 'no-cache',
                        'content-type': 'application/json',
                        authorization: process.env.CIN7_AUTH
                      },
                      body: [ {
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
                      } ],
                      json: true
                    };

                    request( req_options, function ( error, response, body ) {

                      if ( error ) {
                        logger.error( 'Failed to create customer in Cin7 - reason: ' + error + '. For customer_id: ' + customer_id );
                      }
                      else if ( body[ 0 ].success == false ) {
                        logger.error( 'Failed to create customer in Cin7 - reason: ' + body[ 0 ].errors[ 0 ] + '. For customer_id: ' + customer_id + ' body:' + JSON.stringify( body ) );
                      }
                      else {

                        logger.info( 'Successfully created customer record in Cin7 for customer_id: ' + customer_id + '.  Returned member_id: ' + body[ 0 ].id );

                        //  create a new sales order in cin7 (waits a second to avoid rate limiting)
                        setTimeout( function () {
                          order_manager.create( body[ 0 ].id, plan, subscription_id );
                        }, 1000 );

                        //  add count to subscription_counter for customer ID
                        subscription_counter.set( customer_id, subscription_id );

                        //  notify Slack
                        slack_notifier.send( customer.first_name, customer.last_name, customer.email, subscription.shipping_address.city, plan );
                      }
                    } );
                  }
                }
              );
            }
            else {
              logger.info( 'Request made to find user in cin7 - found. member_id: ' + body[ 0 ].id + ' I should create a new order now' );

              //  create a new sales order in cin7 (waits a second to avoid rate limiting)
              setTimeout( function () {
                order_manager.create( body[ 0 ].id, plan, subscription_id );
              }, 1000 );

              //  add count to subscription_counter for customer ID
              subscription_counter.set( customer_id, subscription_id );

              //  notify Slack
              // slack_notifier.send( customer.first_name, customer.last_name, customer.email, subscription.shipping_address.city, plan );

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
                  else if ( body[ 0 ].success == false ) {
                    logger.error( 'Failed to retrieve member_id from Cin7 - reason: ' + body[ 0 ].errors[ 0 ] + '. For customer_id: ' + customer_id );
                  }
                  else {

                    //  create a new sales order in cin7 (waits a second to avoid rate limiting)
                    setTimeout( function () {
                      order_manager.create( body[ 0 ].id, plan, subscription_id );
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
     *  the archtype is added to the sales order in Cin7 ISSUE: need a way to know which cin7 salesorder this subscription
     *  relates to.
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
              fields: 'id',
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
              logger.error( 'Failed to retrieve sales order ID from Cin7 - reason: ' + error + '. For customer_id: ' + customer_id );
            }
            else if ( body.length == 0 ) {
              logger.error( 'Failed to retrieve sales order ID from Cin7 - reason: sales order does not exist for subscription_id: ' + subscription_id );
            }
            else if ( body[ 0 ].success == false ) {
              logger.error( 'Failed to retrieve sales order ID from Cin7 - reason: ' + body[ 0 ].errors[ 0 ] + '. For customer_id: ' + customer_id );
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
                    internalComments: archetype + ' ' + subscription_id,
                    currencyCode: 'NZD'
                  } ],
                  json: true
                };

                request( sales_put_options, function ( error, response, body ) {
                  logger.info( 'DEBUG: error: ' + JSON.stringify( error ) + ' response:' + JSON.stringify( response ) + ' body: ' + JSON.stringify );
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
} );

server.listen( 443, function () {

  logger.info( 'Server started and listening' );

} );
