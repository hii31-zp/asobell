/*グループ一覧(app/(tabs)/groups.tsxページの右下のボタンから遷移。
グループを作成する画面*/

import { MyText } from "@/compornents/MyText";
import { auth, db } from "@/firebase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useState } from "react";
import { ActivityIndicator, Pressable, TextInput, View } from "react-native";

const generateInviteCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export default function CreateGroupScreen() {
  const router = useRouter();

  const [groupName, setGroupName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validate = (groupNameVal: string) => {
    if (groupNameVal.trim().length === 0) {
      return "グループ名を入力してください";
    }
    return "";
  };

  const handleCreateGroup = async () => {
    const error = validate(groupName);
    if (error) {
      setErrorMessage(error);
      return;
    }
    setErrorMessage("");

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setErrorMessage(
        "ユーザー情報の取得に失敗しました。再ログインしてください。",
      );
      return;
    }

    setIsLoading(true);

    try {
      const inviteCode = generateInviteCode();

      const groupRef = await addDoc(collection(db, "groups"), {
        name: groupName.trim(),
        inviteCode: inviteCode,
        ownerId: currentUser.uid,
        memberIds: [currentUser.uid],
        createdAt: serverTimestamp(),
      });

      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        joinedGroupIds: arrayUnion(groupRef.id),
      });

      router.back();
    } catch (e) {
      console.error("Error creating group: ", e);
      setErrorMessage("グループの作成に失敗しました。もう一度お試しください。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="bg-bg p-6 pt-8 flex-1">
      <View>
        <Pressable
          className="flex-row items-center gap-1"
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={20} color="#8B6F4E" />
          <MyText className="text-brown text-xl font-bold">
            グループ一覧に戻る
          </MyText>
        </Pressable>
      </View>
      <View className="pt-6 p-3">
        <View className="gap-2 pb-8">
          <MyText className="text-dark text-2xl font-rounded-bold">
            グループを作成する
          </MyText>
          <MyText className="pt-3 text-textSub font-rounded-bold text-base">
            グループ作成後、招待コードを共有して友達を招待できます
          </MyText>
        </View>
        <View>
          <View className="gap-4">
            <View className="gap-1.5 pb-1">
              <MyText className="text-label text-lg font-rounded-bold">
                グループ名
              </MyText>
              <TextInput
                className="bg-card border border-inputBorder rounded-2xl px-4 py-3 text-dark"
                placeholder="例：大学の友達"
                placeholderTextColor="#B9B4A8"
                value={groupName}
                onChangeText={setGroupName}
                editable={!isLoading}
              />
            </View>
          </View>

          <View className="min-h-[20px] pl-6">
            {errorMessage !== "" && (
              <MyText className="text-danger text-sm">{errorMessage}</MyText>
            )}
          </View>

          <View className="pt-2 pr-4 pl-4">
            <Pressable
              className={`border-2 border-primary bg-primary active:bg-[#C14C24] h-[58px] px-4 rounded-full font-rounded items-center justify-center w-full ${
                isLoading ? "opacity-50" : ""
              }`}
              onPress={handleCreateGroup}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <MyText className="text-white font-semibold text-xl">
                  作成する
                </MyText>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
