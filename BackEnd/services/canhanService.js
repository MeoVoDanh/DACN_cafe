import db from "../config/db.js";

export const getThongTinCaNhanService = async (maTaiKhoan) => {
  const [rows] = await db.query(
    `
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
    `,
    [maTaiKhoan],
  );

  if (rows.length === 0) {
    return {
      statusCode: 404,
      data: { message: "Không tìm thấy thông tin cá nhân" },
    };
  }

  return {
    statusCode: 200,
    data: rows[0],
  };
};

export const getCaLamCuaToiService = async (maNhanVien) => {
  if (!maNhanVien) {
    return {
      statusCode: 400,
      data: { message: "Tài khoản chưa liên kết nhân viên" },
    };
  }

  const [rows] = await db.query(
    `
    SELECT 
      maCa,
      tenCa,
      gioBatDau,
      gioKetThuc,
      ngayLam,
      trangThai,
      MaNhanVien
    FROM CaLamViec
    WHERE MaNhanVien = ?
    ORDER BY ngayLam DESC, gioBatDau DESC
    `,
    [maNhanVien],
  );

  return {
    statusCode: 200,
    data: rows,
  };
};
