/*新規登録画面*/

import { MyText } from "@/compornents/MyText";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  TextInput,
  View,
} from "react-native";

import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";

import { useRouter } from "expo-router";

export default function MyComponent() {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordChecker, setPasswordChecker] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordChecker, setShowPasswordChecker] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const validate = (
    nicknameVal: string,
    emailVal: string,
    passVal: string,
    passCheckVal: string,
  ) => {
    if (nicknameVal.trim().length === 0) {
      return "ニックネームを入力してください";
    }
    if (emailVal.trim().length === 0) {
      return "メールアドレスを入力してください";
    }
    if (passVal.length < 8) {
      return "パスワードは8文字以上で入力してください";
    }
    if (passVal !== passCheckVal) {
      return "パスワードが一致していません";
    }
    return "";
  };

  const handleSignup = async () => {
    const error = validate(nickname, email, password, passwordChecker);
    if (error) {
      setErrorMessage(error);
      return;
    }
    setErrorMessage("");
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        nickname: nickname.trim(),
        createdAt: serverTimestamp(),
      });

      Alert.alert("登録完了", "アカウントが正常に作成されました！", [
        {
          text: "OK",
          onPress: () => router.replace("/(tabs)"),
        },
      ]);
    } catch (err: any) {
      console.error("サインアップエラー:", err);
      if (err.code === "auth/email-already-in-use") {
        setErrorMessage("このメールアドレスは既に登録されています");
      } else if (err.code === "auth/invalid-email") {
        setErrorMessage("メールアドレスの形式が正しくありません");
      } else if (err.code === "auth/weak-password") {
        setErrorMessage("パスワードが弱すぎます");
      } else {
        setErrorMessage("登録に失敗しました。もう一度お試しください。");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="bg-bg gap-4 p-4 pt-6 flex-1">
      <Pressable
        className="flex-row items-center gap-1"
        onPress={() => router.back()}
      >
        <Ionicons name="chevron-back" size={20} color="#8B6F4E" />
        <MyText className="text-brown text-xl">戻る</MyText>
      </Pressable>
      <MyText className="text-brown text-3xl font-rounded-bold pl-4 pt-2">
        新規登録
      </MyText>
      <View className="gap-4 pt-3 pl-5 pr-5">
        <View className="gap-1.5">
          <MyText className="text-label text-xl font-rounded-bold">
            ニックネーム
          </MyText>
          <TextInput
            className="bg-card border border-inputBorder rounded-2xl px-4 py-3 text-dark"
            placeholder="例：すずきたろう"
            placeholderTextColor="#B9B4A8"
            value={nickname}
            onChangeText={setNickname}
          />
        </View>
        <View className="gap-1.5">
          <MyText className="text-label text-xl font-rounded-bold">
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
          <MyText className="text-label text-xl font-rounded-bold">
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
        <View className="gap-1.5">
          <MyText className="text-label text-xl font-rounded-bold">
            パスワード（確認）
          </MyText>
          <View className="relative justify-center">
            <TextInput
              className="bg-card border border-inputBorder rounded-2xl px-4 py-3 text-dark"
              placeholder="半角英数字・記号８文字以上"
              placeholderTextColor="#B9B4A8"
              value={passwordChecker}
              onChangeText={(text) => {
                setPasswordChecker(text);
                if (text === password) {
                  setErrorMessage("");
                }
              }}
              secureTextEntry={!showPasswordChecker}
            />
            <Pressable
              className="absolute right-4"
              onPress={() => setShowPasswordChecker(!showPasswordChecker)}
            >
              <Ionicons
                name={showPasswordChecker ? "eye-outline" : "eye-off-outline"}
                size={20}
                color="#B9B4A8"
              />
            </Pressable>
          </View>
          <View className="min-h-[20px] justify-center">
            {errorMessage !== "" && (
              <MyText className="text-danger text-sm">{errorMessage}</MyText>
            )}
          </View>
        </View>
      </View>
      <View className="pr-8 pl-8">
        <Pressable
          className="border-2 border-primary bg-primary active:bg-[#C14C24] h-[58px] px-6 rounded-full font-rounded items-center justify-center w-full"
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <MyText className="text-white font-semibold text-2xl">
              メールアドレスで登録
            </MyText>
          )}
        </Pressable>
      </View>
      <View className="pr-8 pl-8">
        <View className="flex-row items-center pb-6 gap-3">
          <View className="flex-1 h-[1px] bg-inputBorder" />
          <MyText className="text-brown text-base font-rounded-bold">
            または
          </MyText>
          <View className="flex-1 h-[1px] bg-inputBorder" />
        </View>
        <Pressable className="border-2 border-inputBorder bg-white active:bg-inputBorder h-[58px] px-6 rounded-full font-rounded items-center justify-center w-full">
          <MyText className="text-brown font-semibold text-2xl">
            Googleで登録
          </MyText>
        </Pressable>
      </View>
    </View>
  );
}
