import bcrypt from "bcryptjs";
import db from "../config/db.js";

export const getAllNhanVienService = async () => {
  const [rows] = await db.query(`
    SELECT 
      nv.MaNhanVien,
      nv.HoTen,
      nv.Email,
      nv.SDT,
      nv.SoCCCD,
      nv.TrangThai,
      nv.HinhAnh,
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
      nv.SoCCCD,
      nv.TrangThai,
      nv.HinhAnh,
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
  const { HoTen, Email, SDT, SoCCCD, TrangThai, tenDangNhap, MatKhau, vaiTro, HinhAnh } = data;

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
      INSERT INTO NhanVien (HoTen, Email, SDT, SoCCCD, TrangThai, MaTaiKhoan, HinhAnh)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [HoTen, Email || null, SDT || null, SoCCCD || null, "Đang làm việc", maTaiKhoan, HinhAnh || null],
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
      const msg = error.sqlMessage || "";
      let message = "Thông tin bị trùng lặp";
      if (msg.includes("Email")) {
        message = "Email đã tồn tại trên hệ thống";
      } else if (msg.includes("SoCCCD")) {
        message = "Số CCCD đã tồn tại trên hệ thống";
      } else if (msg.includes("tenDangNhap")) {
        message = "Tên đăng nhập đã tồn tại";
      }
      return {
        statusCode: 409,
        data: { message },
      };
    }

    throw error;
  } finally {
    connection.release();
  }
};

export const updateNhanVienService = async (maNhanVien, data) => {
  const { HoTen, Email, SDT, SoCCCD, TrangThai, vaiTro, HinhAnh } = data;

  // Tự động Khóa tài khoản nếu cho nghỉ việc, ngược lại kích hoạt HoatDong
  const accountStatus = TrangThai === "Đã nghỉ việc" ? "Khoa" : "HoatDong";

  try {
    const [result] = await db.query(
      `
      UPDATE NhanVien nv
      JOIN TaiKhoan tk ON nv.MaTaiKhoan = tk.MaTaiKhoan
      SET 
        nv.HoTen = ?,
        nv.Email = ?,
        nv.SDT = ?,
        nv.SoCCCD = ?,
        nv.TrangThai = ?,
        tk.vaiTro = ?,
        nv.HinhAnh = ?,
        tk.trangThai = ?
      WHERE nv.MaNhanVien = ?
      `,
      [
        HoTen,
        Email || null,
        SDT || null,
        SoCCCD || null,
        TrangThai || "Đang làm việc",
        vaiTro || "NhanVien",
        HinhAnh || null,
        accountStatus,
        maNhanVien,
      ],
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
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      const msg = error.sqlMessage || "";
      let message = "Thông tin bị trùng lặp";
      if (msg.includes("Email")) {
        message = "Email đã tồn tại trên hệ thống";
      } else if (msg.includes("SoCCCD")) {
        message = "Số CCCD đã tồn tại trên hệ thống";
      } else if (msg.includes("tenDangNhap")) {
        message = "Tên đăng nhập đã tồn tại";
      }
      return {
        statusCode: 409,
        data: { message },
      };
    }
    throw error;
  }
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
