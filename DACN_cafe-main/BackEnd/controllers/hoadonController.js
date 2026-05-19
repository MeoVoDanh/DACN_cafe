import {
  createHoaDonService,
  deleteHoaDonService,
  getAllHoaDonService,
  getHoaDonByIdService,
  thanhToanHoaDonService,
} from "../services/hoadonService.js";

export const getAllHoaDon = async (req, res) => {
  try {
    const result = await getAllHoaDonService();
    return res.status(result.statusCode).json(result.data);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi lấy danh sách hóa đơn",
      error: error.message,
    });
  }
};

export const getHoaDonById = async (req, res) => {
  try {
    const result = await getHoaDonByIdService(req.params.maHoaDon);
    return res.status(result.statusCode).json(result.data);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi lấy chi tiết hóa đơn",
      error: error.message,
    });
  }
};

export const createHoaDon = async (req, res) => {
  try {
    const result = await createHoaDonService(req.body, req.user);
    return res.status(result.statusCode).json(result.data);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi tạo hóa đơn",
      error: error.message,
    });
  }
};

export const thanhToanHoaDon = async (req, res) => {
  try {
    const result = await thanhToanHoaDonService(req.params.maHoaDon);
    return res.status(result.statusCode).json(result.data);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi thanh toán hóa đơn",
      error: error.message,
    });
  }
};

export const deleteHoaDon = async (req, res) => {
  try {
    const result = await deleteHoaDonService(req.params.maHoaDon);
    return res.status(result.statusCode).json(result.data);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi xóa hóa đơn",
      error: error.message,
    });
  }
};
