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

/*
 * This function requests a hosted checkout page URL from Chargebee
 */
export async function chargebee_request_checkout (qs, redirect_url, stylist_attribution, keen, palette) {
  if ( qs === undefined || redirect_url === undefined || stylist_attribution === undefined || keen === undefined || palette === undefined ) {
      throw new VError ("Received parameter not defined");
  }

  chargebee.hosted_page.checkout_new( {
      redirect_url: redirect_url,
      embed: false,
      subscription: {
          plan_id: qs.boxtype,
          cf_gender: qs.gender,
          cf_childname: qs.hername || qs.hisname,
          cf_childage: qs.sheage || qs.heage,
          cf_topsize: qs.shetopsize || qs.hetopsize,
          cf_bottomsize: qs.shebottomsize || qs.hebottomsize,
          cf_jam: qs.jam1 || qs.jam2 || qs.jam3 || qs.jam4 || qs.jam5 || qs.jam6,
          cf_doit: qs.doit1 || qs.doit2 || qs.doit3 || qs.doit4 || qs.doit5 || qs.doit6,
          cf_palette: palette,
          cf_fave: qs.fav1 || qs.fav2,
          cf_keen: keen,
          cf_else: qs.else,
          cf_notes: qs.notes
      },
      customer: {
          email: qs.email,
          first_name: qs.fname,
          last_name: qs.lname,
          phone: qs.phone,
          cf_stylist_attr: stylist_attribution
      },
      billing_address: {
          first_name: qs.fname,
          last_name: qs.lname,
          line1: qs.streetaddress,
          line2: qs.suburb,
          city: qs.city,
          country: "NZ",
          phone: qs.phone
      }
  } ).request( function ( err, ret ) {

      if ( err ) {
        throw new VError (err, "Error requesting checkout page in Chargebee");
      }
      else {
          return { ok: true, hosted_page: result.hosted_page };
      }
  } );
}
