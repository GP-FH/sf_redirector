var logger = require( './lib_logger.js' );
var chargebee = require( 'chargebee' );
chargebee.configure( {
    site: process.env.CHARGEBEE_SITE,
    api_key: process.env.CHARGEBEE_API_KEY
} );

var chargebee_get_customer_info = ( customer_id ) => {
    return new Promise( ( resolve, reject ) => {
        if ( customer_id === undefined ) {
            logger.info( 'DEBUG: chargebee_get_customer_info() - invalid param' );
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
                logger.info( 'DEBUG: chargebee_get_customer_info() - request error' );
                return reject( {
                    ok: false,
                    err_msg: err,
                    meta: {
                        customer_id: customer_id,
                        function: 'chargebee_get_customer_info()'
                    }
                } );
            }
            logger.info( 'DEBUG: chargebee_get_customer_info() - returning success' );
            return resolve( {
                ok: true,
                customer: ret.customer
            } );
        } );
    } );
};

var chargebee_get_subscription_info = ( subscription_id ) => {
    return new Promise( ( resolve, reject ) => {
        if ( subscription_id === undefined ) {
            logger.info( 'DEBUG: chargebee_get_subscription_info() - invalid param' );
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
                logger.info( 'DEBUG: chargebee_get_subscription_info() - request error' );
                return reject( {
                    ok: false,
                    err_msg: err,
                    meta: {
                        subscription_id: subscription.id,
                        function: 'chargebee_get_subscription_info()'
                    }
                } );
            }
            logger.info( 'DEBUG: chargebee_get_subscription_info() - returning success' );
            return resolve( {
                ok: true,
                subscription: ret.subscription
            } );
        } );
    } );
};

exports.chargebee_get_customer_info = chargebee_get_customer_info;
exports.chargebee_get_subscription_info = chargebee_get_subscription_info;
