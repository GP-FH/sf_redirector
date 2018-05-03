const logger = require('../libs/lib_logger');
const mysql = require('mysql2/promise');
const pool = mysql.createPool( {
    connectionLimit: 500,
    host: "128.199.88.172",
    user: "sf-hq-user",
    password: "Kc3/H}96g{>fc",
    database: "hq_dev"
} );

const find_user_by_name = async (username) => {
  logger.info(`Got to the db function`);
  const connection = await pool.getConnection();
  logger.info(`got connection`);
  let [rows, fields] = await connection.query(`select username, pw from hq_users where username = '${username}'`);
  logger.info(`executed a query`);
  connection.release();

  if (rows.length == 0) return {ok:true, user:false};

  logger.info(`returned from DB: ${JSON.stringify(rows)}`);

  const user = {username:username, password: rows[0].pw};

  return {ok:true, user:user};
};

exports.find_user_by_name = find_user_by_name;
