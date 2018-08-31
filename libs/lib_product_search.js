/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 * The goal for this lib is to provide the foundations for a more flexible product search.
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

 const tradegecko = require("../libs/lib_tradegecko");
 const chargebee = require("../libs/lib_chargebee");
 const logger = require("../libs/lib_logger");
 const VError = require("verror");

 const _non_tags = [
  'cf_else',
  'cf_notes',
  'cf_internal_notes',
  'cf_archetype',
  'cf_childname',
  'cf_childage',
  'cf_bottomsize',
  'cf_topsize'
 ];

const _product_type_tops = [
  'Tees',
  'Onesies',
  'Tops',
  'Jumpsuits',
  'Crossovers',
  'Dresses',
  'Singlets',
  'Crews',
  'Coats and jackets',
  'Cardigans',
  'Leotards',
  'Playsuits',
  'Hoodies',
  'Henleys'
 ];

const _product_type_bottoms = [
  'Leggings',
  'Shorts',
  'Swimwear',
  'Bloomers',
  'Trackies'
];

const _product_type_misc = [
  'Hats'
];

/*
 * Product search function which accepts 2 sets of args:
 * 1. - when searching with a CB sub
 *    {
 *      sub_id:XXXXXXXXXXXX
 *    }
 * 2. - when searching with tags and sizes
 *    {
 *      tags: [xxxx,xxxx,...],
 *      sizes: {
 *              bottom: size,
 *              top:size
 *             }
 *    }
 *
 * Returns array on results objects:
 * {
 *  id: variant ID
 *  sku: product sku
 *  name: name of the product
 *  stock_on_hand: amount of stock on hand (this does not discount items in active sales orders)
 *  price: price of the variant
 *  colour: the colour dummy
 *  size: the size dummy
 *  image: url for the variant image
 *  brand: product brand
 *  tg_link: link to the variant in TradeGecko
 * }
 */

const search_products = async (args) => {
  let results = [];

  /*
   * If there is a sub_id this means this a CB subscripton ID search. Otherwise
   * it's a product field search
   */

  if (args.sub_id){
    const sub_id = args.sub_id;

    try{
      let {tags, sizes} = await _get_customer_style_info(sub_id);
      const products = await _list_products(tags);
      const ids = await _extract_variant_ids(products);
      const variants = await _list_variants(ids, sizes);
      const image_ids = await _extract_image_ids(variants);
      const images = await _list_images(image_ids);

      results = await _create_results_array(products, variants, images);
    } catch (err){
      throw new VError(err, 'error with sub_id search');
    }
  }else if (args.tags){
    const tags = args.tags;
    const sizes = args.sizes;

    try{
      const products = await _list_products(tags);
      logger.info(`PRODUCTS LENGTH: ${products.length}`);
      const ids = await _extract_variant_ids(products);
      let variants = await _list_variants(products, ids, sizes);
      logger.info(`VARIANTS LENGTH BEFORE: ${variants.length}`);

      if (args.email){
        variants = await _filter_out_already_shipped_variants(products, variants, args.email);
      }

      logger.info(`VARIANTS LENGTH AFTER: ${variants.length}`);

      const image_ids = await _extract_image_ids(variants);
      const images = await _list_images(image_ids);

      results = await _create_results_array(products, variants, images);
    } catch (err){
      throw new VError(err, 'error with product fields search');
    }
  }

  return results;
};

/*
 * Returns tags string and sizes from Chargebee subscription
 */

async function _get_customer_style_info (subscription_id){
  if (typeof subscription_id === 'undefined' || subscription_id === null){
    throw new VError(`subscription_id parameter not usable`);
  }

  const ret = await chargebee.chargebee_get_subscription_info(subscription_id);
  const tags = await _transform_custom_fields_to_tags_and_size(ret.subscription);

  return tags;
}

/*
 * Returns list of filtered products from TG
 */

async function _list_products (tags){
  if (typeof tags === 'undefined' || tags === null){
    throw new VError(`tags parameter not usable`);
  }

  const ret = await tradegecko.tradegecko_get_products ({"tags": tags});
  return ret;
}

/*
 * Returns a list of product variants based on ids, sizes and stock on hand.
 */

async function _list_variants (products, ids, sizes={}, email=false, only_soh=true ){
  if (typeof ids === 'undefined' || ids === null){
    throw new VError(`ids parameter not usable`);
  }
  if (typeof ids === 'undefined' || ids === null){
    throw new VError(`products parameter not usable`);
  }

  let ret = await tradegecko.tradegecko_get_product_variants({"ids": ids});

  const available = [];

  /*
   * If only_soh is true then we only want to return stock on hand.
   */

  if (only_soh){
    for (let i = 0; i < ret.length; i++){
      if (ret[i].stock_on_hand != "0"){
        available.push(ret[i]);
      }
    }

    ret = available;
  }

  if (email){
     ret = await _filter_out_already_shipped_variants(products, ret, email);
  }

  /*
   * If the sizes object is empty there is no real point in filtering for sizes
   */

  if (sizes != {}){
    ret = await _filter_for_sizes(ret, sizes);
  }

  return ret;
}

