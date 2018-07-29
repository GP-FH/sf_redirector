/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 * lib_chargebee: this lib exposes key Chargebee API functionality relating to customers and
 * subscriptions.
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

const chargebee =require("chargebee");
const VError = require("verror");
const logger = require("./lib_logger");

chargebee.configure( {
    site: process.env.CHARGEBEE_SITE,
    api_key: process.env.CHARGEBEE_API_KEY
} );

/*
 * This function exposes the customer retrieval functions of the chargebee module.
 * It returns a customer object full of useful information.
 */
const chargebee_get_customer_info = async ( customer_id ) => {
  if ( customer_id === undefined ) {
    throw new VError ("customer_id not defined");
  }

  return await chargebee.customer.retrieve( customer_id ).request( ( err, ret ) => {
    if ( err ) {
      throw new VError (err, "Error retrieving customer data from Chargebee");
    }
  } );
};

/*
 * This function exposes the subscription retrieval functions of the chargebee module.
 * Similar to the above function it returns a subscription object full of good stuff.
 */
const chargebee_get_subscription_info = async ( subscription_id ) => {
  if ( subscription_id === undefined ) {
      throw new VError ("subscription_id not defined");
  }

  return await chargebee.subscription.retrieve( subscription_id ).request( ( err, ret ) => {
      if ( err ) {
        throw new VError (err, "Error retrieving subscription data from Chargebee");
      }
  } );
};

/*
 * This function requests a hosted checkout page URL from Chargebee
 */
const chargebee_request_checkout = async (profile, redirect_url, stylist_attribution) => {
  if (profile === undefined || redirect_url === undefined || stylist_attribution === undefined){
    throw new VError ("Received parameter not defined");
  }

  return await chargebee.hosted_page.checkout_new({
    redirect_url: redirect_url,
    embed: false,
    subscription: {
      plan_id: profile.boxtype,
      cf_gender: profile.gender,
      cf_childname: profile.childname,
      cf_childage: profile.childage,
      cf_topsize: profile.topsize,
      cf_bottomsize: profile.bottomsize,
      cf_jam: profile.jam,
      cf_doit: profile.doit,
      cf_palette: profile.palette,
      cf_fave: profile.fav,
      cf_keen: profile.keen,
      cf_else: profile.else,
      cf_notes: profile.notes
    },
    customer: {
      email: profile.email,
      first_name: profile.first_name,
      last_name: profile.last_name,
      phone: profile.phone,
      cf_stylist_attr: stylist_attribution
    },
    billing_address: {
      first_name: profile.first_name,
      last_name: profile.last_name,
      line1: profile.street_address,
      line2: profile.suburb,
      city: profile.city,
      country: "NZ",
      phone: profile.phone
    }
  }).request( ( err, ret ) => {
    if (err){
      throw new VError (err, "Error requesting checkout page in Chargebee");
    }
  });
}

const chargebee_pause_subscription = async (subscription_id) => {
  if (typeof subscription_id === 'undefined' || subscription_id === null) {
    throw new VError ("chargebee_pause_subscription() called with undefined subscription_id parameter");
  }

  return await chargebee.subscription.pause(subscription_id).request((err, ret) => {
    if ( err ) {
      throw new VError (err, "Error pausing subscription in Chargebee");
    }
  })
};

exports.chargebee_pause_subscription = chargebee_pause_subscription;
exports.chargebee_get_customer_info = chargebee_get_customer_info;
exports.chargebee_get_subscription_info = chargebee_get_subscription_info;
exports.chargebee_request_checkout = chargebee_request_checkout;
