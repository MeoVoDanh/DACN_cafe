var mysql = require("mysql2");

const pool = mysql.createPool({
  host: "localhost",
  port: "3306",
  user: "root",
  password: "080705Trong",
  database: "DACN_cafe",
  waitForConnections: true,
  connectionLimit: 10, // Giới hạn 10 kết nối cùng lúc để tránh quá tải DB
  queueLimit: 0,
});

module.exports = pool.promise(); // Sử dụng promise để dùng async/await cho sạch code
