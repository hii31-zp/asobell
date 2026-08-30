import { MyText } from "@/compornents/MyText";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";

export default function NotificationSettings() {
  const router = useRouter();

  return (
    <View className="bg-bg flex-1">
      <View className="px-4 pt-6">
        <Pressable
          className="flex-row items-center gap-1"
          onPress={() => router.push("/settings")}
        >
          <Ionicons name="chevron-back" size={20} color="#8B6F4E" />
          <MyText className="text-brown text-xl ">設定に戻る</MyText>
        </Pressable>
      </View>

      <View className="flex-1 items-center justify-center px-10">
        <View className="w-20 h-20 rounded-full bg-primaryLight items-center justify-center mb-5">
          <Ionicons name="construct-outline" size={32} color="#D85A30" />
        </View>
        <MyText className="text-dark text-xl font-rounded-bold text-center">
          通知設定機能を実装中...
        </MyText>
        <MyText className="text-textSub text-base text-center mt-2 leading-5">
          もうしばらくお待ちください
        </MyText>
      </View>
    </View>
  );
}