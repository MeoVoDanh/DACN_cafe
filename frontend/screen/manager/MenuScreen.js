import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  SafeAreaView,
  ScrollView,
  Image,
  Platform,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  createDrink,
  deleteDrink,
  fetchDrinks,
  updateDrink,
} from "../../redux/menuSlice";
import * as ImagePicker from "expo-image-picker";
import { FontAwesome5 } from "@expo/vector-icons";
import api from "../../redux/api";

export default function MenuScreen({ navigation }) {
  const BASE_URL = api.defaults.baseURL.replace("/api", "");
  const [previewImage, setPreviewImage] = useState(null);
  const dispatch = useDispatch();

  const { drinks, isLoading, error, message } = useSelector(
    (state) => state.menu,
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [editingDrink, setEditingDrink] = useState(null);

  const [tenDoUong, setTenDoUong] = useState("");
  const [donGia, setDonGia] = useState("");
  const [moTa, setMoTa] = useState("");
  const [hinhAnh, setHinhAnh] = useState("");
  const [trangThai, setTrangThai] = useState("Đang bán");

  useEffect(() => {
    dispatch(fetchDrinks());
  }, [dispatch]);

  useEffect(() => {
    if (error) Alert.alert("Lỗi", error);
  }, [error]);

  useEffect(() => {
    if (message) Alert.alert("Thông báo", message);
  }, [message]);

  const resetForm = () => {
    setEditingDrink(null);
    setTenDoUong("");
    setDonGia("");
    setMoTa("");
    setHinhAnh("");
    setTrangThai("Đang bán");
    setPreviewImage(null);
  };
  const openCreateModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (drink) => {
    setEditingDrink(drink);
    setTenDoUong(drink.tenDoUong || "");
    setDonGia(String(drink.donGia || ""));
    setMoTa(drink.moTa || "");
    setHinhAnh(drink.hinhAnh || "");
    setTrangThai(drink.trangThai || "Đang bán");

    if (drink.hinhAnh) {
      setPreviewImage(`${BASE_URL}/img/${drink.hinhAnh}`);
    } else {
      setPreviewImage(null);
    }

    setModalVisible(true);
  };
  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("Thông báo", "Bạn cần cấp quyền truy cập thư viện ảnh");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled) return;

    const asset = result.assets[0];

    setPreviewImage(asset.uri);

    const formData = new FormData();

    const fileName =
      asset.fileName || asset.uri.split("/").pop() || "drink.jpg";

    formData.append("image", {
      uri: asset.uri,
      name: fileName,
      type: asset.mimeType || "image/jpeg",
    });

    try {
      const response = await api.post("/upload/image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setHinhAnh(response.data.fileName);

      Alert.alert("Thành công", "Chọn ảnh thành công");
    } catch (error) {
      Alert.alert(
        "Lỗi",
        error.response?.data?.message || error.message || "Upload ảnh thất bại",
      );
    }
  };

  const handleSubmit = async () => {
    if (!tenDoUong.trim() || !donGia.trim()) {
      Alert.alert("Thông báo", "Tên đồ uống và đơn giá không được để trống");
      return;
    }

    const payload = {
      tenDoUong: tenDoUong.trim(),
      donGia: Number(donGia),
      moTa: moTa.trim(),
      hinhAnh: hinhAnh.trim(),
      trangThai: trangThai,
    };

    let result;

    if (editingDrink) {
      result = await dispatch(
        updateDrink({
          maDoUong: editingDrink.maDoUong,
          data: payload,
        }),
      );
    } else {
      result = await dispatch(createDrink(payload));
    }

    if (
      createDrink.fulfilled.match(result) ||
      updateDrink.fulfilled.match(result)
    ) {
      setModalVisible(false);
      resetForm();
      dispatch(fetchDrinks());
    }
  };

  const handleToggleStatus = (drink) => {
    const isCurrentlySelling = drink.trangThai !== "Dừng bán";
    const newStatus = isCurrentlySelling ? "Dừng bán" : "Đang bán";
    const actionText = isCurrentlySelling ? "dừng bán" : "tiếp tục bán";

    if (Platform.OS === "web") {
      const confirmToggle = window.confirm(`Bạn có chắc chắn muốn ${actionText} đồ uống "${drink.tenDoUong}" không?`);
      if (confirmToggle) {
        const payload = {
          tenDoUong: drink.tenDoUong,
          donGia: drink.donGia,
          moTa: drink.moTa,
          hinhAnh: drink.hinhAnh,
          trangThai: newStatus,
        };
        dispatch(
          updateDrink({
            maDoUong: drink.maDoUong,
            data: payload,
          })
        ).then((result) => {
          if (updateDrink.fulfilled.match(result)) {
            dispatch(fetchDrinks());
          }
        });
      }
      return;
    }

    Alert.alert(
      "Xác nhận thay đổi",
      `Bạn có chắc chắn muốn ${actionText} đồ uống "${drink.tenDoUong}" không?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xác nhận",
          onPress: async () => {
            const payload = {
              tenDoUong: drink.tenDoUong,
              donGia: drink.donGia,
              moTa: drink.moTa,
              hinhAnh: drink.hinhAnh,
              trangThai: newStatus,
            };
            const result = await dispatch(
              updateDrink({
                maDoUong: drink.maDoUong,
                data: payload,
              }),
            );
            if (updateDrink.fulfilled.match(result)) {
              dispatch(fetchDrinks());
            }
          },
        },
      ],
    );
  };

  const renderDrink = ({ item }) => {
    const imageUrl = item.hinhAnh ? `${BASE_URL}/img/${item.hinhAnh}` : null;

    return (
      <View style={styles.card}>
        <View style={styles.imageBox}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.drinkImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.noImageBox}>
              <FontAwesome5 name="coffee" size={22} color="#fff" />
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>{item.tenDoUong}</Text>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
            <Text style={styles.price}>
              {Number(item.donGia || 0).toLocaleString("vi-VN")}đ
            </Text>
            <View
              style={[
                styles.statusBadge,
                item.trangThai === "Dừng bán" ? styles.statusBadgeStop : styles.statusBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  item.trangThai === "Dừng bán" ? styles.statusBadgeTextStop : styles.statusBadgeTextActive,
                ]}
              >
                {item.trangThai || "Đang bán"}
              </Text>
            </View>
          </View>

          <Text style={styles.desc} numberOfLines={2}>
            {item.moTa || "Không có mô tả"}
          </Text>

          <Text style={styles.imageName}>
            Ảnh: {item.hinhAnh || "Chưa có ảnh"}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.editBtn]}
            onPress={() => openEditModal(item)}
          >
            <FontAwesome5 name="edit" size={14} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              item.trangThai === "Dừng bán" ? styles.resumeBtn : styles.stopBtn,
            ]}
            onPress={() => handleToggleStatus(item)}
          >
            <FontAwesome5
              name={item.trangThai === "Dừng bán" ? "play" : "ban"}
              size={12}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading && drinks.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4b3621" />
        <Text style={styles.loadingText}>Đang tải menu...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBox}>
        <View style={styles.titleWrapper}>
          <TouchableOpacity
            onPress={() => navigation.navigate("DashboardScreen")}
            style={styles.backBtn}
          >
            <FontAwesome5 name="arrow-left" size={18} color="#4b3621" />
          </TouchableOpacity>
          <Text style={styles.title}>Quản lý menu</Text>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={openCreateModal}>
          <FontAwesome5 name="plus" size={14} color="#fff" />
          <Text style={styles.addText}>Thêm món</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={drinks}
        keyExtractor={(item, index) => String(item.maDoUong ?? index)}
        renderItem={renderDrink}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Chưa có đồ uống nào</Text>
        }
      />

      <Modal visible={modalVisible} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView>
            <Text style={styles.modalTitle}>
              {editingDrink ? "Cập nhật đồ uống" : "Thêm đồ uống"}
            </Text>

            <Input
              label="Tên đồ uống"
              value={tenDoUong}
              onChangeText={setTenDoUong}
            />
            <Input
              label="Đơn giá"
              value={donGia}
              onChangeText={setDonGia}
              keyboardType="numeric"
            />
            <Input label="Mô tả" value={moTa} onChangeText={setMoTa} />

            <View style={styles.formGroup}>
              <Text style={styles.label}>Trạng thái kinh doanh</Text>
              <View style={styles.dropdownContainer}>
                {["Đang bán", "Dừng bán"].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.dropdownOption,
                      trangThai === status && styles.dropdownOptionSelected,
                    ]}
                    onPress={() => setTrangThai(status)}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        trangThai === status && styles.dropdownOptionTextSelected,
                      ]}
                    >
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Hình ảnh</Text>

              {previewImage ? (
                <Image
                  source={{ uri: previewImage }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.previewEmpty}>
                  <FontAwesome5 name="image" size={28} color="#8d6e63" />
                  <Text style={styles.previewEmptyText}>Chưa chọn ảnh</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.chooseImageBtn}
                onPress={pickImage}
              >
                <FontAwesome5
                  name="folder-open"
                  size={14}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.chooseImageText}>Chọn ảnh từ máy</Text>
              </TouchableOpacity>

              <Text style={styles.fileNameText}>
                File lưu DB: {hinhAnh || "Chưa có"}
              </Text>
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitText}>
                {editingDrink ? "Lưu thay đổi" : "Thêm đồ uống"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setModalVisible(false);
                resetForm();
              }}
            >
              <Text style={styles.cancelText}>Đóng</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const Input = ({ label, ...props }) => (
  <View style={styles.formGroup}>
    <Text style={styles.label}>{label}</Text>
    <TextInput style={styles.input} placeholder={label} {...props} />
  </View>
);

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
    backgroundColor: "#4b3621",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
  },
  addText: {
    color: "#fff",
    fontWeight: "bold",
  },
  listContent: {
    paddingBottom: 120,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eadfd3",
    elevation: 2,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#4b3621",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4b3621",
  },
  price: {
    color: "#2e7d32",
    fontWeight: "bold",
    marginTop: 4,
  },
  desc: {
    color: "#8d6e63",
    marginTop: 4,
    fontSize: 13,
  },
  actions: {
    justifyContent: "center",
    gap: 8,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  editBtn: {
    backgroundColor: "#1976D2",
  },
  deleteBtn: {
    backgroundColor: "#D32F2F",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#f8f1e9",
    padding: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4b3621",
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    fontWeight: "bold",
    color: "#4b3621",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eadfd3",
    borderRadius: 12,
    padding: 12,
  },
  submitBtn: {
    backgroundColor: "#4b3621",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  submitText: {
    color: "#fff",
    fontWeight: "bold",
  },
  cancelBtn: {
    padding: 14,
    alignItems: "center",
  },
  cancelText: {
    color: "#4b3621",
    fontWeight: "bold",
  },
  emptyText: {
    textAlign: "center",
    color: "#8d6e63",
    marginTop: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f1e9",
  },
  loadingText: {
    marginTop: 12,
    color: "#4b3621",
  },
  imageBox: {
    width: 78,
    height: 78,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#f5ece3",
    marginRight: 12,
  },
  drinkImage: {
    width: "100%",
    height: "100%",
  },
  noImageBox: {
    flex: 1,
    backgroundColor: "#4b3621",
    justifyContent: "center",
    alignItems: "center",
  },
  imageName: {
    color: "#aaa",
    marginTop: 4,
    fontSize: 11,
  },
  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: 14,
    marginBottom: 12,
    backgroundColor: "#f5ece3",
  },

  previewEmpty: {
    width: "100%",
    height: 180,
    borderRadius: 14,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eadfd3",
    justifyContent: "center",
    alignItems: "center",
  },

  previewEmptyText: {
    color: "#8d6e63",
    marginTop: 8,
  },

  chooseImageBtn: {
    flexDirection: "row",
    backgroundColor: "#4b3621",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  chooseImageText: {
    color: "#fff",
    fontWeight: "bold",
  },

  fileNameText: {
    marginTop: 8,
    fontSize: 12,
    color: "#8d6e63",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeActive: {
    backgroundColor: "#e8f5e9",
    borderColor: "#c8e6c9",
  },
  statusBadgeStop: {
    backgroundColor: "#ffebee",
    borderColor: "#ffcdd2",
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  statusBadgeTextActive: {
    color: "#2e7d32",
  },
  statusBadgeTextStop: {
    color: "#c62828",
  },
  stopBtn: {
    backgroundColor: "#D32F2F",
  },
  resumeBtn: {
    backgroundColor: "#2E7D32",
  },
  dropdownContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
  },
  dropdownOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eadfd3",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownOptionSelected: {
    borderColor: "#4b3621",
    backgroundColor: "#4b3621",
  },
  dropdownOptionText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#8d6e63",
  },
  dropdownOptionTextSelected: {
    color: "#fff",
  },
});
