import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";

export default function RevenueScreen({ onBack }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <FontAwesome5 name="arrow-left" size={18} color="#4b3621" />
        </TouchableOpacity>
        <Text style={styles.title}>BÁO CÁO DOANH THU</Text>
      </View>

      <View style={styles.mainCard}>
        <Text style={styles.cardLabel}>Tổng doanh thu hôm nay</Text>
        <Text style={styles.revenueAmount}>3.450.000 đ</Text>
        <Text style={styles.dateText}>Cập nhật mới nhất: Hôm nay</Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.miniCard}>
          <FontAwesome5 name="file-invoice-dollar" size={20} color="#4b3621" />
          <Text style={styles.miniVal}>54</Text>
          <Text style={styles.miniLbl}>Đơn hàng đã bán</Text>
        </View>

        <View style={styles.miniCard}>
          <FontAwesome5 name="star" size={20} color="#4b3621" />
          <Text style={styles.miniVal}>Cà phê sữa</Text>
          <Text style={styles.miniLbl}>Món bán chạy nhất</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff8f0", padding: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  backBtn: { padding: 10 },
  title: { fontSize: 20, fontWeight: "bold", color: "#4b3621", marginLeft: 15 },
  mainCard: {
    backgroundColor: "#4b3621",
    padding: 25,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 20,
    elevation: 3,
  },
  cardLabel: { color: "#fdf8f0", fontSize: 14, opacity: 0.8 },
  revenueAmount: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginVertical: 10,
  },
  dateText: { color: "#c9a66b", fontSize: 12, fontStyle: "italic" },
  grid: { flexDirection: "row", justifyContent: "space-between" },
  miniCard: {
    backgroundColor: "#fff",
    width: "48%",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
  },
  miniVal: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4b3621",
    marginTop: 10,
    marginBottom: 4,
  },
  miniLbl: { fontSize: 12, color: "#777", textAlign: "center" },
});
