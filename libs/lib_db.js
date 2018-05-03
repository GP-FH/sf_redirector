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

  let [rows, fields] = await connection.execute(`select username, password from hq_users where username = '${username}'`);

  connection.release();

  if (row.length == 0) return {ok:true, user:false};

  const user = {username:username, password: row[0].pw};

  return {ok:true, user:user};
};
