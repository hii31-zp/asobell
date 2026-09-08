/*グループ一覧(app/(tabs)/groups.tsxページの右下のボタンから遷移。
グループに招待する画面*/

import { MyText } from "@/compornents/MyText";
import { db } from "@/firebase";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";

type GroupData = {
  name: string;
  inviteCode?: string;
};

export default function MyComponent() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();

  const [group, setGroup] = useState<GroupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchGroup = async () => {
      if (!groupId) return;
      try {
        const docRef = doc(db, "groups", groupId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setGroup(docSnap.data() as GroupData);
        } else {
          console.error("グループが見つかりません");
        }
      } catch (error) {
        console.error("データ取得エラー:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [groupId]);

  const handleCopy = async () => {
    if (group?.inviteCode) {
      await Clipboard.setStringAsync(group.inviteCode);
      setCopied(true);
    }
  };

  if (loading) {
    return (
      <View className="bg-bg flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#D85A30" />
      </View>
    );
  }

  return (
    <View className="bg-bg p-6 pt-8 flex-1">
      <View>
        <Pressable
          className="flex-row items-center gap-1"
          onPress={() => {
            router.back();
          }}
        >
          <Ionicons name="chevron-back" size={20} color="#8B6F4E" />
          <MyText className="text-brown font-bold text-xl ">
            グループ詳細に戻る
          </MyText>
        </Pressable>
      </View>
      <View className="pt-6 p-3">
        <View className="gap-2 pb-8">
          <MyText className="text-dark text-2xl font-rounded-bold">
            「{"グループ名"}」に招待する
          </MyText>
          <MyText className="pt-3 px-4 text-textSub font-rounded-bold text-lg">
            下のコードを友達に共有して、グループに招待しましょう
          </MyText>
        </View>
        <View className="border-2 border-dashed border-inputBorder p-4 pr-8 bg-card rounded-3xl justify-between flex-row">
          <MyText className="text-brown text-3xl font-rounded-bold items-center pl-5">
            {group?.inviteCode || "----"}
          </MyText>
          <Pressable
            onPress={handleCopy}
            disabled={!group?.inviteCode}
            className="bg-inputBorder/30 active:bg-inputBorder/60 flex-row items-center gap-1.5 px-4 py-2.5 rounded-xl"
          >
            <Ionicons
              name={copied ? "checkmark-outline" : "copy-outline"}
              size={18}
              color="#5C4033"
            >
              <MyText className="text-brown font-rounded-bold text-sm">
                {copied ? "コピー完了" : "コピー"}
              </MyText>
            </Ionicons>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
