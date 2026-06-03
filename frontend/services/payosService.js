import api from "../redux/api";

export const createPayosPayment = async (maHoaDon) => {
  const response = await api.post(`/payos/create-payment/${maHoaDon}`);
  return response.data;
};

export const getPayosPaymentStatus = async (maHoaDon) => {
  const response = await api.get(`/payos/status/${maHoaDon}`);
  return response.data;
};
