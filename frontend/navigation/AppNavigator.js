import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useSelector } from "react-redux";

import LoginScreen from "../screen/LoginScreen";

import DashboardScreen from "../screen/manager/DashboardScreen";
import EmployeeListScreen from "../screen/manager/EmployeeListScreen";
import EmployeeScreen from "../screen/manager/EmployeeScreen";
import ShiftScreen from "../screen/manager/ShiftScreen";
import MenuScreen from "../screen/manager/MenuScreen";
import RevenueScreen from "../screen/manager/RevenueScreen";

import EmployeeDashboardScreen from "../screen/staff/EmployeeDashboardScreen";
import InvoiceScreen from "../screen/staff/InvoiceScreen";
import MyOrderCountScreen from "../screen/staff/MyOrderCountScreen";
import EmployeeShiftScreen from "../screen/staff/EmployeeShiftScreen";
import ProfileScreen from "../screen/staff/ProfileScreen";

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
        ) : user?.vaiTro === "Admin" ? (
          <>
            <Stack.Screen name="DashboardScreen" component={DashboardScreen} />

            <Stack.Screen
              name="EmployeeListScreen"
              component={EmployeeListScreen}
              options={{ headerShown: true, title: "Danh sách nhân viên" }}
            />

            <Stack.Screen name="EmployeeScreen" component={EmployeeScreen} />
            <Stack.Screen name="ShiftScreen" component={ShiftScreen} />
            <Stack.Screen name="MenuScreen" component={MenuScreen} />
            <Stack.Screen name="RevenueScreen" component={RevenueScreen} />
          </>
        ) : (
          <>
            <Stack.Screen
              name="EmployeeDashboardScreen"
              component={EmployeeDashboardScreen}
            />

            <Stack.Screen
              name="InvoiceScreen"
              component={InvoiceScreen}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="MyOrderCountScreen"
              component={MyOrderCountScreen}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="EmployeeShiftScreen"
              component={EmployeeShiftScreen}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="ProfileScreen"
              component={ProfileScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
