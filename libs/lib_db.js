const logger = require('../libs/lib_logger');
const mysql = require('mysql2/promise');
const pool = mysql.createPool( {
    connectionLimit: 500,
    host: "10.130.12.240",
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
  logger.info(`returned from DB: ${rows}`);
  connection.release();

  if (rows.length == 0) return {ok:true, user:false};


  const user = {username:username, password: rows[0].pw};

  return {ok:true, user:user};
};

exports.find_user_by_name = find_user_by_name;
