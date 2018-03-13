/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 * lib_tradegecko: this lib exposes the TradeGecko API. Currently it only provides the ability to
 * create a new Sales order.
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

const got = require("got");
const VError = require("verror");

/*
 * This function exposes the ability to create a Sales Order containing all the information and Stylist
 * needs to fill it
 */
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
          "company_id": "21313869", // TODO: put in config file (should think about whether we should have some config in the repo instead so it's subject to PR process)
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

/*
 * This helper function takes customer and subscription info and preps it for being sent
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
      address1: ${subscription.shipping_address.line1}
      suburb: ${subscription.shipping_address.line2}
      city: ${subscription.shipping_address.city}

      Follow this link to start filling this order: https://stitchfox.gogecko.com?q=${subscription.cf_jam}%20${subscription.cf_doit}%20${subscription.cf_palette}%20${subscription.cf_fave}`,
    "tags":[subscription.plan_id, subscription.cf_fave]
  };
}

/*
 * This function lists all product variants. It is a recursive function and keeps making
 * API calls until it has been through all pages
 */
const tradegecko_get_product_variants = async (storage=[], page=1) => {
  let concat_storage = [];
  let res;

  try {
    res = await got.get('https://api.tradegecko.com/variants/', {
      headers:{
        Authorization: `Bearer ${process.env.TRADEGECKO_TOKEN}`
      },
      query:{
        limit:250,
        page:page
      },
      json: true
    });

  }
  catch (err) {
    throw new VError (err, `Error listing variants via TradeGecko API.` );
  }

  concat_storage = storage.concat(res.body.variants);
  const pagination_info = JSON.parse(res.headers["x-pagination"]);

  if(!pagination_info.last_page){
    return tradegecko_get_product_variants(concat_storage, ++page);
  }

  return concat_storage;
};

/*
 * This function uploads product images to Tradegecko.
 */
const tradegecko_upload_product_images = async (product_id, variant_ids, image_url) => {
  let res;

  try {
    res = await got.post('https://api.tradegecko.com/images/', {
      headers:{
        Authorization: `Bearer ${process.env.TRADEGECKO_TOKEN}`
      },
      body: {
        "image":{
          "product_id":product_id,
          "variant_ids":variant_ids,
          "url":image_url
        }
      },
      json: true
    });

  }
  catch (err) {
    return {ok:false, err:err}; // doesn't throw error here as failures are not unlikely with current use
  }
  console.log(JSON.stringify(res.body));
  return {ok:true};
};

exports.tradegecko_create_sales_order = tradegecko_create_sales_order;
exports.tradegecko_get_product_variants = tradegecko_get_product_variants;
exports.tradegecko_upload_product_images = tradegecko_upload_product_images;
