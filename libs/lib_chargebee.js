var logger = require( './lib_logger.js' );
var chargebee = require( 'chargebee' );
chargebee.configure( {
    site: process.env.CHARGEBEE_SITE,
    api_key: process.env.CHARGEBEE_API_KEY
} );

/*
 * This function is a promise wrapper for the customer retrieval functions of the chargebee module.
 * It returns a customer object full of useful information.
 */
var chargebee_get_customer_info = ( customer_id ) => {
    return new Promise( ( resolve, reject ) => {
        if ( customer_id === undefined ) {
            return reject( {
                ok: false,
                err_msg: 'Required parameter (customer_id) is undefined. ',
                meta: {
                    customer_id: 'undefined',
                    function: 'chargebee_get_customer_info()'
                }
            } );
        }

        chargebee.customer.retrieve( customer_id ).request( ( err, ret ) => {
            if ( err ) {
                return reject( {
                    ok: false,
                    err_msg: err,
                    meta: {
                        customer_id: customer_id,
                        function: 'chargebee_get_customer_info()'
                    }
                } );
            }
            return resolve( {
                ok: true,
                customer: ret.customer
            } );
        } );
    } );
};

/*
 * This function is a promise wrapper for the subscription retrieval functions of the chargebee module.
 * Similar to the above function it returns a subscription object full of good stuff.
 */
var chargebee_get_subscription_info = ( subscription_id ) => {
    return new Promise( ( resolve, reject ) => {
        if ( subscription_id === undefined ) {
            return reject( {
                ok: false,
                err_msg: 'Required parameter (subscription_id) is undefined. ',
                meta: {
                    subscription_id: 'undefined',
                    function: 'chargebee_get_subscription_info()'
                }
            } );
        }
        chargebee.subscription.retrieve( subscription_id ).request( ( err, ret ) => {
            if ( err ) {
                return reject( {
                    ok: false,
                    err_msg: err,
                    meta: {
                        subscription_id: subscription.id,
                        function: 'chargebee_get_subscription_info()'
                    }
                } );
            }
            return resolve( {
                ok: true,
                subscription: ret.subscription
            } );
        } );
    } );
};

exports.chargebee_get_customer_info = chargebee_get_customer_info;
exports.chargebee_get_subscription_info = chargebee_get_subscription_info;
