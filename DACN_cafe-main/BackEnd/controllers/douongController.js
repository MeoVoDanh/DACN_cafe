import {
  createDoUongService,
  deleteDoUongService,
  getAllDoUongService,
  getDoUongByIdService,
  updateDoUongService,
} from "../services/douongService.js";

export const getAllDoUong = async (req, res) => {
  try {
    const result = await getAllDoUongService();

    return res.status(result.statusCode).json(result.data);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi lấy danh sách đồ uống",
      error: error.message,
    });
  }
};

export const getDoUongById = async (req, res) => {
  try {
    const { maDoUong } = req.params;

    const result = await getDoUongByIdService(maDoUong);

    return res.status(result.statusCode).json(result.data);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi lấy chi tiết đồ uống",
      error: error.message,
    });
  }
};

export const createDoUong = async (req, res) => {
  try {
    const { tenDoUong, donGia } = req.body;

    if (!tenDoUong || !donGia) {
      return res.status(400).json({
        message: "Tên đồ uống và đơn giá không được để trống",
      });
    }

    const result = await createDoUongService(req.body);

    return res.status(result.statusCode).json(result.data);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi thêm đồ uống",
      error: error.message,
    });
  }
};

export const updateDoUong = async (req, res) => {
  try {
    const { maDoUong } = req.params;
    const { tenDoUong, donGia } = req.body;

    if (!tenDoUong || !donGia) {
      return res.status(400).json({
        message: "Tên đồ uống và đơn giá không được để trống",
      });
    }

    const result = await updateDoUongService(maDoUong, req.body);

    return res.status(result.statusCode).json(result.data);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi cập nhật đồ uống",
      error: error.message,
    });
  }
};

export const deleteDoUong = async (req, res) => {
  try {
    const { maDoUong } = req.params;

    const result = await deleteDoUongService(maDoUong);

    return res.status(result.statusCode).json(result.data);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi xóa đồ uống",
      error: error.message,
    });
  }
};
