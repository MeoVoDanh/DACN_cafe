import db from "../config/db.js";

export const getAllDanhMucService = async () => {
  try {
    const [rows] = await db.query(`
      SELECT maDanhMuc, tenDanhMuc, createdAt, updatedAt
      FROM DanhMucDoUong
      ORDER BY maDanhMuc ASC
    `);
    return {
      statusCode: 200,
      data: rows,
    };
  } catch (error) {
    if (error.code === "ER_NO_SUCH_TABLE") {
      // Fallback: get distinct categories from DoUong table
      const [rows] = await db.query(`
        SELECT DISTINCT danhMuc FROM DoUong WHERE danhMuc IS NOT NULL AND danhMuc != ''
      `);
      const formatted = rows.map((r, index) => ({
        maDanhMuc: index + 1,
        tenDanhMuc: r.danhMuc,
      }));
      return {
        statusCode: 200,
        data: formatted,
      };
    }
    throw error;
  }
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
  // First, find the ID of 'Khác' category to reassign
  let khacId = null;
  try {
    const [khacRows] = await db.query(
      "SELECT maDanhMuc FROM DanhMucDoUong WHERE tenDanhMuc = 'Khác'"
    );
    if (khacRows.length > 0) {
      khacId = khacRows[0].maDanhMuc;
    }
  } catch (err) {
    console.log("Error finding 'Khác' category:", err.message);
  }

  // Reassign all drinks in the deleted category to 'Khác'
  try {
    await db.query("UPDATE DoUong SET danhMuc = ? WHERE danhMuc = ?", [
      khacId,
      maDanhMuc,
    ]);
  } catch (err) {
    console.log("Error reassigning drinks to 'Khác':", err.message);
  }

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
