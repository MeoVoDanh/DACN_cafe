const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { checkLogin, isAdmin } = require("../middleware/authMiddleware");

// Lấy danh sách ca làm việc theo ngày
router.get("/ngay/:date", async (req, res) => {
  const { date } = req.params; // Format: YYYY-MM-DD
  try {
    const [caLamRows] = await db.query(
      `SELECT c.maCa, c.tenCa, c.ngayLam, c.trangThai, nv.MaNhanVien, nv.HoTen, tk.vaiTro
       FROM CaLamViec c
       LEFT JOIN ChiTietCaLam ct ON c.maCa = ct.maCa
       LEFT JOIN NhanVien nv ON ct.MaNhanVien = nv.MaNhanVien
       LEFT JOIN TaiKhoan tk ON nv.MaTaiKhoan = tk.MaTaiKhoan
       WHERE c.ngayLam = ?`,
      [date]
    );

    // Grouping by Ca (Sáng, Chiều, Tối)
    const shifts = {
      "Ca Sáng": { id: null, staff: [] },
      "Ca Chiều": { id: null, staff: [] },
      "Ca Tối": { id: null, staff: [] },
    };

    caLamRows.forEach((row) => {
      if (shifts[row.tenCa]) {
        shifts[row.tenCa].id = row.maCa;
        if (row.MaNhanVien) {
          shifts[row.tenCa].staff.push({
             MaNhanVien: row.MaNhanVien,
             HoTen: row.HoTen,
          });
        }
      }
    });

    res.json(shifts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lưu thông tin ca làm việc (Thêm mới hoặc Cập nhật nhân viên trong ca)
router.post("/luu-ca", checkLogin, isAdmin, async (req, res) => {
  const { tenCa, ngayLam, danhSachNhanVien } = req.body;
  
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Kiểm tra xem ca làm việc này đã tồn tại trong ngày chưa
    let [caRows] = await connection.query(
      "SELECT maCa FROM CaLamViec WHERE tenCa = ? AND ngayLam = ?",
      [tenCa, ngayLam]
    );

    let maCa;
    if (caRows.length > 0) {
      maCa = caRows[0].maCa;
    } else {
      // Nếu chưa có thì tạo ca mới
      const [insertCa] = await connection.query(
        "INSERT INTO CaLamViec (tenCa, ngayLam, trangThai) VALUES (?, ?, 'Chưa bắt đầu')",
        [tenCa, ngayLam]
      );
      maCa = insertCa.insertId;
    }

    // 2. Xóa sạch các nhân viên cũ trong ca này (Để cập nhật lại danh sách mới nhất)
    await connection.query("DELETE FROM ChiTietCaLam WHERE maCa = ?", [maCa]);

    // 3. Thêm danh sách nhân viên mới vào ChiTietCaLam
    if (danhSachNhanVien && danhSachNhanVien.length > 0) {
      const values = danhSachNhanVien.map((maNV) => [maCa, maNV]);
      await connection.query(
        "INSERT INTO ChiTietCaLam (maCa, MaNhanVien) VALUES ?",
        [values]
      );
    }

    await connection.commit();
    res.json({ message: "Lưu ca làm việc thành công!" });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

module.exports = router;
