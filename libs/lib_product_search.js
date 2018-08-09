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
  if (args.sub_id){
    logger.info(` we're searching products with a sub! Here's the ID: ${args.sub_id}`);
    const sub_id = args.sub_id;

    const ret =  await _get_customer_style_tags (sub_id);
    logger.info(`Here are the transformed tags! ${ret}`);
  }

  return true;
};

/*
 * Returns tags string and sizes from Chargebee subscription
 */
async function _get_customer_style_info (subscription_id){
  logger.info(`we're getting customer tags! with this ID: ${subscription_id}`);
  let ret = await chargebee.chargebee_get_subscription_info(subscription_id);

  const tags = await _transform_custom_fields_to_tags_and_size(ret.subscription);
  logger.info(`Returned from CB: ${JSON.stringify(ret, null, 4)}`);

  return tags;
}

async function _list_products (args){

}

async function _list_variants (args){

}

async function _list_images (args){

}

/*
 * Takes a Chargebee subscription object and returns tags string ready for use
 * in TradeGecko APi call + size object containing top and bottom size
 */

async function _transform_custom_fields_to_tags_and_size (subscription){
  if ((Object.keys(subscription).length === 0 && subscription.constructor === Object) ||  typeof subscription === 'undefined' || subscription === null){
    throw new VError(`subscription parameter not usable`);
  }

  logger.info(`HERE IS WHAT IM GETTING TO TRANSFORM: ${JSON.stringify(subscription, null, 4)}`);

  const keys = Object.keys(subscription);
  let tags = " ";
  let size = {};

  for (let i = 0; i < keys.length; i++){
    if (keys[i].startsWith('cf_') && !_non_tags.includes(keys[i])){
      tags += `${subscription[keys[i]]},`;
    }else if (keys[i] == 'cf_bottomsize'){
      size['bottom'] = subscription[keys[i]];
    }else if (keys[i] == 'cf_topsize'){
      size['top'] = subscription[keys[i]];
    }
  }

  logger.info(`TAGS: ${tags} and SIZES: ${JSON.stringify(size, null, 4)}`);

  tags = tags.str.slice(',', -1);

  return tags;
};

exports.search_products = search_products;
