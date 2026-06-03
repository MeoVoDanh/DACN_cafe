import db from "../config/db.js";
import pool from "../config/db.js";
const resolveDanhMucId = async (danhMucInput) => {
  if (!danhMucInput) {
    try {
      const [rows] = await db.query(
        "SELECT maDanhMuc FROM DanhMucDoUong WHERE tenDanhMuc = 'Khác'",
      );
      if (rows.length > 0) return rows[0].maDanhMuc;
    } catch (error) {
      if (error.code === "ER_NO_SUCH_TABLE") {
        return null;
      }
      throw error;
    }
    return null;
  }

  if (typeof danhMucInput === "number" || !isNaN(Number(danhMucInput))) {
    try {
      const [rows] = await db.query(
        "SELECT maDanhMuc FROM DanhMucDoUong WHERE maDanhMuc = ?",
        [Number(danhMucInput)],
      );
      if (rows.length > 0) return rows[0].maDanhMuc;
    } catch (error) {
      if (error.code === "ER_NO_SUCH_TABLE") {
        return null;
      }
      throw error;
    }
  }

  const categoryName = String(danhMucInput).trim();
  try {
    const [rows] = await db.query(
      "SELECT maDanhMuc FROM DanhMucDoUong WHERE tenDanhMuc = ?",
      [categoryName],
    );
    if (rows.length > 0) {
      return rows[0].maDanhMuc;
    }

    const [result] = await db.query(
      "INSERT INTO DanhMucDoUong (tenDanhMuc) VALUES (?)",
      [categoryName],
    );
    return result.insertId;
  } catch (error) {
    if (error.code === "ER_NO_SUCH_TABLE") {
      return null;
    }
    throw error;
  }
};

export const getAllDoUongService = async () => {
  try {
    const [rows] = await db.query(`
      SELECT 
        du.maDoUong,
        du.tenDoUong,
        du.donGia,
        du.moTa,
        du.hinhAnh,
        du.trangThai,
        du.danhMuc
      FROM DoUong du
      ORDER BY du.maDoUong DESC
    `);

    return rows;
  } catch (error) {
    throw error;
  }
};

export const getDoUongByIdService = async (maDoUong) => {
  let rows = [];

  try {
    const [result] = await db.query(
      `
      SELECT 
        du.maDoUong,
        du.tenDoUong,
        du.donGia,
        du.moTa,
        du.hinhAnh,
        du.trangThai,
        COALESCE(dm.tenDanhMuc, 'Khác') AS danhMuc,
        du.maDanhMuc
      FROM DoUong du
      LEFT JOIN DanhMucDoUong dm ON du.maDanhMuc = dm.maDanhMuc
      WHERE du.maDoUong = ?
      `,
      [maDoUong],
    );
    rows = result;
  } catch (error) {
    const missingCategoryTable =
      error.code === "ER_NO_SUCH_TABLE" &&
      String(error.sqlMessage || "")
        .toLowerCase()
        .includes("danhmucdouong");

    if (!missingCategoryTable) {
      throw error;
    }

    const [fallbackRows] = await db.query(
      `
      SELECT 
        du.maDoUong,
        du.tenDoUong,
        du.donGia,
        du.moTa,
        du.hinhAnh,
        du.trangThai,
        'Khác' AS danhMuc,
        du.maDanhMuc
      FROM DoUong du
      WHERE du.maDoUong = ?
      `,
      [maDoUong],
    );
    rows = fallbackRows;
  }

  if (rows.length === 0) {
    return {
      statusCode: 404,
      data: {
        message: "Không tìm thấy đồ uống",
      },
    };
  }

  return {
    statusCode: 200,
    data: rows[0],
  };
};

export const createDoUongService = async (data) => {
  const { tenDoUong, donGia, moTa, hinhAnh, trangThai, danhMuc } = data;
  const maDanhMuc = await resolveDanhMucId(danhMuc);

  const [result] = await db.query(
    `
    INSERT INTO DoUong (tenDoUong, donGia, moTa, hinhAnh, trangThai, maDanhMuc)
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      tenDoUong,
      donGia,
      moTa || null,
      hinhAnh || null,
      trangThai || "Đang bán",
      maDanhMuc,
    ],
  );

  return {
    statusCode: 201,
    data: {
      message: "Thêm đồ uống thành công",
      maDoUong: result.insertId,
    },
  };
};

export const updateDoUongService = async (maDoUong, data) => {
  const { tenDoUong, donGia, moTa, hinhAnh, trangThai, danhMuc } = data;
  const maDanhMuc = await resolveDanhMucId(danhMuc);

  const [result] = await db.query(
    `
    UPDATE DoUong
    SET tenDoUong = ?, donGia = ?, moTa = ?, hinhAnh = ?, trangThai = ?, maDanhMuc = ?
    WHERE maDoUong = ?
    `,
    [
      tenDoUong,
      donGia,
      moTa || null,
      hinhAnh || null,
      trangThai || "Đang bán",
      maDanhMuc,
      maDoUong,
    ],
  );

  if (result.affectedRows === 0) {
    return {
      statusCode: 404,
      data: {
        message: "Không tìm thấy đồ uống để cập nhật",
      },
    };
  }

  return {
    statusCode: 200,
    data: {
      message: "Cập nhật đồ uống thành công",
    },
  };
};

export const deleteDoUongService = async (maDoUong) => {
  const [result] = await db.query(
    `
    DELETE FROM DoUong
    WHERE maDoUong = ?
    `,
    [maDoUong],
  );

  if (result.affectedRows === 0) {
    return {
      statusCode: 404,
      data: {
        message: "Không tìm thấy đồ uống để xóa",
      },
    };
  }

  return {
    statusCode: 200,
    data: {
      message: "Xóa đồ uống thành công",
    },
  };
};
