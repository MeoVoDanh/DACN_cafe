const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { checkLogin, isAdmin } = require("../middleware/authMiddleware");

// ==========================================
// 1. LẤY DANH SÁCH CA LÀM (GET)
// ==========================================
// Admin: Xem toàn bộ quán | Nhân viên: Chỉ xem ca của mình
router.get("/", checkLogin, async (req, res) => {
  try {
    const { role, id } = req.session.user;
    let sql = `
            SELECT c.*, nv.HoTen 
            FROM CaLamViec c 
            JOIN NhanVien nv ON c.MaNhanVien = nv.MaNhanVien`;
    let params = [];

    if (role !== "Admin") {
      sql += " WHERE nv.MaTaiKhoan = ?";
      params.push(id);
    }

    sql += " ORDER BY c.ngayLam DESC, c.gioBatDau ASC";
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. ADMIN THÊM CA LÀM MỚI (POST)
// ==========================================
router.post("/add", checkLogin, isAdmin, async (req, res) => {
  const { tenCa, gioBatDau, gioKetThuc, ngayLam, MaNhanVien } = req.body;
  try {
    const sql = `
            INSERT INTO CaLamViec (tenCa, gioBatDau, gioKetThuc, ngayLam, trangThai, MaNhanVien) 
            VALUES (?, ?, ?, ?, 'Chưa bắt đầu', ?)`;
    const [result] = await db.query(sql, [
      tenCa,
      gioBatDau,
      gioKetThuc,
      ngayLam,
      MaNhanVien,
    ]);
    res.status(201).json({
      message: "Admin đã thêm ca làm thành công",
      id: result.insertId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. ADMIN SỬA THÔNG TIN CA LÀM (PUT)
// ==========================================
router.put("/edit/:id", checkLogin, isAdmin, async (req, res) => {
  const { id } = req.params; // maCa
  const { tenCa, gioBatDau, gioKetThuc, ngayLam, trangThai, MaNhanVien } =
    req.body;
  try {
    const sql = `
            UPDATE CaLamViec 
            SET tenCa = ?, gioBatDau = ?, gioKetThuc = ?, ngayLam = ?, trangThai = ?, MaNhanVien = ?
            WHERE maCa = ?`;
    const [result] = await db.query(sql, [
      tenCa,
      gioBatDau,
      gioKetThuc,
      ngayLam,
      trangThai,
      MaNhanVien,
      id,
    ]);

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Không tìm thấy ca làm" });
    res.json({ message: "Cập nhật ca làm thành công" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. XÓA/HỦY CA LÀM (Có điều kiện 3 ngày)
// ==========================================
router.delete("/delete/:id", checkLogin, async (req, res) => {
  const maCa = req.params.id;
  const { id, role } = req.session.user; // id ở đây là MaTaiKhoan từ session

  try {
    // 1. Lấy thông tin ca làm để kiểm tra ngày và quyền sở hữu
    const [rows] = await db.query(
      `
            SELECT c.ngayLam, c.trangThai, nv.MaTaiKhoan 
            FROM CaLamViec c
            JOIN NhanVien nv ON c.MaNhanVien = nv.MaNhanVien
            WHERE c.maCa = ?`,
      [maCa],
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy ca làm việc này." });
    }

    const caLam = rows[0];
    const ngayLamViec = new Date(caLam.ngayLam);
    const ngayHienTai = new Date();

    // Tính toán khoảng cách ngày (milliseconds -> days)
    const diffTime = ngayLamViec - ngayHienTai;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // 2. KIỂM TRA ĐIỀU KIỆN

    // Nếu là Nhân viên:
    if (role !== "Admin") {
      // Kiểm tra xem có phải ca của chính mình không
      if (caLam.MaTaiKhoan !== id) {
        return res
          .status(403)
          .json({ message: "Bạn không có quyền xóa ca làm của người khác." });
      }

      // Kiểm tra điều kiện 3 ngày
      if (diffDays < 3) {
        return res.status(400).json({
          message: `Không thể hủy! Bạn chỉ được phép hủy ca trước ngày làm việc ít nhất 3 ngày. (Còn ${diffDays} ngày nữa là đến ca làm)`,
        });
      }

      // Kiểm tra trạng thái ca
      if (caLam.trangThai !== "Chưa bắt đầu") {
        return res
          .status(400)
          .json({
            message: "Không thể hủy ca đang thực hiện hoặc đã kết thúc.",
          });
      }
    }

    // 3. THỰC HIỆN XÓA (Admin hoặc NV thỏa mãn điều kiện)
    await db.query("DELETE FROM CaLamViec WHERE maCa = ?", [maCa]);

    res.json({ message: "Đã xóa ca làm việc thành công." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. NHÂN VIÊN TỰ ĐĂNG KÝ CA (POST)
// ==========================================
router.post("/dang-ky", checkLogin, async (req, res) => {
  const { tenCa, gioBatDau, gioKetThuc, ngayLam } = req.body;
  const maTaiKhoan = req.session.user.id;

  try {
    const [nv] = await db.query(
      "SELECT MaNhanVien FROM NhanVien WHERE MaTaiKhoan = ?",
      [maTaiKhoan],
    );
    const maNV = nv[0].MaNhanVien;

    const sql = `
            INSERT INTO CaLamViec (tenCa, gioBatDau, gioKetThuc, ngayLam, trangThai, MaNhanVien) 
            VALUES (?, ?, ?, ?, 'Chưa bắt đầu', ?)`;
    await db.query(sql, [tenCa, gioBatDau, gioKetThuc, ngayLam, maNV]);

    res.status(201).json({ message: "Bạn đã đăng ký ca làm thành công" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
