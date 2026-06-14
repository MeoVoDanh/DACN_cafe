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
  // Tự động khởi tạo 3 ca làm trống (Ca Sáng, Ca Chiều, Ca Tối) cho 14 ngày tới nếu chưa tồn tại
  const today = new Date();
  const shiftNames = ["Ca Sáng", "Ca Chiều", "Ca Tối"];
  const shiftTimes = {
    "Ca Sáng": { start: "07:00:00", end: "12:00:00" },
    "Ca Chiều": { start: "12:00:00", end: "17:00:00" },
    "Ca Tối": { start: "17:00:00", end: "22:00:00" },
  };

  for (let i = 0; i < 14; i++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + i);
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    for (const tenCa of shiftNames) {
      // Kiểm tra xem ca cụ thể này đã tồn tại trong ngày này chưa
      const [existing] = await db.query(
        "SELECT maCa FROM CaLamViec WHERE ngayLam = ? AND tenCa = ?",
        [dateStr, tenCa]
      );

      if (existing.length === 0) {
        const times = shiftTimes[tenCa];
        const gioBatDau = `${dateStr} ${times.start}`;
        const gioKetThuc = `${dateStr} ${times.end}`;
        await db.query(
          `INSERT INTO CaLamViec (tenCa, gioBatDau, gioKetThuc, ngayLam, trangThai, MaNhanVien)
           VALUES (?, ?, ?, ?, 'Chưa có nhân viên', NULL)`,
          [tenCa, gioBatDau, gioKetThuc, dateStr]
        );
      }
    }
  }

  const [rows] = await db.query(`
    SELECT 
      MIN(clv.maCa) AS maCa,
      clv.tenCa,
      MIN(clv.gioBatDau) AS gioBatDau,
      MIN(clv.gioKetThuc) AS gioKetThuc,
      clv.ngayLam,
      'Chưa có nhân viên' AS trangThai,
      NULL AS MaNhanVien,
      DATEDIFF(clv.ngayLam, CURDATE()) AS soNgayConLai,
      COUNT(clv.MaNhanVien) AS soNguoiDaDangKy
    FROM CaLamViec clv
    WHERE clv.ngayLam >= CURDATE()
    GROUP BY clv.ngayLam, clv.tenCa
    HAVING COUNT(clv.MaNhanVien) < 5
    ORDER BY clv.ngayLam ASC, clv.tenCa ASC
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

  // 1. Lấy thông tin ca làm muốn đăng ký
  const [shifts] = await db.query(
    "SELECT tenCa, gioBatDau, gioKetThuc, ngayLam, MaNhanVien, trangThai FROM CaLamViec WHERE maCa = ?",
    [maCa]
  );

  if (shifts.length === 0) {
    return {
      statusCode: 404,
      data: { message: "Ca làm không tồn tại" },
    };
  }

  const targetShift = shifts[0];
  const { tenCa, ngayLam, gioBatDau, gioKetThuc } = targetShift;

  // Kiểm tra thời gian thực đã qua giờ bắt đầu ca làm chưa
  if (gioBatDau && new Date() > new Date(gioBatDau)) {
    return {
      statusCode: 400,
      data: { message: "Ca làm việc này đã bắt đầu hoặc đã qua thời gian đăng ký." },
    };
  }

  // 2. Đếm số lượng nhân viên hiện tại đã đăng ký ca này vào ngày này (cả 'Chờ duyệt' và 'Đã đăng ký')
  const [countRows] = await db.query(
    `
    SELECT COUNT(*) AS total 
    FROM CaLamViec 
    WHERE ngayLam = ? AND tenCa = ? AND MaNhanVien IS NOT NULL
    `,
    [ngayLam, tenCa]
  );

  const currentCount = countRows[0].total;

  if (currentCount >= 5) {
    return {
      statusCode: 400,
      data: { message: `Ca trực [${tenCa}] ngày hôm đó đã đạt giới hạn tối đa 5 người` },
    };
  }

  // 3. Kiểm tra xem nhân viên này đã đăng ký ca này vào ngày này chưa (tránh trùng)
  const [existingReg] = await db.query(
    `
    SELECT maCa 
    FROM CaLamViec 
    WHERE ngayLam = ? AND tenCa = ? AND MaNhanVien = ?
    `,
    [ngayLam, tenCa, maNhanVien]
  );

  if (existingReg.length > 0) {
    return {
      statusCode: 400,
      data: { message: "Bạn đã đăng ký ca này rồi" },
    };
  }

  // 4. Nếu ca làm hiện tại chưa có nhân viên, update trực tiếp
  if (targetShift.MaNhanVien === null) {
    await db.query(
      `
      UPDATE CaLamViec
      SET 
        MaNhanVien = ?,
        trangThai = 'Chờ duyệt'
      WHERE maCa = ?
      `,
      [maNhanVien, maCa]
    );
  } else {
    // Nếu ca hiện tại đã có nhân viên khác, tạo dòng mới (vì số lượng đang < 5)
    await db.query(
      `
      INSERT INTO CaLamViec (tenCa, gioBatDau, gioKetThuc, ngayLam, trangThai, MaNhanVien)
      VALUES (?, ?, ?, ?, 'Chờ duyệt', ?)
      `,
      [tenCa, gioBatDau, gioKetThuc, ngayLam, maNhanVien]
    );
  }

  return {
    statusCode: 200,
    data: { message: "Đăng ký ca làm thành công, vui lòng chờ Admin phê duyệt" },
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

  if (caLam.trangThai !== "Đã đăng ký" && caLam.trangThai !== "Chờ duyệt") {
    return {
      statusCode: 400,
      data: {
        message: "Chỉ có thể hủy ca đang ở trạng thái Chờ duyệt hoặc Đã đăng ký",
      },
    };
  }

  if (caLam.trangThai === "Đã đăng ký" && caLam.soNgayConLai < 3) {
    return {
      statusCode: 400,
      data: {
        message:
          "Không thể hủy ca. Bạn chỉ được hủy ca đã duyệt trước ngày làm ít nhất 3 ngày",
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
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Lấy thông tin ca làm trước khi xóa để gửi thông báo nếu cần
    const [shifts] = await connection.query(
      `
      SELECT tenCa, ngayLam, trangThai, MaNhanVien
      FROM CaLamViec
      WHERE maCa = ?
      `,
      [maCa]
    );

    if (shifts.length === 0) {
      await connection.rollback();
      return {
        statusCode: 404,
        data: { message: "Không tìm thấy ca làm để xóa" },
      };
    }

    const shift = shifts[0];

    // 2. Thực hiện xóa ca làm
    const [result] = await connection.query(
      `
      DELETE FROM CaLamViec
      WHERE maCa = ?
      `,
      [maCa]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return {
        statusCode: 404,
        data: { message: "Không tìm thấy ca làm để xóa" },
      };
    }

    // 3. Nếu ca làm có gán nhân viên, tự động thêm thông báo cho nhân viên đó
    if (shift.MaNhanVien) {
      const formattedDate = new Date(shift.ngayLam).toLocaleDateString("vi-VN");
      let noiDungThongBao = "";

      if (shift.trangThai === "Đã đăng ký") {
        noiDungThongBao = `Ca trực [${shift.tenCa}] ngày [${formattedDate}] đã đăng ký của bạn đã bị Admin XÓA khỏi lịch làm việc.`;
      } else if (shift.trangThai === "Chờ duyệt") {
        noiDungThongBao = `Yêu cầu đăng ký ca trực [${shift.tenCa}] ngày [${formattedDate}] đang chờ duyệt của bạn đã bị Admin XÓA.`;
      } else {
        noiDungThongBao = `Ca trực [${shift.tenCa}] ngày [${formattedDate}] liên quan đến bạn đã bị Admin XÓA.`;
      }

      await connection.query(
        `
        INSERT INTO ThongBao (noiDung, MaNhanVien)
        VALUES (?, ?)
        `,
        [noiDungThongBao, shift.MaNhanVien]
      );
    }

    await connection.commit();
    return {
      statusCode: 200,
      data: { message: "Xóa ca làm thành công và đã gửi thông báo đến nhân viên" },
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
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

    // 1. Lấy thông tin phân ca cũ để kiểm tra xem ai bị xóa ca
    const [existingShifts] = await connection.query(
      `
      SELECT tenCa, ngayLam, trangThai, MaNhanVien
      FROM CaLamViec
      WHERE ngayLam = ? AND MaNhanVien IS NOT NULL
      `,
      [ngayLam]
    );

    // 2. Xóa các ca trực cũ trong ngày
    await connection.query("DELETE FROM CaLamViec WHERE ngayLam = ?", [ngayLam]);

    // 3. Khai báo khung giờ mặc định cho từng ca làm việc
    const shiftTimes = {
      "Ca Sáng": { start: "07:00:00", end: "12:00:00" },
      "Ca Chiều": { start: "12:00:00", end: "17:00:00" },
      "Ca Tối": { start: "17:00:00", end: "22:00:00" },
    };

    // 4. Lưu danh sách phân ca mới
    for (const shift of shiftsData) {
      const { tenCa, employeeIds, ghiChu } = shift;
      const times = shiftTimes[tenCa] || { start: "00:00:00", end: "00:00:00" };
      const gioBatDau = `${ngayLam} ${times.start}`;
      const gioKetThuc = `${ngayLam} ${times.end}`;

      if (!employeeIds || employeeIds.length === 0) {
        // Ca trống không có nhân viên
        await connection.query(
          `
          INSERT INTO CaLamViec (tenCa, gioBatDau, gioKetThuc, ngayLam, trangThai, MaNhanVien, ghiChu)
          VALUES (?, ?, ?, ?, 'Chưa có nhân viên', NULL, ?)
          `,
          [tenCa, gioBatDau, gioKetThuc, ngayLam, ghiChu || null],
        );
      } else {
        // Ca đã được giao cho một hoặc nhiều nhân viên
        for (const empId of employeeIds) {
          await connection.query(
            `
            INSERT INTO CaLamViec (tenCa, gioBatDau, gioKetThuc, ngayLam, trangThai, MaNhanVien, ghiChu)
            VALUES (?, ?, ?, ?, 'Đã đăng ký', ?, ?)
            `,
            [tenCa, gioBatDau, gioKetThuc, ngayLam, empId, ghiChu || null],
          );
        }
      }
    }

    // 5. So sánh phân ca cũ và mới để gửi thông báo cho nhân viên
    const formattedDate = new Date(ngayLam).toLocaleDateString("vi-VN");
    for (const oldShift of existingShifts) {
      // Tìm cấu hình ca mới tương ứng
      const newShiftData = shiftsData.find((s) => s.tenCa === oldShift.tenCa);
      // Kiểm tra nhân viên cũ có còn được giữ lại ở ca này không
      const isStillAssigned =
        newShiftData &&
        newShiftData.employeeIds &&
        newShiftData.employeeIds.includes(oldShift.MaNhanVien);

      if (isStillAssigned) {
        // Nếu trước đó đang chờ duyệt, giờ được giữ lại thì đổi thành Đã duyệt (Đã đăng ký)
        if (oldShift.trangThai === "Chờ duyệt") {
          const noiDungThongBao = `Yêu cầu đăng ký ca trực [${oldShift.tenCa}] ngày [${formattedDate}] của bạn đã được PHÊ DUYỆT.`;
          await connection.query(
            `
            INSERT INTO ThongBao (noiDung, MaNhanVien)
            VALUES (?, ?)
            `,
            [noiDungThongBao, oldShift.MaNhanVien]
          );
        }
      } else {
        // Nhân viên đã bị xóa hoặc từ chối
        const prefix = oldShift.trangThai === "Chờ duyệt" ? "Yêu cầu đăng ký ca trực" : `Ca trực`;
        const action = oldShift.trangThai === "Chờ duyệt" ? "TỪ CHỐI" : "XÓA khỏi lịch làm việc";
        const noiDungThongBao = `${prefix} [${oldShift.tenCa}] ngày [${formattedDate}] của bạn đã bị Admin ${action}.`;
        
        await connection.query(
          `
          INSERT INTO ThongBao (noiDung, MaNhanVien)
          VALUES (?, ?)
          `,
          [noiDungThongBao, oldShift.MaNhanVien]
        );
      }
    }

    await connection.commit();
    return {
      statusCode: 200,
      data: { message: "Lưu ca làm việc thành công và đã thông báo cho nhân viên bị gỡ ca" },
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const getPendingShiftsService = async () => {
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
      nv.HoTen,
      tk.vaiTro
    FROM CaLamViec clv
    JOIN NhanVien nv ON clv.MaNhanVien = nv.MaNhanVien
    JOIN TaiKhoan tk ON nv.MaTaiKhoan = tk.MaTaiKhoan
    WHERE clv.trangThai = 'Chờ duyệt'
    ORDER BY clv.ngayLam ASC, clv.gioBatDau ASC
  `);

  return {
    statusCode: 200,
    data: rows,
  };
};

