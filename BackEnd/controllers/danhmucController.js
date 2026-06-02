import {
  createDanhMucService,
  deleteDanhMucService,
  getAllDanhMucService,
  updateDanhMucService,
} from "../services/danhmucService.js";

export const getAllDanhMuc = async (req, res) => {
  try {
    const result = await getAllDanhMucService();
    return res.status(result.statusCode).json(result.data);
  } catch (error) {
    console.error("[danhmucController.getAllDanhMuc Error]:", error);
    return res.status(500).json({
      message: "Lỗi lấy danh sách danh mục",
      error: error.message,
    });
  }
};

export const createDanhMuc = async (req, res) => {
  try {
    const result = await createDanhMucService(req.body);
    return res.status(result.statusCode).json(result.data);
  } catch (error) {
    console.error("[danhmucController.createDanhMuc Error]:", error);
    return res.status(500).json({
      message: "Lỗi tạo danh mục",
      error: error.message,
    });
  }
};

export const updateDanhMuc = async (req, res) => {
  try {
    const { maDanhMuc } = req.params;
    const result = await updateDanhMucService(maDanhMuc, req.body);
    return res.status(result.statusCode).json(result.data);
  } catch (error) {
    console.error("[danhmucController.updateDanhMuc Error]:", error);
    return res.status(500).json({
      message: "Lỗi cập nhật danh mục",
      error: error.message,
    });
  }
};

export const deleteDanhMuc = async (req, res) => {
  try {
    const { maDanhMuc } = req.params;
    const result = await deleteDanhMucService(maDanhMuc);
    return res.status(result.statusCode).json(result.data);
  } catch (error) {
    console.error("[danhmucController.deleteDanhMuc Error]:", error);
    return res.status(500).json({
      message: "Lỗi xóa danh mục",
      error: error.message,
    });
  }
};
