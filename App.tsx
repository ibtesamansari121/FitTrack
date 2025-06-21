// App.tsx
import React, { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import AppNavigator from "./src/navigation/AppNavigator";
import { auth } from "./src/lib/firebase";
import { useAuthStore } from "./src/store/authStore";

export default function App() {
  const { setUser } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        });
      } else {
        setUser(null);
      }
    });

    return unsubscribe;
  }, [setUser]);

  return <AppNavigator />;
}