export const pheDuyetCaLamService = async (maCa, action) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [shifts] = await connection.query(
      `
      SELECT maCa, tenCa, ngayLam, trangThai, MaNhanVien 
      FROM CaLamViec 
      WHERE maCa = ?
      `,
      [maCa]
    );

    if (shifts.length === 0) {
      await connection.rollback();
      return {
        statusCode: 404,
        data: { message: "Không tìm thấy ca làm" },
      };
    }

    const shift = shifts[0];

    if (shift.trangThai !== "Chờ duyệt") {
      await connection.rollback();
      return {
        statusCode: 400,
        data: { message: "Ca làm này không ở trạng thái Chờ duyệt" },
      };
    }

    let noiDungThongBao = "";
    const formattedDate = new Date(shift.ngayLam).toLocaleDateString("vi-VN");

    if (action === "approve") {
      await connection.query(
        `
        UPDATE CaLamViec
        SET trangThai = 'Đã đăng ký'
        WHERE maCa = ?
        `,
        [maCa]
      );
      noiDungThongBao = `Ca trực [${shift.tenCa}] ngày [${formattedDate}] của bạn đã được PHÊ DUYỆT.`;
    } else if (action === "reject") {
      await connection.query(
        `
        UPDATE CaLamViec
        SET 
          trangThai = 'Chưa có nhân viên',
          MaNhanVien = NULL
        WHERE maCa = ?
        `,
        [maCa]
      );
      noiDungThongBao = `Ca trực [${shift.tenCa}] ngày [${formattedDate}] của bạn đã bị TỪ CHỐI phê duyệt.`;
    } else {
      await connection.rollback();
      return {
        statusCode: 400,
        data: { message: "Hành động phê duyệt không hợp lệ" },
      };
    }

    await connection.query(
      `
      INSERT INTO ThongBao (noiDung, MaNhanVien)
      VALUES (?, ?)
      `,
      [noiDungThongBao, shift.MaNhanVien]
    );

    await connection.commit();

    return {
      statusCode: 200,
      data: {
        message: action === "approve" ? "Phê duyệt ca trực thành công" : "Từ chối ca trực thành công",
      },
    };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
