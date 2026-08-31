import { MyText } from "@/compornents/MyText";
import { useUserProfile } from "@/compornents/useUserProfile";
import { auth, db } from "@/firebase";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";

type Member = {
  id: string;
  name: string;
  initial: string;
};

type Group = {
  id: string;
  name: string;
  memberCount: number;
  members: Member[];
  activeAsobellCount: number;
};

type GroupDocData = {
  name?: string;
  memberIds?: string[];
  members?: Member[];
};

type UserDocData = {
  avatarText?: string;
  nickname?: string;
  name?: string;
};

export default function GroupsScreen() {
  const router = useRouter();
  const { user, profile, loading: userLoading } = useUserProfile();

  const [groups, setGroups] = useState<Group[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const myUid = auth.currentUser?.uid || user?.uid || "";
  const myAvatarText = profile?.avatarText || "??";

  useFocusEffect(
    useCallback(() => {
      if (!myUid) {
        setDataLoading(false);
        return;
      }

      setDataLoading(true);

      const q = query(
        collection(db, "groups"),
        where("memberIds", "array-contains", myUid)
      );

      const unsubGroupQuery = onSnapshot(
        q,
        async (snapshot) => {
          if (snapshot.empty) {
            setGroups([]);
            setDataLoading(false);
            return;
          }

          const asobellUnsubsMap = new Map<string, () => void>();
          const groupsMap = new Map<string, Group>();
          let loadedCount = 0;

          const groupPromises = snapshot.docs.map(async (groupDoc) => {
            const groupId = groupDoc.id;
            const data = groupDoc.data() as GroupDocData;
            const memberIdsList = data.memberIds || [];

            const membersListPromises = memberIdsList.map(async (uid: string) => {
              if (uid === myUid) {
                return {
                  id: uid,
                  name: profile?.nickname || "自分",
                  initial: myAvatarText,
                };
              }

              try {
                const uSnap = await getDoc(doc(db, "users", uid));
                if (uSnap.exists()) {
                  const uData = uSnap.data() as UserDocData;
                  return {
                    id: uid,
                    name: uData.nickname || uData.name || "メンバー",
                    initial: uData.avatarText || "MB",
                  };
                }
              } catch (e) {
                console.error(`ユーザー情報取得失敗 (${uid}):`, e);
              }

              return {
                id: uid,
                name: "メンバー",
                initial: "MB",
              };
            });

            const resolvedMembers = await Promise.all(membersListPromises);
            const count = memberIdsList.length > 0 ? memberIdsList.length : resolvedMembers.length;

            const asobellsRef = collection(db, "groups", groupId, "asobells");

            if (asobellUnsubsMap.has(groupId)) {
              asobellUnsubsMap.get(groupId)?.();
            }

            const unsubAsobell = onSnapshot(
              asobellsRef,
              (asobellSnap) => {
                const activeCount = asobellSnap.size;

                groupsMap.set(groupId, {
                  id: groupId,
                  name: data.name || "名称未設定",
                  members: resolvedMembers,
                  memberCount: count,
                  activeAsobellCount: activeCount,
                });

                setGroups(Array.from(groupsMap.values()));

                loadedCount++;
                if (loadedCount >= snapshot.docs.length) {
                  setDataLoading(false);
                }
              },
              (err) => {
                console.error("Asobell error:", err);
                setDataLoading(false);
              }
            );

            asobellUnsubsMap.set(groupId, unsubAsobell);
          });

          await Promise.all(groupPromises);

          return () => {
            asobellUnsubsMap.forEach((unsub) => unsub());
          };
        },
        (err) => {
          console.error("Group error:", err);
          setDataLoading(false);
        }
      );

      return () => {
        unsubGroupQuery();
      };
    }, [myUid, myAvatarText, profile?.nickname])
  );

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

          <Pressable
            onPress={() => router.push("/group/join")}
            className="flex-row items-center bg-card border border-cardBorder px-3 py-1.5 rounded-full"
          >
            <Ionicons name="add" size={20} color="#D85A30" />
            <MyText className="text-dark font-bold text-sm ml-1">
              IDで参加
            </MyText>
          </Pressable>
        </View>

        <MyText className="text-textSub text-base mt-1 pb-2">
          仲間と気軽に、集まろう
        </MyText>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-3 px-6 pt-3 pb-24"
        showsVerticalScrollIndicator={false}
      >
        {groups.length === 0 ? (
          <View className="items-center justify-center py-12 gap-4">
            <MyText className="text-textSub text-base text-center">
              所属しているグループがありません{"\n"}
              グループを作成するか、IDで参加しましょう！
            </MyText>

            <View className="flex-row gap-3 mt-2">
              <Pressable
                onPress={() => router.push("/group/create")}
                className="bg-primary px-4 py-2.5 rounded-full flex-row items-center gap-1"
              >
                <Ionicons name="add" size={18} color="#fff" />
                <MyText className="text-white font-bold text-sm">作成する</MyText>
              </Pressable>

              <Pressable
                onPress={() => router.push("/group/join")}
                className="bg-card border border-cardBorder px-4 py-2.5 rounded-full flex-row items-center gap-1"
              >
                <Ionicons name="key-outline" size={16} color="#333" />
                <MyText className="text-dark font-bold text-sm">IDで参加</MyText>
              </Pressable>
            </View>
          </View>
        ) : (
          groups.map((g) => {
            const displayLimit = g.memberCount <= 3 ? g.memberCount : 2;
            const visibleMembers = g.members.slice(0, displayLimit);
            const remainingCount = g.memberCount - visibleMembers.length;

            return (
              <Pressable
                key={g.id}
                className="bg-card border border-cardBorder rounded-2xl p-4 flex-row items-center gap-3"
                onPress={() => router.push(`/group/${g.id}`)}
              >
                <View className="w-14 h-14 rounded-2xl bg-primaryLight items-center justify-center flex-shrink-0">
                  <Ionicons name="people" size={24} color="#D85A30" />
                </View>

                <View className="flex-1">
                  <MyText className="text-dark text-xl my-1 font-bold">
                    {g.name}
                  </MyText>
                  <View className="flex-row items-center gap-1 mt-2">
                    {visibleMembers.map((m) => (
                      <View
                        key={m.id}
                        className="w-8 h-8 rounded-full items-center justify-center bg-[#8FC6A9]"
                      >
                        <MyText className="text-white text-[12px] font-bold">
                          {m.initial}
                        </MyText>
                      </View>
                    ))}

                    {remainingCount > 0 && (
                      <MyText className="text-textSub text-base ml-2">
                        他{remainingCount}人
                      </MyText>
                    )}
                  </View>
                </View>

                <View
                  className={`px-2.5 py-1 rounded-full flex-shrink-0 ${
                    g.activeAsobellCount > 0
                      ? "bg-primaryLight"
                      : "bg-inactive"
                  }`}
                >
                  <MyText
                    className={`text-base font-bold ${
                      g.activeAsobellCount > 0
                        ? "text-primary"
                        : "text-textSub"
                    }`}
                  >
                    {g.activeAsobellCount > 0
                      ? `募集中 ${g.activeAsobellCount}件`
                      : "募集なし"}
                  </MyText>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <Pressable
        className="absolute right-5 bottom-5 w-[52px] h-[52px] rounded-full bg-dark items-center justify-center shadow-lg"
        onPress={() => router.push("/group/create")}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}