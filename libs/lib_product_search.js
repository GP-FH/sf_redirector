/*
 *
 * The goal for this lib is to provide the foundations for a more flexible product search.
 *
 */

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

/*
 *  generic exposed search function.
 */
const search_products = async (args) => {
  let results = [];

  if (args.sub_id){
    const sub_id = args.sub_id;

    try{
      let {tags, sizes} = await _get_customer_style_info (sub_id);
      logger.info(`HERE ARE THE TAGS WE GOT: ${tags.toString()}`);
      logger.info('ABOUT TO LIST PRODUCTS');
      const products = await _list_products(tags);
      const ids = await _extract_product_ids(products);
      const variants = await _list_variants(ids);

    } catch (err){
      throw new VError(err, 'error calling search functions');
    }
  }

  return true;
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

async function _list_variants (ids){
  if (typeof ids === 'undefined' || ids === null){
    throw new VError(`ids parameter not usable`);
  }

  const ret = await tradegecko.tradegecko_get_product_variants({"product_id": ids});
  logger.info(`RETURNED VARIANTS: ${JSON.stringify(ret, null, 4)} VARIANTS`);
  return ret;
}

async function _list_images (args){

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

async function _extract_product_ids (products){
  if (products.length == 0 ||  typeof products === 'undefined' || products === null || !Array.isArray(products)){
    throw new VError(`product parameter not usable`);
  }

  let ids = [];

  for (let i = 0; i < products.length; i++){
    ids.push(products[i].id);
  }

  return ids;
}

exports.search_products = search_products;
