// DeleteEmployeeScreen.js
import React from "react";
import axios from "axios";
import ConfirmDeleteEmployee from "../components/ConfirmDeleteEmployee";

export default function MHXacNhanXoaNhanVien({ route, navigation }) {
  const { emp } = route.params;
  const id = emp.MaNhanVien;

  const handleDelete = () => {
    axios
      .delete(`http://localhost:5555/nhanvien/${id}`)
      .then(() => {
        alert("Xóa thành công!");
        navigation.goBack();
      })
      .catch((err) => {
        console.log(err);
        alert("Lỗi khi xóa!");
      });
  };

  return <ConfirmDeleteEmployee emp={emp} onConfirm={handleDelete} />;
}
