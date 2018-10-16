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
      cf_ts_fit: profile.ts_fit,
      cf_bottomsize: profile.bottomsize,
      cf_bs_fit: profile.bs_fit,
      cf_palette: profile.palette,
      cf_style: profile.style,
      cf_pared_to_bold: profile.pared_to_bold,
      cf_pared_to_fun: profile.pared_to_fun,
      cf_vintage_to_fem: profile.vintage_to_fem,
      cf_vintage_to_beachy: profile.vintage_to_beachy,
      cf_avoid_colours: profile.avoid_colours,
      cf_designs: profile.designs,
      cf_do_not_want: profile.do_not_want,
      cf_need_most: profile.need_most,
      cf_unisex: profile.unisex,
      cf_other_notes: profile.other_notes,
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
      country: profile.country,
      phone: profile.phone,
      // zip: profile.postcode temporarily removing zip as because we can't provide validation on the front end it can result in people hitting
      // the error page with no context + the need to go through the entire form again. Not ideal but it's better. 
      
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
    cf_gender: new_fields.gender,
    cf_childname: new_fields.childname,
    cf_childage: new_fields.childage,
    cf_topsize: new_fields.topsize,
    cf_ts_fit: new_fields.ts_fit,
    cf_bottomsize: new_fields.bottomsize,
    cf_bs_fit: new_fields.bs_fit,
    cf_palette: new_fields.palette,
    cf_style: new_fields.style,
    cf_pared_to_bold: new_fields.pared_to_bold,
    cf_pared_to_fun: new_fields.pared_to_fun,
    cf_vintage_to_fem: new_fields.vintage_to_fem,
    cf_vintage_to_beachy: new_fields.vintage_to_beachy,
    cf_avoid_colours: new_fields.avoid_colours,
    cf_designs: new_fields.designs,
    cf_do_not_want: new_fields.do_not_want,
    cf_need_most: new_fields.need_most,
    cf_unisex: new_fields.unisex,
    cf_other_notes: new_fields.other_notes
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

const chargebee_list_subscriptions = async (filters = {}) => {
  return await chargebee.subscription.list(filters).request((err, ret) => {
    if ( err ) {
      throw new VError (err, "Error listing subscription in Chargebee");
    }
  });
};

exports.chargebee_pause_subscription = chargebee_pause_subscription;
exports.chargebee_get_customer_info = chargebee_get_customer_info;
exports.chargebee_get_subscription_info = chargebee_get_subscription_info;
exports.chargebee_request_checkout = chargebee_request_checkout;
exports.chargebee_update_subscription = chargebee_update_subscription;
exports.chargebee_list_subscriptions = chargebee_list_subscriptions;
