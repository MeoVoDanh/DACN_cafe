import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
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
  StatusBar,
  RefreshControl,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  createDrink,
  deleteDrink,
  fetchDrinks,
  updateDrink,
  clearMenuMessage,
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../redux/menuSlice";
import * as ImagePicker from "expo-image-picker";
import { FontAwesome5 } from "@expo/vector-icons";
import api from "../../redux/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function MenuScreen({ navigation }) {
  const BASE_URL = api.defaults.baseURL.replace("/api", "");
  const [previewImage, setPreviewImage] = useState(null);
  const dispatch = useDispatch();

  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const [hasNewUpdates, setHasNewUpdates] = useState(false);
  const [lastLoadedTime, setLastLoadedTime] = useState(0);

  const lastLoadedTimeRef = useRef(lastLoadedTime);
  useEffect(() => {
    lastLoadedTimeRef.current = lastLoadedTime;
  }, [lastLoadedTime]);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [renamingCategory, setRenamingCategory] = useState(null);

  const { drinks, categories: dbCategoriesRaw, isLoading, error, message } = useSelector(
    (state) => state.menu,
  );

  const resolvedDrinks = useMemo(() => {
    if (!Array.isArray(drinks)) return [];
    return drinks.map((d) => {
      if (d.danhMuc && !isNaN(Number(d.danhMuc)) && Array.isArray(dbCategoriesRaw)) {
        const found = dbCategoriesRaw.find((c) => Number(c.maDanhMuc) === Number(d.danhMuc));
        if (found) {
          return { ...d, danhMuc: found.tenDanhMuc };
        }
      }
      return d;
    });
  }, [drinks, dbCategoriesRaw]);

  const CATEGORIES = useMemo(() => {
    const dbCategories = Array.isArray(dbCategoriesRaw) ? dbCategoriesRaw.map((c) => c.tenDanhMuc) : [];
    const fromDrinks = Array.isArray(resolvedDrinks) ? resolvedDrinks.map((d) => d.danhMuc).filter(Boolean) : [];
    const combined = Array.from(new Set([...dbCategories, ...fromDrinks]));
    return ["Tất cả", ...combined];
  }, [dbCategoriesRaw, resolvedDrinks]);

  const quickCategories = useMemo(() => {
    const dbCategories = Array.isArray(dbCategoriesRaw) ? dbCategoriesRaw.map((c) => c.tenDanhMuc) : [];
    const fromDrinks = Array.isArray(resolvedDrinks) ? resolvedDrinks.map((d) => d.danhMuc).filter(Boolean) : [];
    return Array.from(new Set([...dbCategories, ...fromDrinks]));
  }, [dbCategoriesRaw, resolvedDrinks]);

  const searchedDrinks = useMemo(() => {
    if (!searchQuery.trim()) return resolvedDrinks;
    return resolvedDrinks.filter((d) =>
      d.tenDoUong.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [resolvedDrinks, searchQuery]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingDrink, setEditingDrink] = useState(null);

  const [tenDoUong, setTenDoUong] = useState("");
  const [donGia, setDonGia] = useState("");
  const [moTa, setMoTa] = useState("");
  const [hinhAnh, setHinhAnh] = useState("");
  const [trangThai, setTrangThai] = useState("Đang bán");
  const [danhMuc, setDanhMuc] = useState("Khác");

  const loadDataAndResetBadge = async () => {
    dispatch(fetchDrinks());
    dispatch(fetchCategories());
    try {
      const res = await api.get("/check-updates");
      setLastLoadedTime(res.data.menuTime);
      setHasNewUpdates(false);
    } catch (err) {
      console.log("Error checking updates:", err);
    }
  };

  const handleManualReload = () => {
    if (hasNewUpdates && modalVisible) {
      if (Platform.OS === "web") {
        const confirmReload = window.confirm("Có dữ liệu mới từ database. Tải lại sẽ làm mất các thay đổi chưa lưu trong form. Bạn có muốn tải lại không?");
        if (!confirmReload) return;
      } else {
        Alert.alert(
          "Cập nhật mới",
          "Có dữ liệu mới từ database. Tải lại sẽ làm mất các thay đổi chưa lưu trong form. Bạn có muốn tải lại không?",
          [
            { text: "Hủy", style: "cancel" },
            { text: "Tải lại", onPress: () => loadDataAndResetBadge() }
          ]
        );
        return;
      }
    }
    loadDataAndResetBadge();
  };

  // Fetch drinks and categories when screen is focused and poll check-updates every 5 seconds
  useFocusEffect(
    useCallback(() => {
      loadDataAndResetBadge();

      const interval = setInterval(async () => {
        try {
          const res = await api.get("/check-updates");
          if (res.data.menuTime > lastLoadedTimeRef.current) {
            setHasNewUpdates(true);
          }
        } catch (err) {
          console.log("Error checking updates:", err);
        }
      }, 5000);

      return () => clearInterval(interval);
    }, [dispatch])
  );

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
    setDanhMuc("Khác");
    setPreviewImage(null);
    dispatch(clearMenuMessage());
  };

  const submitNewCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert("Thông báo", "Tên danh mục không được để trống!");
      return;
    }
    const trimmed = newCategoryName.trim();
    
    if (renamingCategory) {
      await performRenameCategory(renamingCategory, trimmed);
      setRenamingCategory(null);
      setNewCategoryName("");
      setCategoryModalVisible(false);
      return;
    }

    const exists = CATEGORIES.some(c => c.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      Alert.alert("Thông báo", "Danh mục này đã tồn tại!");
      return;
    }

    await dispatch(createCategory({ tenDanhMuc: trimmed }));
    dispatch(fetchCategories());
    
    setNewCategoryName("");
    setCategoryModalVisible(false);
    
    if (Platform.OS === "web") {
      window.alert(`Đã thêm danh mục "${trimmed}" thành công!`);
    } else {
      Alert.alert("Thành công", `Đã thêm danh mục "${trimmed}" thành công!`);
    }
  };

  const handleEditCategoryName = async (oldName) => {
    let newName = "";
    if (Platform.OS === "web") {
      const res = window.prompt(`Sửa tên danh mục "${oldName}" thành:`, oldName);
      if (res && res.trim() && res.trim() !== oldName) {
        newName = res.trim();
      } else {
        return;
      }
    } else {
      setRenamingCategory(oldName);
      setNewCategoryName(oldName);
      setCategoryModalVisible(true);
      return;
    }

    if (newName) {
      await performRenameCategory(oldName, newName);
    }
  };

  const performRenameCategory = async (oldName, newName) => {
    const exists = CATEGORIES.some(c => c.toLowerCase() === newName.toLowerCase() && c !== oldName);
    if (exists) {
      if (Platform.OS === "web") {
        window.alert("Tên danh mục này đã tồn tại!");
      } else {
        Alert.alert("Lỗi", "Tên danh mục này đã tồn tại!");
      }
      return;
    }

    const catObj = dbCategoriesRaw.find(c => c.tenDanhMuc === oldName);
    if (catObj) {
      await dispatch(updateCategory({ maDanhMuc: catObj.maDanhMuc, data: { tenDanhMuc: newName } }));
      dispatch(fetchDrinks());
      dispatch(fetchCategories());
    }

    if (Platform.OS === "web") {
      window.alert(`Đã đổi tên danh mục thành "${newName}" thành công!`);
    } else {
      Alert.alert("Thành công", `Đã đổi tên danh mục thành "${newName}" thành công!`);
    }
  };

  const handleDeleteCategory = async (catName) => {
    const isWeb = Platform.OS === "web";
    const confirmDelete = () => {
      return new Promise((resolve) => {
        if (isWeb) {
          const res = window.confirm(`Bạn có chắc chắn muốn xóa danh mục "${catName}" không?\n(Lưu ý: Các món thuộc danh mục này sẽ được tự động chuyển về danh mục "Khác")`);
          resolve(res);
        } else {
          Alert.alert(
            "Xác nhận xóa",
            `Bạn có chắc chắn muốn xóa danh mục "${catName}" không?\n(Các món thuộc danh mục này sẽ chuyển về "Khác")`,
            [
              { text: "Hủy", style: "cancel", onPress: () => resolve(false) },
              { text: "Xóa", style: "destructive", onPress: () => resolve(true) },
            ]
          );
        }
      });
    };

    const accepted = await confirmDelete();
    if (!accepted) return;

    const catObj = dbCategoriesRaw.find(c => c.tenDanhMuc === catName);
    if (catObj) {
      await dispatch(deleteCategory(catObj.maDanhMuc));
      dispatch(fetchDrinks());
      dispatch(fetchCategories());
    }

    if (selectedCategory === catName) {
      setSelectedCategory("Tất cả");
    }

    if (isWeb) {
      window.alert(`Đã xóa danh mục "${catName}" thành công!`);
    } else {
      Alert.alert("Thành công", `Đã xóa danh mục "${catName}" thành công!`);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (drink) => {
    setEditingDrink(drink);
    setTenDoUong(drink.tenDoUong || "");
    setDonGia(drink.donGia ? Number(drink.donGia).toLocaleString("vi-VN") + "đ" : "");
    setMoTa(drink.moTa || "");
    setHinhAnh(drink.hinhAnh || "");
    setTrangThai(drink.trangThai || "Đang bán");
    setDanhMuc(drink.danhMuc || "Khác");

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
    const trimmedTen = (tenDoUong || "").trim();
    const trimmedGia = String(donGia || "").trim();
    if (!trimmedTen || !trimmedGia) {
      Alert.alert("Thông báo", "Tên đồ uống và đơn giá không được để trống");
      return;
    }

    const cleanGia = trimmedGia.replace(/[^0-9]/g, "");
    const parsedPrice = Number(cleanGia);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      Alert.alert("Thông báo", "Đơn giá phải là số dương hợp lệ");
      return;
    }

    const payload = {
      tenDoUong: trimmedTen,
      donGia: parsedPrice,
      moTa: (moTa || "").trim(),
      hinhAnh: (hinhAnh || "").trim(),
      trangThai: trangThai,
      danhMuc: (danhMuc || "").trim() || "Khác",
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
          danhMuc: drink.danhMuc || "Khác",
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
              danhMuc: drink.danhMuc || "Khác",
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

  const renderDrinkGridItem = (drink) => {
    const imageUrl = drink.hinhAnh ? `${BASE_URL}/img/${drink.hinhAnh}` : null;
    const isStopped = drink.trangThai === "Dừng bán";
    return (
      <View
        key={drink.maDoUong}
        style={[
          styles.drinkGridCard,
          isStopped && styles.drinkGridCardStopped
        ]}
      >
        <View style={styles.drinkGridImageWrapper}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.drinkGridImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.drinkGridNoImage}>
              <FontAwesome5 name="coffee" size={24} color="#8d6e63" />
            </View>
          )}
          <View style={[styles.priceBadge, isStopped && styles.priceBadgeStopped]}>
            <Text style={styles.priceBadgeText}>
              {Math.round(drink.donGia / 1000)}k
            </Text>
          </View>
        </View>

        <View style={styles.drinkGridInfo}>
          <Text style={styles.drinkGridName} numberOfLines={2}>
            {drink.tenDoUong}
          </Text>
          <Text style={[styles.drinkStatusText, isStopped ? styles.statusStop : styles.statusActive]}>
            {drink.trangThai || "Đang bán"}
          </Text>
        </View>

        <View style={styles.gridCardActions}>
          <TouchableOpacity
            style={[styles.gridActionBtn, styles.editBtn]}
            onPress={() => openEditModal(drink)}
          >
            <FontAwesome5 name="edit" size={12} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.gridActionBtn,
              isStopped ? styles.resumeBtn : styles.stopBtn,
            ]}
            onPress={() => handleToggleStatus(drink)}
          >
            <FontAwesome5
              name={isStopped ? "play" : "ban"}
              size={10}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCategorySection = (catName) => {
    // Lọc ra các món uống thuộc danh mục này từ danh sách `searchedDrinks` gốc
    const catDrinks = searchedDrinks.filter((d) => d.danhMuc === catName);
    
    // Nếu danh mục trống và không phải là danh mục do người dùng tạo thủ công, ẩn nó đi
    const isSystemDefault = ["Tất cả", "Khác", "Cà phê", "Trà", "Trà sữa", "Sinh tố & Nước ép", "Matcha"].includes(catName);
    const isCustom = !isSystemDefault;
    if (catDrinks.length === 0 && !isCustom) return null;

    return (
      <View key={catName} style={styles.categorySection}>
        <View style={styles.categorySectionHeader}>
          <FontAwesome5 name="folder-open" size={13} color="#8d6e63" style={{ marginRight: 8 }} />
          <Text style={styles.categoryHeaderTitle}>{catName.toUpperCase()}</Text>

          {/* Cặp nút Sửa & Xóa danh mục */}
          {!isSystemDefault && (
            <View style={{ flexDirection: "row", gap: 10, marginLeft: 10 }}>
              <TouchableOpacity
                onPress={() => handleEditCategoryName(catName)}
                style={styles.categoryHeaderBtn}
              >
                <FontAwesome5 name="pen" size={11} color="#1976D2" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteCategory(catName)}
                style={styles.categoryHeaderBtn}
              >
                <FontAwesome5 name="trash" size={11} color="#D32F2F" />
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.categoryHeaderLine} />
        </View>
        
        {catDrinks.length === 0 ? (
          <Text style={styles.emptyCatText}>Danh mục này chưa có đồ uống nào. Nhấn "+ Thêm món" để thêm.</Text>
        ) : (
          <View style={styles.gridContainer}>
            {catDrinks.map((drink) => renderDrinkGridItem(drink))}
          </View>
        )}
      </View>
    );
  };

  const renderDrinksList = () => {
    if (searchedDrinks.length === 0) {
      return <Text style={styles.emptyText}>Không tìm thấy đồ uống phù hợp</Text>;
    }

    if (searchQuery.trim().length > 0) {
      return (
        <View style={styles.gridContainer}>
          {searchedDrinks.map((drink) => renderDrinkGridItem(drink))}
        </View>
      );
    }

    if (selectedCategory === "Tất cả") {
      const categoriesToRender = CATEGORIES.filter((c) => c !== "Tất cả");
      return (
        <View>
          {categoriesToRender.map((cat) => renderCategorySection(cat))}
        </View>
      );
    } else {
      return renderCategorySection(selectedCategory);
    }
  };

  if (isLoading && resolvedDrinks.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4b3621" />
        <Text style={styles.loadingText}>Đang tải menu...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <View style={styles.headerBox}>
        <View style={styles.headerTop}>
          <View style={styles.titleWrapper}>
            <TouchableOpacity
              onPress={() => navigation.navigate("DashboardScreen")}
              style={styles.backBtn}
            >
              <FontAwesome5 name="arrow-left" size={18} color="#4b3621" />
            </TouchableOpacity>
            <Text style={styles.title}>Quản lý menu</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.addCategoryBtn} onPress={() => setCategoryModalVisible(true)}>
            <FontAwesome5 name="folder-plus" size={13} color="#4b3621" />
            <Text style={styles.addCategoryText}>Thêm danh mục</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.addBtn} onPress={openCreateModal}>
            <FontAwesome5 name="plus" size={13} color="#fff" />
            <Text style={styles.addText}>Thêm món</Text>
          </TouchableOpacity>
        </View>
      </View>

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

      {/* Category Tab Bar */}
      <View style={{ height: 48, marginBottom: 12 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 16 }}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryTab,
                  isSelected && styles.categoryTabActive,
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    isSelected && styles.categoryTabTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadDataAndResetBadge}
            tintColor="#4b3621"
            colors={["#4b3621"]}
          />
        }
      >
        {renderDrinksList()}
      </ScrollView>

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
              onChangeText={(text) => {
                const clean = text.replace(/[^0-9]/g, "");
                const num = parseFloat(clean) || 0;
                setDonGia(clean ? num.toLocaleString("vi-VN") + "đ" : "");
              }}
              keyboardType="numeric"
            />
            <Input label="Mô tả" value={moTa} onChangeText={setMoTa} />
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Danh mục đồ uống</Text>
              <TextInput
                style={styles.input}
                value={danhMuc}
                onChangeText={setDanhMuc}
                placeholder="Ví dụ: Cà phê, Trà sữa, Matcha..."
                placeholderTextColor="#bbb"
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: 8 }}
                contentContainerStyle={{ gap: 8, paddingRight: 16 }}
              >
                {quickCategories.map((cat) => {
                  const isSelected = danhMuc === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.quickCatCapsule,
                        isSelected && styles.quickCatCapsuleActive,
                      ]}
                      onPress={() => setDanhMuc(cat)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.quickCatCapsuleText,
                          isSelected && styles.quickCatCapsuleTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {editingDrink && (
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
            )}

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

      {/* Modal Thêm/Sửa Danh Mục Mới */}
      <Modal
        visible={categoryModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setCategoryModalVisible(false);
          setNewCategoryName("");
          setRenamingCategory(null);
        }}
      >
        <View style={styles.categoryModalOverlay}>
          <View style={styles.categoryModalContent}>
            <Text style={styles.categoryModalTitle}>
              {renamingCategory ? "Sửa tên danh mục" : "Thêm danh mục mới"}
            </Text>
            
            <TextInput
              style={styles.categoryModalInput}
              placeholder="Nhập tên danh mục..."
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholderTextColor="#bbb"
              autoFocus={true}
            />

            <View style={styles.categoryModalButtons}>
              <TouchableOpacity
                style={[styles.categoryModalBtn, styles.categoryCancelBtn]}
                onPress={() => {
                  setCategoryModalVisible(false);
                  setNewCategoryName("");
                  setRenamingCategory(null);
                }}
              >
                <Text style={styles.categoryCancelText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.categoryModalBtn, styles.categorySubmitBtn]}
                onPress={submitNewCategory}
              >
                <Text style={styles.categorySubmitText}>
                  {renamingCategory ? "Cập nhật" : "Thêm"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 12 : 16,
    height: Platform.OS === "web" ? "100vh" : undefined,
    maxHeight: Platform.OS === "web" ? "100vh" : undefined,
    overflow: "hidden",
  },
  list: {
    flex: 1,
  },
  headerBox: {
    flexDirection: Platform.OS === "web" ? "row" : "column",
    justifyContent: Platform.OS === "web" ? "space-between" : "flex-start",
    alignItems: Platform.OS === "web" ? "center" : "stretch",
    marginBottom: 16,
    gap: 12,
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
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: Platform.OS === "web" ? "auto" : "100%",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    width: Platform.OS === "web" ? "auto" : "100%",
    justifyContent: Platform.OS === "web" ? "flex-end" : "space-between",
  },
  addBtn: {
    flexDirection: "row",
    backgroundColor: "#4b3621",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    flex: Platform.OS === "web" ? 0 : 1,
  },
  addText: {
    color: "#fff",
    fontWeight: "bold",
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#eadfd3",
    height: 38,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryTabActive: {
    backgroundColor: "#4b3621",
    borderColor: "#4b3621",
  },
  categoryTabText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#8d6e63",
  },
  categoryTabTextActive: {
    color: "#fff",
  },
  quickCatCapsule: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eadfd3",
    justifyContent: "center",
    alignItems: "center",
  },
  quickCatCapsuleActive: {
    backgroundColor: "#4b3621",
    borderColor: "#4b3621",
  },
  quickCatCapsuleText: {
    fontSize: 12,
    color: "#8d6e63",
    fontWeight: "bold",
  },
  quickCatCapsuleTextActive: {
    color: "#fff",
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
    width: 38,
    height: 38,
    borderRadius: 10,
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
  categorySection: {
    marginBottom: 22,
  },
  categorySectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  categoryHeaderTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#8d6e63",
    letterSpacing: 1,
  },
  categoryHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#eadfd3",
    marginLeft: 10,
  },
  categorySectionBody: {
    flexDirection: "column",
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
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  drinkGridCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: Platform.OS === "web" ? "23.5%" : "30.5%",
    minWidth: 100,
    maxWidth: 160,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eadfd3",
    position: "relative",
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    padding: 10,
    alignItems: "center",
  },
  drinkGridCardStopped: {
    opacity: 0.8,
    backgroundColor: "#fcfaf7",
    borderColor: "#e0d0c0",
  },
  drinkGridImageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    backgroundColor: "#f5ece3",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    position: "relative",
  },
  drinkGridImage: {
    width: "100%",
    height: "100%",
  },
  drinkGridNoImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f5ece3",
    justifyContent: "center",
    alignItems: "center",
  },
  priceBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#2e7d32",
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  priceBadgeStopped: {
    backgroundColor: "#c62828",
  },
  priceBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  drinkGridInfo: {
    width: "100%",
    alignItems: "center",
    marginBottom: 8,
  },
  drinkGridName: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#4b3621",
    textAlign: "center",
    lineHeight: 16,
    height: 32,
  },
  drinkStatusText: {
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 4,
  },
  statusActive: {
    color: "#2e7d32",
  },
  statusStop: {
    color: "#c62828",
  },
  gridCardActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#f5ece3",
    paddingTop: 8,
  },
  gridActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  addCategoryBtn: {
    flexDirection: "row",
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#4b3621",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    flex: Platform.OS === "web" ? 0 : 1,
  },
  addCategoryText: {
    color: "#4b3621",
    fontWeight: "bold",
    fontSize: 13,
  },
  categoryModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  categoryModalContent: {
    backgroundColor: "#f8f1e9",
    borderRadius: 18,
    width: "90%",
    maxWidth: 340,
    padding: 20,
    borderWidth: 1,
    borderColor: "#eadfd3",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  categoryModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4b3621",
    marginBottom: 16,
    textAlign: "center",
  },
  categoryModalInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eadfd3",
    borderRadius: 12,
    padding: 12,
    color: "#4b3621",
    fontSize: 14,
    marginBottom: 16,
  },
  categoryModalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  categoryModalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryCancelBtn: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eadfd3",
  },
  categoryCancelText: {
    color: "#8d6e63",
    fontWeight: "bold",
  },
  categorySubmitBtn: {
    backgroundColor: "#4b3621",
  },
  categorySubmitText: {
    color: "#fff",
    fontWeight: "bold",
  },
  categoryHeaderBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eadfd3",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyCatText: {
    color: "#8d6e63",
    fontStyle: "italic",
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 16,
    textAlign: "center",
  },
  reloadBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5ece3",
    justifyContent: "center",
    alignItems: "center",
  },
  reloadBtnHighlight: {
    width: "auto",
    paddingHorizontal: 12,
    flexDirection: "row",
    backgroundColor: "#e65100",
    gap: 6,
  },
  reloadBtnText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
});
