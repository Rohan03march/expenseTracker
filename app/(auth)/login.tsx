import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import React, { useRef, useState } from "react";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import BackButton from "@/components/BackButton";
import Input from "@/components/Input";
import * as Icons from "phosphor-react-native";
import Button from "@/components/Button";
import { router, useRouter } from "expo-router";
import { useAuth } from "@/contexts/authContext";

const Login = () => {
  const emailRef = useRef("");
  const passwordRef = useRef("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login: loginUser } = useAuth();

  const handleSubmit = async () => {
    if (!emailRef.current || !passwordRef.current) {
      Alert.alert("Please fill the fields");
      return;
    }
    setIsLoading(true);
    const res = await loginUser(emailRef.current, passwordRef.current);
    setIsLoading(false);
    if (!res.success) {
      Alert.alert("Failed to login", res.msg);
      return;
    }
  };
  return (
    <ScreenWrapper>
      <ScrollView>
        <View style={styles.container}>
          <BackButton iconSize={28} />

          <View style={{ gap: 5, marginTop: spacingY._20 }}>
            <Typo size={30} fontWeight={"800"}>
              Hay,
            </Typo>
            <Typo size={30} fontWeight={"800"}>
              Welcome Back!
            </Typo>
          </View>
          {/*login form */}
          <View style={styles.form}>
            <Typo size={16} color={colors.textLighter}>
              Login now to track all your expenses
            </Typo>
            <Input
              placeholder="Enter your email"
              onChangeText={(value) => (emailRef.current = value)}
              icon={
                <Icons.At size={verticalScale(26)} color={colors.neutral300} />
              }
            />
            <Input
              placeholder="Enter your password"
              secureTextEntry
              onChangeText={(value) => (passwordRef.current = value)}
              icon={
                <Icons.Lock
                  size={verticalScale(26)}
                  color={colors.neutral300}
                />
              }
            />
            <Typo
              size={14}
              color={colors.text}
              style={{ alignSelf: "flex-end" }}
            >
              Forget Password ?
            </Typo>
            <Button loading={isLoading} onPress={handleSubmit}>
              <Typo fontWeight={"700"} color={colors.black} size={21}>
                Login
              </Typo>
            </Button>
          </View>
          {/** Footer */}
          <View style={styles.footer}>
            <Typo size={15}>Don't have an Account ? </Typo>
            <Pressable onPress={() => router.navigate("/register")}>
              <Typo size={15} fontWeight={"700"} color={colors.primary}>
                Sign Up
              </Typo>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacingY._30,
    paddingHorizontal: spacingX._20,
  },
  welcomeText: {
    fontSize: verticalScale(20),
    fontWeight: "bold",
    color: colors.text,
  },
  form: {
    gap: spacingY._20,
  },
  forgetPassword: {
    textAlign: "right",
    fontWeight: "500",
    color: colors.text,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
  footerText: {
    textAlign: "center",
    color: colors.text,
    fontSize: verticalScale(15),
  },
});
