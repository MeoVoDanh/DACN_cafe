import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllEmployees } from '../redux/DS_employee';
import { setEmployeeDetail } from '../redux/employee';
import EmployeeList from '../components/EmployeeList';

const EmployeeListScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const list = useSelector(state => state.dsEmployee.items);

    useEffect(() => {
        dispatch(fetchAllEmployees());
    }, [dispatch]);

    const goToDetail = (item) => {
        dispatch(setEmployeeDetail(item));
        navigation.navigate('EmployeeScreen');
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
            
            <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 40 }}>
                
                {/* --- CỤM 2: NÚT TẠO TÀI KHOẢN --- */}
                <View style={{ alignItems: 'flex-end', marginBottom: 20 }}>
                    <TouchableOpacity style={{ 
                        backgroundColor: '#ffffff', 
                        paddingVertical: 8, 
                        paddingHorizontal: 15,
                        borderRadius: 20,
                        elevation: 3,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        borderWidth: 1,
                        borderColor: '#007bff'
                    }}>
                        <Text style={{ fontWeight: 'bold', color: '#007bff' }}>+ Tạo tài khoản</Text>
                    </TouchableOpacity>
                </View>

                <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>Danh sách nhân viên</Text>

                {/* --- CỤM 3: DANH SÁCH NHÂN VIÊN --- */}
                {list && list.length > 0 ? (
                    <EmployeeList listData={list} handlePress={goToDetail} />
                ) : (
                    <Text style={{textAlign: 'center', marginTop: 20, color: '#888'}}>Đang tải dữ liệu...</Text>
                )}
            </ScrollView>
        </View>
    );
};

export default EmployeeListScreen;