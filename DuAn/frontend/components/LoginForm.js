// LoginForm.js
import React from "react";
import { View, TextInput, Button, Text, StyleSheet } from "react-native";

export default function LoginForm({ username, setUsername, password, setPassword, onLogin }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đăng nhập</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <View style={styles.button}>
        <Button title="Đăng nhập" onPress={onLogin} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",   
    alignItems: "center",       
    backgroundColor: "#f0f0f0",
    padding: 20
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333"
  },
  input: {
    width: "80%",
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: "#fff"
  },
  button: {
    width: "80%",
    marginTop: 10
  }
});
