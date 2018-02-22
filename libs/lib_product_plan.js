const logger = require("./lib_logger");

const product_plans_one_offs = [ 'style-pack', 'style-chest', 'style-bomb' ];
const product_plans_subscriptions = [ 'premium-box', 'deluxe-box', 'premium-box-weekly', 'deluxe-box-weekly' ];

const product_plan_is_one_off = async ( plan_id ) => {
  const one_off = product_plans_one_offs.includes( plan_id );

  return {
      ok: true,
      one_off: true
  };
}

exports.product_plan_is_one_off = product_plan_is_one_off;
