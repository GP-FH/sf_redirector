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
var RateLimiter = require( 'limiter' ).RateLimiter;
var limiter = new RateLimiter( 1, 3000 );
var util = require( 'underscore' );


/*********************************************Sales Order Actions***********************************************/

/*
 *  Creates a sales order in Cin7 for the given member and subscription plan
 */
var create_sales_order = function ( member_id, plan_id, subscription_id, size_top, size_bottom, archetype = 'NOT_SET', callback ) {
    /*
     *  For accounting purposes we add a dummy 'box' product to sales orders with a unit price equal to the total value of
     *  a box. This allows us to calculate payments received against the total value (treating subscibers as debtors)
     */
    var plan_product = {};

    switch ( plan_id ) {
    case 'deluxe-box':
        plan_product = {
            Code: 'STX-DELUXE-MON',
            Name: 'Deluxe Box',
            Option1: 'MON',
            Option2: 'MONTH',
            Option3: '1 x OSFA',
            Qty: 1

        };
        break;
    case 'deluxe-box-weekly':
        plan_product = {
            Code: 'STX-DELUXE-WEK',
            Name: 'Deluxe Box',
            Option1: 'WEK',
            Option2: 'WEEK',
            Option3: '1 x OSFA',
            Qty: 1

        };
        break;

    case 'premium-box':
        plan_product = {
            Code: 'STX-PREMIUM-MON',
            Name: 'Premium Box',
            Option1: 'MON',
            Option2: 'MONTH',
            Option3: '1 x OSFA',
            Qty: 1
        };
        break;

    case 'premium-box-weekly':
        plan_product = {
            Code: 'STX-PREMIUM-WEK',
            Name: 'Premium Box',
            Option1: 'WEK',
            Option2: 'WEEK',
            Option3: '1 x OSFA',
            Qty: 1
        };
        break;
    default:
        logger.warn( 'Unrecognised plan_id passed on creation of sales order for subscription: ' + subscription_id );
    }

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
            internalComments: 'plan: ' + plan_id + ' archetype: ' + archetype + ' top size: ' + size_top + ' bottom size: ' + size_bottom + ' subscription: ' + subscription_id,
            lineItems: [
                plan_product
            ]
        } ],
        json: true
    };

    _throttled_request( options, function ( err, cb ) {

        if ( err ) {
            return callback( err );
        }

        return callback( null, cb );
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

    _throttled_request( options, function ( err, cb ) {

        if ( err ) {
            return callback( err );
        }

        return callback( null, cb );
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

    _throttled_request( options, function ( err, cb ) {

        if ( err ) {
            return callback( err );
        }

        return callback( null, cb );
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

    _throttled_request( options, function ( err, cb ) {

        if ( err ) {
            return callback( err );
        }

        return callback( null, cb );
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

    _throttled_request( options, function ( err, cb ) {

        if ( err ) {
            return callback( err );
        }

        return callback( null, cb );
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

    _throttled_request( options, function ( err, cb ) {

        if ( err ) {
            return callback( err );
        }

        return callback( null, cb );
    } );
};

/****************************************************** promisified functions ***********************************************/

/*
 * A promise wrapper around a call to the Cin7 API. This functions checks for a customer with the given
 * email and returns the customers member_id if found + exists=true.
 */
var cin7_check_customer_exists = ( email ) => {
    return new Promise( ( resolve, reject ) => {
        if ( email === undefined ) {
            return reject( {
                ok: false,
                err_msg: 'Missing parameter',
                meta: {
                    email: email,
                    function: 'cin7_check_customer_exists()'
                }
            } );
        }

        var options = {
            method: 'GET',
            url: 'https://api.cin7.com/api/v1/Contacts',
            qs: {
                fields: 'id',
                where: 'email=\'' + email + '\''
            },
            headers: {
                'cache-control': 'no-cache',
                authorization: process.env.CIN7_AUTH
            },
            json: true
        };

        _throttled_request( options, ( err, ret ) => {
            if ( err ) {
                return reject( {
                    ok: false,
                    err_msg: err,
                    meta: {
                        email: email,
                        function: 'cin7_check_customer_exists()'
                    }
                } );
            }

            if ( !ret.ok ) {
                return reject( {
                    ok: false,
                    err_msg: ret.msg,
                    meta: {
                        email: email,
                        function: 'cin7_check_customer_exists()'
                    }
                } );
            }

            var exists = util.isEmpty( ret.fields ) ? false : true;
            var id = exists ? ret.fields[ 0 ].id : false;

            return resolve( {
                ok: true,
                exists: exists,
                id: id
            } );
        } );
    } );
};

/*
 * A promise wrapper around a call to the Cin7 API. This function creates a customer record
 * in Cin7 using information from Chargebee. It returns the customer's member_id.
 */
var cin7_create_customer_record = ( customer, subscription ) => {
    return new Promise( ( resolve, reject ) => {
        if ( customer === undefined || subscription === undefined ) {
            return reject( {
                ok: false,
                err_msg: 'Missing parameter',
                meta: {
                    customer_id: 'undefined',
                    subscription_id: 'undefined',
                    function: 'cin7_create_customer_record()'
                }
            } );
        }

        var customer_details = [ {
            integrationRef: customer.id,
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

        _throttled_request( options, ( err, ret ) => {
            if ( err ) {
                return reject( {
                    ok: false,
                    err_msg: err,
                    meta: {
                        customer_id: customer.id,
                        subscription_id: subscription.id,
                        function: 'cin7_create_customer_record()'
                    }
                } );
            }

            if ( !ret.ok ) {
                return reject( {
                    ok: false,
                    err_msg: ret.msg,
                    meta: {
                        customer_id: customer.id,
                        subscription_id: subscription.id,
                        function: 'cin7_create_customer_record()'
                    }
                } );
            }

            if ( util.isEmpty( ret.fields ) ) {
                return reject( {
                    ok: false,
                    err_msg: 'Empty_response from Cin7',
                    meta: {
                        customer_id: customer.id,
                        subscription_id: subscription.id,
                        function: 'cin7_create_customer_record()'
                    }
                } );
            }

            if ( !ret.fields[ 0 ].success ) {
                return reject( {
                    ok: false,
                    err_msg: ret.fields[ 0 ].errors.toString(),
                    meta: {
                        customer_id: customer.id,
                        subscription_id: subscription.id
                    }
                } );
            }

            return resolve( {
                ok: true,
                id: ret.fields[ 0 ].id
            } );


        } );
    } );
};

/*
 * A promise wrapper around a call to the Cin7 API. This function creates a sales order in Cin7. Sales orders
 * are created seasonally with generation controlled by the renewal_tracker.
 */
var cin7_create_sales_order = ( member_id, plan_id, subscription_id, size_top, size_bottom, archetype = 'NOT_SET' ) => {
    return new Promise( ( resolve, reject ) => {
        if ( member_id === undefined || plan_id === undefined || subscription_id === undefined || size_top === undefined || size_bottom === undefined ) {
            return reject( {
                ok: false,
                err_msg: 'Missing parameter',
                meta: {
                    member_id: member_id,
                    plan_id: plan_id,
                    subscription_id: subscription_id,
                    size_top: size_top,
                    size_bottom: size_bottom,
                    function: 'cin7_create_sales_order()'
                }
            } );
        }

        /*
         *  For accounting purposes we add a dummy 'box' product to sales orders with a unit price equal to the total value of
         *  a box. This allows us to calculate payments received against the total value (treating subscibers as debtors)
         */

        var plan_product = {};

        switch ( plan_id ) {
        case 'deluxe-box':
            plan_product = {
                Code: 'STX-DELUXE-MON',
                Name: 'Deluxe Box',
                Option1: 'MON',
                Option2: 'MONTH',
                Option3: '1 x OSFA',
                Qty: 1

            };
            break;
        case 'deluxe-box-weekly':
            plan_product = {
                Code: 'STX-DELUXE-WEK',
                Name: 'Deluxe Box',
                Option1: 'WEK',
                Option2: 'WEEK',
                Option3: '1 x OSFA',
                Qty: 1

            };
            break;

        case 'premium-box':
            plan_product = {
                Code: 'STX-PREMIUM-MON',
                Name: 'Premium Box',
                Option1: 'MON',
                Option2: 'MONTH',
                Option3: '1 x OSFA',
                Qty: 1
            };
            break;

        case 'premium-box-weekly':
            plan_product = {
                Code: 'STX-PREMIUM-WEK',
                Name: 'Premium Box',
                Option1: 'WEK',
                Option2: 'WEEK',
                Option3: '1 x OSFA',
                Qty: 1
            };
            break;

        case 'style-pack':
            plan_product = {
                Code: 'STX-STE-PAK',
                Name: 'Style One-Off',
                Option1: 'PAK',
                Option2: 'Style Pack',
                Qty: 1
            };
            break;
        case 'style-chest':
            plan_product = {
                Code: 'STX-STE-CHT',
                Name: 'Style One-Off',
                Option1: 'CHT',
                Option2: 'Style Chest',
                Qty: 1
            };
            break;
        case 'style-pack':
            plan_product = {
                Code: 'STX-STE-BOB',
                Name: 'Style One-Off',
                Option1: 'BOB',
                Option2: 'Style Bomb',
                Qty: 1
            };
            break;
        default:
            return reject( {
                ok: false,
                err_msg: 'Unrecognised plan_id received.',
                meta: {
                    member_id: member_id,
                    plan_id: plan_id,
                    subscription_id: subscription_id,
                    function: 'cin7_create_sales_order()'
                }
            } );
        }

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
                internalComments: 'plan: ' + plan_id + ' archetype: ' + archetype + ' top size: ' + size_top + ' bottom size: ' + size_bottom + ' subscription: ' + subscription_id,
                lineItems: [
                    plan_product
                ]
            } ],
            json: true
        };

        _throttled_request( options, ( err, ret ) => {
            if ( err ) {
                return reject( {
                    ok: false,
                    err_msg: err,
                    meta: {
                        member_id: member_id,
                        plan_id: plan_id,
                        subscription_id: subscription_id,
                        function: 'cin7_create_sales_order()'
                    }
                } );
            }

            if ( !ret.ok ) {
                return reject( {
                    ok: false,
                    err_msg: ret.msg,
                    meta: {
                        member_id: member_id,
                        plan_id: plan_id,
                        subscription_id: subscription_id,
                        function: 'cin7_create_sales_order()'
                    }
                } );
            }

            if ( util.isEmpty( ret.fields ) ) {
                return reject( {
                    ok: false,
                    err_msg: 'Empty_response from Cin7',
                    meta: {
                        member_id: member_id,
                        plan_id: plan_id,
                        subscription_id: subscription_id,
                        function: 'cin7_create_sales_order()'
                    }
                } );
            }

            if ( !ret.fields[ 0 ].success ) {
                return reject( {
                    ok: false,
                    err_msg: ret.fields[ 0 ].errors.toString(),
                    meta: {
                        member_id: member_id,
                        plan_id: plan_id,
                        subscription_id: subscription_id,
                        function: 'cin7_create_sales_order()'
                    }
                } );
            }

            return resolve( {
                ok: true,
                id: ret.fields[ 0 ].id,
                resolve: true
            } );
        } );

    } );
};

exports.create_sales_order = create_sales_order;
exports.get_sales_order = get_sales_order;
exports.update_sales_order = update_sales_order;
exports.get_customer_record = get_customer_record;
exports.update_customer_record = update_customer_record;
exports.create_customer_record = create_customer_record;
exports.cin7_check_customer_exists = cin7_check_customer_exists;
exports.cin7_create_customer_record = cin7_create_customer_record;
exports.cin7_create_sales_order = cin7_create_sales_order;

/******************************************************** private functions ************************************************/

/*
 *  request wrapper - allows us to rate limit and queue requests to the cin7 API
 */
function _throttled_request( options, callback ) {
    var request_args = options;
    limiter.removeTokens( 1, function () {
        request( request_args, function ( error, response, body ) {

            if ( error ) {
                return callback( error );
            }
            else if ( response.statusCode != 200 ) { //NOTE: handle this case properly Marcelo
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
    } );
};
