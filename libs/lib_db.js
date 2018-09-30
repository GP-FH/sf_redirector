const logger = require('../libs/lib_logger');
const mysql = require('mysql2/promise');
const VError = require('verror');
const hq_pool = mysql.createPool( {
    connectionLimit: 500,
    host: "128.199.88.172",
    user: "sf-hq-user",
    password: "Kc3/H}96g{>fc",
    database: "hq_dev"
} );

const redirect_pool = mysql.createPool( {
    connectionLimit: 500,
    host: "178.128.87.107",
    user: "sf-redirect-user",
    password: "is[42QH)7(A>m",
    database: "aux"
} );

const find_user_by_name = async (username) => {
  try{
    const connection = await hq_pool.getConnection();
    let [rows, fields] = await connection.query(`select * from hq_users where username = '${username}'`);
    connection.release();

    if (rows.length == 0) return {ok:true, user:false};

    return {ok:true, user:rows[0]};
  }catch(err){
    throw new VError(err, "Error find_user_by_name query");
  }
};

const find_user_by_id = async (id) => {
  try{
    const connection = await hq_pool.getConnection();
    let [rows, fields] = await connection.query(`select * from hq_users where id = '${id}'`);
    connection.release();

    if (rows.length == 0) return {ok:true, user:false};

    return {ok:true, user:rows[0]};
  }catch(err){
    throw new VError(err, "Error find_user_by_name query");
  }
};

const db_legacy_check_for_product_order = async (email, sku) => {
  try{
    const connection = await hq_pool.getConnection();
    let [rows, fields] = await connection.query(`select product_code, product_name, product_option1, quantity from legacy_shipped_products where email = '${email}' and product_code = '${sku}'`);
    connection.release();

    if (rows.length == 0) return {ok:true, products:false};

    return {ok:true, products:rows};
  }catch(err){
    throw new VError(err, "Error db_legacy_check_for_product_order query");
  }
};

const db_legacy_get_orders_by_email = async (email) => {
  try{
    const connection = await hq_pool.getConnection();
    let [rows, fields] = await connection.query(`select product_code, product_name, product_option1, quantity from legacy_shipped_products where email = '${email}'`);
    connection.release();

    if (rows.length == 0) return {ok:true, products:false};

    return {ok:true, products:rows};
  }catch(err){
    throw new VError(err, "db_legacy_get_orders_by_email");
  }
};

const db_aux_store_style_profile = async (profile) => {
  try{
    const connection = await redirect_pool.getConnection();
    let [rows, fields] = await connection.query(`insert into pre_subs values (NULL, '${profile.ts}', '${profile.email}', '${profile.gender}',
    '${profile.childname}', '${profile.childage}', '${profile.topsize}', '${profile.ts_fit}', '${profile.bottomsize}', '${profile.bs_fit}', '${profile.palette}', '${profile.style}',
    '${profile.pared_to_bold}', '${profile.pared_to_fun}', '${profile.vintage_to_fem}', '${profile.vintage_to_beachy}', ${profile.avoid_colours}', '${profile.designs}', '${profile.do_not_want}',
    '${profile.need_most}', '${profile.unisex}', '${profile.other_notes}')`);
    connection.release();

    return {ok:true};
  }catch(err){
    throw new VError(err, "db_aux_store_style_profile");
  }
};

const db_aux_retrieve_most_recent_style_profile = async (email) => {
  try{
    const connection = await redirect_pool.getConnection();
    let [rows, fields] = await connection.query(`select * from pre_subs where email = '${email}' order by ts desc`);
    connection.release();

    if (rows.length == 0) return {ok:true, subscription:false};

    return {ok:true, subscription:rows[0]};
  }catch(err){
    throw new VError(err, "db_aux_retrieve_most_recent_style_profile");
  }
};

exports.find_user_by_name = find_user_by_name;
exports.find_user_by_id = find_user_by_id;
exports.db_legacy_get_orders_by_email = db_legacy_get_orders_by_email;
exports.db_legacy_check_for_product_order = db_legacy_check_for_product_order;
exports.db_aux_store_style_profile = db_aux_store_style_profile;
exports.db_aux_retrieve_most_recent_style_profile = db_aux_retrieve_most_recent_style_profile
