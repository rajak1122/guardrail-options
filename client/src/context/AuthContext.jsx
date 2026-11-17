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
googleProvider.setCustomParameters({ prompt: "select_account" });

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (!auth) {
      setAuthError(
        "Firebase is not configured. Add the VITE_FIREBASE_* values to the client environment.",
      );
      setLoading(false);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        setAuthError("");
        setUser(firebaseUser);

        if (firebaseUser) {
          try {
            const idToken = await firebaseUser.getIdToken();
            await syncUserWithBackend({
              idToken,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
            });
          } catch (error) {
            console.error("Failed to sync authenticated user:", error);
            setAuthError(
              "You signed in, but your account could not sync with the server. Please try again.",
            );
          }
        }

        setLoading(false);
      },
      (error) => {
        console.error("Firebase auth state error:", error);
        setAuthError(error.message || "Unable to check your sign-in status.");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setAuthError("");
    if (!auth) {
      const message = "Firebase is not configured. Check your client environment variables.";
      setAuthError(message);
      throw new Error(message);
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.error("Google sign-in failed:", error);
      const message =
        error.code === "auth/unauthorized-domain"
          ? "This domain is not authorized in Firebase Authentication."
          : error.code === "auth/popup-blocked"
            ? "Your browser blocked the Google sign-in popup. Allow popups and try again."
            : error.code === "auth/popup-closed-by-user"
              ? "The sign-in window was closed before completing login."
              : error.message || "Google sign-in failed. Please try again.";
      setAuthError(message);
      throw new Error(message);
    }
  };

  const logout = async () => {
    if (auth) await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{ user, loginWithGoogle, logout, loading, authError, setAuthError }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
