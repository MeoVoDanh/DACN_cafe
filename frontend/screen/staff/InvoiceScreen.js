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
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  createInvoice,
  fetchDrinksForInvoice,
  fetchInvoices,
  payInvoice,
} from "../../redux/invoiceSlice";
import { FontAwesome5 } from "@expo/vector-icons";

export default function InvoiceScreen({ navigation }) {
  const dispatch = useDispatch();

  const { invoices, drinks, isLoading, error, message } = useSelector(
    (state) => state.invoice,
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    dispatch(fetchInvoices());
    dispatch(fetchDrinksForInvoice());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      Alert.alert("Lỗi", error);
    }
  }, [error]);

  useEffect(() => {
    if (message) {
      Alert.alert("Thông báo", message);
    }
  }, [message]);

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

  const renderInvoice = ({ item }) => {
    const isPaid = item.trangthaithanhtoan === "Đã thanh toán";

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.invoiceTitle}>Hóa đơn #{item.maHoaDon}</Text>

          <View
            style={[styles.statusBadge, isPaid ? styles.paid : styles.unpaid]}
          >
            <Text style={styles.statusText}>{item.trangthaithanhtoan}</Text>
          </View>
        </View>

        <Text style={styles.text}>Ngày lập: {formatDate(item.ngaylap)}</Text>
        <Text style={styles.text}>Nhân viên: {item.HoTen || "Không rõ"}</Text>
        <Text style={styles.total}>
          Tổng tiền: {Number(item.tongtien || 0).toLocaleString("vi-VN")}đ
        </Text>

        {!isPaid && (
          <TouchableOpacity
            style={styles.payBtn}
            onPress={() => handlePayInvoice(item.maHoaDon)}
          >
            <FontAwesome5 name="money-bill-wave" size={14} color="#fff" />
            <Text style={styles.payText}>Xác nhận thanh toán</Text>
          </TouchableOpacity>
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
          onPress={() => setModalVisible(true)}
        >
          <FontAwesome5 name="plus" size={14} color="#fff" />
          <Text style={styles.addText}>Tạo hóa đơn</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={invoices}
        keyExtractor={(item) => item.maHoaDon.toString()}
        renderItem={renderInvoice}
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

          <ScrollView style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Chọn đồ uống</Text>

            {drinks.filter(d => d.trangThai !== "Dừng bán").map((drink) => (
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
            ))}

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
    </SafeAreaView>
  );
}

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("vi-VN");
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f1e9",
    padding: 16,
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

  payBtn: {
    marginTop: 12,
    flexDirection: "row",
    backgroundColor: "#2e7d32",
    padding: 12,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  payText: {
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
});
