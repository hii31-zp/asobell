import { MyText } from "@/compornents/MyText";
import { useRouter } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  TextInput,
  View,
} from "react-native";
import { auth } from "../../firebase";

export default function ResetPasswordScreen() {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const validate = (emailVal: string) => {
    if (emailVal.trim().length === 0) {
      return "メールアドレスを入力してください";
    }
    return "";
  };

  const handleResetPassword = async () => {
    const error = validate(email);
    if (error) {
      setErrorMessage(error);
      return;
    }
    setErrorMessage("");
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email.trim());

      Alert.alert(
        "送信完了",
        "パスワード再設定用のメールを送信しました。メール内のリンクから再設定を行ってください。",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err: any) {
      console.error("パスワードリセットエラー:", err);

      if (err.code === "auth/user-not-found") {
        setErrorMessage("このメールアドレスは登録されていません");
      } else if (err.code === "auth/invalid-email") {
        setErrorMessage("メールアドレスの形式が正しくありません");
      } else {
        setErrorMessage(
          "メールの送信に失敗しました。時間をおいて再度お試しください"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="bg-bg gap-4 p-4 pt-6 flex-1">
      <MyText className="text-brown text-2xl font-rounded-bold pl-4 pr-4">
        パスワードをお忘れですか？
      </MyText>
      <View>
        <MyText className="text-textSub text-base font-rounded pr-4 pl-4">
          登録済みのメールアドレスを入力してください。パスワード再設定用のリンクをお送りします。
        </MyText>
      </View>
      <View className="gap-4 pt-5 pl-5 pr-5">
        <View className="gap-1.5">
          <MyText className="text-label text-sm font-rounded-bold">
            メールアドレス
          </MyText>
          <TextInput
            className="bg-card border border-inputBorder rounded-2xl px-4 py-3 text-dark"
            placeholder="example@email.com"
            placeholderTextColor="#B9B4A8"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </View>
      <View className="min-h-[20px] pl-6">
        {errorMessage !== "" && (
          <View>
            <MyText className="text-danger text-sm">{errorMessage}</MyText>
          </View>
        )}
      </View>
      <View className="pr-8 pl-8">
        <Pressable
          className="border-2 border-primary bg-primary active:bg-[#C14C24] h-[58px] px-4 rounded-full font-rounded items-center justify-center w-full"
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <MyText className="text-white font-semibold text-xl">
              送信する
            </MyText>
          )}
        </Pressable>
      </View>
      <View style={{ width: "100%", alignItems: "center" }}>
        <Pressable onPress={() => router.back()}>
          <MyText
            className="pt-3 text-primary active:text-danger text-base"
            style={{ textDecorationLine: "underline" }}
          >
            ログイン画面に戻る
          </MyText>
        </Pressable>
      </View>
    </View>
  );
}