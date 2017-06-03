var request = require( 'request' );
var logger = require( './log_service.js' );

/*
 *  Creates a sales order in Cin7 for the given member and subscription plan
 */
exports.create = function ( member_id, plan_id, subscription_id, size_top, size_bottom, archetype = 'NOT_SET' ) {

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
      internalComments: 'archetype: ' + archetype + ' top size: ' + size_top + ' bottom size: ' + size_bottom + ' subscription: ' + subscription_id
    } ],
    json: true
  };

  request( options, function ( error, response, body ) {

    if ( error ) {
      logger.error( 'Failed to create sales order in Cin7 - reason: ' + error + '. For member_id: ' + member_id );
    }
    else if ( body[ 0 ].success == false ) {
      logger.error( 'Failed to create sales order in Cin7 - reason: ' + body[ 0 ].errors[ 0 ] + '. For member_id: ' + member_id + ' and plan_id: ' + plan_id );
    }
    else {
      logger.info( 'Successfully created sales order for member_id: ' + member_id );
    }
  } );
}
