import express from "express";
import {
  getCaLamCuaToi,
  getThongTinCaNhan,
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

export default router;
