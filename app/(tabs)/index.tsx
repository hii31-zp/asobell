// app/(tabs)/index.tsx

import { MyText } from "@/compornents/MyText";
import { NotificationButton } from "@/compornents/NotificationButton";
import { useUserProfile } from "@/compornents/useUserProfile";
import { auth, db } from "@/firebase";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";

type Participant = {
  id: string;
  initial: string;
};

type Asobell = {
  id: string;
  groupId: string;
  title: string;
  date: string;
  startDateTime: string;
  endDateTime?: string;
  capacity: number;
  participants: Participant[];
  participantIds: string[];
  filledAt?: string;
  notificationReadBy?: string[];
};

type UserDocData = {
  avatarText?: string;
};

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

export default function HomeScreen() {
  const router = useRouter();
  const { user, profile, loading: userLoading } = useUserProfile();
  const [asobells, setAsobells] = useState<Asobell[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const myUid = auth.currentUser?.uid || user?.uid || "";
  const myAvatarText = profile?.avatarText || "??";

  const formatElapsedTime = (filledAt?: string): string => {
    if (!filledAt) return "";
    const filled = new Date(filledAt);
    if (isNaN(filled.getTime())) return "";

    const diffMs = Date.now() - filled.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return "たった今";
    if (diffMin < 60) return `${diffMin}分前`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}時間前`;
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay}日前`;
  };

  const maxedAsobells = asobells.filter((a) => {
    const ids = a.participantIds || [];
    return ids.length >= (a.capacity || 0);
  });

  const notifications = maxedAsobells.map((a) => ({
    id: a.id,
    asobellTitle: a.title,
    time: formatElapsedTime(a.filledAt),
    read: (a.notificationReadBy || []).includes(myUid),
    asobellId: a.id,
    groupId: a.groupId,
  }));

  const markAsRead = async (asobellId: string, groupId: string) => {
    if (!myUid) return;
    try {
      const asobellRef = doc(db, "groups", groupId, "asobells", asobellId);
      await updateDoc(asobellRef, {
        notificationReadBy: arrayUnion(myUid),
      });
    } catch (e) {
      console.error("既読処理エラー:", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!myUid) {
        setDataLoading(false);
        return;
      }

      setDataLoading(true);

      const joinedGroupIds: string[] = profile?.joinedGroupIds || [];

      if (joinedGroupIds.length === 0) {
        setAsobells([]);
        setDataLoading(false);
        return;
      }

      try {
        const unsubscribes: (() => void)[] = [];
        const groupAsobellsMap: { [groupId: string]: Asobell[] } = {};

        const updateAllAsobells = () => {
          const all = Object.values(groupAsobellsMap).flat();
          setAsobells(all);
          setDataLoading(false);
        };

        joinedGroupIds.forEach((groupId) => {
          const asobellColRef = collection(db, "groups", groupId, "asobells");

          const unsub = onSnapshot(
            asobellColRef,
            async (snapshot) => {
              const listPromises = snapshot.docs.map(async (docSnap) => {
                const data = docSnap.data();

                const uids: string[] = Array.isArray(data.participantIds)
                  ? data.participantIds
                  : Array.isArray(data.participantUids)
                    ? data.participantUids
                    : [];

                const participantsPromises = uids.map(async (uid) => {
                  if (uid === myUid) {
                    return {
                      id: uid,
                      initial: myAvatarText,
                    };
                  }

                  try {
                    const uSnap = await getDoc(doc(db, "users", uid));
                    if (uSnap.exists()) {
                      const uData = uSnap.data() as UserDocData;
                      return {
                        id: uid,
                        initial: uData.avatarText || "MB",
                      };
                    }
                  } catch (e) {
                    console.error(`avatarText取得失敗 (${uid}):`, e);
                  }

                  return {
                    id: uid,
                    initial: "MB",
                  };
                });

                const participants = await Promise.all(participantsPromises);

                const rawStartDateTime =
                  data.startDateTime || data.startAt || data.date || "";
                const rawEndDateTime = data.endDateTime || data.endAt || "";

                return {
                  id: docSnap.id,
                  groupId: groupId,
                  title: data.title || "あそベル",
                  date: formatDisplayDate(rawStartDateTime),
                  startDateTime: rawStartDateTime,
                  endDateTime: rawEndDateTime,
                  capacity: data.capacity || data.maxParticipants || 4,
                  participantIds: uids,
                  participants,
                };
              });

              const resolvedList = await Promise.all(listPromises);
              
              groupAsobellsMap[groupId] = resolvedList;
              updateAllAsobells();
            },
            (error) => {
              console.error(`Group ${groupId} Asobells Listener Error:`, error);
              setDataLoading(false);
            }
          );

          unsubscribes.push(unsub);
        });

        return () => {
          unsubscribes.forEach((unsub) => unsub());
        };
      } catch (e) {
        console.error("Setup Error:", e);
        setDataLoading(false);
      }
    }, [myUid, myAvatarText, profile?.joinedGroupIds]),
  );

  const goToDetail = (asobellId: string, groupId: string) => {
    if (!groupId) {
      console.warn("groupIdが存在しません:", asobellId);
    }
    router.push(`/asobell/${asobellId}?groupId=${groupId}`);
  };

  const handleJoin = async (
    groupId: string,
    asobellId: string,
    currentCount: number,
    capacity: number,
  ) => {
    if (!myUid || !groupId) return;
    try {
      const asobellRef = doc(db, "groups", groupId, "asobells", asobellId);
      const willBeFull = currentCount + 1 >= capacity;

      await updateDoc(asobellRef, {
        participantIds: arrayUnion(myUid),
        ...(willBeFull ? { filledAt: new Date().toISOString() } : {}),
      });
    } catch (e) {
      console.error("Join error:", e);
    }
  };

  const now = new Date();

  const confirmedAsobells = asobells.filter((a) => {
    const ids = a.participantIds || [];
    const isJoined = ids.includes(myUid);
    const isFull = ids.length >= (a.capacity || 0);
    const isUpcoming = a.startDateTime ? new Date(a.startDateTime) > now : true;
    return isJoined && isFull && isUpcoming;
  });

  const joiningAsobells = asobells.filter((a) => {
    const ids = a.participantIds || [];
    const isJoined = ids.includes(myUid);
    const isFull = ids.length >= (a.capacity || 0);
    return isJoined && !isFull;
  });

  const recruitingAsobells = asobells.filter((a) => {
    const ids = a.participantIds || [];
    const isJoined = ids.includes(myUid);
    const isFull = ids.length >= (a.capacity || 0);
    return !isJoined && !isFull;
  });

  if (userLoading || dataLoading) {
    return (
      <View className="bg-bg flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#D85A30" />
      </View>
    );
  }

  return (
    <View className="bg-bg flex-1">
      <View className="px-6 pt-8">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <MyText className="text-dark text-3xl font-rounded-bold">
              あそ
              <MyText className="text-primary font-rounded-bold">ベル</MyText>
            </MyText>
            <Ionicons
              name="notifications"
              size={18}
              color="#EF9F27"
              style={{ marginLeft: 6 }}
            />
          </View>
          <NotificationButton
            notifications={notifications}
            onPressNotification={(asobellId, groupId) => {
              router.push(`/asobell/${asobellId}?groupId=${groupId}`);
            }}
            onOpen={() => {
              maxedAsobells.forEach((a) => {
                if (!(a.notificationReadBy || []).includes(myUid)) {
                  markAsRead(a.id, a.groupId);
                }
              });
            }}
          />
        </View>
        <MyText className="text-textSub text-base mt-1">
          仲間と気軽に、集まろう
        </MyText>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-3 px-6 pt-4 pb-24"
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
                className="bg-primaryLight border border-primary/20 rounded-2xl p-4 flex-row items-center justify-between active:opacity-70"
                onPress={() => goToDetail(a.id, a.groupId)}
              >
                <View>
                  <MyText className="text-dark text-lg font-rounded-bold">
                    {a.title}
                  </MyText>
                  <MyText className="text-brown text-base mt-1">
                    {a.date}
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
              const ids = a.participantIds || [];
              const isJoined = ids.includes(myUid);
              const isFull = ids.length >= (a.capacity || 0);

              return (
                <Pressable
                  key={a.id}
                  className="bg-card border border-cardBorder rounded-2xl p-4 active:opacity-80"
                  onPress={() => goToDetail(a.id, a.groupId)}
                >
                  <MyText className="text-dark text-lg font-bold">
                    {a.title}
                  </MyText>
                  <MyText className="text-textSub text-base mt-1">
                    {a.date}
                    {a.endDateTime
                      ? formatEndTime(a.startDateTime, a.endDateTime)
                      : ""}
                  </MyText>

                  <View className="flex-row items-center justify-between mt-3">
                    <MyText className="text-textSub text-sm">参加者</MyText>
                    <MyText className="text-brown text-sm font-bold">
                      {ids.length}/{a.capacity}人
                    </MyText>
                  </View>
                  <View className="h-[6px] bg-inputBorder rounded-full overflow-hidden mt-2">
                    <View
                      className="h-full bg-primary rounded-full"
                      style={{
                        width: `${(ids.length / (a.capacity || 1)) * 100}%`,
                      }}
                    />
                  </View>

                  <View className="flex-row items-center justify-between mt-3">
                    <View className="flex-row items-center gap-1">
                      {(a.participants || []).map((p) => (
                        <View
                          key={p.id}
                          className="w-6 h-6 rounded-full items-center justify-center"
                          style={{ backgroundColor: "#8FC6A9" }}
                        >
                          <MyText className="text-white text-[10px] font-bold">
                            {p.initial}
                          </MyText>
                        </View>
                      ))}
                    </View>

                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        if (!isJoined && !isFull) {
                          handleJoin(a.groupId, a.id, ids.length, a.capacity);
                        } else {
                          goToDetail(a.id, a.groupId);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-full active:opacity-70 ${
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
              const ids = a.participantIds || [];
              const isJoined = ids.includes(myUid);
              const isFull = ids.length >= (a.capacity || 0);

              return (
                <Pressable
                  key={a.id}
                  className="bg-card border border-cardBorder rounded-2xl p-4 active:opacity-80"
                  onPress={() => goToDetail(a.id, a.groupId)}
                >
                  <MyText className="text-dark text-lg font-bold">
                    {a.title}
                  </MyText>
                  <MyText className="text-textSub text-base mt-1">
                    {a.date}
                    {a.endDateTime
                      ? formatEndTime(a.startDateTime, a.endDateTime)
                      : ""}
                  </MyText>

                  <View className="flex-row items-center justify-between mt-3">
                    <MyText className="text-textSub text-sm">参加者</MyText>
                    <MyText className="text-brown text-sm font-bold">
                      {ids.length}/{a.capacity}人
                    </MyText>
                  </View>
                  <View className="h-[6px] bg-inputBorder rounded-full overflow-hidden mt-2">
                    <View
                      className="h-full bg-primary rounded-full"
                      style={{
                        width: `${(ids.length / (a.capacity || 1)) * 100}%`,
                      }}
                    />
                  </View>

                  <View className="flex-row items-center justify-between mt-3">
                    <View className="flex-row items-center gap-1">
                      {(a.participants || []).map((p) => (
                        <View
                          key={p.id}
                          className="w-6 h-6 rounded-full items-center justify-center"
                          style={{ backgroundColor: "#8FC6A9" }}
                        >
                          <MyText className="text-white text-[10px] font-bold">
                            {p.initial}
                          </MyText>
                        </View>
                      ))}
                    </View>

                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        goToDetail(a.id, a.groupId);
                      }}
                      className={`px-3 py-1.5 rounded-full active:opacity-70 ${
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
        className="absolute right-5 bottom-5 w-[52px] h-[52px] rounded-full bg-dark items-center justify-center active:opacity-80"
        onPress={() => router.push("/asobell/create")}
      >
        <View className="w-6 h-6 items-center justify-center">
          <Ionicons name="notifications-outline" size={22} color="#fff" />
          <View
            style={{ position: "absolute", bottom: -4, right: -4 }}
            className="rounded-full font-rounded-bold w-4 h-4 items-center justify-center"
          >
            <Ionicons name="add" size={10} color="#fff" />
          </View>
        </View>
      </Pressable>
    </View>
  );
}