import * as chargebee from "chargebee";
import * as VError from "verror";

chargebee.configure( {
    site: process.env.CHARGEBEE_SITE,
    api_key: process.env.CHARGEBEE_API_KEY
} );

/*
 * Creates a new coupion in an existing coupon set in Chargebee. These coupons are used by customers
 * on on purchase to unlock discounts.
 */
export async function chargebee_coupon_create_new ( coupon_id, set_name, customer_id ) {
  if ( coupon_id === undefined || set_name === undefined || customer_id === undefined ) {
      throw new VError ( "Undefined parameter received" );
  }

  chargebee.coupon_code.create( {
      coupon_id: coupon_id,
      coupon_set_name: set_name,
      code: customer_id
  } ).request( ( err, ret ) => {
      if ( err ) {
        throw new VError ( err, "Error creating coupon code in Chargebee");
      }

      return;
  } );
};

/*
 * This function checks a coupon code to see if it is a referral code. If it is a referral code
 * it adds adds promotional credits to the referrers account in Chargebee. It can do this as the
 * referral code is actually just the customer ID of the referring customer.
 */
export async function chargebee_coupon_check_and_apply_referral ( entity_id ) {
  if ( entity_id === undefined ) {
      throw new VError ( "entity_id undefined" );
  }

  if ( entity_id == process.env.FRIEND_REFERRAL_CODE_ID ) {
    var coupon_owner = coupons[ 0 ].description.split( ' ' )[ 0 ];

    chargebee.customer.add_promotional_credits( coupon_owner, {
        amount: 1000,
        description: "refer_a_friend credits"
    } ).request( ( err, ret ) => {
        if ( err ) {
          throw new VError ( err, "Error adding promotional credits to customer in Chargebee");
        }
    } );
  }

  return;
};
