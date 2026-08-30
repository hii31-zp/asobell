import { SplashScreen, Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import "../global.css";

import {
  MPLUSRounded1c_400Regular,
  MPLUSRounded1c_700Bold,
  useFonts,
} from "@expo-google-fonts/m-plus-rounded-1c";

import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../firebase";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    MPLUSRounded1c_400Regular,
    MPLUSRounded1c_700Bold,
  });

  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error, authChecking]);

  useEffect(() => {
    if (authChecking || (!loaded && !error)) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      router.replace("/(auth)/welcome");
    } else if (user && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [user, authChecking, segments, loaded, error]);

  if ((!loaded && !error) || authChecking) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF8F0" }}>
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}