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
const chargebee_request_checkout = async (qs, redirect_url, stylist_attribution, keen, palette) => {
  if (qs === undefined || redirect_url === undefined || stylist_attribution === undefined || keen === undefined || palette === undefined){
    throw new VError ("Received parameter not defined");
  }

  return await chargebee.hosted_page.checkout_new({
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

  logger.info(`style profile PRE CB UPDATE: ${JSON.stringify(new_fields, null, 4)}`);

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

exports.chargebee_get_customer_info = chargebee_get_customer_info;
exports.chargebee_get_subscription_info = chargebee_get_subscription_info;
exports.chargebee_request_checkout = chargebee_request_checkout;
exports.chargebee_update_subscription = chargebee_update_subscription;
