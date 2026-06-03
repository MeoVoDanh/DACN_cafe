import * as payosService from "../services/payosService.js";

export async function createPayosPayment(req, res) {
  try {
    const { maHoaDon } = req.params;

    const result = await payosService.createPaymentLink(maHoaDon);

    return res.json({
      message: "Tạo thanh toán payOS thành công",
      ...result,
    });
  } catch (error) {
    console.log("Lỗi createPayosPayment:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Lỗi tạo thanh toán payOS",
    });
  }
}

export async function payosWebhook(req, res) {
  try {
    const result = await payosService.handleWebhook(req.body);

    console.log("payOS webhook result:", result);

    // payOS chỉ cần server trả HTTP 2xx là hiểu webhook đã nhận thành công.
    return res.status(200).json({
      message: "Webhook received",
      result,
    });
  } catch (error) {
    console.log("Lỗi payosWebhook:", error);

    return res.status(400).json({
      message: "Webhook không hợp lệ",
      error: error.message,
    });
  }
}

export async function getPayosStatus(req, res) {
  try {
    const { maHoaDon } = req.params;

    const hoaDon = await payosService.getPaymentStatus(maHoaDon);

    return res.json({
      message: "Lấy trạng thái thanh toán thành công",
      hoaDon,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message || "Lỗi lấy trạng thái thanh toán",
    });
  }
}

export function payosReturn(req, res) {
  return res.send(`
    <h2>Thanh toán hoàn tất</h2>
    <p>Bạn có thể quay lại ứng dụng để kiểm tra hóa đơn.</p>
  `);
}

export function payosCancel(req, res) {
  return res.send(`
    <h2>Đã hủy thanh toán</h2>
    <p>Bạn có thể quay lại ứng dụng để thanh toán lại.</p>
  `);
}

export async function confirmPayosWebhook(req, res) {
  try {
    const result = await payosService.confirmWebhookUrl();

    return res.json({
      message: "Đăng ký webhook payOS thành công",
      result,
    });
  } catch (error) {
    console.log("Lỗi confirmPayosWebhook:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Lỗi đăng ký webhook payOS",
    });
  }
}
