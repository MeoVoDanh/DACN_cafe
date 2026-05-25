import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Modal,
  ScrollView,
  Platform,
  TextInput,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  createInvoice,
  fetchDrinksForInvoice,
  fetchInvoices,
  payInvoice,
  clearInvoiceMessage,
  updateInvoice,
  cancelInvoice,
} from "../../redux/invoiceSlice";
import { FontAwesome5 } from "@expo/vector-icons";
import api from "../../redux/api";

export default function InvoiceScreen({ navigation }) {
  const dispatch = useDispatch();

  const { invoices, drinks, isLoading, error, message } = useSelector(
    (state) => state.invoice,
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editInvoiceId, setEditInvoiceId] = useState(null);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [customizingDrink, setCustomizingDrink] = useState(null);
  const [selectedDuong, setSelectedDuong] = useState("100%");
  const [selectedDa, setSelectedDa] = useState("100%");
  
  // Payment States
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPaymentInvoice, setSelectedPaymentInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("tienmat");
  const [customerCash, setCustomerCash] = useState("");
  const [changeDue, setChangeDue] = useState(0);

  useEffect(() => {
    dispatch(fetchInvoices());
    dispatch(fetchDrinksForInvoice());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      Alert.alert("Lỗi", error, [
        { text: "OK", onPress: () => dispatch(clearInvoiceMessage()) }
      ]);
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (message) {
      Alert.alert("Thông báo", message, [
        { text: "OK", onPress: () => dispatch(clearInvoiceMessage()) }
      ]);
    }
  }, [message, dispatch]);

  // Dọn dẹp thông báo lỗi/thành công khi đóng hoặc rời màn hình
  useEffect(() => {
    return () => {
      dispatch(clearInvoiceMessage());
    };
  }, [dispatch]);

  const reloadData = () => {
    dispatch(fetchInvoices());
    dispatch(fetchDrinksForInvoice());
  };

  const handleAddDrink = (drink, duong = "100%", da = "100%") => {
    const itemDuong = drink.duong || duong;
    const itemDa = drink.da || da;

    const existed = cartItems.find(
      (item) =>
        item.maDoUong === drink.maDoUong &&
        item.duong === itemDuong &&
        item.da === itemDa
    );

    if (existed) {
      setCartItems((prev) =>
        prev.map((item) =>
          item.maDoUong === drink.maDoUong &&
          item.duong === itemDuong &&
          item.da === itemDa
            ? { ...item, soluong: item.soluong + 1 }
            : item
        )
      );
    } else {
      setCartItems((prev) => [
        ...prev,
        {
          maDoUong: drink.maDoUong,
          tenDoUong: drink.tenDoUong,
          donGia: Number(drink.donGia),
          soluong: 1,
          duong: itemDuong,
          da: itemDa,
        },
      ]);
    }
  };

  const handlePressAddDrink = (drink) => {
    setCustomizingDrink(drink);
    setSelectedDuong("100%");
    setSelectedDa("100%");
    setOptionsModalVisible(true);
  };

  const handleDecreaseDrink = (maDoUong, duong, da) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.maDoUong === maDoUong && item.duong === duong && item.da === da
            ? { ...item, soluong: item.soluong - 1 }
            : item
        )
        .filter((item) => item.soluong > 0)
    );
  };

  const getTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.soluong * Number(item.donGia),
      0,
    );
  };

  const handleCreateInvoice = async () => {
    if (cartItems.length === 0) {
      Alert.alert("Thông báo", "Vui lòng chọn ít nhất một đồ uống");
      return;
    }

    const payload = {
      trangthaithanhtoan: "Chưa thanh toán",
      items: cartItems.map((item) => ({
        maDoUong: item.maDoUong,
        soluong: item.soluong,
        duong: item.duong || "100%",
        da: item.da || "100%",
      })),
    };

    const result = await dispatch(createInvoice(payload));

    if (createInvoice.fulfilled.match(result)) {
      setCartItems([]);
      setModalVisible(false);
      reloadData();
    }
  };

  const handleOpenPaymentModal = (invoice) => {
    setSelectedPaymentInvoice(invoice);
    setPaymentMethod("tienmat");
    setCustomerCash("");
    setChangeDue(0);
    setPaymentModalVisible(true);
  };

  const handleCashChange = (text, total) => {
    const cleanText = text.replace(/[^0-9]/g, "");
    setCustomerCash(cleanText);
    const amount = parseFloat(cleanText) || 0;
    if (amount >= total) {
      setChangeDue(amount - total);
    } else {
      setChangeDue(0);
    }
  };

  const selectQuickAmount = (amount, total) => {
    const cleanAmount = Math.ceil(amount);
    setCustomerCash(cleanAmount.toString());
    if (cleanAmount >= total) {
      setChangeDue(cleanAmount - total);
    } else {
      setChangeDue(0);
    }
  };

  const executePayment = async () => {
    if (!selectedPaymentInvoice) return;
    const maHoaDon = selectedPaymentInvoice.maHoaDon;
    const result = await dispatch(payInvoice(maHoaDon));

    if (payInvoice.fulfilled.match(result)) {
      setPaymentModalVisible(false);
      reloadData();
      
      if (paymentMethod === "tienmat") {
        const cashVal = customerCash || selectedPaymentInvoice.tongtien.toString();
        const changeVal = changeDue;
        handlePrintBill(maHoaDon, cashVal, changeVal);
      }
    }
  };

  const handlePrintBill = async (maHoaDon, cashVal, changeVal) => {
    try {
      const response = await api.get(`/hoadon/${maHoaDon}`);
      if (!response.data || !response.data.hoaDon) {
        if (Platform.OS === "web") {
          window.alert("Không tìm thấy thông tin hóa đơn để in!");
        } else {
          Alert.alert("Lỗi", "Không tìm thấy thông tin hóa đơn để in!");
        }
        return;
      }
      
      const { hoaDon, chiTiet } = response.data;
      const ngayLapStr = formatDate(hoaDon.createdAt || hoaDon.ngaylap);
      const nhanVien = hoaDon.HoTen || "Không rõ";
      const tongTien = Number(hoaDon.tongtien || 0);

      if (Platform.OS === "web") {
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
          window.alert("Trình duyệt đã chặn cửa sổ bật lên. Vui lòng cho phép bật lên để in hóa đơn.");
          return;
        }

        const itemsHtml = chiTiet.map(item => `
          <tr>
            <td style="padding: 6px 0; text-align: left; vertical-align: top;">
              <strong>${item.tenDoUong}</strong><br/>
              <small style="color: #666; font-size: 11px;">Đường: ${item.duong} | Đá: ${item.da}</small>
            </td>
            <td style="padding: 6px 0; text-align: center; vertical-align: top;">${item.soluong}</td>
            <td style="padding: 6px 0; text-align: right; vertical-align: top;">${Number(item.dongia).toLocaleString("vi-VN")}đ</td>
            <td style="padding: 6px 0; text-align: right; vertical-align: top;">${Number(item.thanhtien).toLocaleString("vi-VN")}đ</td>
          </tr>
        `).join("");

        const cashInfoHtml = cashVal ? `
          <div style="border-top: 1px dashed #000; padding: 10px 0; font-size: 13px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Tiền khách đưa:</span>
              <span><strong>${Number(cashVal).toLocaleString("vi-VN")}đ</strong></span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Tiền trả lại:</span>
              <span><strong>${Number(changeVal).toLocaleString("vi-VN")}đ</strong></span>
            </div>
          </div>
        ` : "";

        const htmlContent = `
          <html>
          <head>
            <title>Hóa đơn #${maHoaDon}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                width: 300px;
                margin: 0 auto;
                padding: 10px;
                color: #000;
              }
              .header {
                text-align: center;
                margin-bottom: 15px;
              }
              .title {
                font-size: 18px;
                font-weight: bold;
                text-transform: uppercase;
                margin-bottom: 5px;
              }
              .subtitle {
                font-size: 11px;
                color: #555;
              }
              .info {
                font-size: 12px;
                margin-bottom: 12px;
                line-height: 1.4;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                font-size: 12px;
                margin-bottom: 12px;
              }
              th {
                border-bottom: 1px solid #000;
                padding: 6px 0;
                font-weight: bold;
              }
              .total {
                font-size: 14px;
                font-weight: bold;
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-top: 1px solid #000;
              }
              .wifi-box {
                border: 1px dashed #4b3621;
                background-color: #fbf9f6;
                padding: 8px;
                border-radius: 4px;
                text-align: center;
                margin-top: 15px;
                font-size: 11px;
                line-height: 1.4;
              }
              .footer {
                text-align: center;
                margin-top: 15px;
                font-size: 11px;
                font-style: italic;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">DACN CAFE</div>
              <div class="subtitle">Địa chỉ: TP. Hồ Chí Minh</div>
              <div class="subtitle">Hotline: 0901 234 567</div>
            </div>
            
            <div style="border-top: 1px solid #000; margin-bottom: 8px;"></div>
            
            <div class="info">
              <strong>HÓA ĐƠN THANH TOÁN</strong><br/>
              Số HD: #${maHoaDon}<br/>
              Thời gian: ${ngayLapStr}<br/>
              Nhân viên: ${nhanVien}
            </div>
            
            <table>
              <thead>
                <tr>
                  <th style="text-align: left; width: 45%;">Món</th>
                  <th style="text-align: center; width: 10%;">SL</th>
                  <th style="text-align: right; width: 22%;">Đơn giá</th>
                  <th style="text-align: right; width: 23%;">T.Tiền</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <div class="total">
              <span>TỔNG CỘNG:</span>
              <span>${tongTien.toLocaleString("vi-VN")}đ</span>
            </div>
            
            ${cashInfoHtml}
            
            <div class="wifi-box">
              <strong>Wifi kết nối miễn phí:</strong><br/>
              Tên Wifi: <strong>DACN Cafe</strong><br/>
              Mật khẩu: <strong>dacncafe2026</strong>
            </div>
            
            <div class="footer">
              Cảm ơn quý khách! Hẹn gặp lại!
            </div>
            
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              };
            </script>
          </body>
          </html>
        `;
        
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      } else {
        Alert.alert("In hóa đơn", `In hóa đơn #${maHoaDon} thành công.\nWifi: DACN Cafe / pass: dacncafe2026`);
      }
    } catch (err) {
      console.error(err);
      if (Platform.OS === "web") {
        window.alert("Có lỗi xảy ra khi in hóa đơn");
      } else {
        Alert.alert("Lỗi", "Có lỗi xảy ra khi in hóa đơn");
      }
    }
  };

  const handleOpenEditModal = async (invoice) => {
    setEditInvoiceId(invoice.maHoaDon);
    setSearchQuery("");
    setCartItems([]);
    setEditModalVisible(true);
    
    try {
      const response = await api.get(`/hoadon/${invoice.maHoaDon}`);
      if (response.data && response.data.chiTiet) {
        const prepopulated = response.data.chiTiet.map((item) => ({
          maDoUong: item.maDoUong,
          tenDoUong: item.tenDoUong,
          donGia: Number(item.dongia),
          soluong: item.soluong,
          duong: item.duong || "100%",
          da: item.da || "100%",
        }));
        setCartItems(prepopulated);
      }
    } catch (err) {
      console.error(err);
      if (Platform.OS === "web") {
        window.alert("Không thể lấy chi tiết hóa đơn để sửa");
      } else {
        Alert.alert("Lỗi", "Không thể lấy chi tiết hóa đơn để sửa");
      }
    }
  };

  const handleUpdateInvoice = async () => {
    if (cartItems.length === 0) {
      if (Platform.OS === "web") {
        window.alert("Vui lòng chọn ít nhất một đồ uống");
      } else {
        Alert.alert("Thông báo", "Vui lòng chọn ít nhất một đồ uống");
      }
      return;
    }

    const payload = {
      items: cartItems.map((item) => ({
        maDoUong: item.maDoUong,
        soluong: item.soluong,
        duong: item.duong || "100%",
        da: item.da || "100%",
      })),
    };

    const result = await dispatch(updateInvoice({ maHoaDon: editInvoiceId, invoiceData: payload }));

    if (updateInvoice.fulfilled.match(result)) {
      setCartItems([]);
      setEditModalVisible(false);
      reloadData();
    }
  };

  const handleCancelInvoice = (maHoaDon) => {
    if (Platform.OS === "web") {
      const confirmCancel = window.confirm("Xác nhận hủy hóa đơn này?");
      if (confirmCancel) {
        dispatch(cancelInvoice(maHoaDon)).then((result) => {
          if (cancelInvoice.fulfilled.match(result)) {
            reloadData();
          }
        });
      }
      return;
    }

    Alert.alert("Xác nhận", "Xác nhận hủy hóa đơn này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đồng ý hủy",
        style: "destructive",
        onPress: async () => {
          const result = await dispatch(cancelInvoice(maHoaDon));
          if (cancelInvoice.fulfilled.match(result)) {
            reloadData();
          }
        },
      },
    ]);
  };

  const renderInvoice = ({ item }) => {
    const isPaid = item.trangthaithanhtoan === "Đã thanh toán";
    const isCancelled = item.trangthaithanhtoan === "Đã hủy";

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.invoiceTitle}>Hóa đơn #{item.maHoaDon}</Text>

          <View
            style={[styles.statusBadge, isPaid ? styles.paid : isCancelled ? styles.cancelled : styles.unpaid]}
          >
            <Text style={styles.statusText}>{item.trangthaithanhtoan}</Text>
          </View>
        </View>

        <Text style={styles.text}>Ngày lập: {formatDate(item.createdAt || item.ngaylap)}</Text>
        <Text style={styles.text}>Nhân viên: {item.HoTen || "Không rõ"}</Text>
        <Text style={styles.total}>
          Tổng tiền: {Number(item.tongtien || 0).toLocaleString("vi-VN")}đ
        </Text>

        {!isPaid && !isCancelled && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.payBtn}
              onPress={() => handleOpenPaymentModal(item)}
            >
              <FontAwesome5 name="money-bill-wave" size={12} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.payText}>Thanh toán</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => handleOpenEditModal(item)}
            >
              <FontAwesome5 name="edit" size={12} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.editText}>Sửa đơn</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => handleCancelInvoice(item.maHoaDon)}
            >
              <FontAwesome5 name="trash-alt" size={12} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.cancelText}>Hủy đơn</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (isLoading && invoices.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4b3621" />
        <Text style={styles.loadingText}>Đang tải hóa đơn...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBox}>
        <View style={styles.titleWrapper}>
          <TouchableOpacity
            onPress={() => navigation.navigate("EmployeeDashboardScreen")}
            style={styles.backBtn}
          >
            <FontAwesome5 name="arrow-left" size={18} color="#4b3621" />
          </TouchableOpacity>
          <Text style={styles.title}>Quản lý hóa đơn</Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            setSearchQuery("");
            setCartItems([]);
            setModalVisible(true);
          }}
        >
          <FontAwesome5 name="plus" size={14} color="#fff" />
          <Text style={styles.addText}>Tạo hóa đơn</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={invoices}
        keyExtractor={(item) => item.maHoaDon.toString()}
        renderItem={renderInvoice}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Chưa có hóa đơn nào</Text>
        }
      />

      <Modal visible={modalVisible} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Tạo hóa đơn mới</Text>

            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <FontAwesome5 name="times" size={22} color="#4b3621" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
            {/* Search Bar for Drinks */}
            <View style={styles.searchWrapper}>
              <FontAwesome5 name="search" size={14} color="#8d6e63" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm đồ uống theo tên..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#aaa"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearSearchBtn}>
                  <FontAwesome5 name="times-circle" size={14} color="#8d6e63" />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.sectionTitle}>Chọn đồ uống</Text>

            {drinks.filter(
              (d) =>
                d.trangThai !== "Dừng bán" &&
                d.tenDoUong.toLowerCase().includes(searchQuery.toLowerCase())
            ).length === 0 ? (
              <Text style={styles.emptyText}>Không tìm thấy đồ uống phù hợp</Text>
            ) : (
              drinks
                .filter(
                  (d) =>
                    d.trangThai !== "Dừng bán" &&
                    d.tenDoUong.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((drink) => (
                  <View key={drink.maDoUong} style={styles.drinkRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.drinkName}>{drink.tenDoUong}</Text>
                      <Text style={styles.drinkPrice}>
                        {Number(drink.donGia).toLocaleString("vi-VN")}đ
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.smallAddBtn}
                      onPress={() => handlePressAddDrink(drink)}
                    >
                      <FontAwesome5 name="plus" size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))
            )}

            <Text style={styles.sectionTitle}>Món đã chọn</Text>

            {cartItems.length === 0 ? (
              <Text style={styles.emptyText}>Chưa chọn món nào</Text>
            ) : (
              cartItems.map((item) => (
                <View key={`${item.maDoUong}-${item.duong}-${item.da}`} style={styles.cartRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.drinkName}>{item.tenDoUong}</Text>
                    <Text style={{ fontSize: 12, color: "#8d6e63", marginTop: 2 }}>
                      Ghi chú: {item.duong} đường, {item.da} đá
                    </Text>
                    <Text style={styles.drinkPrice}>
                      {item.soluong} x{" "}
                      {Number(item.donGia).toLocaleString("vi-VN")}đ
                    </Text>
                  </View>

                  <View style={styles.quantityBox}>
                    <TouchableOpacity
                      style={styles.quantityBtn}
                      onPress={() => handleDecreaseDrink(item.maDoUong, item.duong, item.da)}
                    >
                      <Text style={styles.quantityText}>-</Text>
                    </TouchableOpacity>

                    <Text style={styles.quantityNumber}>{item.soluong}</Text>

                    <TouchableOpacity
                      style={styles.quantityBtn}
                      onPress={() => handleAddDrink(item, item.duong, item.da)}
                    >
                      <Text style={styles.quantityText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}

            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Tổng cộng</Text>
              <Text style={styles.totalValue}>
                {getTotal().toLocaleString("vi-VN")}đ
              </Text>
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleCreateInvoice}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Tạo hóa đơn</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={editModalVisible} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sửa hóa đơn #{editInvoiceId}</Text>

            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <FontAwesome5 name="times" size={22} color="#4b3621" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
            {/* Search Bar for Drinks */}
            <View style={styles.searchWrapper}>
              <FontAwesome5 name="search" size={14} color="#8d6e63" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm đồ uống theo tên..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#aaa"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearSearchBtn}>
                  <FontAwesome5 name="times-circle" size={14} color="#8d6e63" />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.sectionTitle}>Chọn đồ uống</Text>

            {drinks.filter(
              (d) =>
                d.trangThai !== "Dừng bán" &&
                d.tenDoUong.toLowerCase().includes(searchQuery.toLowerCase())
            ).length === 0 ? (
              <Text style={styles.emptyText}>Không tìm thấy đồ uống phù hợp</Text>
            ) : (
              drinks
                .filter(
                  (d) =>
                    d.trangThai !== "Dừng bán" &&
                    d.tenDoUong.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((drink) => (
                  <View key={drink.maDoUong} style={styles.drinkRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.drinkName}>{drink.tenDoUong}</Text>
                      <Text style={styles.drinkPrice}>
                        {Number(drink.donGia).toLocaleString("vi-VN")}đ
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.smallAddBtn}
                      onPress={() => handlePressAddDrink(drink)}
                    >
                      <FontAwesome5 name="plus" size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))
            )}

            <Text style={styles.sectionTitle}>Món đã chọn</Text>

            {cartItems.length === 0 ? (
              <Text style={styles.emptyText}>Chưa chọn món nào</Text>
            ) : (
              cartItems.map((item) => (
                <View key={`${item.maDoUong}-${item.duong}-${item.da}`} style={styles.cartRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.drinkName}>{item.tenDoUong}</Text>
                    <Text style={{ fontSize: 12, color: "#8d6e63", marginTop: 2 }}>
                      Ghi chú: {item.duong} đường, {item.da} đá
                    </Text>
                    <Text style={styles.drinkPrice}>
                      {item.soluong} x{" "}
                      {Number(item.donGia).toLocaleString("vi-VN")}đ
                    </Text>
                  </View>

                  <View style={styles.quantityBox}>
                    <TouchableOpacity
                      style={styles.quantityBtn}
                      onPress={() => handleDecreaseDrink(item.maDoUong, item.duong, item.da)}
                    >
                      <Text style={styles.quantityText}>-</Text>
                    </TouchableOpacity>

                    <Text style={styles.quantityNumber}>{item.soluong}</Text>

                    <TouchableOpacity
                      style={styles.quantityBtn}
                      onPress={() => handleAddDrink(item, item.duong, item.da)}
                    >
                      <Text style={styles.quantityText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}

            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Tổng cộng</Text>
              <Text style={styles.totalValue}>
                {getTotal().toLocaleString("vi-VN")}đ
              </Text>
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleUpdateInvoice}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Cập nhật đơn</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={optionsModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setOptionsModalVisible(false)}
      >
        <View style={styles.optionsModalOverlay}>
          <View style={styles.optionsModalContainer}>
            <Text style={styles.optionsModalTitle}>
              Tùy chỉnh: {customizingDrink?.tenDoUong}
            </Text>
            
            <Text style={styles.optionsLabel}>Chọn lượng đường:</Text>
            <View style={styles.optionsRow}>
              {["0%", "30%", "50%", "70%", "100%"].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.optionBtn,
                    selectedDuong === level && styles.optionBtnActive,
                  ]}
                  onPress={() => setSelectedDuong(level)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedDuong === level && styles.optionTextActive,
                    ]}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.optionsLabel}>Chọn lượng đá:</Text>
            <View style={styles.optionsRow}>
              {["0%", "30%", "50%", "70%", "100%"].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.optionBtn,
                    selectedDa === level && styles.optionBtnActive,
                  ]}
                  onPress={() => setSelectedDa(level)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedDa === level && styles.optionTextActive,
                    ]}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.optionsActionRow}>
              <TouchableOpacity
                style={styles.optionsCancelBtn}
                onPress={() => setOptionsModalVisible(false)}
              >
                <Text style={styles.optionsCancelText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionsConfirmBtn}
                onPress={() => {
                  handleAddDrink(customizingDrink, selectedDuong, selectedDa);
                  setOptionsModalVisible(false);
                }}
              >
                <Text style={styles.optionsConfirmText}>Thêm món</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={paymentModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.optionsModalOverlay}>
          <View style={[styles.optionsModalContainer, { maxWidth: 500, width: "90%" }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thanh toán hóa đơn #{selectedPaymentInvoice?.maHoaDon}</Text>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <FontAwesome5 name="times" size={20} color="#4b3621" />
              </TouchableOpacity>
            </View>

            <View style={styles.invoiceInfoBox}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nhân viên lập:</Text>
                <Text style={styles.infoValue}>{selectedPaymentInvoice?.HoTen || "Không rõ"}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tổng tiền:</Text>
                <Text style={[styles.infoValue, { color: "#2e7d32", fontSize: 18, fontWeight: "bold" }]}>
                  {Number(selectedPaymentInvoice?.tongtien || 0).toLocaleString("vi-VN")}đ
                </Text>
              </View>
            </View>

            {/* Method selection tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabButton, paymentMethod === "tienmat" && styles.activeTab]}
                onPress={() => setPaymentMethod("tienmat")}
              >
                <FontAwesome5
                  name="money-bill-wave"
                  size={14}
                  color={paymentMethod === "tienmat" ? "#fff" : "#8d6e63"}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.tabText, paymentMethod === "tienmat" && styles.activeTabText]}>
                  Tiền mặt
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabButton, paymentMethod === "qr" && styles.activeTab]}
                onPress={() => setPaymentMethod("qr")}
              >
                <FontAwesome5
                  name="qrcode"
                  size={14}
                  color={paymentMethod === "qr" ? "#fff" : "#8d6e63"}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.tabText, paymentMethod === "qr" && styles.activeTabText]}>
                  Quét mã QR
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300, marginVertical: 10 }}>
              {paymentMethod === "tienmat" ? (
                <View>
                  <Text style={styles.inputLabel}>Số tiền khách đưa (đ):</Text>
                  <TextInput
                    style={styles.moneyInput}
                    placeholder="Ví dụ: 100000"
                    placeholderTextColor="#aaa"
                    keyboardType="numeric"
                    value={customerCash}
                    onChangeText={(text) => handleCashChange(text, selectedPaymentInvoice?.tongtien || 0)}
                  />

                  {/* Quick cash select options */}
                  <View style={styles.quickCashContainer}>
                    <TouchableOpacity
                      style={styles.quickCashBtn}
                      onPress={() => selectQuickAmount(selectedPaymentInvoice?.tongtien || 0, selectedPaymentInvoice?.tongtien || 0)}
                    >
                      <Text style={styles.quickCashText}>Đủ</Text>
                    </TouchableOpacity>
                    {[20000, 50000, 100000, 200000, 500000].map((amount) => {
                      return (
                        <TouchableOpacity
                          key={amount}
                          style={styles.quickCashBtn}
                          onPress={() => selectQuickAmount(amount, selectedPaymentInvoice?.tongtien || 0)}
                        >
                          <Text style={styles.quickCashText}>
                            {(amount / 1000)}k
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={styles.changeDueBox}>
                    <Text style={styles.changeDueLabel}>Tiền thừa trả khách:</Text>
                    <Text style={styles.changeDueValue}>
                      {changeDue.toLocaleString("vi-VN")}đ
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.qrGuideContainer}>
                  <Text style={styles.qrGuideTitle}>
                    <FontAwesome5 name="info-circle" size={14} color="#8d6e63" /> Hướng dẫn tích hợp thanh toán QR
                  </Text>
                  <Text style={styles.qrGuideText}>
                    Theo yêu cầu của bạn, phần thanh toán QR này được hướng dẫn để bạn tự thực hiện:
                  </Text>
                  <Text style={styles.qrStep}>
                    1. <Text style={{ fontWeight: "bold" }}>Sinh mã QR thanh toán động</Text>: Bạn có thể sử dụng dịch vụ miễn phí từ VietQR.io bằng cách nhúng trực tiếp thẻ ảnh để sinh mã QR tự động:
                  </Text>
                  <View style={styles.codeBlock}>
                    <Text style={styles.codeText}>
                      {"https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-compact2.png?amount=" + (selectedPaymentInvoice?.tongtien || 0) + "&addInfo=HD" + (selectedPaymentInvoice?.maHoaDon || "")}
                    </Text>
                  </View>
                  <Text style={styles.qrStep}>
                    2. <Text style={{ fontWeight: "bold" }}>Webhook kiểm tra trạng thái</Text>: Sử dụng giải pháp từ PayOS hoặc các bên trung gian khác để đăng ký địa chỉ Webhook của server bạn. Khi khách hàng chuyển khoản thành công, hệ thống PayOS sẽ gửi thông tin giao dịch về API của bạn, sau đó bạn tự động cập nhật trạng thái hóa đơn này thành "Đã thanh toán".
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.optionsActionRow}>
              <TouchableOpacity
                style={styles.optionsCancelBtn}
                onPress={() => setPaymentModalVisible(false)}
              >
                <Text style={styles.optionsCancelText}>Đóng</Text>
              </TouchableOpacity>

              {paymentMethod === "tienmat" && (
                <TouchableOpacity
                  style={[
                    styles.optionsConfirmBtn,
                    (parseFloat(customerCash.replace(/[^0-9]/g, "")) || 0) < (selectedPaymentInvoice?.tongtien || 0) && { backgroundColor: "#aaa" }
                  ]}
                  disabled={(parseFloat(customerCash.replace(/[^0-9]/g, "")) || 0) < (selectedPaymentInvoice?.tongtien || 0)}
                  onPress={executePayment}
                >
                  <Text style={styles.optionsConfirmText}>Thanh toán & In bill</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  
  const hh = date.getHours().toString().padStart(2, "0");
  const mm = date.getMinutes().toString().padStart(2, "0");
  const ss = date.getSeconds().toString().padStart(2, "0");
  
  if (hh === "00" && mm === "00" && ss === "00") {
    return `${d}/${m}/${y}`;
  }
  
  return `${hh}:${mm}:${ss} - ${d}/${m}/${y}`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f1e9",
    padding: 16,
    height: Platform.OS === "web" ? "100vh" : "100%",
    maxHeight: Platform.OS === "web" ? "100vh" : "100%",
    overflow: "hidden",
  },
  list: {
    flex: 1,
  },

  headerBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  titleWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5ece3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4b3621",
  },

  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4b3621",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
  },

  addText: {
    color: "#fff",
    fontWeight: "bold",
  },

  listContent: {
    paddingBottom: 80,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eadfd3",
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  invoiceTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#4b3621",
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },

  paid: {
    backgroundColor: "#2e7d32",
  },

  unpaid: {
    backgroundColor: "#f57c00",
  },

  cancelled: {
    backgroundColor: "#9e9e9e",
  },

  statusText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },

  text: {
    color: "#6d4c41",
    marginBottom: 4,
  },

  total: {
    color: "#4b3621",
    fontWeight: "bold",
    marginTop: 6,
  },

  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },

  payBtn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#2e7d32",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  payText: {
    color: "#fff",
    fontWeight: "bold",
  },

  editBtn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#1976d2",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  editText: {
    color: "#fff",
    fontWeight: "bold",
  },

  cancelBtn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#d32f2f",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  cancelText: {
    color: "#fff",
    fontWeight: "bold",
  },

  modalContainer: {
    flex: 1,
    backgroundColor: "#f8f1e9",
    padding: 16,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4b3621",
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#4b3621",
    marginTop: 16,
    marginBottom: 10,
  },

  drinkRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#eadfd3",
  },

  drinkName: {
    fontWeight: "bold",
    color: "#4b3621",
  },

  drinkPrice: {
    color: "#8d6e63",
    marginTop: 4,
  },

  smallAddBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#4b3621",
    justifyContent: "center",
    alignItems: "center",
  },

  cartRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#eadfd3",
  },

  quantityBox: {
    flexDirection: "row",
    alignItems: "center",
  },

  quantityBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#4b3621",
    alignItems: "center",
    justifyContent: "center",
  },

  quantityText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  quantityNumber: {
    marginHorizontal: 12,
    fontWeight: "bold",
    color: "#4b3621",
  },

  totalBox: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  totalLabel: {
    fontWeight: "bold",
    color: "#4b3621",
  },

  totalValue: {
    fontWeight: "bold",
    color: "#2e7d32",
    fontSize: 18,
  },

  submitBtn: {
    backgroundColor: "#4b3621",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 30,
  },

  submitText: {
    color: "#fff",
    fontWeight: "bold",
  },

  emptyText: {
    textAlign: "center",
    color: "#8d6e63",
    marginTop: 20,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f1e9",
  },

  loadingText: {
    color: "#4b3621",
    marginTop: 12,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eadfd3",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    marginTop: 8,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: "#4b3621",
    fontSize: 14,
    paddingVertical: 10,
  },
  clearSearchBtn: {
    padding: 4,
  },
  optionsModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  optionsModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "100%",
    maxWidth: 360,
    padding: 20,
    borderWidth: 1,
    borderColor: "#eadfd3",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  optionsModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4b3621",
    marginBottom: 16,
    textAlign: "center",
  },
  optionsLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#8d6e63",
    marginTop: 12,
    marginBottom: 8,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 6,
  },
  optionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eadfd3",
    backgroundColor: "#f8f1e9",
    alignItems: "center",
  },
  optionBtnActive: {
    backgroundColor: "#4b3621",
    borderColor: "#4b3621",
  },
  optionText: {
    fontSize: 12,
    color: "#8d6e63",
    fontWeight: "bold",
  },
  optionTextActive: {
    color: "#fff",
  },
  optionsActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 12,
  },
  optionsCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d32f2f",
    alignItems: "center",
  },
  optionsCancelText: {
    color: "#d32f2f",
    fontWeight: "bold",
  },
  optionsConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#2e7d32",
    alignItems: "center",
  },
  optionsConfirmText: {
    color: "#fff",
    fontWeight: "bold",
  },
  invoiceInfoBox: {
    backgroundColor: "#fcfbf9",
    borderWidth: 1,
    borderColor: "#eadfd3",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  infoLabel: {
    color: "#8d6e63",
    fontSize: 13,
  },
  infoValue: {
    color: "#4b3621",
    fontWeight: "bold",
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eadfd3",
    backgroundColor: "#f8f1e9",
  },
  activeTab: {
    backgroundColor: "#4b3621",
    borderColor: "#4b3621",
  },
  tabText: {
    color: "#8d6e63",
    fontWeight: "bold",
    fontSize: 13,
  },
  activeTabText: {
    color: "#fff",
  },
  inputLabel: {
    color: "#4b3621",
    fontWeight: "bold",
    fontSize: 13,
    marginBottom: 6,
  },
  moneyInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eadfd3",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#4b3621",
    marginBottom: 10,
  },
  quickCashContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  quickCashBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#f5ece3",
    borderWidth: 1,
    borderColor: "#eadfd3",
  },
  quickCashText: {
    color: "#4b3621",
    fontSize: 12,
    fontWeight: "bold",
  },
  changeDueBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
    borderWidth: 1,
    borderColor: "#c8e6c9",
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
  },
  changeDueLabel: {
    color: "#2e7d32",
    fontWeight: "bold",
    fontSize: 13,
  },
  changeDueValue: {
    color: "#1b5e20",
    fontWeight: "bold",
    fontSize: 16,
  },
  qrGuideContainer: {
    backgroundColor: "#efebe9",
    borderWidth: 1,
    borderColor: "#d7ccc8",
    borderRadius: 12,
    padding: 12,
  },
  qrGuideTitle: {
    color: "#4b3621",
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 8,
  },
  qrGuideText: {
    color: "#5d4037",
    fontSize: 12,
    lineHeight: 1.4,
    marginBottom: 8,
  },
  qrStep: {
    color: "#6d4c41",
    fontSize: 12,
    lineHeight: 1.4,
    marginBottom: 6,
  },
  codeBlock: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eadfd3",
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
  },
  codeText: {
    fontFamily: Platform.OS === "web" ? "monospace" : "Courier New",
    fontSize: 10,
    color: "#d32f2f",
  },
});
