import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { Stack } from "expo-router";
import { AuthProvider } from "@/contexts/authContext";

const StackLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="(models)/profileModel"
        options={{
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="(models)/walletModal"
        options={{
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="(models)/TransactionModal"
        options={{
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="(models)/searchModal"
        options={{
          presentation: "modal",
        }}
      />
    </Stack>
  );
};
export default function RootLayout() {
  return (
    <AuthProvider>
      <StackLayout />
    </AuthProvider>
  );
}
const styles = StyleSheet.create({});
