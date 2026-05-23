import db from "../config/db.js";

export const getAllCaLamService = async () => {
  const [rows] = await db.query(`
    SELECT 
      clv.maCa,
      clv.tenCa,
      clv.gioBatDau,
      clv.gioKetThuc,
      clv.ngayLam,
      clv.trangThai,
      clv.MaNhanVien,
      clv.ghiChu,
      nv.HoTen
    FROM CaLamViec clv
    LEFT JOIN NhanVien nv ON clv.MaNhanVien = nv.MaNhanVien
    ORDER BY clv.ngayLam ASC, clv.gioBatDau ASC
  `);

  return {
    statusCode: 200,
    data: rows,
  };
};

export const getCaLamConTrongService = async () => {
  const [rows] = await db.query(`
    SELECT 
      maCa,
      tenCa,
      gioBatDau,
      gioKetThuc,
      ngayLam,
      trangThai,
      MaNhanVien,
      ghiChu,
      DATEDIFF(ngayLam, CURDATE()) AS soNgayConLai
    FROM CaLamViec
    WHERE MaNhanVien IS NULL
      AND trangThai = 'Chưa có nhân viên'
      AND ngayLam >= CURDATE()
    ORDER BY ngayLam ASC, gioBatDau ASC
  `);

  return {
    statusCode: 200,
    data: rows,
  };
};

export const getCaLamByIdService = async (maCa) => {
  const [rows] = await db.query(
    `
    SELECT 
      clv.maCa,
      clv.tenCa,
      clv.gioBatDau,
      clv.gioKetThuc,
      clv.ngayLam,
      clv.trangThai,
      clv.MaNhanVien,
      clv.ghiChu,
      nv.HoTen
    FROM CaLamViec clv
    LEFT JOIN NhanVien nv ON clv.MaNhanVien = nv.MaNhanVien
    WHERE clv.maCa = ?
    `,
    [maCa],
  );

  if (rows.length === 0) {
    return {
      statusCode: 404,
      data: { message: "Không tìm thấy ca làm" },
    };
  }

  return {
    statusCode: 200,
    data: rows[0],
  };
};

export const createCaLamService = async (data) => {
  const { tenCa, gioBatDau, gioKetThuc, ngayLam, ghiChu } = data;

  const [result] = await db.query(
    `
    INSERT INTO CaLamViec 
    (tenCa, gioBatDau, gioKetThuc, ngayLam, trangThai, MaNhanVien, ghiChu)
    VALUES (?, ?, ?, ?, 'Chưa có nhân viên', NULL, ?)
    `,
    [tenCa, gioBatDau, gioKetThuc, ngayLam, ghiChu || null],
  );

  return {
    statusCode: 201,
    data: {
      message: "Tạo ca làm thành công",
      maCa: result.insertId,
    },
  };
};

export const dangKyCaLamService = async (maCa, maNhanVien) => {
  if (!maNhanVien) {
    return {
      statusCode: 400,
      data: { message: "Tài khoản này chưa liên kết với nhân viên" },
    };
  }

  const [result] = await db.query(
    `
    UPDATE CaLamViec
    SET 
      MaNhanVien = ?,
      trangThai = 'Đã đăng ký'
    WHERE maCa = ?
      AND MaNhanVien IS NULL
      AND trangThai = 'Chưa có nhân viên'
      AND ngayLam >= CURDATE()
    `,
    [maNhanVien, maCa],
  );

  if (result.affectedRows === 0) {
    return {
      statusCode: 400,
      data: {
        message:
          "Ca làm này không tồn tại, đã có người đăng ký hoặc đã quá hạn đăng ký",
      },
    };
  }

  return {
    statusCode: 200,
    data: {
      message: "Đăng ký ca làm thành công",
    },
  };
};

export const huyDangKyCaLamService = async (maCa, maNhanVien) => {
  if (!maNhanVien) {
    return {
      statusCode: 400,
      data: { message: "Tài khoản này chưa liên kết với nhân viên" },
    };
  }

  const [rows] = await db.query(
    `
    SELECT 
      maCa,
      MaNhanVien,
      ngayLam,
      trangThai,
      DATEDIFF(ngayLam, CURDATE()) AS soNgayConLai
    FROM CaLamViec
    WHERE maCa = ?
    `,
    [maCa],
  );

  if (rows.length === 0) {
    return {
      statusCode: 404,
      data: { message: "Không tìm thấy ca làm" },
    };
  }

  const caLam = rows[0];

  if (caLam.MaNhanVien !== maNhanVien) {
    return {
      statusCode: 403,
      data: {
        message: "Bạn chỉ được hủy ca do chính bạn đã đăng ký",
      },
    };
  }

  if (caLam.trangThai !== "Đã đăng ký") {
    return {
      statusCode: 400,
      data: {
        message: "Chỉ có thể hủy ca đang ở trạng thái Đã đăng ký",
      },
    };
  }

  if (caLam.soNgayConLai < 3) {
    return {
      statusCode: 400,
      data: {
        message:
          "Không thể hủy ca. Bạn chỉ được hủy trước ngày làm ít nhất 3 ngày",
      },
    };
  }

  await db.query(
    `
    UPDATE CaLamViec
    SET 
      MaNhanVien = NULL,
      trangThai = 'Chưa có nhân viên'
    WHERE maCa = ?
    `,
    [maCa],
  );

  return {
    statusCode: 200,
    data: {
      message: "Hủy đăng ký ca làm thành công",
    },
  };
};

