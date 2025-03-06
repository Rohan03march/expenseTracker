import { AuthContextType } from "@/types";
import { createContext, useContext, useEffect, useState } from "react";
import { UserType } from "../types";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth, firestore } from "@/config/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "expo-router";

// Create the Auth Context
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserType | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuthState = () => {
      const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
        console.log("firebase user: ", firebaseUser);
        if (firebaseUser) {
          // User is logged in, update user state
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName,
          });
          await updateUserData(firebaseUser.uid); // Fetch additional user data from Firestore
          router.replace("/(tabs)"); // Redirect to the authenticated screen
        } else {
          // User is logged out
          setUser(null);
          router.replace("/welcome"); // Redirect to the welcome screen
        }
      });

      // Cleanup the listener when the component is unmounted
      return unsub;
    };

    // Call checkAuthState immediately when the component mounts
    const unsubscribe = checkAuthState();

    // Cleanup on unmount
    return unsubscribe;
  }, [router]);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error: any) {
      let msg = error.message;
      console.log("Error message", msg);
      if (msg.includes("(auth/invalid-credential)")) msg = "Invalid credential";
      if (msg.includes("(auth/invalid-email)")) msg = "Invalid email";
      return { success: false, msg };
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      let response = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await setDoc(doc(firestore, "user", response?.user?.uid), {
        name,
        uid: response?.user?.uid,
        email,
      });
      return { success: true };
    } catch (error: any) {
      let msg = error.message;
      console.log("Error message", msg);
      if (msg.includes("(auth/email-already-in-use)"))
        msg = "This email is already in use";
      if (msg.includes("(auth/invalid-email)")) msg = "Invalid email";
      if (msg.includes("(auth/weak-password)"))
        msg = "The password must be at least 6 characters";
      return { success: false, msg };
    }
  };

  const updateUserData = async (uid: string) => {
    try {
      const docRef = doc(firestore, "user", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const userData: UserType = {
          uid: data?.uid,
          email: data?.email || null,
          name: data?.name || null,
          image: data?.image || null,
        };
        setUser({ ...userData });
      }
    } catch (error: any) {
      let msg = error.message;
      console.log("Error updating user data:", msg);
    }
  };

  const contextValue: AuthContextType = {
    user,
    setUser,
    login,
    register,
    updateUserData,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

// Custom hook to access auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
