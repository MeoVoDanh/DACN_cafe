import bcrypt from "bcryptjs";
import db from "../config/db.js";

export const getAllNhanVienService = async () => {
  const [rows] = await db.query(`
    SELECT 
      nv.MaNhanVien,
      nv.HoTen,
      nv.Email,
      nv.SDT,
      tk.MaTaiKhoan,
      tk.tenDangNhap,
      tk.vaiTro
    FROM NhanVien nv
    JOIN TaiKhoan tk ON nv.MaTaiKhoan = tk.MaTaiKhoan
    ORDER BY nv.MaNhanVien DESC
  `);

  return {
    statusCode: 200,
    data: rows,
  };
};

export const getNhanVienByIdService = async (maNhanVien) => {
  const [rows] = await db.query(
    `
    SELECT 
      nv.MaNhanVien,
      nv.HoTen,
      nv.Email,
      nv.SDT,
      tk.MaTaiKhoan,
      tk.tenDangNhap,
      tk.vaiTro
    FROM NhanVien nv
    JOIN TaiKhoan tk ON nv.MaTaiKhoan = tk.MaTaiKhoan
    WHERE nv.MaNhanVien = ?
    `,
    [maNhanVien],
  );

  if (rows.length === 0) {
    return {
      statusCode: 404,
      data: { message: "Không tìm thấy nhân viên" },
    };
  }

  return {
    statusCode: 200,
    data: rows[0],
  };
};

export const createNhanVienService = async (data) => {
  const { HoTen, Email, SDT, tenDangNhap, MatKhau, vaiTro } = data;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const hashedPassword = await bcrypt.hash(MatKhau, 10);

    const [accountResult] = await connection.query(
      `
      INSERT INTO TaiKhoan (tenDangNhap, MatKhau, vaiTro)
      VALUES (?, ?, ?)
      `,
      [tenDangNhap, hashedPassword, vaiTro || "NhanVien"],
    );

    const maTaiKhoan = accountResult.insertId;

    const [employeeResult] = await connection.query(
      `
      INSERT INTO NhanVien (HoTen, Email, SDT, MaTaiKhoan)
      VALUES (?, ?, ?, ?)
      `,
      [HoTen, Email || null, SDT || null, maTaiKhoan],
    );

    await connection.commit();

    return {
      statusCode: 201,
      data: {
        message: "Thêm nhân viên thành công",
        MaNhanVien: employeeResult.insertId,
        MaTaiKhoan: maTaiKhoan,
      },
    };
  } catch (error) {
    await connection.rollback();

    if (error.code === "ER_DUP_ENTRY") {
      return {
        statusCode: 409,
        data: { message: "Tên đăng nhập đã tồn tại" },
      };
    }

    throw error;
  } finally {
    connection.release();
  }
};

export const updateNhanVienService = async (maNhanVien, data) => {
  const { HoTen, Email, SDT, vaiTro } = data;

  const [result] = await db.query(
    `
    UPDATE NhanVien nv
    JOIN TaiKhoan tk ON nv.MaTaiKhoan = tk.MaTaiKhoan
    SET 
      nv.HoTen = ?,
      nv.Email = ?,
      nv.SDT = ?,
      tk.vaiTro = ?
    WHERE nv.MaNhanVien = ?
    `,
    [HoTen, Email || null, SDT || null, vaiTro || "NhanVien", maNhanVien],
  );

  if (result.affectedRows === 0) {
    return {
      statusCode: 404,
      data: { message: "Không tìm thấy nhân viên để cập nhật" },
    };
  }

  return {
    statusCode: 200,
    data: { message: "Cập nhật nhân viên thành công" },
  };
};

export const deleteNhanVienService = async (maNhanVien) => {
  const [rows] = await db.query(
    `
    SELECT MaTaiKhoan 
    FROM NhanVien 
    WHERE MaNhanVien = ?
    `,
    [maNhanVien],
  );

  if (rows.length === 0) {
    return {
      statusCode: 404,
      data: { message: "Không tìm thấy nhân viên để xóa" },
    };
  }

  const maTaiKhoan = rows[0].MaTaiKhoan;

  await db.query(
    `
    DELETE FROM TaiKhoan 
    WHERE MaTaiKhoan = ?
    `,
    [maTaiKhoan],
  );

  return {
    statusCode: 200,
    data: { message: "Xóa nhân viên thành công" },
  };
};
