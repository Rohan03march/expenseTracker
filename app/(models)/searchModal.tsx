import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { scale, verticalScale } from "@/utils/styling";
import ModalWrapper from "@/components/ModalWrapper";
import Header from "@/components/Header";
import { Image } from "expo-image";
import { getProfileImage } from "@/services/imageService";
import * as Icons from "phosphor-react-native";
import Typo from "@/components/typo";
import Input from "@/components/Input";
import { TransactionType, UserDataType, WalletType } from "@/types";
import Button from "@/components/Button";
import { useAuth } from "@/contexts/authContext";
import { updateUser } from "@/services/userService";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import ImageUpload from "@/components/ImageUpload";
import { createOrUpdateWallet, deleteWallet } from "@/services/walletService";
import BackButton from "@/components/BackButton";
import { limit, orderBy, where } from "firebase/firestore";
import useFetchData from "@/hooks/useFetchData";
import TransactionList from "@/components/TransactionList";

const searchModal = () => {
  const { user, updateUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [search, setSearch] = useState("");
  const constraints = [where("uid", "==", user?.uid), orderBy("date", "desc")];

  const {
    data: allTransactions,
    error,
    loading: transactionsLoading,
  } = useFetchData<TransactionType>("transactions", constraints);
  const filteredTransactions = allTransactions.filter((item) => {
    if (search.length > 1) {
      if (
        item.category?.toLowerCase()?.includes(search?.toLowerCase()) ||
        item.type?.toLowerCase()?.includes(search?.toLowerCase()) ||
        item.description?.toLowerCase()?.includes(search?.toLowerCase())
      ) {
        return true;
      }
      return false;
    }
  });
  console.log("all transactions", filteredTransactions);

  return (
    <ModalWrapper style={{ backgroundColor: colors.neutral900 }}>
      <View style={styles.container}>
        <Header title={"Search"} />
        {/** form*/}

        <ScrollView contentContainerStyle={styles.form}>
          <View style={styles.inputContainer}>
            <Input
              placeholder="Search..."
              containerStyle={{ backgroundColor: colors.neutral800 }}
              placeholderTextColor={colors.neutral400}
              value={search}
              onChangeText={(value) => setSearch(value)}
            />
          </View>
          <View>
            <TransactionList
              loading={transactionsLoading}
              data={filteredTransactions}
              emptyListMessage="No transactions matches your search keywords"
            />
          </View>
        </ScrollView>
      </View>
    </ModalWrapper>
  );
};

export default searchModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: spacingX._20,
  },
  form: {
    gap: spacingY._30,
    marginTop: spacingY._15,
  },
  avatarContainer: {
    position: "relative",
    alignSelf: "center",
  },
  inputContainer: {
    gap: spacingY._10,
  },
});
