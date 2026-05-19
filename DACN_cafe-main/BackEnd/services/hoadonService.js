import db from "../config/db.js";

export const getAllHoaDonService = async () => {
  const [rows] = await db.query(`
    SELECT 
      hd.maHoaDon,
      hd.ngaylap,
      hd.tongtien,
      hd.trangthaithanhtoan,
      hd.MaNhanVien,
      nv.HoTen
    FROM HoaDon hd
    JOIN NhanVien nv ON hd.MaNhanVien = nv.MaNhanVien
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
      cthd.thanhtien
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
        (maHoaDon, maDoUong, soluong, dongia, thanhtien)
        VALUES (?, ?, ?, ?, ?)
        `,
        [maHoaDon, item.maDoUong, item.soluong, item.dongia, item.thanhtien],
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

export const thanhToanHoaDonService = async (maHoaDon) => {
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

    await connection.query(
      `
      UPDATE HoaDon
      SET trangthaithanhtoan = 'Đã thanh toán'
      WHERE maHoaDon = ?
      `,
      [maHoaDon],
    );

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