/*
 * Returned list of image objects from TG
 */

async function _list_images (image_ids){
  if (typeof image_ids === 'undefined' || image_ids === null){
    throw new VError(`image_ids parameter not usable`);
  }

  const ret = tradegecko.tradegecko_get_images({"ids": image_ids});

  return ret;
}

/*
 * Takes a Chargebee subscription object and returns tags array ready for use
 * in TradeGecko APi call + size object containing top and bottom size
 */

async function _transform_custom_fields_to_tags_and_size (subscription){
  if ((Object.keys(subscription).length === 0 && subscription.constructor === Object) ||  typeof subscription === 'undefined' || subscription === null){
    throw new VError(`subscription parameter not usable`);
  }

  const keys = Object.keys(subscription);
  let tags = [];
  let sizes = {};

  /*
   * loops through subscription object pulling out all relevant custom fields
   */

  for (let i = 0; i < keys.length; i++){
    if (keys[i].startsWith('cf_') && !_non_tags.includes(keys[i])){
      tags.push(subscription[keys[i]]);
    }else if (keys[i] == 'cf_bottomsize'){
      sizes['bottom'] = subscription[keys[i]];
    }else if (keys[i] == 'cf_topsize'){
      sizes['top'] = subscription[keys[i]];
    }
  }

  return {tags: tags, sizes: sizes};
};

/*
 * Takes a TG products array and extracts all the product IDs and returns them
 * in an array
 */

async function _extract_variant_ids (products){
  if (products.length == 0 ||  typeof products === 'undefined' || products === null || !Array.isArray(products)){
    throw new VError(`product parameter not usable`);
  }

  let ids = [];
  let ret = [];

  for (let i = 0; i < products.length; i++){
    ids = ids.concat(products[i].variant_ids);
  }

  return ids;
}

/*
 * Takes a TG Variants array and extracts all of the image IDs and returns them
 * in an array
 */

async function _extract_image_ids (variants){
  if (variants.length == 0 ||  typeof variants === 'undefined' || variants === null || !Array.isArray(variants)){
    throw new VError(`variants parameter not usable`);
  }

  let ids = [];

  /*
   * Defaults to plucking the first image. This is fine now but in a future where
   * variants may have multiple images we'll need to do better
   */

  for (let i = 0; i < variants.length; i++){
    if (variants[i].image_ids.length > 0){
      ids.push(variants[i].image_ids[0]);
    }
  }

  return ids;
}

/*
 * Create and return results array for presenting to stylists. BOOM.
 */

async function _create_results_array (products, variants, images){
  if (products.length == 0 ||  typeof products === 'undefined' || products === null || !Array.isArray(products)){
    throw new VError(`products parameter not usable`);
  }
  if (variants.length == 0 ||  typeof variants === 'undefined' || variants === null || !Array.isArray(variants)){
    throw new VError(`variants parameter not usable`);
  }
  if (images.length == 0 ||  typeof images === 'undefined' || images === null || !Array.isArray(images)){
    throw new VError(`images parameter not usable`);
  }

  let ret = [];

  // eeeeew
  for (let i = 0; i < variants.length; i++){
    let o = {};
    o['id'] = variants[i].id;
    o['sku'] = variants[i].sku;
    o['name'] = variants[i].product_name;
    o['stock_on_hand'] = variants[i].stock_on_hand;
    o['price'] = `$${variants[i].wholesale_price}`;
    o['colour'] = variants[i].opt1;
    o['size'] = variants[i].opt2;

    ret.push(o);
  }

  for (let i = 0; i < ret.length; i++){
    for (let j = 0; j < images.length; j++ ){
      if (images[j].variant_ids.includes(ret[i].id)){
        ret[i]['image'] = `${images[j].base_path}/${images[j].file_name}`;
      }
    }
  }

  for (let i = 0; i < ret.length; i++){
    for (let j = 0; j < products.length; j++){
      if (products[j].variant_ids.includes(ret[i].id)){
        ret[i]['brand'] = products[j].brand;
        ret[i]['tg_link'] = `https://go.tradegecko.com/inventory/${products[j].id}/variants/${ret[i].id}/edit`
      }
    }
  }

  return ret;
}

/*
 * Filter variants array for given sizes. Returns filtered array
 */

