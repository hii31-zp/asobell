import { MyText } from "@/compornents/MyText";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, View } from "react-native";

import { signOut } from "firebase/auth";
import { auth } from "../../firebase";

export default function LogoutConfirm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      router.replace("/(auth)/welcome");
    } catch (error) {
      console.error("ログアウトエラー:", error);
      Alert.alert(
        "エラー",
        "ログアウトに失敗しました。もう一度お試しください。",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="bg-bg flex-1">
      <Pressable
        className="flex-1 bg-black/40 items-center justify-center"
        onPress={() => router.back()}
      >
        <Pressable className="bg-white rounded-2xl px-6 py-7 w-[300px] items-center">
          <View className="w-14 h-14 rounded-full bg-primaryLight items-center justify-center mb-4">
            <Ionicons name="log-out-outline" size={26} color="#D85A30" />
          </View>
          <MyText className="text-dark text-xl font-rounded-bold text-center">
            ログアウトしますか？
          </MyText>
          <MyText className="text-textSub text-base text-center mt-2 leading-5">
            再度ログインするには、メールアドレスとパスワード（またはGoogleアカウント）が必要です
          </MyText>
          <View className="flex-row gap-2.5 mt-6 w-full">
            <Pressable
              className="flex-1 bg-inactive h-[46px] rounded-full items-center justify-center"
              onPress={() => router.back()}
            >
              <MyText className="text-textSub font-bold text-lg">
                キャンセル
              </MyText>
            </Pressable>
            <Pressable
              className="flex-1 bg-primary h-[46px] rounded-full items-center justify-center"
              onPress={handleLogout}
            >
              <MyText className="text-white font-bold text-lg">
                ログアウト
              </MyText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </View>
  );
}
