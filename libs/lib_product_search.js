/*
 *
 * The goal for this lib is to provide the foundations for a more flexible product search.
 *
 */

 const tradegecko = require("../libs/lib_tradegecko");
 const chargebee = require("../libs/lib_chargebee");

/*
 *  generic exposed search function.
 */
const search_products = async (args) => {
  if (args.sub_id){
    const sub_id = args.sub_id;

    const ret =  await _get_customer_style_tags (sub_id);
  }

  return true;
};

/*
 * Returns tags from Chargebee subscription
 */
async function _get_customer_style_tags (subcription_id){
  let ret = chargebee.chargebee_get_subscription_info(subscription_id);

  logger.info(`Returned from CB: ${ret}`);
}

async function _list_products (args){

}

async function _list_variants (args){

}

async function _list_images (args){

}

async function _transform_custom_fields_to_tags (){

};

exports.search_products = search_products;
