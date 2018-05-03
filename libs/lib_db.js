const logger = require('../libs/lib_logger');
const mysql = require('mysql2/promise');
const pool = mysql.createPool( {
    connectionLimit: 500,
    host: "10.130.12.240",
    user: "sf-hq-user",
    password: "Kc3/H}96g{>fc",
    database: "hq_dev",
    multipleStatements: 'true'
} );

const find_user_by_name = async (username) => {
  const connection = await pool.getConnection();
  let [rows, fields] = await connection.execute(`select username, pw from hq_users where username = '${username}'`);

  if (rows.length == 0){
    //connection.release();
    return {ok:true, user:false};
  }
  const user = {username:username, password: rows[0].pw};
  //connection.release();

  return {ok:true, user:user};
};

exports.find_user_by_name = find_user_by_name;
