const express = require("express");
const router = express.Router();
const db = require("../config/db");

// ==========================================
// 1. TẠO MỚI MỘT HÓA ĐƠN TRỐNG
// ==========================================
router.post("/tao", async (req, res) => {
  try {
    const maTaiKhoan = req.session.user.id;
    // Tìm MaNhanVien từ MaTaiKhoan
    const [nv] = await db.query(
      "SELECT MaNhanVien FROM NhanVien WHERE MaTaiKhoan = ?",
      [maTaiKhoan],
    );
    const maNV = nv[0].MaNhanVien;

    const sql =
      "INSERT INTO HoaDon (ngaylap, tongtien, trangthaithanhtoan, MaNhanVien) VALUES (CURDATE(), 0, 'Chưa thanh toán', ?)";
    const [result] = await db.query(sql, [maNV]);

    res
      .status(201)
      .json({ message: "Đã tạo hóa đơn mới", maHoaDon: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. THÊM MÓN VÀO HÓA ĐƠN
// ==========================================
router.post("/them-mon", async (req, res) => {
  const { maHoaDon, maDoUong, soluong } = req.body;
  try {
    // Lấy đơn giá hiện tại của đồ uống
    const [mon] = await db.query(
      "SELECT donGia FROM DoUong WHERE maDoUong = ?",
      [maDoUong],
    );
    const dongia = mon[0].donGia;
    const thanhtien = dongia * soluong;

    // Thêm vào chi tiết (Nếu món đã tồn tại thì cộng dồn số lượng - ON DUPLICATE KEY)
    const sql = `
            INSERT INTO ChiTietHoaDon (maHoaDon, maDoUong, soluong, dongia, thanhtien) 
            VALUES (?, ?, ?, ?, ?) 
            ON DUPLICATE KEY UPDATE 
                soluong = soluong + VALUES(soluong), 
                thanhtien = soluong * dongia`;

    await db.query(sql, [maHoaDon, maDoUong, soluong, dongia, thanhtien]);

    // Cập nhật lại tổng tiền trong bảng HoaDon
    await capNhatTongTien(maHoaDon);

    res.json({ message: "Đã thêm món thành công" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. CHỈNH SỬA SỐ LƯỢNG MÓN
// ==========================================
router.put("/sua-so-luong", async (req, res) => {
  const { maHoaDon, maDoUong, soluongMoi } = req.body;
  try {
    if (soluongMoi <= 0)
      return res.status(400).json({ message: "Số lượng phải lớn hơn 0" });

    const sql =
      "UPDATE ChiTietHoaDon SET soluong = ?, thanhtien = soluong * dongia WHERE maHoaDon = ? AND maDoUong = ?";
    await db.query(sql, [soluongMoi, maHoaDon, maDoUong]);

    await capNhatTongTien(maHoaDon);
    res.json({ message: "Đã cập nhật số lượng" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. XÓA MÓN KHỎI HÓA ĐƠN
// ==========================================
router.delete("/xoa-mon", async (req, res) => {
  const { maHoaDon, maDoUong } = req.body;
  try {
    await db.query(
      "DELETE FROM ChiTietHoaDon WHERE maHoaDon = ? AND maDoUong = ?",
      [maHoaDon, maDoUong],
    );

    await capNhatTongTien(maHoaDon);
    res.json({ message: "Đã xóa món khỏi hóa đơn" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. XÁC NHẬN THANH TOÁN
// ==========================================
router.post("/xac-nhan-thanh-toan", async (req, res) => {
  const { maHoaDon } = req.body;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Chuyển trạng thái hóa đơn thành 'Đã thanh toán'
    // Ngay lập tức, hóa đơn này "đủ điều kiện" để được tính vào Doanh thu và KPI
    await connection.query(
      "UPDATE HoaDon SET trangthaithanhtoan = 'Đã thanh toán' WHERE maHoaDon = ?",
      [maHoaDon],
    );

    // 2. Ghi nhận vào bảng ThanhToan để lưu vết thời gian thực tế thu tiền
    await connection.query(
      "INSERT INTO ThanhToan (thoigianthanhtoan, sotien, maHoaDon) SELECT NOW(), tongtien, maHoaDon FROM HoaDon WHERE maHoaDon = ?",
      [maHoaDon],
    );

    await connection.commit();

    // 3. Phản hồi cho Frontend để cập nhật giao diện
    res.json({
      status: "success",
      message: "Thanh toán thành công! Doanh thu và KPI đã được cập nhật.",
    });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});
// Hàm bổ trợ: Tự động tính toán lại tổng tiền của Hóa Đơn
async function capNhatTongTien(maHoaDon) {
  const sql = `
        UPDATE HoaDon 
        SET tongtien = (SELECT SUM(thanhtien) FROM ChiTietHoaDon WHERE maHoaDon = ?) 
        WHERE maHoaDon = ?`;
  await db.query(sql, [maHoaDon, maHoaDon]);
}

module.exports = router;
