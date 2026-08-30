/*ログイン画面*/

import { MyText } from "@/compornents/MyText";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  TextInput,
  ScrollView,
  View,
} from "react-native";

import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const validate = (emailVal: string, passVal: string) => {
    if (emailVal.trim().length === 0) {
      return "メールアドレスを入力してください";
    }
    if (passVal.length < 8) {
      return "パスワードは8文字以上で入力してください";
    }
    return "";
  };

  const handleLogin = async () => {
    const error = validate(email, password);
    if (error) {
      setErrorMessage(error);
      return;
    }
    setErrorMessage("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);

      Alert.alert("ログイン成功", "早速あそベルを作成しましょう！", [
        {
          text: "OK",
          onPress: () => router.replace("/(tabs)"),
        },
      ]);
    } catch (err: any) {
      console.error("ログインエラー:", err);

      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setErrorMessage("メールアドレスまたはパスワードが間違っています");
      } else if (err.code === "auth/invalid-email") {
        setErrorMessage("メールアドレスの形式が正しくありません");
      } else if (err.code === "auth/too-many-requests") {
        setErrorMessage(
          "ログイン試行が多すぎます。しばらく時間をおいてお試しください",
        );
      } else {
        setErrorMessage("ログインに失敗しました。もう一度お試しください。");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      className="bg-bg flex-1"
      contentContainerStyle={{ padding: 16, paddingTop: 24 }}
    >
      <MyText className="text-brown text-3xl font-rounded-bold pl-3">
        ログイン
      </MyText>
      <View className="gap-4 pt-5 pl-5 pr-5">
        <View className="gap-1.5">
          <MyText className="text-label text-base font-rounded-bold">
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
        <View className="gap-1.5">
          <MyText className="text-label text-base font-rounded-bold">
            パスワード
          </MyText>
          <View className="relative justify-center">
            <TextInput
              className="bg-card border border-inputBorder rounded-2xl px-4 py-3 text-dark"
              placeholder="半角英数字・記号８文字以上"
              placeholderTextColor="#B9B4A8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <Pressable
              className="absolute right-4"
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={20}
                color="#B9B4A8"
              />
            </Pressable>
          </View>
        </View>
      </View>
      <View style={{ width: "100%", alignItems: "flex-end", paddingRight: 20 }}>
        <Pressable
          onPress={() => {
            router.push("/reset-password");
          }}
        >
          <MyText
            className="text-brown active:text-danger py-2 pb-3 text-base"
            style={{ textDecorationLine: "underline" }}
          >
            パスワードを忘れた方はこちら
          </MyText>
        </Pressable>
      </View>
      {errorMessage !== "" && (
        <MyText className="text-danger text-base pb-3">{errorMessage}</MyText>
      )}
      <View className="pr-8 pl-8">
        <Pressable
          className="border-2 border-primary bg-primary active:bg-[#C14C24] h-[58px] px-6 rounded-full items-center justify-center w-full"
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <MyText className="text-white font-semibold text-2xl">
              ログイン
            </MyText>
          )}
        </Pressable>
      </View>
      <View className="pr-8 pl-8">
        <View className="flex-row items-center my-6 gap-3">
          <View className="flex-1 h-[1px] bg-inputBorder" />
          <MyText className="text-brown text-base font-rounded-bold">
            または
          </MyText>
          <View className="flex-1 h-[1px] bg-inputBorder" />
        </View>
        <Pressable className="border-2 border-inputBorder bg-white active:bg-inputBorder h-[58px] px-6 rounded-full font-rounded items-center justify-center w-full">
          <MyText className="text-brown font-semibold text-2xl">
            Googleでログイン
          </MyText>
        </Pressable>
      </View>
    </ScrollView>
  );
}
