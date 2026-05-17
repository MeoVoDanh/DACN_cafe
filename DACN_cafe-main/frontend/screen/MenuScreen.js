import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";

export default function MenuScreen({ navigation }) {
  const [menuItems, setMenuItems] = useState([
    { id: "1", name: "Cà phê đá truyền thống", price: 29000, icon: "coffee" },
    { id: "2", name: "Cà phê sữa Sài Gòn", price: 32000, icon: "coffee" },
    {
      id: "3",
      name: "Bạc xỉu ba tầng",
      price: 35000,
      icon: "glass-martini-alt",
    },
    { id: "4", name: "Trà đào cam sả", price: 39000, icon: "leaf" },
    {
      id: "5",
      name: "Matcha đá xay kem béo",
      price: 45000,
      icon: "cloud-meatball",
    },
  ]);

  // Các state để quản lý form thêm món mới
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");

  // Các state để quản lý việc CHỈNH SỬA GIÁ trực tiếp
  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState("");

  // Hàm thêm món mới vào thực đơn
  const handleAddItem = () => {
    if (!newName || !newPrice)
      return alert("Vui lòng nhập đầy đủ tên món và giá tiền ní ơi!");

    const priceNum = parseInt(newPrice, 10);
    if (isNaN(priceNum) || priceNum <= 0)
      return alert("Giá tiền nhập vào không hợp lệ!");

    const newItem = {
      id: Date.now().toString(),
      name: newName,
      price: priceNum,
      icon: "coffee",
    };

    setMenuItems([...menuItems, newItem]);
    setNewName("");
    setNewPrice("");
  };

  // Hàm xóa món khỏi thực đơn
  const handleDeleteItem = (id, name) => {
    const confirmDelete = window.confirm
      ? window.confirm(`Bạn có chắc muốn xóa món "${name}" khỏi thực đơn?`)
      : true;
    if (confirmDelete) {
      setMenuItems(menuItems.filter((item) => item.id !== id));
      if (editingId === id) setEditingId(null);
    }
  };

  // Hàm lưu giá mới vừa sửa
  const handleSavePrice = (id) => {
    const priceNum = parseInt(editPrice, 10);
    if (isNaN(priceNum) || priceNum <= 0)
      return alert("Giá tiền mới không hợp lệ!");

    const updatedMenu = menuItems.map((item) => {
      if (item.id === id) {
        return { ...item, price: priceNum };
      }
      return item;
    });

    setMenuItems(updatedMenu);
    setEditingId(null);
  };

  const startEditing = (id, currentPrice) => {
    setEditingId(id);
    setEditPrice(String(currentPrice));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Thanh Header chính */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate("DashboardScreen")} style={styles.backBtn}>
          <FontAwesome5 name="arrow-left" size={18} color="#4b3621" />
        </TouchableOpacity>
        <Text style={styles.title}>DANH MỤC THỰC ĐƠN MÓN</Text>
      </View>

      {/* FORM THÊM MÓN MỚI */}
      <View style={styles.inputBox}>
        <Text style={styles.boxTitle}>THÊM MÓN MỚI VÀO MENU</Text>
        <View style={styles.rowInputs}>
          <TextInput
            style={[styles.input, { flex: 2, marginRight: 10 }]}
            placeholder="Tên đồ uống mới..."
            value={newName}
            onChangeText={setNewName}
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Giá tiền (VNĐ)"
            keyboardType="numeric"
            value={newPrice}
            onChangeText={setNewPrice}
          />
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={handleAddItem}
          activeOpacity={0.8}
        >
          <FontAwesome5
            name="plus"
            size={12}
            color="#fff"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.addBtnText}>Thêm vào thực đơn</Text>
        </TouchableOpacity>
      </View>

      {/* DANH SÁCH MENU CHIA DỌC 2 BÊN */}
      <FlatList
        data={menuItems}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRowWrapper}
        renderItem={({ item }) => (
          <View style={styles.menuCard}>
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <FontAwesome5 name={item.icon} size={16} color="#4b3621" />
              </View>
              <Text style={styles.itemName} numberOfLines={2}>
                {item.name}
              </Text>
            </View>

            <View style={styles.cardBody}>
              {editingId === item.id ? (
                <View style={styles.editPriceRow}>
                  <TextInput
                    style={styles.priceInput}
                    keyboardType="numeric"
                    value={editPrice}
                    onChangeText={setEditPrice}
                    autoFocus
                  />
                  <TouchableOpacity
                    style={styles.savePriceBtn}
                    onPress={() => handleSavePrice(item.id)}
                  >
                    <FontAwesome5 name="check" size={10} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.itemPrice}>
                  {item.price.toLocaleString("vi-VN")}đ
                </Text>
              )}
            </View>

            <View style={styles.cardActions}>
              {editingId === item.id ? (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => setEditingId(null)}
                >
                  <Text style={[styles.actionText, { color: "#777" }]}>
                    Hủy
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => startEditing(item.id, item.price)}
                >
                  <FontAwesome5
                    name="edit"
                    size={11}
                    color="#8d6e63"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.actionText}>Sửa giá</Text>
                </TouchableOpacity>
              )}

              <View style={styles.dividerV} />

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleDeleteItem(item.id, item.name)}
              >
                <FontAwesome5
                  name="trash-alt"
                  size={11}
                  color="#d32f2f"
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.actionText, { color: "#d32f2f" }]}>
                  Xóa món
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff8f0", padding: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    marginTop: 10,
  },
  backBtn: { padding: 5 },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4b3621",
    marginLeft: 15,
    letterSpacing: 0.5,
  },
  inputBox: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f1e6da",
  },
  boxTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#8d6e63",
    marginBottom: 12,
    letterSpacing: 1,
  },
  rowInputs: { flexDirection: "row", marginBottom: 12 },
  input: {
    borderBottomWidth: 1,
    borderColor: "#e0e0e0",
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontSize: 14,
    color: "#4b3621",
  },
  addBtn: {
    flexDirection: "row",
    backgroundColor: "#4b3621",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  gridRowWrapper: { justifyContent: "space-between", paddingHorizontal: 2 },
  menuCard: {
    backgroundColor: "#fff",
    width: "49%",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f1e6da",
    elevation: 2,
    justifyContent: "space-between",
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f5ece3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4b3621",
    flex: 1,
    lineHeight: 18,
  },
  cardBody: { marginVertical: 4, paddingLeft: 2 },
  itemPrice: { fontSize: 15, fontWeight: "bold", color: "#8b4513" },
  editPriceRow: { flexDirection: "row", alignItems: "center" },
  priceInput: {
    borderBottomWidth: 1,
    borderColor: "#8b4513",
    fontSize: 14,
    color: "#4b3621",
    paddingVertical: 2,
    flex: 1,
    marginRight: 5,
    fontWeight: "bold",
  },
  savePriceBtn: {
    backgroundColor: "#4b3621",
    width: 22,
    height: 22,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#f9f4ee",
    paddingTop: 10,
    marginTop: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
  },
  actionText: { fontSize: 11, fontWeight: "bold", color: "#8d6e63" },
  dividerV: { width: 1, height: 12, backgroundColor: "#f5ece3" },
});
