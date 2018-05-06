const logger = require('../libs/lib_logger');
const mysql = require('mysql2/promise');
const VError = require('verror');
const pool = mysql.createPool( {
    connectionLimit: 500,
    host: "128.199.88.172",
    user: "sf-hq-user",
    password: "Kc3/H}96g{>fc",
    database: "hq_dev"
} );

const find_user_by_name = async (username) => {
  logger.info("making it to the DB!");
  try{
    const connection = await pool.getConnection();
    let [rows, fields] = await connection.query(`select * from hq_users where username = '${username}'`);
    connection.release();

    logger.info(`returned from DB: ${JSON.stringify(rows)}`);
    if (rows.length == 0) return {ok:true, user:false};


    return {ok:true, user:rows[0]};
  }catch(err){
    throw new VError(err, "Error find_user_by_name query");
  }
};

const find_user_by_id = async (id) => {
  logger.info("making it to the DB!");
  try{
    const connection = await pool.getConnection();
    let [rows, fields] = await connection.query(`select * from hq_users where id = '${id}'`);
    connection.release();

    logger.info(`returned from DB: ${JSON.stringify(rows)}`);
    if (rows.length == 0) return {ok:true, user:false};


    return {ok:true, user:rows[0]};
  }catch(err){
    throw new VError(err, "Error find_user_by_name query");
  }
};

const db_legacy_check_for_product_order = async (email, sku) => {
  try{
    const connection = await pool.getConnection();
    let [rows, fields] = await connection.query(`select * from legacy_shipped_products where email = '${email}' and product_code = '${sku}'`);
    connection.release();

    logger.info(`returned from DB: ${JSON.stringify(rows)}`);
    if (rows.length == 0) return {ok:true, products:false};

    return {ok:true, products:rows};
  }catch(err){
    throw new VError(err, "Error db_legacy_check_for_product_order query");
  }
};

const db_legacy_get_orders_by_email = async (email) => {
  try{
    const connection = await pool.getConnection();
    let [rows, fields] = await connection.query(`select * from legacy_shipped_products where email = '${email}'`);
    connection.release();

    logger.info(`returned from DB: ${JSON.stringify(rows)}`);
    if (rows.length == 0) return {ok:true, products:false};

    return {ok:true, products:rows};
  }catch(err){
    throw new VError(err, "db_legacy_get_orders_by_email");
  }
};

exports.find_user_by_name = find_user_by_name;
exports.find_user_by_id = find_user_by_id;
exports.db_legacy_get_orders_by_email = db_legacy_get_orders_by_email;
exports.db_legacy_check_for_product_order = db_legacy_check_for_product_order;
