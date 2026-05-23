import express from "express";
import {
  createNhanVien,
  deleteNhanVien,
  getAllNhanVien,
  getNhanVienById,
  updateNhanVien,
} from "../controllers/nhanvienController.js";
import { authorizeRoles, verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", verifyToken, authorizeRoles("Admin"), getAllNhanVien);
router.get(
  "/:maNhanVien",
  verifyToken,
  authorizeRoles("Admin"),
  getNhanVienById,
);
router.post("/", verifyToken, authorizeRoles("Admin"), createNhanVien);
router.put(
  "/:maNhanVien",
  verifyToken,
  authorizeRoles("Admin"),
  updateNhanVien,
);
router.delete(
  "/:maNhanVien",
  verifyToken,
  authorizeRoles("Admin"),
  deleteNhanVien,
);

export default router;
