import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator, CardStyleInterpolators } from "@react-navigation/stack";
import { useSelector, useDispatch } from "react-redux";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { restoreSession } from "../redux/authSlice";

import LoginScreen from "../screen/LoginScreen";

import DashboardScreen from "../screen/manager/DashboardScreen";
import EmployeeListScreen from "../screen/manager/EmployeeListScreen";
import EmployeeScreen from "../screen/manager/EmployeeScreen";
import ShiftScreen from "../screen/manager/ShiftScreen";
import ShiftApprovalScreen from "../screen/manager/ShiftApprovalScreen";
import MenuScreen from "../screen/manager/MenuScreen";
import RevenueScreen from "../screen/manager/RevenueScreen";

import EmployeeDashboardScreen from "../screen/staff/EmployeeDashboardScreen";
import InvoiceScreen from "../screen/staff/InvoiceScreen";
import MyOrderCountScreen from "../screen/staff/MyOrderCountScreen";
import EmployeeShiftScreen from "../screen/staff/EmployeeShiftScreen";
import ProfileScreen from "../screen/staff/ProfileScreen";

const Stack = createStackNavigator();

const AppNavigator = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user, isRestoringSession } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);

  if (isRestoringSession) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4b3621" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          gestureEnabled: true,
          gestureDirection: "horizontal",
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
        ) : user?.vaiTro === "Admin" ? (
          <>
            <Stack.Screen name="DashboardScreen" component={DashboardScreen} />

            <Stack.Screen
              name="EmployeeListScreen"
              component={EmployeeListScreen}
            />

            <Stack.Screen name="EmployeeScreen" component={EmployeeScreen} />
            <Stack.Screen name="ShiftScreen" component={ShiftScreen} />
            <Stack.Screen name="ShiftApprovalScreen" component={ShiftApprovalScreen} />
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f1e9",
  },
});

export default AppNavigator;
