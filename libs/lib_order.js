import * as VError from "verror";

import { chargebee_coupon_create_new, chargebee_coupon_check_and_apply_referral } from "../libs/lib_chargebee_coupon";
import { chargebee_get_customer_info, chargebee_get_subscription_info} from "../libs/lib_chargebee";
import { subscription_tracker_set_subscription_count, increment_and_check_weekly, increment_and_check_monthly } from "../libs/lib_subscription_tracker";
import { logger } from "../libs/lib_logger";
import { tradegecko_create_sales_order, tradegecko_add_address_to_stylist } from "../libs/lib_tradegecko";

/*
 * This function does what it says - it handles the creation of new orders. Currently this means
 * creating/checking referral codes, creating Cin7 contacts/sales orders, setting the renewal count.
 */

export async function order_create_new_subscription ( subscription, coupons ) {
  try {
    const customer = await chargebee_get_customer_info( subscription.customer_id );

    if ( coupons ) {
      await chargebee_coupon_check_and_apply_referral( coupons[ 0 ].entity_id );
    }

    await chargebee_coupon_create_new( process.env.FRIEND_REFERRAL_CODE_ID, process.env.FRIEND_REFERRAL_SET_NAME, subscription.customer_id );
    await subscription_tracker_set_subscription_count( subscription.plan_id, subscription.id, customer.id );
    await tradegecko_add_address_to_stylist();

    return await tradegecko_create_sales_order();
  }
  catch ( err ) {
    throw new VError (err, "Error occurred while creating new subscription");
  }
}

/*
 * Different to a 'subscription', a 'purchase' is a one-off box. The below function handles the backend shenanigans required when
 * someone make a purchase: creating Cin7 contacts/sales orders. You'll also notice that there is no tracking of renewal count.
 * As these are one-off purchases, billing cycle is capped at 1, so nothing to keep track of.
 */

export async function order_create_new_purchase ( subscription ) {
  try {
    const customer = await chargebee_get_customer_info( subscription.customer_id );
    await tradegecko_add_address_to_stylist();

    return await tradegecko_create_sales_order();
  }
  catch ( err ) {
    throw new VError (err, "Error occurred while creating new one-off purchase");
  }
}

/*
 * This function process all renewals: increments the subscription counts and generates a sales order where
 * appropriate.
 */

export async function order_process_renewal ( subscription ) {
  try {
    const customer = await chargebee_get_customer_info( subscription.customer_id );

    switch ( subscription.plan_id ) {
      case 'deluxe-box':
      case 'premium-box':
        const new_order = await increment_and_check_monthly(subscription.id, subscription.customer_id, subscription.plan_id);

        if ( new_order ) {
          return await tradegecko_create_sales_order();
        }

        break;
      case 'deluxe-box-weekly':
      case 'premium-box-weekly':
        const new_order = await increment_and_check_weelky(subscription.id, subscription.customer_id, subscription.plan_id);

        if ( new_order ) {
          return await tradegecko_create_sales_order();
        }
        break;
      default:
        throw new VError ("Unexpect plan_id received when trying to renew subscription");
      }
  }
  catch ( err ) {
    throw new VError (err, "Error occurred while trying to process subscription renewal");
  }
}
