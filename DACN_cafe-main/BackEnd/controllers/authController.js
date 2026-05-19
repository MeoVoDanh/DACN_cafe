import { getMeService, loginService } from "../services/authService.js";

export const login = async (req, res) => {
  try {
    const { tenDangNhap, matKhau } = req.body;

    if (!tenDangNhap || !matKhau) {
      return res.status(400).json({
        message: "Vui lòng nhập tên đăng nhập và mật khẩu",
      });
    }

    const result = await loginService(tenDangNhap, matKhau);

    return res.status(result.statusCode).json(result.data);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server khi đăng nhập",
      error: error.message,
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const result = await getMeService(req.user.MaTaiKhoan);

    return res.status(result.statusCode).json(result.data);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server khi lấy thông tin người dùng",
      error: error.message,
    });
  }
};
