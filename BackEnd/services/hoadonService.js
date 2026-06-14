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

  // Lấy chi tiết hóa đơn (dùng schema chuẩn từ DACN_cafe.sql)
  const [chiTietRows] = await db.query(
    `
    SELECT 
      cthd.maChiTietHoaDon,
      cthd.maHoaDon,
      cthd.maDoUong,
      du.tenDoUong,
      du.hinhAnh,
      cthd.soluong,
      cthd.dongia,
      cthd.tongTienTopping,
      cthd.thanhtien,
      cthd.duong,
      cthd.da,
      cthd.size,
      cthd.ghiChu
    FROM ChiTietHoaDon cthd
    JOIN DoUong du ON cthd.maDoUong = du.maDoUong
    WHERE cthd.maHoaDon = ?
    `,
    [maHoaDon],
  );

  // Lấy topping cho từng chi tiết hóa đơn từ bảng ChiTietTopping
  for (const chiTiet of chiTietRows) {
    const [toppingRows] = await db.query(
      `
      SELECT 
        ctt.maTopping,
        tp.tenTopping,
        ctt.soLuong,
        ctt.donGia,
        ctt.thanhtien
      FROM ChiTietTopping ctt
      JOIN Topping tp ON ctt.maTopping = tp.maTopping
      WHERE ctt.maChiTietHoaDon = ?
      `,
      [chiTiet.maChiTietHoaDon],
    );
    chiTiet.toppings = toppingRows;
  }

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

    // 1. Tạo hóa đơn với tongtien = 0, trigger sẽ tự tính sau
    const [hoaDonResult] = await connection.query(
      `
      INSERT INTO HoaDon (ngaylap, tongtien, trangthaithanhtoan, MaNhanVien)
      VALUES (NOW(), 0, ?, ?)
      `,
      [trangthaithanhtoan || "Chưa thanh toán", MaNhanVien],
    );

    const maHoaDon = hoaDonResult.insertId;

    // 2. Thêm chi tiết hóa đơn cho từng món
    for (const item of items) {
      // Kiểm tra đồ uống tồn tại và lấy giá
      const [drinkRows] = await connection.query(
        "SELECT maDoUong, donGia FROM DoUong WHERE maDoUong = ?",
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

      // INSERT ChiTietHoaDon — KHÔNG ghi thanhtien (cột GENERATED), KHÔNG ghi toppings (không tồn tại)
      const [cthdResult] = await connection.query(
        `
        INSERT INTO ChiTietHoaDon 
        (maHoaDon, maDoUong, soluong, dongia, duong, da, size, ghiChu)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          maHoaDon,
          item.maDoUong,
          soluong,
          dongia,
          item.duong || "100%",
          item.da || "100%",
          item.size || "M",
          item.ghiChu || null,
        ],
      );

      const maChiTietHoaDon = cthdResult.insertId;

      // 3. Thêm topping cho món này (nếu có)
      // Frontend gửi dạng mảng: [{ maTopping, soLuong }]
      if (Array.isArray(item.toppings) && item.toppings.length > 0) {
        for (const tp of item.toppings) {
          // Lấy giá topping từ bảng Topping
          const [toppingRows] = await connection.query(
            "SELECT maTopping, donGia FROM Topping WHERE maTopping = ?",
            [tp.maTopping],
          );

          if (toppingRows.length === 0) {
            await connection.rollback();
            return {
              statusCode: 404,
              data: { message: `Không tìm thấy topping mã ${tp.maTopping}` },
            };
          }

          // INSERT ChiTietTopping — trigger sẽ tự cập nhật tongTienTopping → thanhtien → tongtien
          await connection.query(
            `
            INSERT INTO ChiTietTopping (maChiTietHoaDon, maTopping, soLuong, donGia)
            VALUES (?, ?, ?, ?)
            `,
            [
              maChiTietHoaDon,
              tp.maTopping,
              tp.soLuong || 1,
              toppingRows[0].donGia,
            ],
          );
        }
      }
    }

    // 4. Đọc lại tongtien (đã được trigger tự tính)
    const [[hoaDon]] = await connection.query(
      "SELECT tongtien FROM HoaDon WHERE maHoaDon = ?",
      [maHoaDon],
    );

    await connection.commit();

    return {
      statusCode: 201,
      data: {
        message: "Tạo hóa đơn thành công",
        maHoaDon,
        tongtien: hoaDon.tongtien,
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

    // 2. Xóa chi tiết hóa đơn cũ (CASCADE sẽ tự xóa ChiTietTopping liên quan)
    await connection.query(
      "DELETE FROM ChiTietHoaDon WHERE maHoaDon = ?",
      [maHoaDon]
    );

    // 3. Thêm chi tiết hóa đơn mới
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

      // INSERT ChiTietHoaDon — không ghi thanhtien (GENERATED), không ghi toppings
      const [cthdResult] = await connection.query(
        `
        INSERT INTO ChiTietHoaDon 
        (maHoaDon, maDoUong, soluong, dongia, duong, da, size, ghiChu)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          maHoaDon,
          item.maDoUong,
          soluong,
          dongia,
          item.duong || "100%",
          item.da || "100%",
          item.size || "M",
          item.ghiChu || null,
        ]
      );

      const maChiTietHoaDon = cthdResult.insertId;

      // Thêm topping (nếu có) — trigger sẽ tự tính tongTienTopping → thanhtien → tongtien
      if (Array.isArray(item.toppings) && item.toppings.length > 0) {
        for (const tp of item.toppings) {
          const [toppingRows] = await connection.query(
            "SELECT maTopping, donGia FROM Topping WHERE maTopping = ?",
            [tp.maTopping]
          );

          if (toppingRows.length === 0) {
            await connection.rollback();
            return {
              statusCode: 404,
              data: { message: `Không tìm thấy topping mã ${tp.maTopping}` },
            };
          }

          await connection.query(
            `
            INSERT INTO ChiTietTopping (maChiTietHoaDon, maTopping, soLuong, donGia)
            VALUES (?, ?, ?, ?)
            `,
            [
              maChiTietHoaDon,
              tp.maTopping,
              tp.soLuong || 1,
              toppingRows[0].donGia,
            ]
          );
        }
      }
    }

    // 4. Cập nhật nhân viên thao tác
    await connection.query(
      "UPDATE HoaDon SET MaNhanVien = ? WHERE maHoaDon = ?",
      [MaNhanVien, maHoaDon]
    );

    // 5. Đọc lại tongtien (trigger đã tự tính)
    const [[hoaDon]] = await connection.query(
      "SELECT tongtien FROM HoaDon WHERE maHoaDon = ?",
      [maHoaDon]
    );

    await connection.commit();
    return {
      statusCode: 200,
      data: { message: "Cập nhật hóa đơn thành công", tongtien: hoaDon.tongtien },
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
