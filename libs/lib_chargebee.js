import * as chargebee from "chargebee";
import * as VError from "verror";

import { logger } from "../libs/lib_logger";

chargebee.configure( {
    site: process.env.CHARGEBEE_SITE,
    api_key: process.env.CHARGEBEE_API_KEY
} );

/*
 * This function is a promise wrapper for the customer retrieval functions of the chargebee module.
 * It returns a customer object full of useful information.
 */
export async function chargebee_get_customer_info ( customer_id ) {
  if ( customer_id === undefined ) {
    throw new VError ("customer_id not defined");
  }

  chargebee.customer.retrieve( customer_id ).request( ( err, ret ) => {
    if ( err ) {
      throw new VError (err, "Error retrieving customer data from Chargebee");
    }

    return ret.customer
  } );
};

/*
 * This function is a promise wrapper for the subscription retrieval functions of the chargebee module.
 * Similar to the above function it returns a subscription object full of good stuff.
 */
export async function chargebee_get_subscription_info ( subscription_id ) {

  if ( subscription_id === undefined ) {
      throw new VError ("subscription_id not defined");
  }
  chargebee.subscription.retrieve( subscription_id ).request( ( err, ret ) => {
      if ( err ) {
        throw new VError (err, "Error retrieving subscription data from Chargebee");
      }

      return ret.subscription
  } );
};
