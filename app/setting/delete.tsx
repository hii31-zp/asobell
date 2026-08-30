import { MyText } from "@/compornents/MyText";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, View } from "react-native";

import { deleteUser } from "firebase/auth";
import { doc } from "firebase/firestore";
import { auth, db } from "../../firebase";

export default function DeleteAccountConfirm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    const user = auth.currentUser;

    if (!user) {
      Alert.alert("エラー", "ユーザー情報が取得できませんでした。");
      return;
    }
    setLoading(true);

    try {
      const userDocRef = doc(db, "users", user.uid);

      await deleteUser(user);

      Alert.alert(
        "アカウントは削除されました",
        "ご利用ありがとうございました。",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(auth)/welcome"),
          },
        ],
      );
    } catch (error: any) {
      console.error("アカウント削除エラー:", error);

      if (error.code === "auth/requires-recent-login") {
        Alert.alert(
          "再ログインが必要です",
          "安全のため、一度ログアウトして再ログインしてからアカウント削除を再度お試しください。",
        );
      } else {
        Alert.alert(
          "エラー",
          "アカウントの削除に失敗しました。もう一度お試しください。",
        );
      }
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
        <Pressable
          className="bg-white rounded-2xl px-6 py-7 w-[300px] items-center"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="w-14 h-14 rounded-full bg-dangerLight items-center justify-center mb-4">
            <Ionicons name="warning-outline" size={26} color="#C94141" />
          </View>
          <MyText className="text-dark text-xl font-rounded-bold text-center">
            本当にアカウントを削除しますか？
          </MyText>
          <MyText className="text-textSub text-base text-center mt-2 leading-5">
            この操作は取り消せません。参加中のグループやあそベルの情報もすべて削除されます
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
              className="flex-1 bg-danger h-[46px] rounded-full items-center justify-center"
              onPress={handleDelete}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <MyText className="text-white font-bold text-lg">
                  削除する
                </MyText>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </View>
  );
}
