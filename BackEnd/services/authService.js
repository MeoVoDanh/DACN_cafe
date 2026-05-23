import bcrypt from "bcryptjs";
import db from "../config/db.js";
import { generateToken } from "../utils/token.js";

export const loginService = async (tenDangNhap, matKhau) => {
  const sql = `
    SELECT 
      tk.MaTaiKhoan,
      tk.tenDangNhap,
      tk.MatKhau,
      tk.vaiTro,
      nv.MaNhanVien,
      nv.HoTen,
      nv.Email,
      nv.SDT
    FROM TaiKhoan tk
    LEFT JOIN NhanVien nv ON tk.MaTaiKhoan = nv.MaTaiKhoan
    WHERE tk.tenDangNhap = ?
  `;

  const [rows] = await db.query(sql, [tenDangNhap]);

  if (rows.length === 0) {
    return {
      statusCode: 401,
      data: {
        message: "Tên đăng nhập không tồn tại",
      },
    };
  }

  const user = rows[0];

  let isPasswordValid = false;

  if (user.MatKhau.startsWith("$2a$") || user.MatKhau.startsWith("$2b$")) {
    isPasswordValid = await bcrypt.compare(matKhau, user.MatKhau);
  } else {
    isPasswordValid = matKhau === user.MatKhau;
  }

  if (!isPasswordValid) {
    return {
      statusCode: 401,
      data: {
        message: "Mật khẩu không đúng",
      },
    };
  }

  const token = generateToken({
    MaTaiKhoan: user.MaTaiKhoan,
    MaNhanVien: user.MaNhanVien,
    tenDangNhap: user.tenDangNhap,
    vaiTro: user.vaiTro,
  });

  return {
    statusCode: 200,
    data: {
      message: "Đăng nhập thành công",
      token,
      user: {
        MaTaiKhoan: user.MaTaiKhoan,
        MaNhanVien: user.MaNhanVien,
        tenDangNhap: user.tenDangNhap,
        vaiTro: user.vaiTro,
        HoTen: user.HoTen,
        Email: user.Email,
        SDT: user.SDT,
      },
    },
  };
};

export const getMeService = async (maTaiKhoan) => {
  const sql = `
    SELECT 
      tk.MaTaiKhoan,
      tk.tenDangNhap,
      tk.vaiTro,
      nv.MaNhanVien,
      nv.HoTen,
      nv.Email,
      nv.SDT
    FROM TaiKhoan tk
    LEFT JOIN NhanVien nv ON tk.MaTaiKhoan = nv.MaTaiKhoan
    WHERE tk.MaTaiKhoan = ?
  `;

  const [rows] = await db.query(sql, [maTaiKhoan]);

  if (rows.length === 0) {
    return {
      statusCode: 404,
      data: {
        message: "Không tìm thấy tài khoản",
      },
    };
  }

  return {
    statusCode: 200,
    data: {
      user: rows[0],
    },
  };
};
