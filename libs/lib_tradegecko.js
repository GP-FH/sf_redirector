/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 * lib_tradegecko: this lib exposes the TradeGecko API. Currently it only provides the ability to
 * create a new Sales order.
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

const got = require("got");
const qs = require("qs");
const VError = require("verror");
const logger = require("../libs/lib_logger");


/*
 * This function exposes the ability to create a Sales Order containing all the information and Stylist
 * needs to fill it
 */

const tradegecko_create_sales_order = async ( subscription, customer, company_id = "21313869" ) => {
  let { shipping_address, notes, tags } = await _prep_subscription_for_sending( subscription, customer );
  let order = {
    "company_id": company_id, // defaults to Stylist
    "issued_at": "13-03-2018",
    "tags": tags,
    "status": "draft",
    "notes": notes
  };

  /*
   * Here we compare the address received from CB to the addresses attached to the customer in TG.
   * If any matches are found we send the address ID in the sales order to avoid creating dupe addresses
   */

  const ret = await _tradegecko_check_for_existing_address(shipping_address, company_id);
  if (ret.exists){
    order["shipping_address_id"] = ret.address_id;
  }else{
    order["shipping_address"] = shipping_address;
  }

  let res;
  try {
    res = await got.post('https://api.tradegecko.com/orders/', {
      headers:{
        Authorization: `Bearer ${process.env.TRADEGECKO_TOKEN}`
      },
      body: {
        "order": order
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
      "zip_code": subscription.shipping_address.zip || "",
      "country": "New Zealand",
      "label": "Shipping Address",
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
 * This function lists product variants. If no filters are passed it returns all variants.
 * Filters must be valid according to TG API documentation. It is a recursive
 * function and keeps making API calls until it has been through all pages
 */

const tradegecko_get_product_variants = async (filters={}, storage=[], page=1) => {
  let get_all = false;
  let url = 'https://api.tradegecko.com/variants/';

  if ((Object.keys(filters).length === 0 && filters.constructor === Object) ||  typeof filters === 'undefined' || filters === null){
    get_all = true;
  }

  let query = {
    "limit": 250,
    "page": page,
    "sellable": true
  }

  let concat_storage = [];
  let res;
  let batch_request = false;
  let remainder = [];
  let batch = [];

  /*
   * Append to the the query object and only do it the first function call
   * + check for excessive number of filter values (specifically product_ids)
   * and enable batched requests (more recursions) if necessary
   */

  if (!get_all && page == 1){
    const keys = Object.keys(filters);
    for (let i = 0; i < keys.length; i++){
      if (keys[i] == 'product_id' && filters[keys[i]].length > 50){
        batch_request = true;
      }else{
        query[keys[i]] = filters[keys[i]];
      }
    }
  }

  /*
   * Calls helper function which splits the array of product_ids into 2 arrays:
   * the 'batch' which will be used in the current API request, and the 'remainder'
   * which will be used in future requests
   */

  if (batch_request){
    const ret = await _tradegecko_prepare_for_batch_request(filters.product_id);
    batch  = ret.batch;
    remainder = ret.remainder
    query['product_id'] = batch;
  }

  /*
   * Have to put the URL together with the Q params here instead of using Got's
   * query arg as got does not seem to support the bracket array format e.g
   * product_id[]=id1&product_id[]=id2.... which TG requires.
   */

  const query_string = qs.stringify(query, {arrayFormat: 'brackets', encode: false});
  url += `?${query_string}`;

  try {
    res = await got.get(url, {
      headers:{
        Authorization: `Bearer ${process.env.TRADEGECKO_TOKEN}`
      },
      json: true
    });

  }
  catch (err) {
    throw new VError (err, `Error listing variants via TradeGecko API.` );
  }

  concat_storage = storage.concat(res.body.variants);
  const pagination_info = JSON.parse(res.headers["x-pagination"]);

  /*
   * If it's a multi-page result make the recursive call to get the rest of the
   * results
   */

  if (!pagination_info.last_page){
    return tradegecko_get_product_variants(query, concat_storage, ++page);
  }

  /*
   * If it's a batched request then we want to make a recursive call with the
   * remainder of the ids we have to start the process again
   */

  if (batch_request){
    query['product_id'] = remainder;
    return tradegecko_get_product_variants(query, concat_storage, ++page);
  }

  return concat_storage;
};

/*
 * This function lists image objects. If no filters are passed it returns all images.
 * Filters must be valid according to TG API documentation. It is a recursive
 * function and keeps making API calls until it has been through all pages
 */

const tradegecko_get_images = async (filters={}, storage=[], page=1) => {
  logger.info(`IDS LENGTH: ${filters.ids.length}`);
  let get_all = false;
  let url = 'https://api.tradegecko.com/images/';

  if ((Object.keys(filters).length === 0 && filters.constructor === Object) ||  typeof filters === 'undefined' || filters === null){
    get_all = true;
  }

  let query = {
    "limit": 250,
    "page": page
  }

  let concat_storage = [];
  let res;
  let batch_request = false;
  let remainder = [];
  let batch = [];

  /*
   * Append to the the query object and only do it the first function call
   * + check for excessive number of filter values (specifically image ids)
   * and enable batched requests (more recursions) if necessary
   */

  if (!get_all && page == 1){
    const keys = Object.keys(filters);
    for (let i = 0; i < keys.length; i++){
      if (keys[i] == 'ids' && filters[keys[i]].length > 50){
        logger.info(`SETTING BATCH TO TRUE`);
        batch_request = true;
      }else{
        query[keys[i]] = filters[keys[i]];
      }
    }
  }

  /*
   * Calls helper function which splits the array of ids into 2 arrays:
   * the 'batch' which will be used in the current API request, and the 'remainder'
   * which will be used in future requests
   */

  if (batch_request){
    const ret = await _tradegecko_prepare_for_batch_request(filters.ids);
    batch  = ret.batch;
    remainder = ret.remainder
    logger.info(`BATCH LENGTH: ${batch.length}. REMAINDER LENGTH: ${remainder.length}`);
    query['ids'] = batch;
  }

  /*
   * Have to put the URL together with the Q params here instead of using Got's
   * query arg as got does not seem to support the bracket array format e.g
   * ids[]=id1&ids[]=id2.... which TG requires.
   */

  const query_string = qs.stringify(query, {arrayFormat: 'brackets', encode: false});
  url += `?${query_string}`;

  try {
    res = await got.get(url, {
      headers:{
        Authorization: `Bearer ${process.env.TRADEGECKO_TOKEN}`
      },
      json: true
    });

  }
  catch (err) {
    throw new VError (err, `Error listing images via TradeGecko API.` );
  }

  logger.info(`RESPONSE TO IMAGE API CALL LENGTH: ${res.body.images.length}`);
  concat_storage = storage.concat(res.body.images);
  const pagination_info = JSON.parse(res.headers["x-pagination"]);

  /*
   * If it's a multi-page result make the recursive call to get the rest of the
   * results
   */

  if (!pagination_info.last_page){
    return tradegecko_get_images(query, concat_storage, ++page);
  }

  /*
   * If it's a batched request then we want to make a recursive call with the
   * remainder of the ids we have to start the process again
   */

  if (batch_request){
    query['ids'] = remainder;
    return tradegecko_get_images(query, concat_storage, ++page);
  }

  return concat_storage;
}

/*
 * This function lists products. If no filters are passed it returns all products.
 * Filters must be valid according to TG API documentation. It is a recursive
 * function and keeps making API calls until it has been through all pages
 */

const tradegecko_get_products = async (filters={}, storage=[], page=1) => {
  let get_all = false;
  let url = 'https://api.tradegecko.com/products/';

  if ((Object.keys(filters).length === 0 && filters.constructor === Object) ||  typeof filters === 'undefined' || filters === null){
    get_all = true;
  }

  let query = {
    "limit": 250,
    "page": page,
    "status": "active"
  }

  let concat_storage = [];
  let res;

  /*
   * Append to the the query object and only do it the first function call
   */

  if (!get_all && page == 1){
    const keys = Object.keys(filters);
    for (let i = 0; i < keys.length; i++){
      query[keys[i]] = filters[keys[i]];
    }
  }

  /*
   * Have to put the URL together with the Q params here instead of using Got's
   * query arg as got does not seem to support the bracket array format e.g
   * tag[]=tag1&tag[]=tag2.... which TG requires.
   */

  const query_string = qs.stringify(query, {arrayFormat: 'brackets', encode: false});
  url += `?${query_string}`;

  try {
    res = await got.get(url, {
      headers:{
        Authorization: `Bearer ${process.env.TRADEGECKO_TOKEN}`
      },
      json: true
    });
  }
  catch (err) {
    throw new VError (err, `Error listing products via TradeGecko API.` );
  }

  concat_storage = storage.concat(res.body.products);
  const pagination_info = JSON.parse(res.headers["x-pagination"]);

  if(!pagination_info.last_page){
    return tradegecko_get_products(query, concat_storage, ++page);
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
 * This function creates & returns an accompanying 'consumer' company for new sales orders. If one
 * already exists it returns that instead.
 */

const tradegecko_create_sales_order_contact = async (subscription, customer) => {
  let company;
  try{
    const ret = await _tradegecko_check_for_existing_company(customer.email);

    if (ret.exists){
      company = ret.company;
    }else{
      const ret1 = await _tradegecko_create_company("consumer", customer.email, `${customer.first_name} ${customer.last_name}`, customer.phone);
      company = ret1.company;
    }
  }catch(err){
    throw new VError(err, `subscription_id: ${subscription.id}`);
  }

  return {ok:true, company:company};
};

/*
 * Bare bones TG company creation helper method. Will export if needed.
 */

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
 * Bare bones TG address creation function. Will export if ever neccessary.
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
          "address1": address.line1,
          "suburb": address.line2 ,
          "city": address.city,
          "zip_code": address.zip || "",
          "country": "New Zealand",
          "label": "Shipping Address"
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

/*
 * Helper function: checks for any TG customers with a matching email and returns
 * the result.
 */

async function _tradegecko_check_for_existing_company (email, page=1){
  let res;

  try {
    res = await got.get('https://api.tradegecko.com/companies/', {
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

  let company = null;
  let exists = false;
  const companies = res.body.companies;

  for (let c of companies){
    if (c.email == email){
      company = c;
      exists = true;
      break;
    }
  }

  const pagination_info = JSON.parse(res.headers["x-pagination"]);

  if(!pagination_info.last_page && !!company){
    return _tradegecko_check_for_existing_company(email, ++page);
  }

  return {ok:true, exists:exists, company:company};
};

/*
 * Helper function: chrcks for matching addresses for a given TG customer. Returns
 * the result.
 */

async function _tradegecko_check_for_existing_address (address, company_id){
  let res;

  try {
    res = await got.get('https://api.tradegecko.com/addresses/', {
      headers:{
        Authorization: `Bearer ${process.env.TRADEGECKO_TOKEN}`
      },
      query:{
        limit:250,
        company_id: company_id
      },
      json: true
    });

  }
  catch (err) {
    throw new VError (err, `Error listing variants via TradeGecko API.` );
  }

  let address_id = null;
  let exists = false;
  const addresses = res.body.addresses;

  for (let a of addresses){
    if (a.address1 == address.address1 && a.suburb == address.suburb && a.city == address.city && a.zip_code == address.zip_code && a.country == address.country){
      address_id = a.id;
      exists = true;
      break;
    }
  }

  return {ok:true, exists:exists, address_id:address_id};
}

/*
 * Helper function to break array up into smaller batches when number of filters is
 * too long for TG API e.g when using ids as filters. Returns object containing batch
 * array + array containing remaining values
 */

async function _tradegecko_prepare_for_batch_request (values, batch_size=50){
  if (values.length == 0 ||  typeof values === 'undefined' || values === null || !Array.isArray(values)){
    throw new VError(`values parameter not usable`);
  }

  let batch = [];

  for (let i = 0; i < batch_size; i++){
    let v = values.pop();
    batch.push(v);
  }

  return {batch: batch, remainder: values};
}

exports.tradegecko_create_sales_order = tradegecko_create_sales_order;
exports.tradegecko_get_product_variants = tradegecko_get_product_variants;
exports.tradegecko_upload_product_images = tradegecko_upload_product_images;
exports.tradegecko_create_company = tradegecko_create_company;
exports.tradegecko_create_sales_order_contact = tradegecko_create_sales_order_contact;
exports.tradegecko_get_products = tradegecko_get_products;
exports.tradegecko_get_images = tradegecko_get_images;
