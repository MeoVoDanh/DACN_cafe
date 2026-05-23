import api from "../redux/api";

export const getAllDoUongApi = async () => {
  const response = await api.get("/douong");
  return response.data;
};

export const createDoUongApi = async (data) => {
  const response = await api.post("/douong", data);
  return response.data;
};

export const updateDoUongApi = async (maDoUong, data) => {
  const response = await api.put(`/douong/${maDoUong}`, data);
  return response.data;
};

export const deleteDoUongApi = async (maDoUong) => {
  const response = await api.delete(`/douong/${maDoUong}`);
  return response.data;
};
