import {
  getDoanhThuTheoNgayService,
  getTongDoanhThuService,
  getTopDoUongService,
} from "../services/doanhthuService.js";

export const getTongDoanhThu = async (req, res) => {
  try {
    const result = await getTongDoanhThuService();
    return res.status(result.statusCode).json(result.data);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi lấy tổng doanh thu",
      error: error.message,
    });
  }
};

export const getDoanhThuTheoNgay = async (req, res) => {
  try {
    const result = await getDoanhThuTheoNgayService();
    return res.status(result.statusCode).json(result.data);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi lấy doanh thu theo ngày",
      error: error.message,
    });
  }
};

export const getTopDoUong = async (req, res) => {
  try {
    const result = await getTopDoUongService();
    return res.status(result.statusCode).json(result.data);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi lấy top đồ uống",
      error: error.message,
    });
  }
};
