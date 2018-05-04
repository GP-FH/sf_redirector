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
    let [rows, fields] = await connection.query(`select username, password from hq_users where username = '${username}'`);
    connection.release();
  }catch(err){
    throw new VError(err, "Error find_user_by_name query");
  }
  logger.info(`returned from DB: ${JSON.stringify(rows)}`);
  if (rows.length == 0) return {ok:true, user:false};


  return {ok:true, user:rows[0]};
};

exports.find_user_by_name = find_user_by_name;
