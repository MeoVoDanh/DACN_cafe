import pool from "../config/db.js";
// Nếu project bạn dùng database.js thì sửa thành:
// import pool from "../config/database.js";

import { PayOS } from "@payos/node";

const payOS = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID,
  apiKey: process.env.PAYOS_API_KEY,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY,
});

async function findHoaDon(maHoaDon) {
  const [rows] = await pool.query(
    `
    SELECT 
      maHoaDon,
      tongtien,
      trangthaithanhtoan,
      payosOrderCode,
      payosPaymentLinkId
    FROM HoaDon
    WHERE maHoaDon = ?
    `,
    [maHoaDon],
  );

  return rows[0];
}

function createOrderCode(maHoaDon) {
  // payOS yêu cầu orderCode là số.
  // Ghép mã hóa đơn + thời gian để tránh trùng.
  const shortTime = Date.now().toString().slice(-6);
  return Number(`${maHoaDon}${shortTime}`);
}

export async function createPaymentLink(maHoaDon) {
  const hoaDon = await findHoaDon(maHoaDon);

  if (!hoaDon) {
    const error = new Error("Không tìm thấy hóa đơn");
    error.statusCode = 404;
    throw error;
  }

  if (hoaDon.trangthaithanhtoan === "Đã thanh toán") {
    const error = new Error("Hóa đơn này đã thanh toán rồi");
    error.statusCode = 400;
    throw error;
  }

  const amount = Number(hoaDon.tongtien);

  if (!amount || amount <= 0) {
    const error = new Error("Số tiền hóa đơn không hợp lệ");
    error.statusCode = 400;
    throw error;
  }

  const orderCode = createOrderCode(maHoaDon);

  const paymentData = {
    orderCode,
    amount,
    description: `HD${maHoaDon}`,
    items: [
      {
        name: `Hoa don ${maHoaDon}`,
        quantity: 1,
        price: amount,
      },
    ],
    returnUrl: process.env.PAYOS_RETURN_URL,
    cancelUrl: process.env.PAYOS_CANCEL_URL,
  };

  const paymentLink = await payOS.paymentRequests.create(paymentData);

  await pool.query(
    `
    UPDATE HoaDon
    SET 
      payosOrderCode = ?,
      payosPaymentLinkId = ?
    WHERE maHoaDon = ?
    `,
    [orderCode, paymentLink.paymentLinkId || null, maHoaDon],
  );

  return {
    maHoaDon,
    orderCode,
    amount,
    checkoutUrl: paymentLink.checkoutUrl,
    qrCode: paymentLink.qrCode,
    paymentLinkId: paymentLink.paymentLinkId,
  };
}

export async function handleWebhook(body) {
  const webhookData = payOS.webhooks.verify(body);

  const {
    orderCode,
    amount,
    paymentLinkId,
    reference,
    transactionDateTime,
    code,
  } = webhookData;

  if (code !== "00") {
    return {
      success: false,
      message: "Giao dịch không thành công",
      webhookData,
    };
  }

  const [rows] = await pool.query(
    `
    SELECT 
      maHoaDon,
      tongtien,
      trangthaithanhtoan
    FROM HoaDon
    WHERE payosOrderCode = ?
    `,
    [orderCode],
  );

  const hoaDon = rows[0];

  if (!hoaDon) {
    return {
      success: false,
      message: "Không tìm thấy hóa đơn theo orderCode",
      webhookData,
    };
  }

  if (Number(hoaDon.tongtien) !== Number(amount)) {
    return {
      success: false,
      message: "Số tiền thanh toán không khớp hóa đơn",
      webhookData,
    };
  }

  if (hoaDon.trangthaithanhtoan !== "Đã thanh toán") {
    await pool.query(
      `
      UPDATE HoaDon
      SET trangthaithanhtoan = ?
      WHERE maHoaDon = ?
      `,
      ["Đã thanh toán", hoaDon.maHoaDon],
    );

    await pool.query(
      `
      INSERT INTO ThanhToan 
        (maHoaDon, thoigianthanhtoan, sotien, phuongThuc)
      VALUES 
        (?, NOW(), ?, ?)
      `,
      [hoaDon.maHoaDon, amount, "PAYOS"],
    );
  }

  return {
    success: true,
    message: "Cập nhật thanh toán thành công",
    maHoaDon: hoaDon.maHoaDon,
    orderCode,
    amount,
    paymentLinkId,
    reference,
    transactionDateTime,
  };
}

export async function getPaymentStatus(maHoaDon) {
  const hoaDon = await findHoaDon(maHoaDon);

  if (!hoaDon) {
    const error = new Error("Không tìm thấy hóa đơn");
    error.statusCode = 404;
    throw error;
  }

  if (
    hoaDon.trangthaithanhtoan !== "Đã thanh toán" &&
    (hoaDon.payosPaymentLinkId || hoaDon.payosOrderCode)
  ) {
    try {
      const paymentLink = hoaDon.payosPaymentLinkId
        ? await payOS.paymentRequests.get(hoaDon.payosPaymentLinkId)
        : await payOS.paymentRequests.get(Number(hoaDon.payosOrderCode));

      if (paymentLink?.status === "PAID") {
        await pool.query(
          `
          UPDATE HoaDon
          SET trangthaithanhtoan = ?
          WHERE maHoaDon = ?
          `,
          ["Đã thanh toán", hoaDon.maHoaDon],
        );

        const [existingRows] = await pool.query(
          `
          SELECT COUNT(*) AS total
          FROM ThanhToan
          WHERE maHoaDon = ? AND phuongThuc = ?
          `,
          [hoaDon.maHoaDon, "PAYOS"],
        );

        if (!existingRows[0]?.total) {
          await pool.query(
            `
            INSERT INTO ThanhToan
              (maHoaDon, thoigianthanhtoan, sotien, phuongThuc)
            VALUES
              (?, NOW(), ?, ?)
            `,
            [hoaDon.maHoaDon, hoaDon.tongtien, "PAYOS"],
          );
        }

        hoaDon.trangthaithanhtoan = "Đã thanh toán";
      }
    } catch (error) {
      console.log("Lỗi kiểm tra trạng thái payOS:", error.message);
    }
  }

  return hoaDon;
}

export async function confirmWebhookUrl() {
  const webhookUrl = process.env.PAYOS_WEBHOOK_URL;

  if (!webhookUrl) {
    const error = new Error("Thiếu PAYOS_WEBHOOK_URL trong .env");
    error.statusCode = 500;
    throw error;
  }

  return await payOS.webhooks.confirm(webhookUrl);
}
