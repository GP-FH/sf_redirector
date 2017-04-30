var request = require( 'request' );
var logger = require( './log_service.js' );

/*
 *  Creates a sales order in Cin7 for the given member and subscription plan
 */
exports.create = function ( member_id, plan_id ) {

  var options = {
    method: 'POST',
    url: 'https://api.cin7.com/api/v1/SalesOrders',
    headers: {
      'cache-control': 'no-cache',
      'content-type': 'application/json',
      authorization: 'Basic U3RpdGNoZm94Tlo6ZDczMzNmNmM5MTQxNDgxNjhlMmQ5NzIwNTYxYzQ2OTM='
    },
    body: [ {
      stage: 'New',
      memberId: member_id,
      currencyCode: 'NZD',
      taxStatus: 'Incl',
      taxRate: 0.15,
      internalComments: plan_id
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
