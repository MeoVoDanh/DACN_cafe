import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';

// Import Screen
import LoginScreen from '../screen/LoginScreen';
import DashboardScreen from '../screen/DashboardScreen';
import EmployeeListScreen from '../screen/EmployeeListScreen';
import EmployeeScreen from '../screen/EmployeeScreen';
import ShiftScreen from '../screen/ShiftScreen';
import MenuScreen from '../screen/MenuScreen';
import RevenueScreen from '../screen/RevenueScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
    // Lấy trạng thái đăng nhập từ Redux
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

    return (
        <NavigationContainer> 
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!isAuthenticated ? (
                    // Nếu chưa đăng nhập -> Hiển thị màn hình Login
                    <Stack.Screen name="LoginScreen" component={LoginScreen} />
                ) : (
                    // Nếu đã đăng nhập -> Hiển thị các màn hình chức năng chính
                    <>
                        <Stack.Screen name="DashboardScreen" component={DashboardScreen} />
                        <Stack.Screen 
                            name="EmployeeListScreen" 
                            component={EmployeeListScreen} 
                            options={{ headerShown: true, title: 'Danh sách nhân viên' }} 
                        />
                        <Stack.Screen 
                            name="EmployeeScreen" 
                            component={EmployeeScreen} 
                        />
                        <Stack.Screen name="ShiftScreen" component={ShiftScreen} />
                        <Stack.Screen name="MenuScreen" component={MenuScreen} />
                        <Stack.Screen name="RevenueScreen" component={RevenueScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;