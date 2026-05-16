import React from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';

const EmployeeList = ({ listData, handlePress }) => {
    
    const renderItem = ({ item }) => (
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#ffffff', // ĐỔI THÀNH MÀU XANH DƯƠNG
            padding: 15,
            borderRadius: 15,
            marginBottom: 12,
            elevation: 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 3,
        }}>
            {/* Avatar Trắng */}
            <View style={{ 
                width: 50, 
                height: 50, 
                borderRadius: 25, 
                backgroundColor: '#751c8e', 
                marginRight: 15 
            }} />

            {/* Thông tin nhân viên (Chữ trắng) */}
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000000' }}>
                    {item.HoTen}
                </Text>
                <Text style={{ fontSize: 14, color: '#000000', marginTop: 2 }}>
                    Mã NV: {item.MaNhanVien}
                </Text>
            </View>

            {/* Cụm nút bấm bên phải */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
                {/* Nút Sửa (Màu trắng chữ xanh) */}
                <TouchableOpacity 
                    style={{ 
                        backgroundColor: '#007bff', 
                        paddingHorizontal: 12, 
                        paddingVertical: 6, 
                        borderRadius: 8 
                    }}
                    onPress={() => handlePress(item)}
                >
                    <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>Sửa</Text>
                </TouchableOpacity>

                {/* Nút Xóa (Màu đỏ tươi) */}
                <TouchableOpacity 
                    style={{ 
                        backgroundColor: '#ff4d4d', 
                        paddingHorizontal: 12, 
                        paddingVertical: 6, 
                        borderRadius: 8 
                    }}
                >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Xóa</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <FlatList
            data={listData}
            keyExtractor={(item, index) => item.MaNhanVien ? item.MaNhanVien.toString() : index.toString()}
            renderItem={renderItem}
            scrollEnabled={false} // Vì đã có ScrollView ở ngoài
        />
    );
};

export default EmployeeList;