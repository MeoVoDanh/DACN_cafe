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
      nv.SDT,
      nv.HinhAnh
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
      MaNhanVien,
      CASE 
        WHEN trangThai = 'Chờ duyệt' THEN 1
        WHEN trangThai = 'Đã đăng ký' AND DATEDIFF(ngayLam, CURDATE()) >= 3 THEN 1
        ELSE 0
      END AS coTheHuy,
      (SELECT COUNT(*) FROM CaLamViec clv2 WHERE clv2.ngayLam = CaLamViec.ngayLam AND clv2.tenCa = CaLamViec.tenCa AND clv2.MaNhanVien IS NOT NULL) AS soNguoiDaDangKy
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

export const getThongBaoCuaToiService = async (maNhanVien) => {
  if (!maNhanVien) {
    return {
      statusCode: 400,
      data: { message: "Tài khoản chưa liên kết nhân viên" },
    };
  }

  const [rows] = await db.query(
    `
    SELECT 
      maThongBao,
      noiDung,
      trangThai,
      createdAt
    FROM ThongBao
    WHERE MaNhanVien = ?
    ORDER BY createdAt DESC
    `,
    [maNhanVien]
  );

  return {
    statusCode: 200,
    data: rows,
  };
};

export const docHetThongBaoService = async (maNhanVien) => {
  if (!maNhanVien) {
    return {
      statusCode: 400,
      data: { message: "Tài khoản chưa liên kết nhân viên" },
    };
  }

  await db.query(
    `
    UPDATE ThongBao
    SET trangThai = 'Đã đọc'
    WHERE MaNhanVien = ? AND trangThai = 'Chưa đọc'
    `,
    [maNhanVien]
  );

  return {
    statusCode: 200,
    data: { message: "Đã đọc tất cả thông báo" },
  };
};

export const updateAvatarService = async (maTaiKhoan, hinhAnh) => {
  const [result] = await db.query(
    `
    UPDATE NhanVien
    SET HinhAnh = ?
    WHERE MaTaiKhoan = ?
    `,
    [hinhAnh, maTaiKhoan],
  );

  if (result.affectedRows === 0) {
    return {
      statusCode: 404,
      data: { message: "Không tìm thấy thông tin nhân viên liên kết" },
    };
  }

  return {
    statusCode: 200,
    data: { message: "Cập nhật ảnh đại diện thành công", HinhAnh: hinhAnh },
  };
};
