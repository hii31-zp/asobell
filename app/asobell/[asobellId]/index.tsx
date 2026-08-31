import { MyText } from "@/compornents/MyText";
import { useUserProfile } from "@/compornents/useUserProfile";
import { auth, db } from "@/firebase";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  arrayRemove,
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";

type Participant = {
  id: string;
  name: string;
  initial: string;
  color: string;
};

type AsobellRaw = {
  title: string;
  description?: string;
  startAt?: string;
  location?: string;
  maxParticipants: number;
  groupId: string;
  createdBy?: string;
  participantIds: string[];
};

type AsobellData = {
  title: string;
  description?: string;
  eventDate?: string;
  location?: string;
  capacity: number;
  groupId: string;
  groupName: string;
  participantIds: string[];
  participants: Participant[];
};

type UserDocData = {
  nickname?: string;
  name?: string;
  avatarColor?: string;
  avatarText?: string;
};

const UNIFIED_AVATAR_COLOR = "#8FC6A9";

export default function AsobellDetail() {
  const router = useRouter();
  const { asobellId, groupId: searchGroupId } = useLocalSearchParams<{
    asobellId: string;
    groupId?: string;
  }>();

  const { user, profile, loading: userLoading } = useUserProfile();
  const myUid = auth.currentUser?.uid || user?.uid || "";

  const [asobell, setAsobell] = useState<AsobellData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!asobellId || !searchGroupId) {
      setDataLoading(false);
      return;
    }

    const docRef = doc(db, "groups", searchGroupId, "asobells", asobellId);

    const unsubscribe = onSnapshot(
      docRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          const raw = docSnap.data() as AsobellRaw;
          const participantIds = raw.participantIds || [];

          let groupName = "グループ";
          try {
            const groupSnap = await getDoc(doc(db, "groups", searchGroupId));
            if (groupSnap.exists()) {
              groupName = groupSnap.data().name || "グループ";
            }
          } catch (e) {
            console.error("グループ名取得失敗:", e);
          }

          const participantsPromises = participantIds.map(async (uid) => {
            try {
              const uSnap = await getDoc(doc(db, "users", uid));
              if (uSnap.exists()) {
                const uData = uSnap.data() as UserDocData;
                const name = uData.nickname || uData.name || "メンバー";
                return {
                  id: uid,
                  name,
                  initial: uData.avatarText || name.slice(0, 2).toUpperCase(),
                  color: UNIFIED_AVATAR_COLOR,
                };
              }
            } catch (e) {
              console.error(`ユーザー情報取得失敗 (${uid}):`, e);
            }
            return {
              id: uid,
              name: "メンバー",
              initial: "MB",
              color: UNIFIED_AVATAR_COLOR,
            };
          });

          const participants = await Promise.all(participantsPromises);

          let formattedDate = raw.startAt || "日時未設定";
          if (raw.startAt) {
            const d = new Date(raw.startAt);
            if (!isNaN(d.getTime())) {
              formattedDate = `${d.getMonth() + 1}月${d.getDate()}日 ${String(
                d.getHours()
              ).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}〜`;
            }
          }

          setAsobell({
            title: raw.title || "無題のあそベル",
            description: raw.description,
            eventDate: formattedDate,
            location: raw.location,
            capacity: raw.maxParticipants || 4,
            groupId: searchGroupId,
            groupName,
            participantIds,
            participants,
          });
        } else {
          console.error("該当のあそベルが見つかりません");
          setAsobell(null);
        }
        setDataLoading(false);
      },
      (error) => {
        console.error("データ取得エラー:", error);
        setDataLoading(false);
      }
    );

    return () => unsubscribe();
  }, [asobellId, searchGroupId]);

  if (userLoading || dataLoading) {
    return (
      <View className="bg-bg flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#D85A30" />
      </View>
    );
  }

  if (!asobell) {
    return (
      <View className="bg-bg flex-1 items-center justify-center p-6 gap-6">
        <MyText className="text-dark text-lg text-center font-bold">
          あそベルが見つかりませんでした。
        </MyText>

        <Pressable
          className="bg-primary px-6 py-3 rounded-full active:opacity-80"
          onPress={() => router.replace("/(tabs)")}
        >
          <MyText className="text-white text-base font-bold">
            ホームに戻る
          </MyText>
        </Pressable>
      </View>
    );
  }

  const participants = asobell.participants || [];
  const capacity = asobell.capacity || 4;
  const isJoined = asobell.participantIds.includes(myUid);
  const isFull = participants.length >= capacity;

  const handleToggleJoin = async () => {
    if (!asobellId || !asobell.groupId || !myUid) return;

    const docRef = doc(db, "groups", asobell.groupId, "asobells", asobellId);

    try {
      if (isJoined) {
        await updateDoc(docRef, {
          participantIds: arrayRemove(myUid),
        });
      } else {
        if (isFull) return;
        await updateDoc(docRef, {
          participantIds: arrayUnion(myUid),
        });
      }
    } catch (error) {
      console.error("参加状態の更新エラー:", error);
    }
  };

  const remaining = capacity - participants.length;

  return (
    <View className="bg-bg flex-1">
      <View className="p-4 pt-6 flex-row items-center justify-between">
        <Pressable
          className="flex-row items-center gap-1"
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={20} color="#8B6F4E" />
          <MyText className="text-brown text-xl">戻る</MyText>
        </Pressable>

        <Pressable
          className="flex-row items-center gap-1 bg-card border border-inputBorder px-3 py-1.5 rounded-full active:opacity-70"
          onPress={() =>
            router.push(`/asobell/${asobellId}/edit?groupId=${asobell.groupId}`)
          }
        >
          <Ionicons name="pencil" size={16} color="#8B6F4E" />
          <MyText className="text-brown font-bold text-sm">編集</MyText>
        </Pressable>
      </View>

      <View className="px-6 gap-4 flex-1">
        <View className="self-start bg-card border border-inputBorder px-3 py-1 rounded-lg flex-row items-center gap-1.5">
          <Ionicons name="people-outline" size={14} color="#8B6F4E" />
          <MyText className="text-brown font-bold text-xs">
            {asobell.groupName}
          </MyText>
        </View>

        <View>
          <MyText className="text-dark text-2xl font-rounded-bold">
            {asobell.title}
          </MyText>
          {asobell.description ? (
            <MyText className="text-textSub text-lg mt-2 leading-6">
              {asobell.description}
            </MyText>
          ) : null}
        </View>

        <View className="gap-2 my-2">
          <View className="flex-row items-center gap-2">
            <Ionicons name="calendar-outline" size={18} color="#B8925A" />
            <MyText className="text-dark text-lg">
              {asobell.eventDate || "日時未定"}
            </MyText>
          </View>
          <View className="flex-row items-center gap-2">
            <Ionicons name="location-outline" size={18} color="#B8925A" />
            <MyText className="text-dark text-lg">
              {asobell.location || "場所未定"}
            </MyText>
          </View>
        </View>

        <View className="h-[1px] bg-inputBorder mb-2" />

        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <MyText className="text-brown text-lg font-rounded-bold">
              参加者
            </MyText>
            <View className="flex-row items-center gap-2">
              <MyText className="text-brown text-base font-bold">
                {participants.length}/{capacity}人
              </MyText>
              {!isFull && (
                <View className="bg-primaryLight px-2 py-1 rounded-full">
                  <MyText className="text-primary text-sm font-bold">
                    あと{remaining}人！
                  </MyText>
                </View>
              )}
            </View>
          </View>

          <View className="h-2 bg-inputBorder rounded-full overflow-hidden">
            <View
              className="h-full bg-primary rounded-full"
              style={{ width: `${(participants.length / capacity) * 100}%` }}
            />
          </View>

          {/* 参加者一覧表示 */}
          <View className="gap-3 mt-2">
            {participants.map((p) => (
              <View key={p.id} className="flex-row items-center gap-3">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: p.color }}
                >
                  <MyText className="text-white text-base font-bold">
                    {p.initial}
                  </MyText>
                </View>
                <MyText className="text-dark text-lg font-bold">
                  {p.name} {p.id === myUid ? "（自分）" : ""}
                </MyText>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* 参加 / 参加キャンセル ボタン */}
      <View className="p-6">
        <Pressable
          disabled={!isJoined && isFull}
          onPress={handleToggleJoin}
          className={`h-[52px] mb-10 rounded-full items-center justify-center ${
            isJoined
              ? "bg-inactive border border-inputBorder"
              : isFull
              ? "bg-inactive"
              : "bg-primary active:bg-[#C14C24]"
          }`}
        >
          <MyText
            className={`font-bold text-xl ${
              isJoined ? "text-dark" : isFull ? "text-textSub" : "text-white"
            }`}
          >
            {isJoined ? "参加キャンセル" : isFull ? "満員です" : "あそべる！"}
          </MyText>
        </Pressable>
      </View>
    </View>
  );
}