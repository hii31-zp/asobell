import { MyText } from "@/compornents/MyText";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, TextInput, View } from "react-native";

import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { auth } from "../../firebase";

export default function ResetPassword() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordChecker, setNewPasswordChecker] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showNewChecker, setShowNewChecker] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (newPassword !== newPasswordChecker) {
      setErrorMessage("新しいパスワードが一致していません");
      return;
    }
    if (newPassword.length < 8) {
      setErrorMessage("パスワードは8文字以上で入力してください");
      return;
    }
    if (newPassword !== newPasswordChecker) {
      setErrorMessage("新しいパスワードが一致していません");
      return;
    }

    const user = auth.currentUser;
    if (!user || !user.email) {
      Alert.alert("エラー", "ログイン情報が見つかりません。");
      return;
    }

    setErrorMessage("");
    setLoading(true);

    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword,
      );

      await reauthenticateWithCredential(user, credential);

      await updatePassword(user, newPassword);

      Alert.alert("変更完了", "パスワードを変更しました。", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error("パスワード変更エラー:", error);

      if (
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        setErrorMessage("現在のパスワードが違います");
      } else if (error.code === "auth/weak-password") {
        setErrorMessage(
          "パスワードが英数字・記号8文字以上で指定されていません",
        );
      } else {
        setErrorMessage(
          "パスワードの変更に失敗しました。もう一度お試しください。",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="bg-bg flex-1">
      <View className="px-4 pt-6">
        <Pressable
          className="flex-row items-center gap-1"
          onPress={() => router.push("/settings")}
        >
          <Ionicons name="chevron-back" size={20} color="#8B6F4E" />
          <MyText className="text-brown text-xl ">設定に戻る</MyText>
        </Pressable>
      </View>

      <View className="p-6 gap-4">
        <MyText className="text-dark text-2xl font-rounded-bold">
          パスワードを変更する
        </MyText>

        <View className="gap-2 px-2">
          <MyText className="text-label text-base font-rounded-bold">
            現在のパスワード
          </MyText>
          <View className="relative justify-center">
            <TextInput
              className="bg-card border border-inputBorder rounded-2xl px-4 py-3 pr-12 text-dark"
              placeholder="現在のパスワードを入力"
              placeholderTextColor="#B9B4A8"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showCurrent}
            />
            <Pressable
              className="absolute right-4"
              onPress={() => setShowCurrent(!showCurrent)}
            >
              <Ionicons
                name={showCurrent ? "eye-outline" : "eye-off-outline"}
                size={20}
                color="#B9B4A8"
              />
            </Pressable>
          </View>
        </View>

        <View className="gap-2 px-2">
          <MyText className="text-label text-base font-rounded-bold">
            新しいパスワード
          </MyText>
          <View className="relative justify-center">
            <TextInput
              className="bg-card border border-inputBorder rounded-2xl px-4 py-3 pr-12 text-dark"
              placeholder="半角英数字・記号8文字以上"
              placeholderTextColor="#B9B4A8"
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                if (text === newPasswordChecker) setErrorMessage("");
              }}
              secureTextEntry={!showNew}
            />
            <Pressable
              className="absolute right-4"
              onPress={() => setShowNew(!showNew)}
            >
              <Ionicons
                name={showNew ? "eye-outline" : "eye-off-outline"}
                size={20}
                color="#B9B4A8"
              />
            </Pressable>
          </View>
        </View>

        <View className="gap-2 px-2">
          <MyText className="text-label text-base font-rounded-bold">
            新しいパスワード（確認）
          </MyText>
          <View className="relative justify-center">
            <TextInput
              className="bg-card border border-inputBorder rounded-2xl px-4 py-3 pr-12 text-dark"
              placeholder="半角英数字・記号8文字以上"
              placeholderTextColor="#B9B4A8"
              value={newPasswordChecker}
              onChangeText={(text) => {
                setNewPasswordChecker(text);
                if (text === newPassword) setErrorMessage("");
              }}
              secureTextEntry={!showNewChecker}
            />
            <Pressable
              className="absolute right-4"
              onPress={() => setShowNewChecker(!showNewChecker)}
            >
              <Ionicons
                name={showNewChecker ? "eye-outline" : "eye-off-outline"}
                size={20}
                color="#B9B4A8"
              />
            </Pressable>
          </View>
          {errorMessage !== "" && (
            <MyText className="text-danger text-sm">{errorMessage}</MyText>
          )}
        </View>

        <Pressable
          className="bg-primary active:bg-[#C14C24] h-[52px] rounded-full items-center justify-center mt-4"
          onPress={handleSubmit}
        >
          <MyText className="text-white font-bold text-xl">変更する</MyText>
        </Pressable>
      </View>
    </View>
  );
}
