import db from "../config/db.js";

export const getAllHoaDonService = async () => {
  const [rows] = await db.query(`
    SELECT 
      hd.maHoaDon,
      hd.ngaylap,
      hd.createdAt,
      hd.tongtien,
      hd.trangthaithanhtoan,
      hd.MaNhanVien,
      nv.HoTen,
      tt.phuongThuc
    FROM HoaDon hd
    JOIN NhanVien nv ON hd.MaNhanVien = nv.MaNhanVien
    LEFT JOIN ThanhToan tt ON hd.maHoaDon = tt.maHoaDon
    ORDER BY hd.maHoaDon DESC
  `);

  return {
    statusCode: 200,
    data: rows,
  };
};

export const getHoaDonByIdService = async (maHoaDon) => {
  const [hoaDonRows] = await db.query(
    `
    SELECT 
      hd.maHoaDon,
      hd.ngaylap,
      hd.createdAt,
      hd.tongtien,
      hd.trangthaithanhtoan,
      hd.MaNhanVien,
      nv.HoTen
    FROM HoaDon hd
    JOIN NhanVien nv ON hd.MaNhanVien = nv.MaNhanVien
    WHERE hd.maHoaDon = ?
    `,
    [maHoaDon],
  );

  if (hoaDonRows.length === 0) {
    return {
      statusCode: 404,
      data: { message: "Không tìm thấy hóa đơn" },
    };
  }

  const [chiTietRows] = await db.query(
    `
    SELECT 
      cthd.maHoaDon,
      cthd.maDoUong,
      du.tenDoUong,
      cthd.soluong,
      cthd.dongia,
      cthd.thanhtien,
      cthd.duong,
      cthd.da
    FROM ChiTietHoaDon cthd
    JOIN DoUong du ON cthd.maDoUong = du.maDoUong
    WHERE cthd.maHoaDon = ?
    `,
    [maHoaDon],
  );

  return {
    statusCode: 200,
    data: {
      hoaDon: hoaDonRows[0],
      chiTiet: chiTietRows,
    },
  };
};

