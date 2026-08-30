//退出ボタンはまだ実装していない
import { MyText } from "@/compornents/MyText";
import { useUserProfile } from "@/compornents/useUserProfile";
import { db } from "@/firebase";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  arrayRemove,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";

type Member = {
  id: string;
  name: string;
  initial: string;
  color: string;
  isMe?: boolean;
};

type GroupData = {
  name: string;
  memberIds?: string[];
};

type UserDocData = {
  nickname?: string;
  name?: string;
  avatarColor?: string;
  avatarText?: string;
};

export default function GroupMembers() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();

  const { user, loading: userLoading } = useUserProfile();

  const [groupName, setGroupName] = useState("グループ");
  const [editingName, setEditingName] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const myUid = user?.uid;

  useEffect(() => {
    if (userLoading || !groupId) return;

    const groupRef = doc(db, "groups", groupId);
    const unsubscribe = onSnapshot(
      groupRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as GroupData;
          setGroupName(data.name || "グループ");

          const memberIds = data.memberIds || [];

          const memberPromises = memberIds.map(async (uid) => {
            try {
              const userSnap = await getDoc(doc(db, "users", uid));
              if (userSnap.exists()) {
                const userData = userSnap.data() as UserDocData;
                const name = userData.nickname || userData.name || "メンバー";
                const initial =
                  userData.avatarText || name.slice(0, 2).toUpperCase();

                return {
                  id: uid,
                  name,
                  initial,
                  color: userData.avatarColor || "#8FC6A9",
                  isMe: uid === myUid,
                };
              }
            } catch (e) {
              console.error(`ユーザー ${uid} の取得に失敗:`, e);
            }

            return {
              id: uid,
              name: "メンバー",
              initial: "MB",
              color: "#8FC6A9",
              isMe: uid === myUid,
            };
          });

          const fetchedMembers = await Promise.all(memberPromises);
          setMembers(fetchedMembers);
        } else {
          console.error("グループが見つかりません");
        }
        setDataLoading(false);
      },
      (error) => {
        console.error("グループ取得エラー:", error);
        setDataLoading(false);
      }
    );

    return () => unsubscribe();
  }, [groupId, userLoading, myUid]);

  const handleSaveGroupName = async () => {
    setEditingName(false);
    if (!groupId || !groupName.trim()) return;

    try {
      const groupRef = doc(db, "groups", groupId);
      await updateDoc(groupRef, {
        name: groupName.trim(),
      });
    } catch (error) {
      console.error("グループ名更新エラー:", error);
      Alert.alert("エラー", "グループ名の更新に失敗しました");
    }
  };

  const confirmRemove = (member: Member) => {
    const isMe = member.id === myUid;
    Alert.alert(
      isMe ? "グループを退出しますか？" : "本当に削除しますか？",
      isMe
        ? "退出するとこのグループのあそベルが見れなくなります。"
        : `${member.name}さんをグループから削除します。この操作は取り消せません。`,
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: isMe ? "退出する" : "削除する",
          style: "destructive",
          onPress: async () => {
            if (!groupId) return;

            try {
              const groupRef = doc(db, "groups", groupId);
              const userRef = doc(db, "users", member.id);

              await updateDoc(groupRef, {
                memberIds: arrayRemove(member.id),
              });

              await updateDoc(userRef, {
                joinedGroupIds: arrayRemove(groupId),
              });

              if (isMe) {
                router.replace("/(tabs)/groups");
              }
            } catch (error) {
              console.error("削除/退出処理エラー:", error);
              Alert.alert("エラー", "処理に失敗しました");
            }
          },
        },
      ]
    );
  };

  if (userLoading || dataLoading) {
    return (
      <View className="bg-bg flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#D85A30" />
      </View>
    );
  }

  const me = members.find((m) => m.id === myUid);

  return (
    <View className="bg-bg flex-1">
      <View className="p-4 pt-6">
        <Pressable
          className="flex-row items-center gap-1"
          onPress={() => router.push(`/group/${groupId}`)}
        >
          <Ionicons name="chevron-back" size={20} color="#8B6F4E" />
          <MyText className="text-brown text-xl font-bold">
            グループ詳細に戻る
          </MyText>
        </Pressable>
      </View>

      <View className="px-6">
        <MyText className="text-textSub text-base font-bold my-1.5">
          グループ名
        </MyText>
        <View className="bg-card border border-inputBorder rounded-2xl px-4 py-3 flex-row items-center justify-between">
          {editingName ? (
            <TextInput
              className="flex-1 text-dark text-base font-bold"
              value={groupName}
              onChangeText={setGroupName}
              autoFocus
              onBlur={() => setEditingName(false)}
              returnKeyType="done"
              onSubmitEditing={handleSaveGroupName}
            />
          ) : (
            <MyText className="text-dark text-base font-bold">
              {groupName}
            </MyText>
          )}
          <Pressable
            onPress={() => {
              if (editingName) {
                handleSaveGroupName();
              } else {
                setEditingName(true);
              }
            }}
          >
            <Ionicons
              name={editingName ? "checkmark" : "pencil"}
              size={18}
              color="#B8925A"
            />
          </Pressable>
        </View>
      </View>

      <View className="flex-row items-center justify-between px-6 pt-6 pb-2">
        <MyText className="text-brown text-lg font-rounded-bold">
          メンバー {members.length}人
        </MyText>
        <Pressable
          className="flex-row items-center gap-1 bg-ochreLight border border-inputBorder px-3 py-1.5 rounded-full"
          onPress={() => router.push(`/group/${groupId}/invite`)}
        >
          <Ionicons name="add" size={13} color="#B8925A" />
          <MyText className="text-ochre text-base font-bold">招待</MyText>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6"
        showsVerticalScrollIndicator={false}
      >
        {members.map((m) => (
          <View
            key={m.id}
            className="flex-row items-center justify-between py-3 border-t border-inputBorder"
          >
            <View className="flex-row items-center gap-3">
              <View
                className="w-9 h-9 rounded-full items-center justify-center"
                style={{ backgroundColor: m.color }}
              >
                <MyText className="text-white text-base font-bold">
                  {m.initial}
                </MyText>
              </View>
              <View>
                <MyText className="text-dark text-lg font-bold">
                  {m.name}
                </MyText>
              </View>
            </View>

            {!m.isMe && (
              <Pressable onPress={() => confirmRemove(m)}>
                <Ionicons
                  name="remove-circle-outline"
                  size={20}
                  color="#C9A98A"
                />
              </Pressable>
            )}
          </View>
        ))}

        {me && (
          <Pressable
            onPress={() => confirmRemove(me)}
            className="items-center mt-6 mb-6"
          >
            <MyText className="text-danger text-lg font-bold">
              このグループを退出する
            </MyText>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}