import {
  createCaLamService,
  dangKyCaLamService,
  deleteCaLamService,
  getAllCaLamService,
  getCaLamByIdService,
  getCaLamConTrongService,
  huyDangKyCaLamService,
  updateCaLamService,
} from "../services/calamService.js";

export const getAllCaLam = async (req, res) => {
  try {
    const result = await getAllCaLamService();
    return res.status(result.statusCode).json(result.data);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi lấy danh sách ca làm",
      error: error.message,
    });
  }
};

export const getCaLamConTrong = async (req, res) => {
  try {
    const result = await getCaLamConTrongService();
    return res.status(result.statusCode).json(result.data);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi lấy danh sách ca còn trống",
      error: error.message,
    });
  }
};

export const getCaLamById = async (req, res) => {
  try {
    const result = await getCaLamByIdService(req.params.maCa);
    return res.status(result.statusCode).json(result.data);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi lấy chi tiết ca làm",
      error: error.message,
    });
  }
};

export const createCaLam = async (req, res) => {
  try {
    const { tenCa, gioBatDau, gioKetThuc, ngayLam } = req.body;

    if (!tenCa || !gioBatDau || !gioKetThuc || !ngayLam) {
      return res.status(400).json({
        message:
          "Tên ca, giờ bắt đầu, giờ kết thúc và ngày làm không được để trống",
      });
    }

    const result = await createCaLamService(req.body);
    return res.status(result.statusCode).json(result.data);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi tạo ca làm",
      error: error.message,
    });
  }
};

export const dangKyCaLam = async (req, res) => {
  try {
    const result = await dangKyCaLamService(
      req.params.maCa,
      req.user.MaNhanVien,
    );

    return res.status(result.statusCode).json(result.data);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi đăng ký ca làm",
      error: error.message,
    });
  }
};

export const huyDangKyCaLam = async (req, res) => {
  try {
    const result = await huyDangKyCaLamService(
      req.params.maCa,
      req.user.MaNhanVien,
    );

    return res.status(result.statusCode).json(result.data);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi hủy đăng ký ca làm",
      error: error.message,
    });
  }
};

export const updateCaLam = async (req, res) => {
  try {
    const { tenCa, gioBatDau, gioKetThuc, ngayLam } = req.body;

    if (!tenCa || !gioBatDau || !gioKetThuc || !ngayLam) {
      return res.status(400).json({
        message:
          "Tên ca, giờ bắt đầu, giờ kết thúc và ngày làm không được để trống",
      });
    }

    const result = await updateCaLamService(req.params.maCa, req.body);
    return res.status(result.statusCode).json(result.data);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi cập nhật ca làm",
      error: error.message,
    });
  }
};

export const deleteCaLam = async (req, res) => {
  try {
    const result = await deleteCaLamService(req.params.maCa);
    return res.status(result.statusCode).json(result.data);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi xóa ca làm",
      error: error.message,
    });
  }
};
