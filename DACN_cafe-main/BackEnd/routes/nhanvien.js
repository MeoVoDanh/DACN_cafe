const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Lấy danh sách nhân viên (kết hợp với bảng TaiKhoan)
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT nv.MaNhanVien, nv.HoTen, nv.SoCCCD, nv.Email, nv.SDT, nv.TrangThai, nv.MaTaiKhoan, 
             tk.tenDangNhap, tk.MatKhau, tk.vaiTro 
      FROM NhanVien nv 
      LEFT JOIN TaiKhoan tk ON nv.MaTaiKhoan = tk.MaTaiKhoan
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tạo nhân viên mới
router.post("/", async (req, res) => {
  const { name, user, pass, role, cccd, email, phone, status } = req.body;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Thêm vào bảng TaiKhoan trước
    const [taikhoanResult] = await connection.query(
      "INSERT INTO TaiKhoan (tenDangNhap, MatKhau, vaiTro) VALUES (?, ?, ?)",
      [user, pass, role]
    );
    const maTaiKhoan = taikhoanResult.insertId;

    const [nhanVienResult] = await connection.query(
      "INSERT INTO NhanVien (HoTen, SoCCCD, Email, SDT, TrangThai, MaTaiKhoan) VALUES (?, ?, ?, ?, ?, ?)",
      [name, cccd, email, phone, status || "Đang làm việc", maTaiKhoan]
    );

    await connection.commit();
    res.json({ message: "Thêm nhân viên thành công!", id: nhanVienResult.insertId });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// Lấy 1 nhân viên theo ID
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM NhanVien WHERE MaNhanVien = ?",
      [req.params.id],
    );
    if (rows.length === 0) return res.status(404).send("Không tìm thấy");
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
//Cập nhật thông tin nhân viên
router.post("/update/:id", async (req, res) => {
  const { name, cccd, email, phone, status } = req.body;
  try {
    const [rows] = await db.query(
      "UPDATE NhanVien SET HoTen = ?, SoCCCD = ?, Email = ?, SDT = ?, TrangThai = ? WHERE MaNhanVien = ?",
      [name, cccd, email, phone, status, req.params.id],
    );
    if (rows.affectedRows === 0)
      return res.status(404).send("Không tìm thấy nhân viên");
    res.send("Cập nhật thành công");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Xóa nhân viên
router.delete("/delete/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM NhanVien WHERE MaNhanVien = ?", [
      req.params.id,
    ]);
    res.send("Xóa thành công");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
