import express from "express";

import {
  createPayosPayment,
  getPayosStatus,
  payosWebhook,
  payosReturn,
  payosCancel,
  confirmPayosWebhook,
} from "../controllers/payosController.js";

const router = express.Router();

router.post("/create-payment/:maHoaDon", createPayosPayment);

router.post("/webhook", payosWebhook);

router.get("/status/:maHoaDon", getPayosStatus);

router.get("/return", payosReturn);

router.get("/cancel", payosCancel);

// Gọi API này 1 lần sau khi có link ngrok để đăng ký webhook với payOS
router.post("/confirm-webhook", confirmPayosWebhook);

export default router;
