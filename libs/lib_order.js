var chargebee_coupon = require( './lib_chargebee_coupon.js' );
var chargebee = require( './lib_chargebee.js' );
var cin7 = require( './lib_cin7.js' );
var slack = require( './lib_slack.js' );
var subscription_tracker = require( './lib_subscription_tracker.js' );
var logger = require( './lib_logger.js' );

var order_create_new_subscription = ( sub, coupons ) => {
    var customer = '';
    var subscription = '';

    return new Promise( ( resolve, reject ) => {
        chargebee_coupon.chargebee_coupon_create_new( process.env.FRIEND_REFERRAL_CODE_ID, process.env.FRIEND_REFERRAL_SET_NAME, sub.customer_id )
            .then( ( ret ) => {
                logger.info( 'Created referral coupon code: subscription_id: ' + sub.id );
                return chargebee.chargebee_get_customer_info( sub.customer_id );
            } )
            .then( ( ret ) => {
                customer = ret.customer;
                return cin7.cin7_check_customer_exists( customer.email )
            } )
            .then( ( ret ) => {
                /*
                 * If the customer exists in Cin7 then we can jump straight to creating a sales order.
                 * Otherwise we need to mine Chargbee for some extra info so we can create a new customer in Cin7
                 */

                if ( !ret.exists ) {
                    logger.info( 'New customer. Creating new contact in Cin7: ' + sub.id );
                    return chargebee.chargebee_get_subscription_info( sub.id );
                }
                else if ( ret.exists ) {
                    logger.info( 'Existing customer. Creating new sales order in Cin7: ' + sub.id );
                    return cin7.cin7_create_sales_order( ret.id, sub.plan, sub.id, sub.cf_topsize, sub.cf_bottomsize, 'NOT_SET' );
                }
            } )
            .then( ( ret ) => {
                if ( ret.resolve ) {
                    subscription_tracker.subscription_tracker_set_subscription_count( sub.plan_id, sub.id, customer.id );
                    return resolve( {
                        ok: true
                    } );
                }

                subscription = ret.subscription;
                return cin7.cin7_create_customer_record( customer, subscription );
            } )
            .then( ( ret ) => {
                logger.info( 'Creating new sales order in Cin7: ' + sub.id );
                cin7.cin7_create_sales_order( ret.id, sub.plan, sub.id, sub.cf_topsize, sub.cf_bottomsize, 'NOT_SET' );
            } )
            .then( ( ret ) => {
                subscription_tracker.subscription_tracker_set_subscription_count( sub.plan_id, sub.id, customer.id );

                /*
                 * If a coupon code was used by the customer we want to check whether it was a referral as
                 * we owe these peeps some credits.
                 */

                if ( coupons ) {
                    logger.info( 'Checking if customer used referral code: ' + sub.id );
                    return chargebee_coupon.chargebee_coupon_check_and_apply_referral( coupons[ 0 ].entity_id );
                }

                return resolve( {
                    ok: true
                } );
            } )
            .then( ( ret ) => {
                return resolve( {
                    ok: true
                } );
            } )
            .catch( ( err ) => {
                reject( err );
            } );
    } );
};

exports.order_create_new_subscription = order_create_new_subscription;
