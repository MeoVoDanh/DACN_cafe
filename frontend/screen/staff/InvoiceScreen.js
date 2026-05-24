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

  const handleAddDrink = (drink) => {
    const existed = cartItems.find((item) => item.maDoUong === drink.maDoUong);

    if (existed) {
      setCartItems((prev) =>
        prev.map((item) =>
          item.maDoUong === drink.maDoUong
            ? { ...item, soluong: item.soluong + 1 }
            : item,
        ),
      );
    } else {
      setCartItems((prev) => [
        ...prev,
        {
          maDoUong: drink.maDoUong,
          tenDoUong: drink.tenDoUong,
          donGia: Number(drink.donGia),
          soluong: 1,
        },
      ]);
    }
  };

  const handleDecreaseDrink = (maDoUong) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.maDoUong === maDoUong
            ? { ...item, soluong: item.soluong - 1 }
            : item,
        )
        .filter((item) => item.soluong > 0),
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
      })),
    };

    const result = await dispatch(createInvoice(payload));

    if (createInvoice.fulfilled.match(result)) {
      setCartItems([]);
      setModalVisible(false);
      reloadData();
    }
  };

  const handlePayInvoice = (maHoaDon) => {
    if (Platform.OS === "web") {
      const confirmPay = window.confirm("Xác nhận thanh toán hóa đơn này?");
      if (confirmPay) {
        dispatch(payInvoice(maHoaDon)).then((result) => {
          if (payInvoice.fulfilled.match(result)) {
            reloadData();
          }
        });
      }
      return;
    }

    Alert.alert("Xác nhận", "Xác nhận thanh toán hóa đơn này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Thanh toán",
        onPress: async () => {
          const result = await dispatch(payInvoice(maHoaDon));

          if (payInvoice.fulfilled.match(result)) {
            reloadData();
          }
        },
      },
    ]);
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
              onPress={() => handlePayInvoice(item.maHoaDon)}
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
                      onPress={() => handleAddDrink(drink)}
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
                <View key={item.maDoUong} style={styles.cartRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.drinkName}>{item.tenDoUong}</Text>
                    <Text style={styles.drinkPrice}>
                      {item.soluong} x{" "}
                      {Number(item.donGia).toLocaleString("vi-VN")}đ
                    </Text>
                  </View>

                  <View style={styles.quantityBox}>
                    <TouchableOpacity
                      style={styles.quantityBtn}
                      onPress={() => handleDecreaseDrink(item.maDoUong)}
                    >
                      <Text style={styles.quantityText}>-</Text>
                    </TouchableOpacity>

                    <Text style={styles.quantityNumber}>{item.soluong}</Text>

                    <TouchableOpacity
                      style={styles.quantityBtn}
                      onPress={() => handleAddDrink(item)}
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
                      onPress={() => handleAddDrink(drink)}
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
                <View key={item.maDoUong} style={styles.cartRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.drinkName}>{item.tenDoUong}</Text>
                    <Text style={styles.drinkPrice}>
                      {item.soluong} x{" "}
                      {Number(item.donGia).toLocaleString("vi-VN")}đ
                    </Text>
                  </View>

                  <View style={styles.quantityBox}>
                    <TouchableOpacity
                      style={styles.quantityBtn}
                      onPress={() => handleDecreaseDrink(item.maDoUong)}
                    >
                      <Text style={styles.quantityText}>-</Text>
                    </TouchableOpacity>

                    <Text style={styles.quantityNumber}>{item.soluong}</Text>

                    <TouchableOpacity
                      style={styles.quantityBtn}
                      onPress={() => handleAddDrink(item)}
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
});
