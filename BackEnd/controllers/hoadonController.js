import {
  createHoaDonService,
  deleteHoaDonService,
  getAllHoaDonService,
  getHoaDonByIdService,
  thanhToanHoaDonService,
  updateHoaDonService,
  huyHoaDonService,
} from "../services/hoadonService.js";

export const getAllHoaDon = async (req, res) => {
  try {
    const result = await getAllHoaDonService();
    return res.status(result.statusCode).json(result.data);
  } catch (error) {
    console.error("[hoadonController.getAllInvoice Error]:", error);
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
    console.error("[hoadonController.getHoaDonById Error]:", error);
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
    console.error("[hoadonController.createHoaDon Error]:", error);
    return res.status(500).json({
      message: "Lỗi tạo hóa đơn",
      error: error.message,
    });
  }
};

export const thanhToanHoaDon = async (req, res) => {
  try {
    const result = await thanhToanHoaDonService(req.params.maHoaDon, req.user);
    return res.status(result.statusCode).json(result.data);
  } catch (error) {
    console.error("[hoadonController.thanhToanHoaDon Error]:", error);
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
    console.error("[hoadonController.deleteHoaDon Error]:", error);
    return res.status(500).json({
      message: "Lỗi xóa hóa đơn",
      error: error.message,
    });
  }
};

export const updateHoaDon = async (req, res) => {
  try {
    const result = await updateHoaDonService(req.params.maHoaDon, req.body, req.user);
    return res.status(result.statusCode).json(result.data);
  } catch (error) {
    console.error("[hoadonController.updateHoaDon Error]:", error);
    return res.status(500).json({
      message: "Lỗi sửa hóa đơn",
      error: error.message,
    });
  }
};

export const huyHoaDon = async (req, res) => {
  try {
    const result = await huyHoaDonService(req.params.maHoaDon, req.user);
    return res.status(result.statusCode).json(result.data);
  } catch (error) {
    console.error("[hoadonController.huyHoaDon Error]:", error);
    return res.status(500).json({
      message: "Lỗi hủy hóa đơn",
      error: error.message,
    });
  }
};