async function _filter_for_sizes (variants, sizes){
  let ret = [];
  logger.info(`SIZE FILTERING IS HAPPENING`);
  for (let i = 0; i < variants.length; i++){
    if (_product_type_tops.includes(variants[i].product_type)){
      if (variants[i].opt2 == sizes.top){
        ret.push(variants[i]);
      }
    }else if (_product_type_bottoms.includes(variants[i].product_type)){
      if (variants[i].opt2 == sizes.bottom){
        ret.push(variants[i]);
      }
    }else if (_product_type_misc.includes(variants[i].product_type)){
      ret.push(variants[i]);
    }
  }

  return ret;
};

/*
 * Filter out variants that have been sent in Sales Orders to customer with given
 * email already. Returns updated variants array.
 */

async function _filter_out_already_shipped_variants (products, variants, email){
  const companies = await tradegecko.tradegecko_get_companies({"email":email});
  const company_ids = await _extract_company_id_objects(companies);
  let promises = company_ids.map(o => tradegecko.tradegecko_get_orders(o));
  const orders = await Promise.all(promises);
  const order_ids = await _extract_order_ids(orders);
  promises = order_ids.map(o => tradegecko.tradegecko_get_order_line_items(o));
  const line_items = await Promise.all(promises);

  return await _remove_sent_variants(products, variants, line_items);
}

/*
 * Takes a TG companies array and extracts all of the IDs and returns them
 * in an array as ready to go TG filter objects
 */

async function _extract_company_id_objects (companies){
  if (companies.length == 0 ||  typeof companies === 'undefined' || companies === null || !Array.isArray(companies)){
    throw new VError(`companies parameter not usable`);
  }

  let ids = [];

  for (let i = 0; i < companies.length; i++){
    ids.push({"company_id": companies[i].id});
  }

  return ids;
}


/*
 * Takes a TG orders array and extracts all of the IDs and returns them
 * in an array as ready to go TG filter objects
 */

async function _extract_order_ids (orders){
  if (orders.length == 0 ||  typeof orders === 'undefined' || orders === null || !Array.isArray(orders)){
    throw new VError(`orders parameter not usable`);
  }

  let ids = [];

  for (let i = 0; i < orders.length; i++){
    for (let j = 0; j < orders[i].length; j++){
      ids.push({"order_id":orders[i][j].id});
    }
  }

  return ids;
}


/*
 * This function takes an array of product objects, an array of variant objects and an array of
 * arrays of order_line_items. These line items are variants that have been sent to
 * the customer before. We remove any variants that have been sent to the customer before
 * + accompanying variants in the same product group, from the variants array. Removing the
 * accompanying variants means we won't do something silly like return a product they've
 * had before but in a different colour/size in the search results
 */

async function _remove_sent_variants (products, variants, line_items){
  if (variants.length == 0 ||  typeof variants === 'undefined' || variants === null || !Array.isArray(variants)){
    throw new VError(`variants parameter not usable`);
  }
  if (line_items.length == 0 ||  typeof line_items === 'undefined' || line_items === null || !Array.isArray(line_items)){
    throw new VError(`line_items parameter not usable`);
  }
  
  let line_item_variants = [];
  logger.info(`line_items length: ${line_items.length}`);
  logger.info(`line_items item length: ${line_items[0].length}`);
  logger.info(`line_items item object: ${JSON.stringify(line_items[0][0])}`);
  for (let i = 0; i < line_items; i++){
    for (let j = 0; j < line_items[i].length; j++){
      line_item_variants.push(line_items[i][j].variant_id);
    }
  }

  logger.info(`line_items_variants length ${line_item_variants.length}`);
  //TODO: get all products with line item variant ids and add other variant ids to the line_item variants arrays
  let all_product_variants = [];
  for (let i = 0; i < products.length; i++){
    for (let j = 0; j < line_item_variants.length; j++){
      if (products[i].variant_ids.includes(line_item_variants[j])){
        logger.info('hello?');
        all_product_variants.push(products[i].variant_ids);
      }
    }
  }
  
  logger.info(`VARIANTS before EXTRACTION: ${variants.length}`);
  logger.info(`all_product_variants length: ${all_product_variants.length}`);
  logger.info(`all_product_variants first index: ${all_product_variants[0]}`);
  //TODO: remove all matching variants from the variants array and return
  for (let i = 0; i < variants.length; i++){
    for (let j = 0; j < all_product_variants.length; j++){
      if(variants.indexOf(all_product_variants[j])){
        variants.splice(variants.indexOf(all_product_variants[j]), 1);
      }
    }
  }

  logger.info(`VARIANTS after EXTRACTION: ${variants.length}`);
  return variants;
}
exports.search_products = search_products;
