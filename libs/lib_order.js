const  VError = require("verror");

const chargebee_coupon = require("../libs/lib_chargebee_coupon");
const chargebee = require("../libs/lib_chargebee");
const subscription_tracker = require("../libs/lib_subscription_tracker");
const tradegecko = require("../libs/lib_tradegecko");
const logger = require("./lib_logger");

/*
 * This function does what it says - it handles the creation of new orders. Currently this means
 * creating/checking referral codes, creating Cin7 contacts/sales orders, setting the renewal count.
 */

const order_create_new_subscription = async ( subscription, coupons ) => {
  try {
    const ret = await chargebee.chargebee_get_customer_info( subscription.customer_id );

    if ( coupons ) {
      await chargebee_coupon.chargebee_coupon_check_and_apply_referral( coupons[ 0 ].entity_id );
    }

    await chargebee_coupon.chargebee_coupon_create_new( process.env.FRIEND_REFERRAL_CODE_ID, process.env.FRIEND_REFERRAL_SET_NAME, subscription.customer_id );
    await tradegecko.tradegecko_create_sales_order();
    await subscription_tracker.subscription_tracker_set_subscription_count( subscription.plan_id, subscription.id, ret.customer.id );
  }
  catch ( err ) {
    if(!VError.findCauseByName(err, "redis")) {
      throw new VError (err, "Error occurred while creating new subscription")
    }

    logger.error( `Redis error: ${err}` );
  }

  return { ok:true };
}

/*
 * Different to a 'subscription', a 'purchase' is a one-off box. The below function handles the backend shenanigans required when
 * someone make a purchase: creating Cin7 contacts/sales orders. You'll also notice that there is no tracking of renewal count.
 * As these are one-off purchases, billing cycle is capped at 1, so nothing to keep track of.
 */

const order_create_new_purchase = async ( subscription ) => {
  try {
    const ret = await chargebee.chargebee_get_customer_info( subscription.customer_id );

    return await tradegecko.tradegecko_create_sales_order();
  }
  catch ( err ) {
    throw new VError (err, "Error occurred while creating new one-off purchase");
  }
}

/*
 * This function process all renewals: increments the subscription counts and generates a sales order where
 * appropriate.
 */

const order_process_renewal = async ( subscription ) => {
  try {
    const ret = await chargebee.chargebee_get_customer_info( subscription.customer_id );
    let new_order;

    switch ( subscription.plan_id ) {
      case 'deluxe-box':
      case 'premium-box':
        new_order = await subscription_tracker.increment_and_check_monthly(subscription.id, subscription.customer_id, subscription.plan_id);

        if ( new_order ) {
          await tradegecko.tradegecko_create_sales_order();
        }

        break;
      case 'deluxe-box-weekly':
      case 'premium-box-weekly':
        new_order = await subscription_tracker.increment_and_check_weelky(subscription.id, subscription.customer_id, subscription.plan_id);

        if ( new_order ) {
          await tradegecko.tradegecko_create_sales_order();
        }

        break;
      default:
        throw new VError ("Unexpect plan_id received when trying to renew subscription");
    }
  }
  catch ( err ) {
    if(!VError.findCauseByName(err, "redis")) {
      throw new VError (err, "Error occurred while trying to process subscription renewal");
    }

    logger.error( `Redis error: ${err}` );
  }

  return { ok: true };
}

exports.order_create_new_subscription = order_create_new_subscription;
exports.order_create_new_purchase = order_create_new_purchase;
exports.order_process_renewal = order_process_renewal;
