import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// SỬA TẠI ĐÂY: Bỏ dấu { } nếu file Dashboard dùng "export default"
import DashboardScreen from '../screen/DashboardScreen'; 
import EmployeeListScreen from '../screen/EmployeeListScreen';
import EmployeeScreen from '../screen/EmployeeScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
    return (
        /* LƯU Ý: Chỉ dùng independent={true} nếu AppNavigator nằm trong một NavigationContainer khác.
           Nếu đây là Navigator chính, bạn nên bỏ nó đi để tránh lỗi điều hướng.
        */
        <NavigationContainer> 
            <Stack.Navigator initialRouteName="DashboardScreen">
                <Stack.Screen 
                    name="DashboardScreen" 
                    component={DashboardScreen} 
                    options={{ headerShown: false }} 
                />
                <Stack.Screen 
                    name="EmployeeListScreen" 
                    component={EmployeeListScreen} 
                    options={{ title: 'Danh sách nhân viên' }} 
                />
                <Stack.Screen 
                    name="EmployeeScreen" 
                    component={EmployeeScreen} 
                    options={{ title: 'Chi tiết nhân viên' }} 
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;