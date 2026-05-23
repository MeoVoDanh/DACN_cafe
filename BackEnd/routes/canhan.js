import express from "express";
import {
  getCaLamCuaToi,
  getThongTinCaNhan,
  updateAvatar,
  getThongBaoCuaToi,
  docHetThongBao,
} from "../controllers/canhanController.js";
import { authorizeRoles, verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/thong-tin",
  verifyToken,
  authorizeRoles("Admin", "NhanVien"),
  getThongTinCaNhan,
);

router.get(
  "/ca-lam",
  verifyToken,
  authorizeRoles("Admin", "NhanVien"),
  getCaLamCuaToi,
);

router.put(
  "/cap-nhat-avatar",
  verifyToken,
  authorizeRoles("Admin", "NhanVien"),
  updateAvatar,
);

router.get(
  "/thong-bao",
  verifyToken,
  authorizeRoles("Admin", "NhanVien"),
  getThongBaoCuaToi,
);

router.patch(
  "/thong-bao/doc-het",
  verifyToken,
  authorizeRoles("Admin", "NhanVien"),
  docHetThongBao,
);

export default router;
