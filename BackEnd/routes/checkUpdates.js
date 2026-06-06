import express from "express";
import db from "../config/db.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", verifyToken, async (req, res) => {
  let shiftTime = 0;
  let menuTime = 0;
  let revenueTime = 0;

  try {
    const [[shiftRow]] = await db.query("SELECT UNIX_TIMESTAMP(MAX(updatedAt)) AS lastUpdate FROM CaLamViec");
    shiftTime = shiftRow?.lastUpdate || 0;
  } catch (error) {
    console.log("Error checking CaLamViec updates:", error.message);
  }

  try {
    const [[douongRow]] = await db.query("SELECT UNIX_TIMESTAMP(MAX(updatedAt)) AS lastUpdate FROM DoUong");
    menuTime = Math.max(menuTime, douongRow?.lastUpdate || 0);
  } catch (error) {
    console.log("Error checking DoUong updates:", error.message);
  }

  try {
    const [[danhmucRow]] = await db.query("SELECT UNIX_TIMESTAMP(MAX(updatedAt)) AS lastUpdate FROM DanhMucDoUong");
    menuTime = Math.max(menuTime, danhmucRow?.lastUpdate || 0);
  } catch (error) {
    console.log("Error checking DanhMucDoUong updates:", error.message);
  }

  try {
    const [[hoadonRow]] = await db.query("SELECT UNIX_TIMESTAMP(MAX(updatedAt)) AS lastUpdate FROM HoaDon");
    revenueTime = hoadonRow?.lastUpdate || 0;
  } catch (error) {
    console.log("Error checking HoaDon updates:", error.message);
  }

  res.json({
    shiftTime,
    menuTime,
    revenueTime,
  });
});

export default router;
