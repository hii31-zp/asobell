/*あそベルのロゴと、新規登録・ログインボタンの表示*/

import { MyText } from "@/compornents/MyText";
import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";

export default function MyComponent() {
  const router = useRouter();

  return (
    <View className="bg-bg p-5 flex-1">
      <View className="">
        <MyText className="">logo.img</MyText>
      </View>
      <View className="justify-center items-center">
        <MyText className="text-5xl font-bold justify-center items-center">
          <MyText className="text-dark">
            あそ
            <MyText className="text-primary">ベル</MyText>
          </MyText>
        </MyText>
      </View>
      <View className="mt-6 gap-3 p-8">
        <Pressable
          className="border-2 border-primary bg-primary active:bg-[#C14C24] h-[58px] px-6 rounded-full items-center justify-center"
          onPress={() => {
            router.push("/signup");
          }}
        >
          <MyText className="text-white font-semibold text-2xl">
            新規登録
          </MyText>
        </Pressable>
        <Pressable
          className="border-2 border-primary bg-primary-light active:bg-white h-[58px] px-6 rounded-full items-center justify-center"
          onPress={() => {
            router.push("/login");
          }}
        >
          <MyText className="text-primary font-semibold text-2xl">
            ログイン
          </MyText>
        </Pressable>
      </View>
    </View>
  );
}
