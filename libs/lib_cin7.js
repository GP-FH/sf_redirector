/*
 *
 *  lib_cin7: this lib provides an interface for interacting with Cin7. Currently it allows us to
 *  create/get/update Sales Orders and Customer records. This is V0.1 of this lib and it still
 *  needs some refactoring to make it a bit more flexible/take some of the implementation burden
 *  away from the calling parties.
 *
 */

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

    setTimeout( function () {
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
    }, 1000 );


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

    setTimeout( function () {
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
    }, 1000 );


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

    setTimeout( function () {
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
    }, 1000 );

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

    setTimeout( function () {
        request( options, function ( error, response, body ) {


            if ( error ) {
                logger.info( 'DEBUG: error: ' + error );
                return callback( error );
            }
            else if ( response.statusCode != 200 ) {
                logger.info( 'DEBUG: non-200' );
                return callback( null, {
                    ok: false,
                    msg: 'status code ' + response.statusCode + ' reason: ' + response.body
                } );
            }
            else {
                logger.info( 'DEBUG: 200' );
                return callback( null, {
                    ok: true,
                    fields: body
                } )
            }
        } );
    }, 1000 );

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

    setTimeout( function () {
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
    }, 1000 );
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

    setTimeout( function () {
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
    }, 1000 );

};

exports.create_sales_order = create_sales_order;
exports.get_sales_order = get_sales_order;
exports.update_sales_order = update_sales_order;
exports.get_customer_record = get_customer_record;
exports.update_customer_record = update_customer_record;
exports.create_customer_record = create_customer_record;
