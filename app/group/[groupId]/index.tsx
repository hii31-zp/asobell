// グループ一覧(app/(tabs)/group.tsx/からの遷移)*/
import { MyText } from "@/compornents/MyText";
import { useUserProfile } from "@/compornents/useUserProfile";
import { db } from "@/firebase";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";

type Participant = {
  id: string;
  initial: string;
  color: string;
};

type AsobellRaw = {
  title: string;
  description?: string;
  groupId: string;
  createdBy: string;
  participantIds: string[];
  maxParticipants: number;
  startAt?: string;
  endAt?: string;
  location?: string;
  status?: string;
};

type Asobell = {
  id: string;
  title: string;
  description?: string;
  startDateTime?: string;
  endDateTime?: string;
  maxParticipants: number;
  participantIds: string[];
  participants: Participant[];
};

type GroupData = {
  name: string;
  memberIds: string[];
  createdBy?: string;
};

type UserDocData = {
  nickname?: string;
  name?: string;
  avatarColor?: string;
  avatarText?: string;
};

export default function GroupDetail() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { user, profile, loading: profileLoading } = useUserProfile();

  const [asobells, setAsobells] = useState<Asobell[]>([]);
  const [group, setGroup] = useState<GroupData | null>(null);
  const [groupLoading, setGroupLoading] = useState(true);
  const [asobellsLoading, setAsobellsLoading] = useState(true);

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
        console.error("グループデータ取得エラー:", error);
      } finally {
        setGroupLoading(false);
      }
    };

    fetchGroup();
  }, [groupId]);

  useEffect(() => {
    if (!groupId) return;

    const asobellsRef = collection(db, "groups", groupId, "asobells");

    const unsubscribe = onSnapshot(
      asobellsRef,
      async (snapshot) => {
        const listPromises = snapshot.docs.map(async (d) => {
          const raw = d.data() as AsobellRaw;
          const participantIds = raw.participantIds || [];

          const participantsPromises = participantIds.map(async (uid) => {
            try {
              const uSnap = await getDoc(doc(db, "users", uid));
              if (uSnap.exists()) {
                const uData = uSnap.data() as UserDocData;
                const name = uData.nickname || uData.name || "メンバー";
                return {
                  id: uid,
                  initial: uData.avatarText || name.slice(0, 2).toUpperCase(),
                  color: uData.avatarColor || "#8FC6A9",
                };
              }
            } catch (e) {
              console.error("ユーザー取得失敗:", e);
            }
            return { id: uid, initial: "MB", color: "#8FC6A9" };
          });

          const participants = await Promise.all(participantsPromises);

          return {
            id: d.id,
            title: raw.title || "無題のあそベル",
            description: raw.description || "",
            startDateTime: raw.startAt,
            endDateTime: raw.endAt,
            maxParticipants: raw.maxParticipants || 4,
            participantIds,
            participants,
          } as Asobell;
        });

        const resolvedList = await Promise.all(listPromises);
        setAsobells(resolvedList);
        setAsobellsLoading(false);
      },
      (error) => {
        console.error("あそベルデータ取得エラー:", error);
        setAsobellsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [groupId]);

  const myUid = user?.uid || "";
  const myAvatarText = profile?.avatarText || "自分";

  const handleJoin = async (asobellId: string) => {
    if (!myUid || !groupId) return;

    try {
      const asobellRef = doc(db, "groups", groupId, "asobells", asobellId);
      await updateDoc(asobellRef, {
        participantIds: arrayUnion(myUid),
      });
    } catch (error) {
      console.error("参加処理エラー:", error);
    }
  };

  const now = new Date();

  const confirmedAsobells = asobells.filter((a) => {
    const isJoined = a.participantIds.includes(myUid);
    const isFull = a.participantIds.length >= a.maxParticipants;
    const isUpcoming = a.startDateTime ? new Date(a.startDateTime) > now : true;
    return isJoined && isFull && isUpcoming;
  });

  const recruitingAsobells = asobells.filter((a) => {
    const isJoined = a.participantIds.includes(myUid);
    const isFull = a.participantIds.length >= a.maxParticipants;
    return !isJoined && !isFull;
  });

  const joiningAsobells = asobells.filter((a) => {
    const isJoined = a.participantIds.includes(myUid);
    const isFull = a.participantIds.length >= a.maxParticipants;
    return isJoined && !isFull;
  });

  const formatDisplayDate = (rawDate: any): string => {
    if (!rawDate) return "日時未定";

    let d: Date;
    if (typeof rawDate === "object" && typeof rawDate.toDate === "function") {
      d = rawDate.toDate();
    } else {
      d = new Date(rawDate);
    }

    if (isNaN(d.getTime())) {
      return String(rawDate);
    }

    const month = d.getMonth() + 1;
    const date = d.getDate();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");

    return `${month}月${date}日 ${hours}:${minutes}〜`;
  };

  const formatEndTime = (startRaw: any, endRaw: any): string => {
    if (!endRaw) return "";

    let startD: Date;
    if (typeof startRaw === "object" && typeof startRaw.toDate === "function") {
      startD = startRaw.toDate();
    } else {
      startD = new Date(startRaw);
    }

    let endD: Date;
    if (typeof endRaw === "object" && typeof endRaw.toDate === "function") {
      endD = endRaw.toDate();
    } else {
      endD = new Date(endRaw);
    }

    if (isNaN(endD.getTime())) return "";

    const hours = String(endD.getHours()).padStart(2, "0");
    const minutes = String(endD.getMinutes()).padStart(2, "0");

    const isDifferentDay =
      !isNaN(startD.getTime()) &&
      (startD.getFullYear() !== endD.getFullYear() ||
        startD.getMonth() !== endD.getMonth() ||
        startD.getDate() !== endD.getDate());

    if (isDifferentDay) {
      const month = endD.getMonth() + 1;
      const date = endD.getDate();
      return `${month}月${date}日 ${hours}:${minutes}`;
    }

    return `${hours}:${minutes}`;
  };

  if (profileLoading || groupLoading || asobellsLoading) {
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
          onPress={() => router.push("/(tabs)/groups")}
        >
          <Ionicons name="chevron-back" size={20} color="#8B6F4E" />
          <MyText className="text-brown text-xl font-bold">
            グループ一覧に戻る
          </MyText>
        </Pressable>
      </View>

      <Pressable
        className="flex-row items-center gap-4 px-6"
        onPress={() => router.push(`/group/${groupId}/members`)}
      >
        <View className="w-14 h-14 rounded-2xl bg-primaryLight items-center justify-center">
          <Ionicons name="people" size={26} color="#D85A30" />
        </View>
        <View>
          <MyText className="text-dark text-xl font-rounded-bold">
            {group?.name || "グループ名なし"}
          </MyText>
          <View className="flex-row items-center gap-1 mt-1">
            <MyText className="text-textSub text-base font-bold">
              メンバー{group?.memberIds?.length || 0}人
            </MyText>
            <Ionicons name="chevron-forward" size={15} color="#A6A096" />
          </View>
        </View>
      </Pressable>

      <ScrollView
        className="flex-1 mt-3"
        contentContainerClassName="gap-3 px-6 pt-2 pb-24"
        showsVerticalScrollIndicator={false}
      >
        <MyText className="text-brown text-base font-rounded-bold mt-3">
          確定したあそベル一覧
        </MyText>
        {confirmedAsobells.length === 0 ? (
          <View className="bg-card border border-cardBorder rounded-2xl p-5 mt-2 items-center">
            <MyText className="text-label text-base text-center leading-6">
              現在開催予定のあそベルはありません
            </MyText>
          </View>
        ) : (
          <View className="gap-2 mt-2">
            {confirmedAsobells.map((a) => (
              <Pressable
                key={a.id}
                className="bg-primaryLight border border-primary/20 rounded-2xl p-4 flex-row items-center justify-between"
                onPress={() =>
                  router.push(`/asobell/${a.id}?groupId=${groupId}`)
                }
              >
                <View>
                  <MyText className="text-dark text-lg">{a.title}</MyText>
                  <MyText className="text-brown text-base mt-1">
                    {formatDisplayDate(a.startDateTime)}
                    {a.endDateTime
                      ? formatEndTime(a.startDateTime, a.endDateTime)
                      : ""}
                  </MyText>
                </View>
                <Ionicons name="checkmark-circle" size={22} color="#D85A30" />
              </Pressable>
            ))}
          </View>
        )}

        <MyText className="text-brown text-base font-rounded-bold mt-3">
          募集中のあそベル一覧
        </MyText>
        {recruitingAsobells.length === 0 ? (
          <View className="bg-card border border-cardBorder rounded-2xl p-5 mt-2 items-center">
            <MyText className="text-label text-base text-center leading-6">
              現在募集中のあそベルはありません{"\n"}あそベルを作成しましょう！
            </MyText>
          </View>
        ) : (
          <View className="gap-2 mt-2">
            {recruitingAsobells.map((a) => {
              const isJoined = a.participantIds.includes(myUid);
              const isFull = a.participantIds.length >= a.maxParticipants;

              return (
                <Pressable
                  key={a.id}
                  className="bg-card border border-cardBorder rounded-2xl p-4"
                  onPress={() =>
                    router.push(`/asobell/${a.id}?groupId=${groupId}`)
                  }
                >
                  <MyText className="text-dark text-lg">{a.title}</MyText>
                  <MyText className="text-textSub text-base mt-1">
                    {formatDisplayDate(a.startDateTime)}
                    {a.endDateTime
                      ? formatEndTime(a.startDateTime, a.endDateTime)
                      : ""}
                  </MyText>

                  <View className="flex-row items-center justify-between mt-3">
                    <MyText className="text-textSub text-sm">参加者</MyText>
                    <MyText className="text-brown text-sm font-bold">
                      {a.participants.length}/{a.maxParticipants}人
                    </MyText>
                  </View>
                  <View className="h-[6px] bg-inputBorder rounded-full overflow-hidden mt-2">
                    <View
                      className="h-full bg-primary rounded-full"
                      style={{
                        width: `${
                          (a.participants.length / a.maxParticipants) * 100
                        }%`,
                      }}
                    />
                  </View>

                  <View className="flex-row items-center justify-between mt-3">
                    <View className="flex-row items-center gap-1">
                      {a.participants.map((p, idx) => {
                        const isMe = p.id === myUid;
                        return (
                          <View
                            key={`${p.id}-${idx}`}
                            className="w-6 h-6 rounded-full items-center justify-center"
                            style={{ backgroundColor: p.color }}
                          >
                            <MyText className="text-white text-[10px] font-bold">
                              {isMe ? myAvatarText : p.initial}
                            </MyText>
                          </View>
                        );
                      })}
                    </View>

                    <Pressable
                      disabled={isJoined || isFull}
                      onPress={() => handleJoin(a.id)}
                      className={`px-3 py-1.5 rounded-full ${
                        isJoined || isFull ? "bg-inactive" : "bg-primary"
                      }`}
                    >
                      <MyText
                        className={`text-sm font-bold ${
                          isJoined || isFull ? "text-textSub" : "text-white"
                        }`}
                      >
                        {isJoined
                          ? "参加予定 ✓"
                          : isFull
                            ? "満員"
                            : "あそべる！"}
                      </MyText>
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        <MyText className="text-brown text-base font-rounded-bold mt-3">
          参加予定のあそベル一覧
        </MyText>
        {joiningAsobells.length === 0 ? (
          <View className="bg-card border border-cardBorder rounded-2xl p-5 mt-2 items-center">
            <MyText className="text-textSub text-sm text-center leading-6">
              現在参加予定のあそベルはありません{"\n"}参加してみましょう！
            </MyText>
          </View>
        ) : (
          <View className="gap-2 mt-2">
            {joiningAsobells.map((a) => {
              const isJoined = a.participantIds.includes(myUid);
              const isFull = a.participantIds.length >= a.maxParticipants;

              return (
                <Pressable
                  key={a.id}
                  className="bg-card border border-cardBorder rounded-2xl p-4"
                  onPress={() =>
                    router.push(`/asobell/${a.id}?groupId=${groupId}`)
                  }
                >
                  <MyText className="text-dark text-lg">{a.title}</MyText>
                  <MyText className="text-textSub text-base mt-1">
                    {formatDisplayDate(a.startDateTime)}
                    {a.endDateTime
                      ? formatEndTime(a.startDateTime, a.endDateTime)
                      : ""}
                  </MyText>

                  <View className="flex-row items-center justify-between mt-3">
                    <MyText className="text-textSub text-sm">参加者</MyText>
                    <MyText className="text-brown text-sm font-bold">
                      {a.participants.length}/{a.maxParticipants}人
                    </MyText>
                  </View>
                  <View className="h-[6px] bg-inputBorder rounded-full overflow-hidden mt-2">
                    <View
                      className="h-full bg-primary rounded-full"
                      style={{
                        width: `${
                          (a.participants.length / a.maxParticipants) * 100
                        }%`,
                      }}
                    />
                  </View>

                  <View className="flex-row items-center justify-between mt-3">
                    <View className="flex-row items-center gap-1">
                      {a.participants.map((p, idx) => {
                        const isMe = p.id === myUid;
                        return (
                          <View
                            key={`${p.id}-${idx}`}
                            className="w-6 h-6 rounded-full items-center justify-center"
                            style={{ backgroundColor: p.color }}
                          >
                            <MyText className="text-white text-[10px] font-bold">
                              {isMe ? myAvatarText : p.initial}
                            </MyText>
                          </View>
                        );
                      })}
                    </View>

                    <Pressable
                      disabled={isJoined || isFull}
                      onPress={() => handleJoin(a.id)}
                      className={`px-3 py-1.5 rounded-full ${
                        isJoined || isFull ? "bg-inactive" : "bg-primary"
                      }`}
                    >
                      <MyText
                        className={`text-sm font-bold ${
                          isJoined || isFull ? "text-textSub" : "text-white"
                        }`}
                      >
                        {isJoined
                          ? "参加予定 ✓"
                          : isFull
                            ? "満員"
                            : "あそべる！"}
                      </MyText>
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Pressable
        className="absolute right-5 bottom-5 w-[52px] h-[52px] rounded-full bg-dark items-center justify-center"
        onPress={() => router.push(`/asobell/create?groupId=${groupId}`)}
      >
        <View className="w-6 h-6 items-center justify-center">
          <Ionicons name="notifications-outline" size={22} color="#fff" />
          <Ionicons
            name="add"
            size={12}
            color="#fff"
            style={{ position: "absolute", bottom: -2, right: -4 }}
          />
        </View>
      </Pressable>
    </View>
  );
}
