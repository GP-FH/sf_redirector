var request = require( 'request' );
var logger = require( './lib_logger.js' );

/*********************************************Sales Order Actions***********************************************/

/*
 *  Creates a sales order in Cin7 for the given member and subscription plan
 */
var create_sales_order = function ( member_id, plan_id, subscription_id, size_top, size_bottom, archetype = 'NOT_SET', callback ) {

  var options = {
    method: 'POST',
    url: 'https://api.cin7.com/api/v1/SalesOrders',
    headers: {
      'cache-control': 'no-cache',
      'content-type': 'application/json',
      authorization: process.env.CIN7_AUTH
    },
    body: [ {
      stage: 'New',
      memberId: member_id,
      currencyCode: 'NZD',
      taxStatus: 'Incl',
      taxRate: 0.15,
      internalComments: 'plan: ' + plan_id + ' archetype: ' + archetype + ' top size: ' + size_top + ' bottom size: ' + size_bottom + ' subscription: ' + subscription_id
    } ],
    json: true
  };

  request( options, function ( error, response, body ) {
    logger.info( 'DEBUG: response:' + JSON.stringify( response ) + ' error: ' + error );
    if ( error ) {
      return callback( error );
    }
    else if ( response.statusCode != 200 ) {
      return callback( null, {
        ok: false,
        msg: 'status code ' + response.statusCode + ' reason: ' + response.body
      } );
    }
    else {
      return callback( null, {
        ok: true,
        fields: body
      } )
    }
  } );

};

var get_sales_order = function ( field_wanted, filter, callback ) {

  var options = {
    method: 'GET',
    url: 'https://api.cin7.com/api/v1/SalesOrders',
    qs: {
      fields: field_wanted,
      where: filter
    },
    headers: {
      'cache-control': 'no-cache',
      authorization: process.env.CIN7_AUTH
    },
    json: true
  };

  request( options, function ( error, response, body ) {

    if ( error ) {
      return callback( error );
    }
    else if ( response.statusCode != 200 ) {
      return callback( null, {
        ok: false,
        msg: 'status code ' + response.statusCode + ' reason: ' + response.body
      } );
    }
    else {
      return callback( null, {
        ok: true,
        fields: body
      } )
    }
  } );

};

var update_sales_order = function ( update_details, callback ) {

  var options = {
    method: 'PUT',
    url: 'https://api.cin7.com/api/v1/SalesOrders',
    headers: {
      'cache-control': 'no-cache',
      'content-type': 'application/json',
      authorization: process.env.CIN7_AUTH
    },
    body: update_details,
    json: true
  };

  request( options, function ( error, response, body ) {

    if ( error ) {
      return callback( error );
    }
    else if ( response.statusCode != 200 ) {
      return callback( null, {
        ok: false,
        msg: 'status code ' + response.statusCode + ' reason: ' + response.body
      } );
    }
    else {
      return callback( null, {
        ok: true,
        fields: body
      } )
    }
  } );

};

/*********************************************Customer Record Actions***********************************************/

var get_customer_record = function ( field_wanted, filter, callback ) {

  //  check if customer record exists in cin7
  var options = {
    method: 'GET',
    url: 'https://api.cin7.com/api/v1/Contacts',
    qs: {
      fields: field_wanted,
      where: filter
    },
    headers: {
      'cache-control': 'no-cache',
      authorization: process.env.CIN7_AUTH
    },
    json: true
  };

  //TODO missing an error case here (success:false)
  request( options, function ( error, response, body ) {

    if ( error ) {
      return callback( error );
    }
    else if ( response.statusCode != 200 ) {
      return callback( null, {
        ok: false,
        msg: 'status code ' + response.statusCode + ' reason: ' + response.body
      } );
    }
    else {
      return callback( null, {
        ok: true,
        fields: body
      } )
    }
  } );

};

var update_customer_record = function ( update_details, callback ) {

  var options = {
    method: 'PUT',
    url: 'https://api.cin7.com/api/v1/Contacts',
    headers: {
      'cache-control': 'no-cache',
      'content-type': 'application/json',
      authorization: process.env.CIN7_AUTH
    },
    body: update_details,
    json: true
  };

  request( options, function ( error, response, body ) {

    if ( error ) {
      return callback( error );
    }
    else if ( response.statusCode != 200 ) {
      return callback( null, {
        ok: false,
        msg: 'status code ' + response.statusCode + ' reason: ' + response.body
      } );
    }
    else {
      return callback( null, {
        ok: true,
        fields: body
      } )
    }
  } );

};

var create_customer_record = function ( customer_details, callback ) {

  var options = {
    method: 'POST',
    url: 'https://api.cin7.com/api/v1/Contacts',
    headers: {
      'cache-control': 'no-cache',
      'content-type': 'application/json',
      authorization: process.env.CIN7_AUTH
    },
    body: customer_details,
    json: true
  };

  request( options, function ( error, response, body ) {

    if ( error ) {
      return callback( error );
    }
    else if ( response.statusCode != 200 ) {
      return callback( null, {
        ok: false,
        msg: 'status code ' + response.statusCode + ' reason: ' + response.body
      } );
    }
    else {
      return callback( null, {
        ok: true,
        fields: body
      } )
    }
  } );
};

exports.create_sales_order = create_sales_order;
exports.get_sales_order = get_sales_order;
exports.update_sales_order = update_sales_order;
exports.get_customer_record = get_customer_record;
exports.update_customer_record = update_customer_record;
exports.create_customer_record = create_customer_record;
