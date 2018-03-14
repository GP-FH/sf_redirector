/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 * lib_order: this lib provides functions for creating and renewing subscriptions.
 * As these actions require multiple steps, this lib was intended as a way to
 * provide some abstraction
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

const  VError = require("verror");

const chargebee_coupon = require("../libs/lib_chargebee_coupon");
const chargebee = require("../libs/lib_chargebee");
const subscription_tracker = require("../libs/lib_subscription_tracker");
const tradegecko = require("../libs/lib_tradegecko");
const logger = require("./lib_logger");

/*
 * This function does what it says - it handles the creation of new orders. Currently this means
 * creating/checking referral codes, creating a draft sales order in TradeGecko, setting the renewal count.
 */

const order_create_new_subscription = async ( subscription, customer, coupons ) => {
  try {
    if ( coupons ) {
      await chargebee_coupon.chargebee_coupon_check_and_apply_referral( coupons[ 0 ].entity_id );
    }

    await chargebee_coupon.chargebee_coupon_create_new( process.env.FRIEND_REFERRAL_CODE_ID, process.env.FRIEND_REFERRAL_SET_NAME, subscription.customer_id );
    await tradegecko.tradegecko_create_sales_order( subscription, customer );
    await subscription_tracker.subscription_tracker_set_subscription_count( subscription.plan_id, subscription.id, customer.id );
  }
  catch ( err ) {
    throw new VError (err, "Error occurred while creating new subscription")
  }

  return { ok:true };
}

/*
 * Different to a 'subscription', a 'purchase' is a one-off box. The below function handles the backend shenanigans required when
 * someone make a purchase: creating a draft sales order in TradeGecko. You'll also notice that there is no tracking of renewal count.
 * As these are one-off purchases, billing cycle is capped at 1, so nothing to keep track of.
 */

const order_create_new_purchase = async ( subscription, customer ) => {
  try {
     return await tradegecko.tradegecko_create_sales_order( subscription, customer );
  }
  catch ( err ) {
    throw new VError (err, "Error occurred while creating new one-off purchase");
  }
}

/*
 * This function process all renewals: increments the subscription counts and generates a sales order where
 * appropriate.
 */

const order_process_renewal = async ( subscription, customer ) => {
  try {
    let new_order;

    switch ( subscription.plan_id ) {
      case 'deluxe-box':
      case 'premium-box':
        new_order = await subscription_tracker.increment_and_check_monthly(subscription.id, subscription.customer_id, subscription.plan_id);

        if ( new_order ) {
          await tradegecko.tradegecko_create_sales_order( subscription, customer );
        }

        return { ok:true, new_order:new_order };
      case 'deluxe-box-weekly':
      case 'premium-box-weekly':
        new_order = await subscription_tracker.increment_and_check_weekly(subscription.id, subscription.customer_id, subscription.plan_id);

        if ( new_order ) {
          await tradegecko.tradegecko_create_sales_order( subscription, customer );
        }

        return { ok:true, new_order:new_order };
      default:
        throw new VError ("Unexpected plan_id received when trying to renew subscription");
    }
  }
  catch ( err ) {
    throw new VError (err, "Error occurred while trying to process subscription renewal");
  }
}

exports.order_create_new_subscription = order_create_new_subscription;
exports.order_create_new_purchase = order_create_new_purchase;
exports.order_process_renewal = order_process_renewal;
