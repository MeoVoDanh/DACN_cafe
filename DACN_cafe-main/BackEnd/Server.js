const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const session = require("express-session");
const app = express();
const { checkLogin, isAdmin } = require("./middleware/authMiddleware");

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(
  session({
    secret: "cpokqwoeqjeq", // Dùng để mã hóa session ID
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }, // Session tồn tại trong 1 ngày
  }),
);

// Đăng ký các Route
const nhanvienRouter = require("./routes/nhanvien");
const douongRouter = require("./routes/douong");
const calamRouter = require("./routes/calam");
const doanhthuRouter = require("./routes/doanhthu");
const authRouter = require("./routes/auth");
const hoadonRouter = require("./routes/hoadon");
const canhanRouter = require("./routes/canhan");

//Tính năng chung
app.use("/auth", authRouter);
app.use("/calam", calamRouter);
//quản lý
app.use("/doanhthu", checkLogin, isAdmin, doanhthuRouter);
app.use("/nhanvien", checkLogin, isAdmin, nhanvienRouter);
app.use("/douong", checkLogin, isAdmin, douongRouter);

//nhân viên
app.use("/hoadon", checkLogin, hoadonRouter);
app.use("/canhan", checkLogin, canhanRouter);

const PORT = 1234;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
