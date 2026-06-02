import db from "../config/db.js";

export const getAllDanhMucService = async () => {
  const [rows] = await db.query(`
    SELECT maDanhMuc, tenDanhMuc, createdAt, updatedAt
    FROM DanhMucDoUong
    ORDER BY maDanhMuc ASC
  `);
  return {
    statusCode: 200,
    data: rows,
  };
};

export const createDanhMucService = async (data) => {
  const { tenDanhMuc } = data;
  if (!tenDanhMuc || !tenDanhMuc.trim()) {
    return {
      statusCode: 400,
      data: { message: "Tên danh mục không được để trống" },
    };
  }

  const trimmed = tenDanhMuc.trim();

  // Check duplicate
  const [existed] = await db.query(
    "SELECT maDanhMuc FROM DanhMucDoUong WHERE tenDanhMuc = ?",
    [trimmed],
  );
  if (existed.length > 0) {
    return {
      statusCode: 400,
      data: { message: "Danh mục này đã tồn tại" },
    };
  }

  const [result] = await db.query(
    "INSERT INTO DanhMucDoUong (tenDanhMuc) VALUES (?)",
    [trimmed],
  );

  return {
    statusCode: 201,
    data: {
      message: "Thêm danh mục thành công",
      maDanhMuc: result.insertId,
      tenDanhMuc: trimmed,
    },
  };
};

export const updateDanhMucService = async (maDanhMuc, data) => {
  const { tenDanhMuc } = data;
  if (!tenDanhMuc || !tenDanhMuc.trim()) {
    return {
      statusCode: 400,
      data: { message: "Tên danh mục không được để trống" },
    };
  }

  const trimmed = tenDanhMuc.trim();

  // Check duplicate for other categories
  const [existed] = await db.query(
    "SELECT maDanhMuc FROM DanhMucDoUong WHERE tenDanhMuc = ? AND maDanhMuc != ?",
    [trimmed, maDanhMuc],
  );
  if (existed.length > 0) {
    return {
      statusCode: 400,
      data: { message: "Tên danh mục này đã tồn tại" },
    };
  }

  const [result] = await db.query(
    "UPDATE DanhMucDoUong SET tenDanhMuc = ? WHERE maDanhMuc = ?",
    [trimmed, maDanhMuc],
  );

  if (result.affectedRows === 0) {
    return {
      statusCode: 404,
      data: { message: "Không tìm thấy danh mục để cập nhật" },
    };
  }

  return {
    statusCode: 200,
    data: { message: "Cập nhật danh mục thành công" },
  };
};

export const deleteDanhMucService = async (maDanhMuc) => {
  const [result] = await db.query(
    "DELETE FROM DanhMucDoUong WHERE maDanhMuc = ?",
    [maDanhMuc],
  );

  if (result.affectedRows === 0) {
    return {
      statusCode: 404,
      data: { message: "Không tìm thấy danh mục để xóa" },
    };
  }

  return {
    statusCode: 200,
    data: { message: "Xóa danh mục thành công" },
  };
};
