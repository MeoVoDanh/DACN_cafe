import express from "express";
import {
  createDoUong,
  deleteDoUong,
  getAllDoUong,
  getDoUongById,
  updateDoUong,
} from "../controllers/douongController.js";
import { authorizeRoles, verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", verifyToken, authorizeRoles("Admin", "NhanVien"), getAllDoUong);

router.get(
  "/:maDoUong",
  verifyToken,
  authorizeRoles("Admin", "NhanVien"),
  getDoUongById,
);

router.post("/", verifyToken, authorizeRoles("Admin"), createDoUong);

router.put("/:maDoUong", verifyToken, authorizeRoles("Admin"), updateDoUong);

router.delete("/:maDoUong", verifyToken, authorizeRoles("Admin"), deleteDoUong);

export default router;
