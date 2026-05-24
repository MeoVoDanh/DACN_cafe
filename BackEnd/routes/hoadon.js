import express from "express";
import {
  createHoaDon,
  deleteHoaDon,
  getAllHoaDon,
  getHoaDonById,
  thanhToanHoaDon,
  updateHoaDon,
  huyHoaDon,
} from "../controllers/hoadonController.js";
import { authorizeRoles, verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", verifyToken, authorizeRoles("Admin", "NhanVien"), getAllHoaDon);
router.get(
  "/:maHoaDon",
  verifyToken,
  authorizeRoles("Admin", "NhanVien"),
  getHoaDonById,
);

router.post(
  "/",
  verifyToken,
  authorizeRoles("Admin", "NhanVien"),
  createHoaDon,
);

router.put(
  "/:maHoaDon",
  verifyToken,
  authorizeRoles("Admin", "NhanVien"),
  updateHoaDon,
);

router.patch(
  "/:maHoaDon/thanh-toan",
  verifyToken,
  authorizeRoles("Admin", "NhanVien"),
  thanhToanHoaDon,
);

router.patch(
  "/:maHoaDon/huy",
  verifyToken,
  authorizeRoles("Admin", "NhanVien"),
  huyHoaDon,
);

router.delete("/:maHoaDon", verifyToken, authorizeRoles("Admin"), deleteHoaDon);

export default router;
