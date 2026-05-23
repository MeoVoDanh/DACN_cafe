import express from "express";
import {
  createCaLam,
  dangKyCaLam,
  deleteCaLam,
  getAllCaLam,
  getCaLamById,
  getCaLamConTrong,
  huyDangKyCaLam,
  updateCaLam,
  getCaLamByNgay,
  saveCaLamByNgay,
} from "../controllers/calamController.js";
import { authorizeRoles, verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/con-trong",
  verifyToken,
  authorizeRoles("Admin", "NhanVien"),
  getCaLamConTrong,
);

router.get("/", verifyToken, authorizeRoles("Admin"), getAllCaLam);

router.get(
  "/:maCa",
  verifyToken,
  authorizeRoles("Admin", "NhanVien"),
  getCaLamById,
);

router.post("/", verifyToken, authorizeRoles("Admin"), createCaLam);

router.patch(
  "/:maCa/dang-ky",
  verifyToken,
  authorizeRoles("NhanVien"),
  dangKyCaLam,
);

router.patch(
  "/:maCa/huy-dang-ky",
  verifyToken,
  authorizeRoles("NhanVien"),
  huyDangKyCaLam,
);

router.put("/:maCa", verifyToken, authorizeRoles("Admin"), updateCaLam);

router.delete("/:maCa", verifyToken, authorizeRoles("Admin"), deleteCaLam);

router.get("/ngay/:ngay", verifyToken, authorizeRoles("Admin"), getCaLamByNgay);
router.post("/ngay/:ngay", verifyToken, authorizeRoles("Admin"), saveCaLamByNgay);

export default router;
