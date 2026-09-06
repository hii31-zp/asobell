/*グループ一覧(app/(tabs)/groups.tsxページの右下のボタンから遷移。
グループに参加する画面*/

import { MyText } from "@/compornents/MyText";
import { auth, db } from "@/firebase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { arrayUnion, doc, getDoc, updateDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  TextInput,
  View,
} from "react-native";

export default function JoinGroupScreen() {
  const router = useRouter();
  const [groupIdInput, setGroupIdInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoinGroup = async () => {
    const trimmedId = groupIdInput.trim();
    if (!trimmedId) {
      Alert.alert("エラー", "グループIDを入力してください");
      return;
    }

    const myUid = auth.currentUser?.uid;
    if (!myUid) {
      Alert.alert("エラー", "ログイン情報が確認できませんでした");
      return;
    }

    setLoading(true);

    try {
      const groupRef = doc(db, "groups", trimmedId);
      const groupSnap = await getDoc(groupRef);

      if (!groupSnap.exists()) {
        Alert.alert("エラー", "該当するグループが見つかりませんでした");
        setLoading(false);
        return;
      }

      await updateDoc(groupRef, {
        members: arrayUnion(myUid),
      });

      Alert.alert("成功", "グループに参加しました！", [
        {
          text: "OK",
          onPress: () => router.replace("/(tabs)/groups"),
        },
      ]);
    } catch (error) {
      console.error("Group join error:", error);
      Alert.alert("エラー", "グループ参加処理に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="bg-bg flex-1 px-6 pt-12">

      <View className="pb-4">
          <Pressable
            className="flex-row items-center gap-1"
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={20} color="#8B6F4E" />
            <MyText className="text-brown text-xl font-bold">戻る</MyText>
          </Pressable>
        </View>

      <MyText className="text-dark text-2xl font-rounded-bold mb-2">
        グループに参加する
      </MyText>
      <MyText className="text-textSub text-base mb-6">
        共有されたグループID（招待コード）を入力してください。
      </MyText>

      <View className="gap-4">
        <View>
          <MyText className="text-brown text-base font-bold mb-2">
            グループID
          </MyText>
          <TextInput
            className="bg-card border border-cardBorder rounded-2xl px-4 py-3 text-dark text-base"
            placeholder="8桁のコードを入力して参加"
            placeholderTextColor="#A0A0A0"
            value={groupIdInput}
            onChangeText={setGroupIdInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <Pressable
          disabled={loading}
          onPress={handleJoinGroup}
          className="bg-primary py-4 rounded-full items-center mt-4"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <MyText className="text-white font-bold text-xl">
              グループに参加
            </MyText>
          )}
        </Pressable>
      </View>
    </View>
  );
}