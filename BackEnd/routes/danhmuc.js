import express from "express";
import {
  createDanhMuc,
  deleteDanhMuc,
  getAllDanhMuc,
  updateDanhMuc,
} from "../controllers/danhmucController.js";
import { authorizeRoles, verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", verifyToken, authorizeRoles("Admin", "NhanVien"), getAllDanhMuc);

router.post("/", verifyToken, authorizeRoles("Admin"), createDanhMuc);

router.put("/:maDanhMuc", verifyToken, authorizeRoles("Admin"), updateDanhMuc);

router.delete("/:maDanhMuc", verifyToken, authorizeRoles("Admin"), deleteDanhMuc);

export default router;
