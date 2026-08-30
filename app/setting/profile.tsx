import { MyText } from "@/compornents/MyText";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  TextInput,
  View,
} from "react-native";
import { useUserProfile } from "../../compornents/useUserProfile";

import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";

export default function EditProfile() {
  const router = useRouter();

  const { profile, loading: initialLoading } = useUserProfile();

  const [name, setName] = useState("");
  const [avatarText, setAvatarText] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      if (profile.nickname) setName(profile.nickname);
      if (profile.avatarText) setAvatarText(profile.avatarText);
    }
  }, [profile]);

  const handleAvatarChange = (text: string) => {
    const trimmed = Array.from(text).slice(0, 2).join("");
    setAvatarText(trimmed);
    setAvatarError("");
  };

  const handleSave = async () => {
    let hasError = false;

    if (name.trim().length === 0) {
      setErrorMessage("名前を入力してください");
      hasError = true;
    } else {
      setErrorMessage("");
    }

    if (avatarText.trim().length === 0) {
      setAvatarError("アイコン文字を入力してください");
      hasError = true;
    } else {
      setAvatarError("");
    }

    if (hasError) return;

    const user = auth.currentUser;
    if (!user) {
      Alert.alert("エラー", "ログイン情報が見つかりません。");
      return;
    }

    setLoading(true);

    try {
      const userDocRef = doc(db, "users", user.uid);

      await setDoc(
        userDocRef,
        {
          nickname: name.trim(),
          avatarText: avatarText.trim(),
        },
        { merge: true },
      );

      Alert.alert("保存完了", "プロフィールを更新しました", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("プロフィール保存エラー:", error);
      Alert.alert("エラー", "更新に失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View className="bg-bg flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#D85A30" />
      </View>
    );
  }

  return (
    <View className="bg-bg flex-1">
      <View className="p-4 pt-6">
        <Pressable
          className="flex-row items-center gap-1"
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={20} color="#8B6F4E" />
          <MyText className="text-brown font-bold text-xl">設定に戻る</MyText>
        </Pressable>
      </View>

      <View className="px-6 gap-4">
        <MyText className="text-dark text-2xl font-rounded-bold">
          プロフィールを編集
        </MyText>

        <View className="items-center py-2">
          <View className="w-20 h-20 rounded-full bg-[#7FC7A6] items-center justify-center">
            <MyText className="text-white text-3xl font-bold">
              {avatarText || "?"}
            </MyText>
          </View>
        </View>

        <View className="gap-1">
          <MyText className="text-label text-base font-rounded-bold">
            名前（ニックネーム）
          </MyText>
          <TextInput
            className="bg-card border border-inputBorder rounded-2xl px-4 py-3 text-dark items-center"
            placeholder="例：すずきたろう"
            placeholderTextColor="#B9B4A8"
            value={name}
            onChangeText={setName}
          />
          {errorMessage !== "" && (
            <MyText className="text-danger text-sm">{errorMessage}</MyText>
          )}
        </View>

        <View className="gap-1">
          <MyText className="text-label text-base font-rounded-bold">
            アイコン文字（全角1〜2文字）
          </MyText>
          <TextInput
            className="bg-card border border-inputBorder rounded-2xl px-4 py-3 text-dark"
            placeholder="例：ST"
            placeholderTextColor="#B9B4A8"
            value={avatarText}
            onChangeText={handleAvatarChange}
            maxLength={2}
          />
          {avatarError !== "" && (
            <MyText className="text-danger text-sm">{avatarError}</MyText>
          )}
        </View>

        <Pressable
          className="bg-primary active:bg-[#C14C24] h-[52px] rounded-full items-center justify-center mt-2"
          onPress={handleSave}
        >
          <MyText className="text-white font-bold text-xl">保存する</MyText>
        </Pressable>
      </View>
    </View>
  );
}
