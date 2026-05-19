import db from "../config/db.js";

export const getAllDoUongService = async () => {
  const [rows] = await db.query(`
    SELECT 
      maDoUong,
      tenDoUong,
      donGia,
      moTa,
      hinhAnh
    FROM DoUong
    ORDER BY maDoUong DESC
  `);

  return {
    statusCode: 200,
    data: rows,
  };
};

export const getDoUongByIdService = async (maDoUong) => {
  const [rows] = await db.query(
    `
    SELECT 
      maDoUong,
      tenDoUong,
      donGia,
      moTa,
      hinhAnh
    FROM DoUong
    WHERE maDoUong = ?
    `,
    [maDoUong],
  );

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
  const { tenDoUong, donGia, moTa, hinhAnh } = data;

  const [result] = await db.query(
    `
    INSERT INTO DoUong (tenDoUong, donGia, moTa, hinhAnh)
    VALUES (?, ?, ?, ?)
    `,
    [tenDoUong, donGia, moTa || null, hinhAnh || null],
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
  const { tenDoUong, donGia, moTa, hinhAnh } = data;

  const [result] = await db.query(
    `
    UPDATE DoUong
    SET tenDoUong = ?, donGia = ?, moTa = ?, hinhAnh = ?
    WHERE maDoUong = ?
    `,
    [tenDoUong, donGia, moTa || null, hinhAnh || null, maDoUong],
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
