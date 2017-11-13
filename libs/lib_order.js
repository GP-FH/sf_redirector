var chargebee_coupon = require( './lib_chargebee_coupon.js' );
var chargebee = require( './lib_chargebee.js' );
var cin7 = require( './lib_cin7.js' );
var slack = require( './lib_slack.js' );

var order_create_new_subscription = ( sub, coupons ) => {
    var customer = '';
    var subscription = '';

    return new Promise( ( resolve, reject ) => {
        chargebee_coupon.chargebee_coupon_create_new( process.env.FRIEND_REFERRAL_CODE_ID, process.env.FRIEND_REFERRAL_SET_NAME, sub.customer_id )
            .then( ( ret ) => {
                return chargebee.chargebee_get_customer_info( sub.customer_id );
            } )
            .then( ( ret ) => {
                customer = ret.customer;
                return cin7.cin7_get_customer_record( customer.email )
            } )
            .then( ( ret ) => {
                /*
                 * If the customer exists in Cin7 then we can jump straight to creating a sales order.
                 * Otherwise we need to mine Chargbee for some extra info so we can create a new customer in Cin7
                 */

                if ( !ret.exists ) {
                    return chargebee.chargebee_get_subscription_info( sub.id );
                }
                else if ( ret.exists ) {
                    return cin7.cin7_create_sales_order( ret.member_id, sub.plan, sub.id, sub.cf_topsize, sub.cf_bottomsize, 'NOT_SET' );
                }
            } )
            .then( ( ret ) => {
                if ( ret.resolve ) {
                    return resolve();
                }

                subscription = ret.subscription;
                return cin7.cin7_create_customer_record( customer, subscription );
            } )
            .then( ( ret ) => {
                cin7.cin7_create_sales_order( ret.member_id, sub.plan, sub.id, sub.cf_topsize, sub.cf_bottomsize, 'NOT_SET' );
            } )
            .then( ( ret ) => {
                /*
                 * If a coupon code was used by the customer we want to check whether it was a referral as
                 * we owe these peeps some credits.
                 */

                if ( coupons ) {
                    return chargebee_coupon.chargebee_coupon_check_referral( coupons[ 0 ].entity_id );
                }

                return resolve();
            } )
            .then( ( ret ) => {
                return resolve();
            } )
            .catch( ( err ) => {
                reject( err );
            } );
    } );
};

exports.order_create_new_subscription = order_create_new_subscription;
