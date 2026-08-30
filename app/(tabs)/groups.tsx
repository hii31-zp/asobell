import { MyText } from "@/compornents/MyText";
import { useUserProfile } from "@/compornents/useUserProfile";
import { db } from "@/firebase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
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
  joinedGroupIds?: string[];
  nickname?: string;
  avatarText?: string;
};

export default function GroupsScreen() {
  const router = useRouter();

  const { user, loading: userLoading } = useUserProfile();

  const [groups, setGroups] = useState<Group[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (userLoading || !user?.uid) return;

    const userRef = doc(db, "users", user.uid);

    const unsubUser = onSnapshot(
      userRef,
      (userSnap) => {
        if (!userSnap.exists()) {
          setGroups([]);
          setDataLoading(false);
          return;
        }

        const userData = userSnap.data() as UserDocData;
        const joinedGroupIds = userData.joinedGroupIds || [];

        if (joinedGroupIds.length === 0) {
          setGroups([]);
          setDataLoading(false);
          return;
        }

        const groupUnsubs: (() => void)[] = [];
        const asobellUnsubsMap = new Map<string, () => void>();
        const groupsMap = new Map<string, Group>();

        // 2. joinedGroupIds に含まれる各グループを取得
        joinedGroupIds.forEach((groupId) => {
          const groupRef = doc(db, "groups", groupId);

          const unsubGroup = onSnapshot(
            groupRef,
            (groupSnap) => {
              if (groupSnap.exists()) {
                const data = groupSnap.data() as GroupDocData;
                const memberIdsList = data.memberIds || [];
                const membersList: Member[] =
                  data.members ||
                  memberIdsList.map((id: string) => ({
                    id,
                    name: "メンバー",
                    initial: "MB",
                  }));

                const count =
                  memberIdsList.length > 0
                    ? memberIdsList.length
                    : membersList.length;

                if (asobellUnsubsMap.has(groupId)) {
                  asobellUnsubsMap.get(groupId)?.();
                }

                const asobellsRef = collection(
                  db,
                  "groups",
                  groupId,
                  "asobells"
                );
                const unsubAsobell = onSnapshot(
                  asobellsRef,
                  (asobellSnap) => {
                    const activeCount = asobellSnap.size;

                    const groupItem: Group = {
                      id: groupId,
                      name: data.name || "名称未設定",
                      members: membersList,
                      memberCount: count,
                      activeAsobellCount: activeCount,
                    };

                    groupsMap.set(groupId, groupItem);
                    setGroups(Array.from(groupsMap.values()));
                    setDataLoading(false);
                  },
                  (err) => {
                    console.error("Asobell error:", err);
                    setDataLoading(false);
                  }
                );

                asobellUnsubsMap.set(groupId, unsubAsobell);
              } else {
                groupsMap.delete(groupId);
                setGroups(Array.from(groupsMap.values()));
                setDataLoading(false);
              }
            },
            (err) => {
              console.error("Group error:", err);
              setDataLoading(false);
            }
          );

          groupUnsubs.push(unsubGroup);
        });

        return () => {
          groupUnsubs.forEach((unsub) => unsub());
          asobellUnsubsMap.forEach((unsub) => unsub());
        };
      },
      (err) => {
        console.error("User fetch error:", err);
        setDataLoading(false);
      }
    );

    return () => {
      unsubUser();
    };
  }, [userLoading, user?.uid]);

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
          <View className="items-center justify-center py-12">
            <MyText className="text-textSub text-base">
              所属しているグループがありません
            </MyText>
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
        className="absolute right-5 bottom-5 w-[52px] h-[52px] rounded-full bg-dark items-center justify-center"
        onPress={() => router.push("/group/create")}
      >
        <Ionicons name="person-add" size={22} color="#fff" />
      </Pressable>
    </View>
  );
}