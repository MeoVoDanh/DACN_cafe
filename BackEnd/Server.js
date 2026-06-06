import "./loadEnv.js";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import douongRoutes from "./routes/douong.js";
import danhmucRoutes from "./routes/danhmuc.js";
import nhanvienRoutes from "./routes/nhanvien.js";
import calamRoutes from "./routes/calam.js";
import hoadonRoutes from "./routes/hoadon.js";
import doanhthuRoutes from "./routes/doanhthu.js";
import canhanRoutes from "./routes/canhan.js";
import path from "path";
import multer from "multer";
import payosRoutes from "./routes/payos.js";
import checkUpdatesRoutes from "./routes/checkUpdates.js";
const app = express();

app.use(cors());
app.use((req, res, next) => {
  const authHeader = req.headers.authorization
    ? req.headers.authorization
    : "None";
  console.log(
    `[Request] ${req.method} ${req.url} - Auth Header: ${authHeader}`,
  );
  next();
});
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "DACN Cafe API đang chạy",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/payos", payosRoutes);
app.use("/api/douong", douongRoutes);
app.use("/api/danhmuc", danhmucRoutes);
app.use("/api/nhanvien", nhanvienRoutes);
app.use("/api/calam", calamRoutes);
app.use("/api/hoadon", hoadonRoutes);
app.use("/api/doanhthu", doanhthuRoutes);
app.use("/api/canhan", canhanRoutes);
app.use("/api/check-updates", checkUpdatesRoutes);
app.use("/img", express.static("img"));
const PORT = process.env.PORT || 3000;
app.use("/img", express.static("img"));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "img");
  },

  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

app.post("/api/upload/image", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: "Không có file ảnh được upload",
    });
  }

  res.json({
    message: "Upload ảnh thành công",
    fileName: req.file.filename,
  });
});
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
