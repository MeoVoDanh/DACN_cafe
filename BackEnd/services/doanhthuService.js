import db from "../config/db.js";

export const getTongDoanhThuService = async () => {
  const [rows] = await db.query(`
    SELECT 
      COALESCE(SUM(tongtien), 0) AS tongDoanhThu,
      COUNT(*) AS soHoaDonDaThanhToan
    FROM HoaDon
    WHERE trangthaithanhtoan = 'Đã thanh toán'
  `);

  return {
    statusCode: 200,
    data: rows[0],
  };
};

export const getDoanhThuTheoNgayService = async () => {
  const [rows] = await db.query(`
    SELECT 
      ngaylap,
      COALESCE(SUM(tongtien), 0) AS tongDoanhThu,
      COUNT(*) AS soHoaDon
    FROM HoaDon
    WHERE trangthaithanhtoan = 'Đã thanh toán'
    GROUP BY ngaylap
    ORDER BY ngaylap DESC
  `);

  return {
    statusCode: 200,
    data: rows,
  };
};

export const getTopDoUongService = async () => {
  const [rows] = await db.query(`
    SELECT 
      du.maDoUong,
      du.tenDoUong,
      SUM(cthd.soluong) AS tongSoLuongBan,
      SUM(cthd.thanhtien) AS tongTienBan
    FROM ChiTietHoaDon cthd
    JOIN DoUong du ON cthd.maDoUong = du.maDoUong
    JOIN HoaDon hd ON cthd.maHoaDon = hd.maHoaDon
    WHERE hd.trangthaithanhtoan = 'Đã thanh toán'
    GROUP BY du.maDoUong, du.tenDoUong
    ORDER BY tongSoLuongBan DESC
    LIMIT 10
  `);

  return {
    statusCode: 200,
    data: rows,
  };
};
