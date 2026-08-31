/*設定画面*/

import { MyText } from "@/compornents/MyText";
import { Ionicons } from "@expo/vector-icons";
import { useUserProfile } from "../../compornents/useUserProfile";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, View } from "react-native";

type MenuItem = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  danger?: boolean;
  onPress: () => void;
};

export default function SettingsScreen() {
  const router = useRouter();

  const { profile, loading } = useUserProfile();

  const menuItems: MenuItem[] = [
    {
      key: "notification",
      icon: "notifications-outline",
      label: "通知設定",
      onPress: () => router.push("/setting/notification"),
    },
    {
      key: "password",
      icon: "lock-closed-outline",
      label: "パスワードを変更する",
      onPress: () => router.push("/setting/reset"),
    },
    {
      key: "logout",
      icon: "log-out-outline",
      label: "ログアウト",
      onPress: () => router.push("/setting/logout"),
    },
    {
      key: "delete",
      icon: "trash-outline",
      label: "アカウントを削除する",
      danger: true,
      onPress: () => router.push("/setting/delete"),
    },
  ];

  return (
    <View className="bg-bg flex-1">
      <View className="px-6 pt-6 pb-2">
        <MyText className="text-dark text-3xl font-rounded-bold">設定</MyText>
      </View>

      <Pressable
        className="flex-row items-center gap-4 px-6 py-5"
        onPress={() => router.push("/setting/profile")}
      >
        {loading ? (
          <View className="w-14 h-14 rounded-full bg-card items-center justify-center border border-inputBorder">
            <ActivityIndicator size="small" color="#D85A30" />
          </View>
        ) : (
          <View className="w-14 h-14 rounded-full bg-[#7FC7A6] items-center justify-center">
            <MyText className="text-white text-xl font-bold">
              {profile?.avatarText || "?"}
            </MyText>
          </View>
        )}

        <View>
          {loading ? (
            <MyText className="text-label text-base">読み込み中...</MyText>
          ) : (
            <MyText className="text-dark text-xl font-rounded-bold">
              {profile?.nickname || "未設定"}
            </MyText>
          )}
          <MyText className="text-primary text-base font-bold mt-1">
            プロフィールを編集する
          </MyText>
        </View>
      </Pressable>

      <View className="px-8 pt-2">
        {menuItems.map((item, index) => (
          <View key={item.key}>
            <Pressable
              className="flex-row items-center justify-between py-4"
              onPress={item.onPress}
            >
              <View className="flex-row items-center gap-4">
                <Ionicons
                  name={item.icon}
                  size={22}
                  color={item.danger ? "#C94141" : "#5C594F"}
                />
                <MyText
                  className={`text-lg font-bold ${
                    item.danger ? "text-danger" : "text-dark"
                  }`}
                >
                  {item.label}
                </MyText>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#B9B4A8" />
            </Pressable>
            {index < menuItems.length - 1 && (
              <View className="h-[1px] bg-inputBorder" />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}
