import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import { auth } from "../config/firebase";
import { syncUserWithBackend } from "../api/authApi";

const googleProvider = new GoogleAuthProvider();
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setUser(firebaseUser);

        if (firebaseUser) {
          const idToken = await firebaseUser.getIdToken();

          await syncUserWithBackend({
            idToken,
            displayName: firebaseUser.displayName,
          });

          console.log("Authenticated user synced successfully");
        }
      } catch (error) {
        console.error("Authentication sync failed:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, loginWithGoogle, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
