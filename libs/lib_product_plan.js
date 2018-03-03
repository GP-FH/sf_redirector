/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 * lib_product_plan: this is a helper lib for differentiating between recurring subscriptions
 * and one-off boxes based on the plan received from Chargebee.
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

const logger = require("./lib_logger");

const product_plans_one_offs = [ 'style-pack', 'style-chest', 'style-bomb' ];
const product_plans_subscriptions = [ 'premium-box', 'deluxe-box', 'premium-box-weekly', 'deluxe-box-weekly' ];

const product_plan_is_one_off = async ( plan_id ) => {
  const one_off = product_plans_one_offs.includes( plan_id );

  if ( one_off ) {
    return {
        ok: true,
        one_off: true
    };
  }

  return {
      ok: true,
      one_off: false
  };
}

exports.product_plan_is_one_off = product_plan_is_one_off;
