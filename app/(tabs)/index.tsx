/*募集中のあそベル一覧が表示される*/

import { MyText } from "@/compornents/MyText";
import { NotificationButton } from "@/compornents/NotificationButton";
import { useUserProfile } from "@/compornents/useUserProfile";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";

type Asobell = {
  id: string;
  title: string;
  date: string;
  startDateTime: string;
  capacity: number;
  participants: { id: string; initial: string; color: string }[];
};

// 仮データ（後でFirestoreから取得する部分に差し替える）
const INITIAL_ASOBELLS: Asobell[] = [
  {
    id: "1",
    title: "夜ご飯いかない？☕️",
    date: "9月18日（水）19:00〜",
    startDateTime: "2026-09-18T19:00:00",
    capacity: 4,
    participants: [
      { id: "1", initial: "YK", color: "#F5C77E" },
      { id: "2", initial: "MF", color: "#9B8DE0" },
    ],
  },
  {
    id: "2",
    title: "週末カラオケ行きたい",
    date: "9月21日（土）14:00〜",
    startDateTime: "2026-09-21T14:00:00",
    capacity: 5,
    participants: [{ id: "3", initial: "SK", color: "#E88BA6" }],
  },
  {
    id: "3",
    title: "ボードゲームしたい！🎲",
    date: "9月19日（木）18:00〜",
    startDateTime: "2026-09-19T18:00:00",
    capacity: 4,
    participants: [
      { id: "4", initial: "RY", color: "#999999" },
      { id: "5", initial: "HN", color: "#E8A16F" },
      { id: "6", initial: "SY", color: "#222222" },
    ],
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [asobells, setAsobells] = useState<Asobell[]>(INITIAL_ASOBELLS);

  const { user, profile, loading } = useUserProfile();

  const myUid = user?.uid || "";
  const myAvatarText = profile?.avatarText || "?";

  const handleJoin = (id: string) => {
    if (!myUid) return;

    setAsobells((prev) =>
      prev.map((a) =>
        a.id === id && !a.participants.some((p) => p.id === myUid)
          ? {
              ...a,
              participants: [
                ...a.participants,
                { id: myUid, initial: myAvatarText, color: "#7FC7A6" },
              ],
            }
          : a
      )
    );
  };

  const now = new Date();

  const confirmedAsobells = asobells.filter((a) => {
    const isJoined = a.participants.some((p) => p.id === myUid);
    const isFull = a.participants.length >= a.capacity;
    const isUpcoming = a.startDateTime
      ? new Date(a.startDateTime) > now
      : false;
    return isJoined && isFull && isUpcoming;
  });

  const joiningAsobells = asobells.filter((a) => {
    const isJoined = a.participants.some((p) => p.id === myUid );
    const isFull = a.participants.length >= a.capacity;
    return isJoined && !isFull;
  });

  const recruitingAsobells = asobells.filter((a) => {
    const isJoined = a.participants.some((p) => p.id === myUid);
    const isFull = a.participants.length >= a.capacity;
    return !isJoined && !isFull;
  });

  if (loading) {
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
          <NotificationButton />
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
                className="bg-primaryLight border border-primary/20 rounded-2xl p-4 flex-row items-center justify-between"
                onPress={() => router.push(`/asobell/${a.id}`)}
              >
                <View>
                  <MyText className="text-dark text-lg font-rouded-bold">
                    {a.title}
                  </MyText>
                  <MyText className="text-brown text-base mt-1">{a.date}</MyText>
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
              const isJoined = a.participants.some((p) => p.id === myUid );
              const isFull = a.participants.length >= a.capacity;

              return (
                <Pressable
                  key={a.id}
                  className="bg-card border border-cardBorder rounded-2xl p-4"
                  onPress={() => router.push(`/asobell/${a.id}`)}
                >
                  <MyText className="text-dark text-lg font-rouded-bold">
                    {a.title}
                  </MyText>
                  <MyText className="text-textSub text-base mt-1">
                    {a.date}
                  </MyText>

                  <View className="flex-row items-center justify-between mt-3">
                    <MyText className="text-textSub text-sm">参加者</MyText>
                    <MyText className="text-brown text-sm font-bold">
                      {a.participants.length}/{a.capacity}人
                    </MyText>
                  </View>
                  <View className="h-[6px] bg-inputBorder rounded-full overflow-hidden mt-2">
                    <View
                      className="h-full bg-primary rounded-full"
                      style={{
                        width: `${(a.participants.length / a.capacity) * 100}%`,
                      }}
                    />
                  </View>

                  <View className="flex-row items-center justify-between mt-3">
                    <View className="flex-row items-center gap-1">
                      {a.participants.map((p) => {
                        const isMe = p.id === myUid;
                        return (
                          <View
                            key={p.id}
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
              const isJoined = a.participants.some((p) => p.id === myUid );
              const isFull = a.participants.length >= a.capacity;
              return (
                <Pressable
                  key={a.id}
                  className="bg-card border border-cardBorder rounded-2xl p-4"
                  onPress={() => router.push(`/asobell/${a.id}`)}
                >
                  <MyText className="text-dark text-lg font-bold">
                    {a.title}
                  </MyText>
                  <MyText className="text-textSub text-base mt-1">
                    {a.date}
                  </MyText>

                  <View className="flex-row items-center justify-between mt-3">
                    <MyText className="text-textSub text-sm">参加者</MyText>
                    <MyText className="text-brown text-sm font-bold">
                      {a.participants.length}/{a.capacity}人
                    </MyText>
                  </View>
                  <View className="h-[6px] bg-inputBorder rounded-full overflow-hidden mt-2">
                    <View
                      className="h-full bg-primary rounded-full"
                      style={{
                        width: `${(a.participants.length / a.capacity) * 100}%`,
                      }}
                    />
                  </View>

                  <View className="flex-row items-center justify-between mt-3">
                    <View className="flex-row items-center gap-1">
                      {a.participants.map((p) => (
                        <View
                          key={p.id}
                          className="w-6 h-6 rounded-full items-center justify-center"
                          style={{ backgroundColor: p.color }}
                        >
                          <MyText className="text-white text-[10px] font-bold">
                            {p.initial}
                          </MyText>
                        </View>
                      ))}
                    </View>
                    <Pressable
                      disabled={isJoined || isFull}
                      onPress={() => {
                        handleJoin(a.id);
                      }}
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
