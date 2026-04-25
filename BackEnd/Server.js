const mysql = require('mysql2'); // <-- THÊM DÒNG NÀY
var express = require('express');
var bodyParser = require("body-parser");
const cors = require('cors');


var app = express();
app.use(cors());

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))

var con = mysql.createConnection({
  host: "localhost",
  port: "3306",
  user: "root",
  password: "080705Trong",
  insecureAuth: true,
  database: "DACN_cafe",
});

app.get("/nhanvien", function (req, res) {
  var sql = "SELECT * FROM nhanvien";
  con.query(sql, function (err, results) {
    if (err) {
      return res.status(500).send(err);
    }
    res.status(200).send(results);
  });
});

app.get("/taikhoan", function (req, res) {
  var sql = "SELECT * FROM taikhoan";
  con.query(sql, function (err, results) {
    if (err) {
      return res.status(500).send(err);
    }
    res.status(200).send(results);
  });
});

app.get("/douong", function (req, res) {
  var sql = "SELECT * FROM douong";
  con.query(sql, function (err, results) {
    if (err) {
      return res.status(500).send(err);
    }
    res.status(200).send(results);
  });
});

app.post("/douong/add", function (req, res) {
  const { tenDoUong, donGia, moTa, hinhAnh } = req.body;

  const insertSql = "insert into douong(tenDoUong, donGia, moTa, hinhAnh) values (?,?,?,?)";
  con.query(insertSql, [tenDoUong, donGia, moTa, hinhAnh], function (err, result) {
    if (err) {
      return res.status(500).send(err);
    }

    res.status(201).send({
      message: "them do uong thanh cong",
      data: {
        id: result.insertId,
        tenDoUong: tenDoUong,
        donGia:donGia,
        moTa:moTa,
        hinhAnh:hinhAnh
      },
    });
  });
});



var server = app.listen(3000, function () {
  var host = server.address().name ? server.address().name : "localhost";
  var port = server.address().port;

  console.log("Example app listening at http://%s:%s", host, port);
});