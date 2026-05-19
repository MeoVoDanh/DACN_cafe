import express from "express";
import {
  getDoanhThuTheoNgay,
  getTongDoanhThu,
  getTopDoUong,
} from "../controllers/doanhthuController.js";
import { authorizeRoles, verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/tong", verifyToken, authorizeRoles("Admin"), getTongDoanhThu);
router.get(
  "/theo-ngay",
  verifyToken,
  authorizeRoles("Admin"),
  getDoanhThuTheoNgay,
);
router.get("/top-do-uong", verifyToken, authorizeRoles("Admin"), getTopDoUong);

export default router;
