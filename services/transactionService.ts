import { firestore } from "@/config/firebase";
import { ResponseType, TransactionType } from "@/types";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { WalletType } from "../types";
import { uploadFileToCloud } from "./imageService";
import { createOrUpdateWallet } from "./walletService";
import { getLast12Months, getLast7Days } from "@/utils/common";
import { scale } from "@/utils/styling";
import { colors } from "@/constants/theme";

export const createOrUpdateTransaction = async (
  transactionData: Partial<TransactionType>
): Promise<ResponseType> => {
  try {
    const { id, type, walletId, image, amount } = transactionData;
    if (!amount || amount <= 0 || !walletId || !type) {
      return { success: false, msg: "Invalid transaction data" };
    }
    if (id) {
      // Update existing transaction
      const oldTransactionSnapshot = await getDoc(
        doc(firestore, "transactions", id)
      );
      const oldTransacton = oldTransactionSnapshot.data() as TransactionType;
      const shouldRevertOrginal =
        oldTransacton.type != type ||
        oldTransacton.amount != amount ||
        oldTransacton.walletId != walletId;
      if (shouldRevertOrginal) {
        let res = await revertAndUpdateWallets(
          oldTransacton,
          Number(amount),
          type,
          walletId
        );
        if (!res.success) return res;
      }
    } else {
      //update wallet for new transaction
      let res = await updateWalletForNewTransaction(
        walletId!,
        Number(amount!),
        type
      );
      if (!res.success) {
        return res;
      }
    }
    if (image) {
      const imageUploadRes = await uploadFileToCloud(image, "transactions");
      if (!imageUploadRes.success) {
        return {
          success: false,
          msg: imageUploadRes.msg || "Failed to upload receipt",
        };
      }
      transactionData.image = imageUploadRes.data;
    }

    const transactionRef = id
      ? doc(firestore, "transactions", id)
      : doc(collection(firestore, "transactions"));

    await setDoc(transactionRef, transactionData, { merge: true });
    return {
      success: true,
      data: { ...transactionData, id: transactionRef.id },
    };
  } catch (err: any) {
    console.log("Error creating or updating transaction", err);
    return { success: false, msg: err.message };
  }
};

const updateWalletForNewTransaction = async (
  walletId: string,
  amount: number,
  type: string
) => {
  try {
    const walletRef = doc(firestore, "wallets", walletId);
    const walletSnapShot = await getDoc(walletRef);
    if (!walletSnapShot.exists()) {
      console.log("Error updating wallet for new transaction");
      return { success: false, msg: "wallet not found" };
    }

    const walletData = walletSnapShot.data() as WalletType;

    if (type == "expense" && walletData.amount! - amount < 0) {
      return {
        success: false,
        msg: "Selected wallet don't have enough Balance",
      };
    }

    const updateType = type == "income" ? "totalIncome" : "totalExpenses";
    const updatedWalletAmount =
      type == "income"
        ? Number(walletData.amount) + amount
        : Number(walletData.amount) - amount;

    const updatedTotals =
      type == "income"
        ? Number(walletData.totalIncome) + amount
        : Number(walletData.totalExpenses) + amount;

    await updateDoc(walletRef, {
      amount: updatedWalletAmount,
      [updateType]: updatedTotals,
    });
    return { success: true };
  } catch (err: any) {
    console.log("Error updating wallet for new transaction", err);
    return { success: false, msg: err.message };
  }
};

const revertAndUpdateWallets = async (
  oldTransaction: TransactionType,
  newTransactionAmount: number,
  newTransactionType: string,
  newWalletId: string
) => {
  try {
    const orginalWalletSnapshot = await getDoc(
      doc(firestore, "wallets", oldTransaction.walletId)
    );

    const orginalWallet = orginalWalletSnapshot.data() as WalletType;
    let newWalletSnapshot = await getDoc(
      doc(firestore, "wallets", newWalletId)
    );
    let newWallet = newWalletSnapshot.data() as WalletType;

    const revertType =
      oldTransaction.type == "income" ? "totalIncome" : "totalExpenses";
    const revertIncomeExpense: number =
      oldTransaction.type == "income"
        ? -Number(oldTransaction.amount)
        : Number(oldTransaction.amount);

    const revertedWalletAmount =
      Number(orginalWallet.amount) + revertIncomeExpense;
    //wallet amount, after the transaction is removed

    const revertedIncomeExpenseAmount =
      Number(orginalWallet[revertType]) - Number(oldTransaction.amount);

    if (newTransactionType == "expense") {
      // if user tries to convert income to expense on the same wallet
      //or if the user tries to increase the expense amount and dont have enough balance
      if (
        oldTransaction.walletId == newWalletId &&
        revertedWalletAmount < newTransactionAmount
      ) {
        return {
          success: false,
          msg: "The selected wallet does not have enough balance",
        };
      }
      //if the user tries to add expense from a new wallet but the wallet don't have enough balance
      if (newWallet.amount! < newTransactionAmount) {
        return {
          success: false,
          msg: "The selected wallet does not have enough balance",
        };
      }
    }

    await createOrUpdateWallet({
      id: oldTransaction.walletId,
      amount: revertedWalletAmount,
      [revertType]: revertedIncomeExpenseAmount,
    });
    //revert completed
    ////////////////////////////////////////////////////////////

    //reFetch the newWallet because we may have just updated it
    newWalletSnapshot = await getDoc(doc(firestore, "wallets", newWalletId));
    newWallet = newWalletSnapshot.data() as WalletType;

    const updatedType =
      newTransactionType == "income" ? "totalIncome" : "totalExpenses";

    const updatedTransactionAmount: number =
      newTransactionType == "income"
        ? Number(newTransactionAmount)
        : -Number(newTransactionAmount);

    const newWalletAmount = Number(newWallet.amount) + updatedTransactionAmount;

    const newIncomeExpenseAmount = Number(
      newWallet[updatedType]! + Number(newTransactionAmount)
    );

    await createOrUpdateWallet({
      id: newWalletId,
      amount: newWalletAmount,
      [updatedType]: newIncomeExpenseAmount,
    });

    return { success: true };
  } catch (err: any) {
    console.log("Error updating wallet for new transaction", err);
    return { success: false, msg: err.message };
  }
};

