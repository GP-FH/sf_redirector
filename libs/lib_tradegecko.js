/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 * lib_tradegecko: this lib exposes the TradeGecko API. Currently it only provides the ability to
 * create a new Sales order.
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

const got = require("got");
const VError = require("verror");
const util = require('util');

/*
 * This function exposes the ability to create a Sales Order containing all the information and Stylist
 * needs to fill it
 */
const tradegecko_create_sales_order = async ( subscription, customer ) => {
  const { shipping_address, notes, tags } = await _prep_subscription_for_sending( subscription, customer );
  console.log("Hello tradegecko");
  let res;
  try {
    res = await got.post('https://api.tradegecko.com/orders/', {
      headers:{
        Authorization: `Bearer ${process.env.TRADEGECKO_TOKEN}`
      },
      body: {
        "order":{
          "company_id": "20733937", // TODO: put in config file (should think about whether we should have some config in the repo instead so it's subject to PR process)
          "shipping_address": shipping_address,
          "issued_at": "26-02-2018",
          "tags": tags,
          "status": "draft",
          "notes": notes
        }
      },
      json: true
    });

  }
  catch (err) {
    console.log(`err from TG is ${err}`);
    throw new VError (err, `Error creating sales order via TradeGecko API. Note: will need to be manually created for subscription ${subscription.id}` );
  }

  console.log(`res from TG is ${util.inspect(res)}`);
  return { ok:true };
}

/*
 * This helper function takes customer and subsctiption info and preps it for being sent
 * into Tradegecko via a new Sales Order.
 */
async function _prep_subscription_for_sending ( subscription, customer ) {
  return {
    "shipping_address": { // the customers address -> this will be automagically added to the Stylists relationship
      "address1": subscription.shipping_address.line1,
      "suburb": subscription.shipping_address.line1,
      "city": subscription.shipping_address.city,
      "country": "New Zealand",
      "label": customer.email,
      "email": customer.email
    },
    "notes":`
      Chargebee Subscription ID: ${subscription.id}
      Name: ${subscription.cf_childname}
      DOB: ${subscription.cf_childage}
      Gender: ${subscription.cf_gender}
      Top Size: ${subscription.cf_topsize}
      Bottom Size: ${subscription.cf_bottomsize}
      Which looks are their jam: ${subscription.cf_jam}
      Which looks do it for them: ${subscription.cf_doit}
      Palette: ${subscription.cf_palette}
      Favourite Style: ${subscription.cf_fave}
      Types of clothes they are keen on: ${subscription.cf_keen}

      Address:
      "address1": ${subscription.shipping_address.line1}
      "suburb": ${subscription.shipping_address.line1}
      "city": ${subscription.shipping_address.city}

      Follow this link to start filling this order: https://stitchfox.gogecko.com/variants?q=${subscription.cf_jam}%20${subscription.cf_doit}%20${subscription.cf_palette}%20${subscription.cf_fave}`,
    "tags":[subscription.plan_id, subscription.cf_fave]
  };
}

exports.tradegecko_create_sales_order = tradegecko_create_sales_order;