export const updateCaLamService = async (maCa, data) => {
  const { tenCa, gioBatDau, gioKetThuc, ngayLam, trangThai, ghiChu } = data;

  const [result] = await db.query(
    `
    UPDATE CaLamViec
    SET 
      tenCa = ?,
      gioBatDau = ?,
      gioKetThuc = ?,
      ngayLam = ?,
      trangThai = ?,
      ghiChu = ?
    WHERE maCa = ?
    `,
    [
      tenCa,
      gioBatDau,
      gioKetThuc,
      ngayLam,
      trangThai || "Chưa có nhân viên",
      ghiChu || null,
      maCa,
    ],
  );

  if (result.affectedRows === 0) {
    return {
      statusCode: 404,
      data: { message: "Không tìm thấy ca làm để cập nhật" },
    };
  }

  return {
    statusCode: 200,
    data: { message: "Cập nhật ca làm thành công" },
  };
};

export const deleteCaLamService = async (maCa) => {
  const [result] = await db.query(
    `
    DELETE FROM CaLamViec
    WHERE maCa = ?
    `,
    [maCa],
  );

  if (result.affectedRows === 0) {
    return {
      statusCode: 404,
      data: { message: "Không tìm thấy ca làm để xóa" },
    };
  }

  return {
    statusCode: 200,
    data: { message: "Xóa ca làm thành công" },
  };
};

export const getCaLamByNgayService = async (ngayLam) => {
  const [rows] = await db.query(
    `
    SELECT 
      clv.maCa,
      clv.tenCa,
      clv.gioBatDau,
      clv.gioKetThuc,
      clv.ngayLam,
      clv.trangThai,
      clv.MaNhanVien,
      clv.ghiChu,
      nv.HoTen
    FROM CaLamViec clv
    LEFT JOIN NhanVien nv ON clv.MaNhanVien = nv.MaNhanVien
    WHERE clv.ngayLam = ?
    ORDER BY clv.gioBatDau ASC
    `,
    [ngayLam],
  );

  return {
    statusCode: 200,
    data: rows,
  };
};

export const saveCaLamByNgayService = async (ngayLam, shiftsData) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Delete all existing shifts for that date
    await connection.query("DELETE FROM CaLamViec WHERE ngayLam = ?", [ngayLam]);

    // 2. Define times for each fixed shift
    const shiftTimes = {
      "Ca Sáng": { start: "07:00:00", end: "12:00:00" },
      "Ca Chiều": { start: "12:00:00", end: "17:00:00" },
      "Ca Tối": { start: "17:00:00", end: "22:00:00" },
    };

    // 3. Insert new shifts
    for (const shift of shiftsData) {
      const { tenCa, employeeIds } = shift;
      const times = shiftTimes[tenCa] || { start: "00:00:00", end: "00:00:00" };
      const gioBatDau = `${ngayLam} ${times.start}`;
      const gioKetThuc = `${ngayLam} ${times.end}`;

      if (!employeeIds || employeeIds.length === 0) {
        // Shift has no employees assigned
        await connection.query(
          `
          INSERT INTO CaLamViec (tenCa, gioBatDau, gioKetThuc, ngayLam, trangThai, MaNhanVien)
          VALUES (?, ?, ?, ?, 'Chưa có nhân viên', NULL)
          `,
          [tenCa, gioBatDau, gioKetThuc, ngayLam],
        );
      } else {
        // Shift has employees assigned, create one record per employee
        for (const empId of employeeIds) {
          await connection.query(
            `
            INSERT INTO CaLamViec (tenCa, gioBatDau, gioKetThuc, ngayLam, trangThai, MaNhanVien)
            VALUES (?, ?, ?, ?, 'Đã đăng ký', ?)
            `,
            [tenCa, gioBatDau, gioKetThuc, ngayLam, empId],
          );
        }
      }
    }

    await connection.commit();
    return {
      statusCode: 200,
      data: { message: "Lưu ca làm việc thành công" },
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
