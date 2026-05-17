const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcryptjs");

// API ĐĂNG NHẬP
router.post("/login", async (req, res) => {
  const { tenDangNhap, MatKhau } = req.body;

  try {
    const [users] = await db.query("SELECT * FROM TaiKhoan WHERE tenDangNhap = ?", [tenDangNhap]);

    if (users.length === 0) {
      return res.status(401).json({ message: "Tên đăng nhập không tồn tại" });
    }

    const user = users[0];

    // Kiểm tra mật khẩu (Hiện tại database đang lưu text thuần)
    if (MatKhau !== user.MatKhau) {
      return res.status(401).json({ message: "Mật khẩu không chính xác" });
    }

    // Lưu thông tin vào session
    req.session.user = {
      id: user.MaTaiKhoan,
      username: user.tenDangNhap,
      role: user.vaiTro
    };

    res.json({ message: "Đăng nhập thành công", user: req.session.user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API ĐĂNG XUẤT
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).send("Không thể đăng xuất");
    res.clearCookie('connect.sid'); // Xóa cookie của session
    res.json({ message: "Đã đăng xuất thành công" });
  });
});

// Kiểm tra trạng thái đăng nhập
router.get("/check", (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

module.exports = router;