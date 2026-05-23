import React, { useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  FlatList,
  Platform,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { fetchInvoices } from "../../redux/invoiceSlice";
import { FontAwesome5 } from "@expo/vector-icons";

export default function MyOrderCountScreen({ navigation }) {
  const dispatch = useDispatch();

  const { invoices, isLoading } = useSelector((state) => state.invoice);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchInvoices());
  }, [dispatch]);

  const myInvoices = useMemo(() => {
    return invoices.filter(
      (item) => Number(item.MaNhanVien) === Number(user?.MaNhanVien),
    );
  }, [invoices, user]);

  const stats = useMemo(() => {
    const totalOrders = myInvoices.length;

    const paidOrders = myInvoices.filter(
      (item) => item.trangthaithanhtoan === "Đã thanh toán",
    ).length;

    const unpaidOrders = myInvoices.filter(
      (item) => item.trangthaithanhtoan === "Chưa thanh toán",
    ).length;

    const totalRevenue = myInvoices
      .filter((item) => item.trangthaithanhtoan === "Đã thanh toán")
      .reduce((sum, item) => sum + Number(item.tongtien || 0), 0);

    return {
      totalOrders,
      paidOrders,
      unpaidOrders,
      totalRevenue,
    };
  }, [myInvoices]);

  if (isLoading && invoices.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4b3621" />
        <Text style={styles.loadingText}>Đang tải thống kê đơn...</Text>
      </View>
    );
  }

  const renderHeader = () => (
    <>
      <View style={styles.headerBox}>
        <TouchableOpacity
          onPress={() => navigation.navigate("EmployeeDashboardScreen")}
          style={styles.backBtn}
        >
          <FontAwesome5 name="arrow-left" size={18} color="#4b3621" />
        </TouchableOpacity>
        <Text style={styles.title}>Đơn đã thực hiện</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          icon="receipt"
          label="Tổng đơn"
          value={stats.totalOrders}
          color="#4b3621"
        />

        <StatCard
          icon="check-circle"
          label="Đã thanh toán"
          value={stats.paidOrders}
          color="#2e7d32"
        />

        <StatCard
          icon="clock"
          label="Chưa thanh toán"
          value={stats.unpaidOrders}
          color="#f57c00"
        />

        <StatCard
          icon="money-bill-wave"
          label="Doanh thu"
          value={`${stats.totalRevenue.toLocaleString("vi-VN")}đ`}
          color="#6d4c41"
        />
      </View>

      <Text style={styles.sectionTitle}>Danh sách đơn của tôi</Text>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={myInvoices}
        keyExtractor={(item) => item.maHoaDon.toString()}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Bạn chưa thực hiện đơn nào</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.invoiceCard}>
            <View style={styles.invoiceHeader}>
              <Text style={styles.invoiceTitle}>Hóa đơn #{item.maHoaDon}</Text>
              <Text style={styles.status}>{item.trangthaithanhtoan}</Text>
            </View>

            <Text style={styles.text}>
              Ngày lập: {formatDate(item.ngaylap)}
            </Text>

            <Text style={styles.total}>
              Tổng tiền: {Number(item.tongtien || 0).toLocaleString("vi-VN")}đ
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const StatCard = ({ icon, label, value, color }) => {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color }]}>
        <FontAwesome5 name={icon} size={16} color="#fff" />
      </View>

      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
};

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("vi-VN");
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

  headerBox: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
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

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },

  statCard: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#eadfd3",
  },

  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4b3621",
  },

  statLabel: {
    fontSize: 12,
    color: "#8d6e63",
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4b3621",
    marginTop: 24,
    marginBottom: 12,
  },

  listContent: {
    paddingBottom: 80,
  },

  invoiceCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eadfd3",
  },

  invoiceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  invoiceTitle: {
    fontWeight: "bold",
    color: "#4b3621",
    fontSize: 16,
  },

  status: {
    color: "#8d6e63",
    fontWeight: "bold",
    fontSize: 12,
  },

  text: {
    color: "#6d4c41",
    marginBottom: 4,
  },

  total: {
    color: "#2e7d32",
    fontWeight: "bold",
    marginTop: 6,
  },

  emptyText: {
    textAlign: "center",
    color: "#8d6e63",
    marginTop: 40,
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
