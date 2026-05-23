import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const Employee = ({ data, onDetail }) => (
    <TouchableOpacity style={styles.item} onPress={() => onDetail(data)}>
        {/* Sửa thành MaNhanVien */}
        <Text style={styles.txtId}>Mã NV: {data.MaNhanVien}</Text>
        <Text style={styles.txtName}>{data.HoTen}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    item: { padding: 15, borderBottomWidth: 0.5, borderColor: '#ccc', backgroundColor: '#fff' },
    txtId: { fontSize: 12, color: '#666' },
    txtName: { fontSize: 17, fontWeight: 'bold' }
});

export default Employee;