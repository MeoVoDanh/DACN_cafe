import {
  getCaLamCuaToiService,
  getThongTinCaNhanService,
} from "../services/canhanService.js";

export const getThongTinCaNhan = async (req, res) => {
  try {
    const result = await getThongTinCaNhanService(req.user.MaTaiKhoan);
    return res.status(result.statusCode).json(result.data);
  } catch (error) {
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
    return res.status(500).json({
      message: "Lỗi lấy ca làm của tôi",
      error: error.message,
    });
  }
};
