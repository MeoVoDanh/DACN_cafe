const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Lấy danh sách nhân viên
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM NhanVien");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
  const { name, email, phone } = req.body;
  try {
    const [rows] = await db.query(
      "UPDATE NhanVien SET name = ?, email = ?, phone = ? WHERE MaNhanVien = ?",
      [name, email, phone, req.params.id],
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
