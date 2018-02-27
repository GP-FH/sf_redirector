const got = require("got");
const VError = require("verror");

// gonna have to do something with addresses. Either dedupe via daily cron or check for existance on the fly

const tradegecko_create_sales_order = async ( subscription, customer ) => {
  const { shipping_address, notes, tags } = await _prep_subscription_for_sending( subscription, customer );

  let res;
  try {
    res = await got.post('https://api.tradegecko.com/orders/', {
      headers:{
        Authorization: `Bearer ${process.env.TRADEGECKO_TOKEN}`
      },
      body: {
        "order":{
          "company_id": "20733937",
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
    throw new VError (err, `Error creating sales order via TradeGecko API. Note: will need to be manually created for subscription ${subscription.id}` );
  }

  return { ok:true };
}

async function _prep_subscription_for_sending ( subscription, customer ) {
  return {
    "shipping_address": { // the customers address -> this will be automagically added to the Stylists relationship
      "address1": subscription.shipping_address.line1,
      "suburb": subscription.shipping_address.line1,
      "city": subscription.shipping_address.city,
      "country": subscription.shipping_address.city,
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

      Follow this link to start filling this order: https://link_to_b2b.com`,
    "tags":[subscription.plan_id, subscription.cf_fave]
  };
}

exports.tradegecko_create_sales_order = tradegecko_create_sales_order;
