const express = require("express");
const router = express.Router();
const db = require("../config/db");

// ==========================================
// 1. XEM THÔNG TIN CÁ NHÂN (PROFILE)
// ==========================================
router.get("/profile", async (req, res) => {
  try {
    const maTaiKhoan = req.session.user.id;

    const sql = `
            SELECT nv.HoTen, nv.Email, nv.SDT, tk.tenDangNhap, tk.vaiTro 
            FROM NhanVien nv
            JOIN TaiKhoan tk ON nv.MaTaiKhoan = tk.MaTaiKhoan
            WHERE nv.MaTaiKhoan = ?`;

    const [rows] = await db.query(sql, [maTaiKhoan]);

    if (rows.length === 0)
      return res.status(404).json({ message: "Không tìm thấy thông tin" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. XEM LỊCH LÀM VIỆC (CA LÀM) CỦA CÁ NHÂN
// ==========================================
router.get("/my-shifts", async (req, res) => {
  try {
    const maTaiKhoan = req.session.user.id;

    const sql = `
            SELECT c.tenCa, c.gioBatDau, c.gioKetThuc, c.ngayLam, c.trangThai
            FROM CaLamViec c
            JOIN NhanVien nv ON c.MaNhanVien = nv.MaNhanVien
            WHERE nv.MaTaiKhoan = ?
            ORDER BY c.ngayLam DESC`;

    const [rows] = await db.query(sql, [maTaiKhoan]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. XEM THỐNG KÊ ĐƠN HÀNG ĐÃ THỰC HIỆN (KPI)
// ==========================================
router.get("/my-stats", async (req, res) => {
  try {
    const maTaiKhoan = req.session.user.id;

    const sql = `
            SELECT 
                COUNT(h.maHoaDon) AS tongSoDon,
                SUM(h.tongtien) AS tongDoanhThuCaNhan,
                CURDATE() as ngayHienTai
            FROM HoaDon h
            JOIN NhanVien nv ON h.MaNhanVien = nv.MaNhanVien
            WHERE nv.MaTaiKhoan = ? AND h.trangthaithanhtoan = 'Đã thanh toán'`;

    const [rows] = await db.query(sql, [maTaiKhoan]);
    res.json({
      message: "Thống kê hiệu suất bán hàng",
      data: rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
