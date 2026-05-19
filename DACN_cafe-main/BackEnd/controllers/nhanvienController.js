import {
  createNhanVienService,
  deleteNhanVienService,
  getAllNhanVienService,
  getNhanVienByIdService,
  updateNhanVienService,
} from "../services/nhanvienService.js";

export const getAllNhanVien = async (req, res) => {
  try {
    const result = await getAllNhanVienService();
    return res.status(result.statusCode).json(result.data);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi lấy danh sách nhân viên",
      error: error.message,
    });
  }
};

export const getNhanVienById = async (req, res) => {
  try {
    const result = await getNhanVienByIdService(req.params.maNhanVien);
    return res.status(result.statusCode).json(result.data);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi lấy chi tiết nhân viên",
      error: error.message,
    });
  }
};

export const createNhanVien = async (req, res) => {
  try {
    const { HoTen, tenDangNhap, MatKhau } = req.body;

    if (!HoTen || !tenDangNhap || !MatKhau) {
      return res.status(400).json({
        message: "Họ tên, tên đăng nhập và mật khẩu không được để trống",
      });
    }

    const result = await createNhanVienService(req.body);
    return res.status(result.statusCode).json(result.data);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi thêm nhân viên",
      error: error.message,
    });
  }
};

export const updateNhanVien = async (req, res) => {
  try {
    const { HoTen } = req.body;

    if (!HoTen) {
      return res.status(400).json({
        message: "Họ tên không được để trống",
      });
    }

    const result = await updateNhanVienService(req.params.maNhanVien, req.body);
    return res.status(result.statusCode).json(result.data);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi cập nhật nhân viên",
      error: error.message,
    });
  }
};

export const deleteNhanVien = async (req, res) => {
  try {
    const result = await deleteNhanVienService(req.params.maNhanVien);
    return res.status(result.statusCode).json(result.data);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi xóa nhân viên",
      error: error.message,
    });
  }
};
