const express = require("express");
const router = express.Router();
const db = require("../config/db");

// 1. Xem doanh thu theo ngày cụ thể
// Đường dẫn: /doanhthu/ngay?date=2024-05-01
router.get("/chi-tiet-ngay", async (req, res) => {
  const { date } = req.query; // Lấy ngày từ query string

  if (!date) {
    return res.status(400).json({ message: "Vui lòng cung cấp ngày cụ thể." });
  }

  try {
    // 1. Lấy tổng kết doanh thu của ngày
    const sqlSummary = `
            SELECT 
                COUNT(maHoaDon) AS tongSoDon,
                SUM(tongtien) AS tongDoanhThu
            FROM HoaDon 
            WHERE ngaylap = ? AND trangthaithanhtoan = 'Đã thanh toán'`;

    // 2. Lấy danh sách chi tiết các hóa đơn trong ngày đó
    const sqlInvoices = `
            SELECT h.maHoaDon, h.tongtien, n.HoTen AS nhanVien, t.thoigianthanhtoan
            FROM HoaDon h
            JOIN NhanVien n ON h.MaNhanVien = n.MaNhanVien
            LEFT JOIN ThanhToan t ON h.maHoaDon = t.maHoaDon
            WHERE h.ngaylap = ? AND h.trangthaithanhtoan = 'Đã thanh toán'
            ORDER BY t.thoigianthanhtoan DESC`;

    const [summary] = await db.query(sqlSummary, [date]);
    const [invoices] = await db.query(sqlInvoices, [date]);

    res.json({
      ngay: date,
      tongKet: summary[0] || { tongSoDon: 0, tongDoanhThu: 0 },
      danhSachHoaDon: invoices,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Xem doanh thu theo từng ca trong một ngày
// Đường dẫn: /doanhthu/ca?date=2024-05-01
router.get("/ca", async (req, res) => {
  try {
    const { date } = req.query;
    if (!date)
      return res.status(400).json({ message: "Vui lòng cung cấp ngày" });

    // Câu lệnh này sẽ kết hợp bảng HoaDon và CaLamViec thông qua MaNhanVien và Ngay
    const sql = `
            SELECT 
            c.tenCa, 
            n.HoTen AS NhanVienPhucVu,
            COUNT(h.maHoaDon) AS SoLuongDon,
            SUM(h.tongtien) AS TongDoanhThuCa
            FROM HoaDon h
            JOIN NhanVien n ON h.MaNhanVien = n.MaNhanVien
            JOIN CaLamViec c ON h.MaNhanVien = c.MaNhanVien AND h.ngaylap = c.ngayLam
            WHERE h.trangthaithanhtoan = 'Đã thanh toán' 
            AND h.ngaylap = CURDATE()
            GROUP BY c.maCa;`;

    const [rows] = await db.query(sql, [date]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Xem tổng doanh thu tất cả các ngày (để vẽ biểu đồ)
router.get("/tong-hop", async (req, res) => {
  try {
    const sql = `
            SELECT ngaylap, SUM(tongtien) as doanhThu 
            FROM HoaDon 
            WHERE trangthaithanhtoan = 'Đã thanh toán'
            GROUP BY ngaylap 
            ORDER BY ngaylap DESC`;
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
