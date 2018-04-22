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
const tradegecko_create_sales_order = async ( subscription, customer, company_id = "21313869" ) => {
  const { shipping_address, notes, tags } = await _prep_subscription_for_sending( subscription, customer );

  let res;
  try {
    res = await got.post('https://api.tradegecko.com/orders/', {
      headers:{
        Authorization: `Bearer ${process.env.TRADEGECKO_TOKEN}`
      },
      body: {
        "order":{
          "company_id": company_id, // defaults to Stylist
          "shipping_address": shipping_address,
          "issued_at": "13-03-2018",
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
      "suburb": subscription.shipping_address.line2,
      "city": subscription.shipping_address.city,
      "zip": subscription.shipping_address.zip,
      "country": "New Zealand",
      "label": customer.email,
      "email": customer.email
    },
    "notes":`
      Chargebee Subscription ID: ${subscription.id}
      Box Type: ${subscription.plan_id}
      First Name: ${customer.first_name}
      Last Name: ${customer.last_name}
      Phone Number: ${customer.phone}
      Child Name: ${subscription.cf_childname}
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
      city: ${subscription.shipping_address.city}`,
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

  return {ok:true};
};

/*
 * This function creates a company in TradeGecko (a 'company' being a supplier, business, or consumer
 * contact).
 */
const tradegecko_create_company = async (customer, company_type) => {
  try{
    return await _tradegecko_create_company(company_type, customer.email, `${customer.first_name} ${customer.last_name}`, customer.phone);
  }catch(err){
    throw new VError (err, `customer_id: ${customer.id}`);
  }
};

/*
 * This function creates an accompanying 'consumer' company for new sales orders
 */
const tradegecko_create_sales_order_contact = async (subscription, customer) => {
  try{
    const company = await _tradegecko_create_company("consumer", customer.email, `${customer.first_name} ${customer.last_name}`, customer.phone);
    const tg_address = await _tradegecko_create_address(company.id, subscription.shipping_address);

    return {ok:true, company:company, address:address};

  }catch(err){
    throw new VError(err, `subscription_id: ${subscription.id}`);
  }
};

async function _tradegecko_create_company (company_type, email, name, phone_number){
  let res;
  try {
    res = await got.post('https://api.tradegecko.com/companies/', {
      headers:{
        Authorization: `Bearer ${process.env.TRADEGECKO_TOKEN}`
      },
      body: {
        "company":{
          "company_type": company_type,
          "email": email,
          "name": name,
          "phone_number": phone_number,
        }
      },
      json: true
    });

  }
  catch (err) {
    throw new VError (err, `Error creating new company in TradeGecko`);
  }

  return {ok:true, company:res.body.company};
}

/*
 * This function takes an address object and company_id anmd creates an address
 *
 * address object:
 *   {
 *    address1:string,
 *    suburb:string,
 *    city:string,
 *    zip_code:string,
 *    country:string
 *   }
 *
 */
async function _tradegecko_create_address (company_id, address){
  let res;
  try {
    res = await got.post('https://api.tradegecko.com/addresses/', {
      headers:{
        Authorization: `Bearer ${process.env.TRADEGECKO_TOKEN}`
      },
      body: {
        "address":{
          "company_id": company_id,
          "address1": address.address1,
          "suburb": address.suburb,
          "city": address.city,
          "zip_code": address.zip || "",
          "country": address.country
        }
      },
      json: true
    });

  }
  catch (err) {
    throw new VError (err, `Error creating new address in TradeGecko`);
  }

  return {ok:true, address:res.body.address};
}

exports.tradegecko_create_sales_order = tradegecko_create_sales_order;
exports.tradegecko_get_product_variants = tradegecko_get_product_variants;
exports.tradegecko_upload_product_images = tradegecko_upload_product_images;
exports.tradegecko_create_company = tradegecko_create_company;
exports.tradegecko_create_sales_order_contact = tradegecko_create_sales_order_contact;
