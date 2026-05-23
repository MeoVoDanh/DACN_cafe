import {
  getCaLamCuaToiService,
  getThongTinCaNhanService,
  updateAvatarService,
  getThongBaoCuaToiService,
  docHetThongBaoService,
} from "../services/canhanService.js";

export const getThongTinCaNhan = async (req, res) => {
  try {
    const result = await getThongTinCaNhanService(req.user.MaTaiKhoan);
    return res.status(result.statusCode).json(result.data);
  } catch (error) {
    console.error("[canhanController.getThongTinCaNhan Error]:", error);
    return res.status(500).json({
      message: "Lỗi lấy thông tin cá nhân",
      error: error.message,
    });
  }
};

export const getCaLamCuaToi = async (req, res) => {
  try {
    const result = await getCaLamCuaToiService(req.user.MaNhanVien);
    return res.status(result.statusCode).json(result.data);
  } catch (error) {
    console.error("[canhanController.getCaLamCuaToi Error]:", error);
    return res.status(500).json({
      message: "Lỗi lấy ca làm của tôi",
      error: error.message,
    });
  }
};

export const updateAvatar = async (req, res) => {
  try {
    const { HinhAnh } = req.body;
    if (!HinhAnh) {
      return res.status(400).json({ message: "Thiếu đường dẫn hình ảnh" });
    }
    const result = await updateAvatarService(req.user.MaTaiKhoan, HinhAnh);
    return res.status(result.statusCode).json(result.data);
  } catch (error) {
    console.error("[canhanController.updateAvatar Error]:", error);
    return res.status(500).json({
      message: "Lỗi cập nhật ảnh đại diện",
      error: error.message,
    });
  }
};

export const getThongBaoCuaToi = async (req, res) => {
  try {
    const result = await getThongBaoCuaToiService(req.user.MaNhanVien);
    return res.status(result.statusCode).json(result.data);
  } catch (error) {
    console.error("[canhanController.getThongBaoCuaToi Error]:", error);
    return res.status(500).json({
      message: "Lỗi lấy danh sách thông báo",
      error: error.message,
    });
  }
};

export const docHetThongBao = async (req, res) => {
  try {
    const result = await docHetThongBaoService(req.user.MaNhanVien);
    return res.status(result.statusCode).json(result.data);
  } catch (error) {
    console.error("[canhanController.docHetThongBao Error]:", error);
    return res.status(500).json({
      message: "Lỗi đọc tất cả thông báo",
      error: error.message,
    });
  }
};
