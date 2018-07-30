/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 * lib_chargebee: this lib exposes key Chargebee API functionality relating to customers and
 * subscriptions.
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

const chargebee = require("chargebee");
const VError = require("verror");
const logger = require("./lib_logger");

chargebee.configure( {
    site: process.env.CHARGEBEE_SITE,
    api_key: process.env.CHARGEBEE_API_KEY
});

/*
 * This function exposes the customer retrieval functions of the chargebee module.
 * It returns a customer object full of useful information.
 */
const chargebee_get_customer_info = async ( customer_id ) => {
  if (customer_id === undefined){
    throw new VError ("customer_id not defined");
  }

  return await chargebee.customer.retrieve( customer_id ).request( ( err, ret ) => {
    if (err){
      throw new VError (err, "Error retrieving customer data from Chargebee");
    }
  });
};

/*
 * This function exposes the subscription retrieval functions of the chargebee module.
 * Similar to the above function it returns a subscription object full of good stuff.
 */
const chargebee_get_subscription_info = async ( subscription_id ) => {
  if (subscription_id === undefined){
    throw new VError ("subscription_id not defined");
  }

  return await chargebee.subscription.retrieve( subscription_id ).request( ( err, ret ) => {
    if (err){
      throw new VError (err, "Error retrieving subscription data from Chargebee");
    }
  });
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
      cf_else: profile.something_else,
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

const chargebee_update_subscription = async (subscription, new_fields) => {
  if (typeof subscription === 'undefined' || subscription === null) {
    throw new VError ("chargebee_update_subscription() called with undefined subscription parameter");
  }

  if (typeof new_fields === 'undefined' || new_fields === null) {
    throw new VError ("chargebee_update_subscription() called with undefined new_fields parameter");
  }

  const updates = {
    cf_archetype: new_fields.fave,
    cf_gender: new_fields.gender,
    cf_childname: new_fields.childname,
    cf_childage: new_fields.childage,
    cf_topsize: new_fields.topsize,
    cf_bottomsize: new_fields.bottomsize,
    cf_jam: new_fields.jam,
    cf_doit: new_fields.doit,
    cf_palette: new_fields.palette,
    cf_fave: new_fields.fave,
    cf_keen: new_fields.keen,
    cf_else: new_fields.something_else,
    cf_notes: new_fields.notes,
    cf_internal_notes: new_fields.internal_notes
  };

  return await chargebee.subscription.update(subscription.id, updates).request( (err, ret) => {
    if ( err ) {
      throw new VError (err, "Error updating subscription Chargebee");
    }
  });
};

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
exports.chargebee_update_subscription = chargebee_update_subscription;