export const deleteTransaction = async (
  transactionId: string,
  walletId: string
) => {
  try {
    const transactionRef = doc(firestore, "transactions", transactionId);
    const TransactionSnapshot = await getDoc(transactionRef);
    if (!TransactionSnapshot.exists()) {
      return { success: false, msg: "Transaction not found" };
    }
    const transactionData = TransactionSnapshot.data() as TransactionType;

    const transactionType = transactionData?.type;
    const transactionAmount = transactionData?.amount;

    //Fetch the wallet to update amount , totalIncome or totalExpenses

    const walletSnapshot = await getDoc(doc(firestore, "wallets", walletId));
    const walletData = walletSnapshot.data() as WalletType;

    //check field to be updated based on transaction type

    const updateType =
      transactionType == "income" ? "totalIncome" : "totalExpenses";
    const newWalletAmount =
      walletData?.amount! -
      (transactionType == "income" ? transactionAmount : -transactionAmount);

    const newIncomeExpenseAmount = walletData[updateType]! - transactionAmount;

    //if the expense and the wallet amount can go below zero

    if (transactionType == "expense" && newWalletAmount < 0) {
      return { success: false, msg: "You cannot delete this transaction" };
    }

    await createOrUpdateWallet({
      id: walletId,
      amount: newWalletAmount,
      [updateType]: newIncomeExpenseAmount, //update total income or total expenses in the wallet  based on transaction type
    });

    await deleteDoc(transactionRef); //delete the transaction from firestore

    return { success: true };
  } catch (err: any) {
    console.log("Error updating wallet for new transaction", err);
    return { success: false, msg: err.message };
  }
};

//Stats
export const fetchWeeklyStats = async (uid: string): Promise<ResponseType> => {
  try {
    const db = firestore;
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const transactionQuery = query(
      collection(db, "transactions"),
      where("date", ">=", Timestamp.fromDate(sevenDaysAgo)),
      where("date", "<=", Timestamp.fromDate(today)),
      orderBy("date", "desc"),
      where("uid", "==", uid)
    );

    const querySnapshot = await getDocs(transactionQuery);
    const weeklyData = getLast7Days();
    const transactions: TransactionType[] = [];

    //maping each transaction in a day

    querySnapshot.forEach((doc) => {
      const transaction = doc.data() as TransactionType;
      transaction.id = doc.id;
      transactions.push(transaction);
      const transactionDate = (transaction.date as Timestamp)
        .toDate()
        .toISOString()
        .split("T")[0];
      const dayDate = weeklyData.find((day) => day.date == transactionDate);

      if (dayDate) {
        if (transaction.type == "income") {
          dayDate.income += transaction.amount;
        } else if (transaction.type == "expense") {
          dayDate.expense += transaction.amount;
        }
      }
    });

    const stats = weeklyData.flatMap((day) => [
      {
        value: day.income,
        label: day.day,
        spacing: scale(4),
        labelWidth: scale(30),
        fontColor: "#008000", // Green color
      },
      { value: day.expense, fontColor: colors.rose },
    ]);

    return { success: true, data: { stats, transactions } };
  } catch (err: any) {
    console.log("Error fetching the weekly stats", err);
    return { success: false, msg: err.message };
  }
};

export const fetchMonthlyStats = async (uid: string): Promise<ResponseType> => {
  try {
    const db = firestore;
    const today = new Date();
    const twelveMonthsAgo = new Date(today);
    twelveMonthsAgo.setMonth(today.getMonth() - 12);

    const transactionQuery = query(
      collection(db, "transactions"),
      where("date", ">=", Timestamp.fromDate(twelveMonthsAgo)),
      where("date", "<=", Timestamp.fromDate(today)),
      orderBy("date", "desc"),
      where("uid", "==", uid)
    );

    const querySnapshot = await getDocs(transactionQuery);
    const monthlyData = getLast12Months();
    const transactions: TransactionType[] = [];

    //maping each transaction in a day

    querySnapshot.forEach((doc) => {
      const transaction = doc.data() as TransactionType;
      transaction.id = doc.id;
      transactions.push(transaction);
      const transactionDate = (transaction.date as Timestamp).toDate();
      const monthName = transactionDate.toLocaleString("default", {
        month: "short",
      });
      const shortYear = transactionDate.getFullYear().toString().slice(-2);
      const monthData = monthlyData.find(
        (month) => month.month === `${monthName} ${shortYear}`
      );

      if (monthData) {
        if (transaction.type == "income") {
          monthData.income += transaction.amount;
        } else if (transaction.type == "expense") {
          monthData.expense += transaction.amount;
        }
      }
    });

    const stats = monthlyData.flatMap((month) => [
      {
        value: month.income,
        label: month.month,
        spacing: scale(4),
        labelWidth: scale(30),
        fontColor: colors.primary,
      },
      { value: month.expense, fontColor: colors.rose },
    ]);

    return {
      success: true,
      data: {
        stats,
        transactions,
      },
    };
  } catch (error) {
    console.log("Error fetching the monthly transactions", error);
    return { success: false, msg: "failed to fetch monthly transactions" };
  }
};