export const createHoaDonService = async (data, user) => {
  const { trangthaithanhtoan, items } = data;
  const MaNhanVien = user.MaNhanVien;

  if (!MaNhanVien) {
    return {
      statusCode: 400,
      data: { message: "Tài khoản chưa liên kết nhân viên" },
    };
  }

  if (!Array.isArray(items) || items.length === 0) {
    return {
      statusCode: 400,
      data: { message: "Hóa đơn phải có ít nhất một món" },
    };
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    let tongtien = 0;
    const chiTietItems = [];

    for (const item of items) {
      const [drinkRows] = await connection.query(
        `
        SELECT maDoUong, donGia 
        FROM DoUong 
        WHERE maDoUong = ?
        `,
        [item.maDoUong],
      );

      if (drinkRows.length === 0) {
        await connection.rollback();

        return {
          statusCode: 404,
          data: { message: `Không tìm thấy đồ uống mã ${item.maDoUong}` },
        };
      }

      const soluong = Number(item.soluong || 1);
      const dongia = Number(drinkRows[0].donGia);
      const thanhtien = soluong * dongia;

      tongtien += thanhtien;

      chiTietItems.push({
        maDoUong: item.maDoUong,
        soluong,
        dongia,
        thanhtien,
        duong: item.duong,
        da: item.da,
      });
    }

    const [hoaDonResult] = await connection.query(
      `
      INSERT INTO HoaDon (ngaylap, tongtien, trangthaithanhtoan, MaNhanVien)
      VALUES (CURDATE(), ?, ?, ?)
      `,
      [tongtien, trangthaithanhtoan || "Chưa thanh toán", MaNhanVien],
    );

    const maHoaDon = hoaDonResult.insertId;

    for (const item of chiTietItems) {
      await connection.query(
        `
        INSERT INTO ChiTietHoaDon 
        (maHoaDon, maDoUong, soluong, dongia, duong, da)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [maHoaDon, item.maDoUong, item.soluong, item.dongia, item.duong || "100%", item.da || "100%"],
      );
    }

    await connection.commit();

    return {
      statusCode: 201,
      data: {
        message: "Tạo hóa đơn thành công",
        maHoaDon,
        tongtien,
      },
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const thanhToanHoaDonService = async (maHoaDon, user) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [hoaDonRows] = await connection.query(
      `
      SELECT maHoaDon, tongtien, trangthaithanhtoan
      FROM HoaDon
      WHERE maHoaDon = ?
      `,
      [maHoaDon],
    );

    if (hoaDonRows.length === 0) {
      await connection.rollback();

      return {
        statusCode: 404,
        data: { message: "Không tìm thấy hóa đơn" },
      };
    }

    const hoaDon = hoaDonRows[0];

    if (hoaDon.trangthaithanhtoan === "Đã thanh toán") {
      await connection.rollback();

      return {
        statusCode: 400,
        data: { message: "Hóa đơn này đã thanh toán rồi" },
      };
    }

    const MaNhanVien = user?.MaNhanVien;
    if (MaNhanVien) {
      await connection.query(
        `
        UPDATE HoaDon
        SET trangthaithanhtoan = 'Đã thanh toán', MaNhanVien = ?
        WHERE maHoaDon = ?
        `,
        [MaNhanVien, maHoaDon],
      );
    } else {
      await connection.query(
        `
        UPDATE HoaDon
        SET trangthaithanhtoan = 'Đã thanh toán'
        WHERE maHoaDon = ?
        `,
        [maHoaDon],
      );
    }

    await connection.query(
      `
      INSERT INTO ThanhToan (thoigianthanhtoan, sotien, maHoaDon)
      VALUES (NOW(), ?, ?)
      `,
      [hoaDon.tongtien, maHoaDon],
    );

    await connection.commit();

    return {
      statusCode: 200,
      data: {
        message: "Thanh toán hóa đơn thành công",
        maHoaDon,
        sotien: hoaDon.tongtien,
      },
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const deleteHoaDonService = async (maHoaDon) => {
  const [result] = await db.query(
    `
    DELETE FROM HoaDon
    WHERE maHoaDon = ?
    `,
    [maHoaDon],
  );

  if (result.affectedRows === 0) {
    return {
      statusCode: 404,
      data: { message: "Không tìm thấy hóa đơn để xóa" },
    };
  }

  return {
    statusCode: 200,
    data: { message: "Xóa hóa đơn thành công" },
  };
};

export const updateHoaDonService = async (maHoaDon, data, user) => {
  const { items } = data;
  const MaNhanVien = user?.MaNhanVien;

  if (!MaNhanVien) {
    return {
      statusCode: 400,
      data: { message: "Tài khoản chưa liên kết nhân viên" },
    };
  }

  if (!Array.isArray(items) || items.length === 0) {
    return {
      statusCode: 400,
      data: { message: "Hóa đơn phải có ít nhất một món" },
    };
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Kiểm tra hóa đơn tồn tại và chưa thanh toán
    const [hoaDonRows] = await connection.query(
      "SELECT trangthaithanhtoan FROM HoaDon WHERE maHoaDon = ?",
      [maHoaDon]
    );

    if (hoaDonRows.length === 0) {
      await connection.rollback();
      return {
        statusCode: 404,
        data: { message: "Không tìm thấy hóa đơn" },
      };
    }

    if (hoaDonRows[0].trangthaithanhtoan !== "Chưa thanh toán") {
      await connection.rollback();
      return {
        statusCode: 400,
        data: { message: "Chỉ được sửa hóa đơn chưa thanh toán" },
      };
    }

    // 2. Tính toán tổng tiền mới và xác thực các đồ uống
    let tongtien = 0;
    const chiTietItems = [];

    for (const item of items) {
      const [drinkRows] = await connection.query(
        "SELECT maDoUong, donGia FROM DoUong WHERE maDoUong = ?",
        [item.maDoUong]
      );

      if (drinkRows.length === 0) {
        await connection.rollback();
        return {
          statusCode: 404,
          data: { message: `Không tìm thấy đồ uống mã ${item.maDoUong}` },
        };
      }

      const soluong = Number(item.soluong || 1);
      const dongia = Number(drinkRows[0].donGia);
      const thanhtien = soluong * dongia;

      tongtien += thanhtien;
      chiTietItems.push({
        maDoUong: item.maDoUong,
        soluong,
        dongia,
        duong: item.duong,
        da: item.da,
      });
    }

    // 3. Xóa chi tiết hóa đơn cũ
    await connection.query(
      "DELETE FROM ChiTietHoaDon WHERE maHoaDon = ?",
      [maHoaDon]
    );

    // 4. Thêm chi tiết hóa đơn mới
    for (const item of chiTietItems) {
      await connection.query(
        "INSERT INTO ChiTietHoaDon (maHoaDon, maDoUong, soluong, dongia, duong, da) VALUES (?, ?, ?, ?, ?, ?)",
        [maHoaDon, item.maDoUong, item.soluong, item.dongia, item.duong || "100%", item.da || "100%"]
      );
    }

    // 5. Cập nhật tổng tiền và nhân viên thao tác trong HoaDon
    await connection.query(
      "UPDATE HoaDon SET tongtien = ?, MaNhanVien = ? WHERE maHoaDon = ?",
      [tongtien, MaNhanVien, maHoaDon]
    );

    await connection.commit();
    return {
      statusCode: 200,
      data: { message: "Cập nhật hóa đơn thành công", tongtien },
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const huyHoaDonService = async (maHoaDon, user) => {
  const MaNhanVien = user?.MaNhanVien;

  if (!MaNhanVien) {
    return {
      statusCode: 400,
      data: { message: "Tài khoản chưa liên kết nhân viên" },
    };
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Kiểm tra hóa đơn tồn tại và chưa thanh toán
    const [hoaDonRows] = await connection.query(
      "SELECT trangthaithanhtoan FROM HoaDon WHERE maHoaDon = ?",
      [maHoaDon]
    );

    if (hoaDonRows.length === 0) {
      await connection.rollback();
      return {
        statusCode: 404,
        data: { message: "Không tìm thấy hóa đơn" },
      };
    }

    if (hoaDonRows[0].trangthaithanhtoan !== "Chưa thanh toán") {
      await connection.rollback();
      return {
        statusCode: 400,
        data: { message: "Chỉ được hủy hóa đơn chưa thanh toán" },
      };
    }

    // 2. Cập nhật trạng thái thành Đã hủy
    await connection.query(
      "UPDATE HoaDon SET trangthaithanhtoan = 'Đã hủy', MaNhanVien = ? WHERE maHoaDon = ?",
      [MaNhanVien, maHoaDon]
    );

    await connection.commit();
    return {
      statusCode: 200,
      data: { message: "Hủy hóa đơn thành công" },
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
