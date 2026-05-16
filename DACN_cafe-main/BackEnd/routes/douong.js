const express = require("express");
const router = express.Router();
const db = require("../config/db");
// Lấy danh sách đồ uống
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM DoUong");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Lấy 1 đồ uống theo ID
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM DoUong WHERE MaDoUong = ?", [
      req.params.id,
    ]);
    if (rows.length === 0) return res.status(404).send("Không tìm thấy");
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
//Cập nhật thông tin đồ uống
router.post("/update/:id", async (req, res) => {
  const { name, price } = req.body;
  try {
    const [rows] = await db.query(
      "UPDATE DoUong SET name = ?, price = ? WHERE MaDoUong = ?",
      [name, price, req.params.id],
    );
    if (rows.affectedRows === 0)
      return res.status(404).send("Không tìm thấy đồ uống");
    res.send("Cập nhật thành công");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Xóa đồ uống
router.delete("/delete/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM DoUong WHERE MaDoUong = ?", [req.params.id]);
    res.send("Xóa thành công");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
