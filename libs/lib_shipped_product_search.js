const db = require("../libs/lib_db");

const sps_get = async (email) => {
  const ret = await db.db_legacy_get_orders_by_email(email);
  return ret;
};

const sps_check = async (email, sku) => {
  const ret = await db.db_legacy_check_for_product_order(email, sku);
};

exports.sps_get = sps_get;
exports.sps_check = sps_check;
