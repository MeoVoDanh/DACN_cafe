var express = require('express');
var bodyParser = require("body-parser");
var cors = require('cors');
var mysql = require('mysql2');
var unidecode = require("unidecode");

var app = express();
app.use(cors());
app.use(bodyParser.json());

// Kết nối MySQL
var con = mysql.createConnection({
    host: "localhost",
    port: "3306",
    user: "root",
    password: "123456",
    database: "dacn_cafe"
});

con.connect(err => {
    if (err) {
        console.error("Kết nối MySQL thất bại: " + err.stack);
        return;
    }
    console.log("Đã kết nối MySQL với id " + con.threadId);
});



//API đăng ký tài khoản nhân viên
app.post("/create-account", (req, res) => {
    const { tenDangNhap, matKhau, hoTen, email, sdt } = req.body;

    // Kiểm tra tên đăng nhập phải kết thúc bằng @nhanvien
    if (!tenDangNhap.endsWith("@nhanvien")) {
        return res.status(400).json({ error: "Tên đăng nhập phải kết thúc bằng @nhanvien" });
    }
    // kiểm tra tên đăng nhập không dấu + không khoảng trắng
    if (unidecode(tenDangNhap) !== tenDangNhap || /\s/.test(tenDangNhap)) {
        return res.status(400).json({ error: "Tên đăng nhập không được chứa dấu hoặc khoảng trắng" });
    }

    // kiểm tra email không dấu + không khoảng trắng
    if (unidecode(email) !== email || /\s/.test(email)) {
        return res.status(400).json({ error: "Email không được chứa dấu hoặc khoảng trắng" });
    }
    // Kiểm tra số điện thoại phải là số và đúng 11 chữ số
    const phoneRegex = /^[0-9]{11}$/;
    if (!phoneRegex.test(sdt)) {
        return res.status(400).json({ error: "Số điện thoại phải là số gồm đúng 11 chữ số" });
    }

    // Vai trò mặc định là "NhanVien"
    const vaiTro = "NhanVien";

    // Thêm vào bảng TaiKhoan
    con.query(
        "INSERT INTO TaiKhoan (tenDangNhap, MatKhau, vaiTro) VALUES (?, ?, ?)",
        [tenDangNhap, matKhau, vaiTro],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });

            const maTaiKhoan = result.insertId;

            // Thêm vào bảng NhanVien
            con.query(
                "INSERT INTO NhanVien (HoTen, Email, SDT, MaTaiKhoan) VALUES (?, ?, ?, ?)",
                [hoTen, email, sdt, maTaiKhoan],
                (err2, result2) => {
                    const maNhanVien = result2.insertId;

                    if (err2) return res.status(500).json({ error: err2.message });
                    res.json({ message: "Tạo tài khoản nhân viên thành công!", maNhanVien });
                }
            );
        }
    );
});

// API đăng nhập
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    con.query(
        "SELECT MaTaiKhoan, tenDangNhap, vaiTro FROM TaiKhoan WHERE tenDangNhap = ? AND MatKhau = ?",
        [username, password],
        (err, results) => {
            if (err) {
                console.log(err); // 👈 thêm dòng này để debug
                return res.status(500).json({ error: "Lỗi truy vấn MySQL" });
            }

            if (results.length > 0) {
                res.json({
                    role: results[0].vaiTro,
                    profile: results[0]
                });
            } else {
                res.status(401).json({ error: "Sai thông tin đăng nhập" });
            }
        }
    );
});

app.get('/nhanvien/:id', (req, res) => {
    const id = req.params.id;
    const sql = `
    SELECT tk.MaTaiKhoan, tk.tenDangNhap, tk.MatKhau, tk.vaiTro,
           nv.MaNhanVien, nv.HoTen, nv.Email, nv.SDT
    FROM NhanVien nv
    JOIN TaiKhoan tk ON nv.MaTaiKhoan = tk.MaTaiKhoan
    WHERE nv.MaNhanVien = ?
  `;
    con.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json(result[0]);
    });
});

// Lấy danh sách nhân viên (trừ @quanly)
app.get('/tendangnhapvamanhanvien', (req, res) => {
    const sql = `
        SELECT tk.tenDangNhap, nv.MaNhanVien
        FROM NhanVien nv
        JOIN TaiKhoan tk ON nv.MaTaiKhoan = tk.MaTaiKhoan
        WHERE tk.tenDangNhap NOT LIKE '%@quanly'
    `;
    con.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results); // Trả về mảng các đối tượng { tenDangNhap: ... }
    });
});

app.put("/nhanvien/:id", (req, res) => {
  const { tenDangNhap, MatKhau, HoTen, Email, SDT } = req.body;

  // Lấy MaTaiKhoan từ nhân viên
  con.query(
    "SELECT MaTaiKhoan FROM NhanVien WHERE MaNhanVien = ?",
    [req.params.id],
    (err, nv) => {
      if (err) return res.status(500).json({ error: err.message });
      if (nv.length === 0) return res.status(404).json({ error: "Không tìm thấy nhân viên" });

      const maTK = nv[0].MaTaiKhoan;

      // Update bảng TaiKhoan
      con.query(
        "UPDATE TaiKhoan SET tenDangNhap=?, MatKhau=? WHERE MaTaiKhoan=?",
        [tenDangNhap, MatKhau, maTK],
        (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });

          // Update bảng NhanVien
          con.query(
            "UPDATE NhanVien SET HoTen=?, Email=?, SDT=? WHERE MaNhanVien=?",
            [HoTen, Email, SDT, req.params.id],
            (err3) => {
              if (err3) return res.status(500).json({ error: err3.message });

              res.json({ message: "Cập nhật thành công" });
            }
          );
        }
      );
    }
  );
});

// Xóa nhân viên theo MaNhanVien
app.delete("/nhanvien/:id", (req, res) => {
  const id = req.params.id;

  // Lấy MaTaiKhoan từ nhân viên
  con.query(
    "SELECT MaTaiKhoan FROM NhanVien WHERE MaNhanVien = ?",
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.length === 0) {
        return res.status(404).json({ error: "Không tìm thấy nhân viên" });
      }

      const maTK = result[0].MaTaiKhoan;

      // Xóa tài khoản (nhân viên sẽ tự động bị xóa nhờ ON DELETE CASCADE)
      con.query(
        "DELETE FROM TaiKhoan WHERE MaTaiKhoan = ?",
        [maTK],
        (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });

          res.json({ message: "Xóa nhân viên và tài khoản thành công" });
        }
      );
    }
  );
});



//server
var server = app.listen(5555, function () {
    var host = server.address().name ? server.address().name : 'localhost';
    var port = server.address().port

    console.log("Example app listening at http://%s:%s", host, port)
})
