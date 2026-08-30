/*グループ一覧(app/(tabs)/groups.tsxページの右下のボタンから遷移。
グループを作成する画面*/

/*グループ一覧(app/(tabs)/groups.tsxページの右下のボタンから遷移。
グループに招待する画面*/

import { MyText } from "@/compornents/MyText";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";

export default function MyComponent() {
  const inviteCode = "TEST-test";
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const [groupName, setGroupName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const validate = (groupNameVal: string) => {
    if (groupNameVal.trim().length === 0) {
      return "グループ名を入力してください";
    }
    return "";
  };

  const handleSignup = () => {
    const error = validate(groupName);
    if (error) {
      setErrorMessage(error);
      return;
    }
    setErrorMessage("");
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(inviteCode);
    setCopied(true);
  };

  return (
    <View className="bg-bg p-6 pt-8 flex-1">
      <View>
        <Pressable
          className="flex-row items-center gap-1"
          onPress={() => {
            router.push("../");
          }}
        >
          <Ionicons name="chevron-back" size={20} color="#8B6F4E" />
          <MyText className="text-brown text-xl font-bold ">グループ一覧に戻る</MyText>
        </Pressable>
      </View>
      <View className="pt-6 p-3">
        <View className="gap-2 pb-8">
          <MyText className="text-dark text-2xl font-rounded-bold">
            グループを作成する
          </MyText>
          <MyText className="pt-3 text-textSub font-rounded-bold text-base">
            グループ作成後、招待コードを共有して友達を招待できます
          </MyText>
        </View>
        <View>
          <View className="gap-4">
            <View className="gap-1.5 pb-1">
              <MyText className="text-label text-lg font-rounded-bold">
                グループ名
              </MyText>
              <TextInput
                className="bg-card border border-inputBorder rounded-2xl px-4 py-3 text-dark"
                placeholder="例：大学の友達"
                placeholderTextColor="#B9B4A8"
                value={groupName}
                onChangeText={setGroupName}
              />
            </View>
          </View>
          <View className="min-h-[20px] pl-6">
            {errorMessage !== "" && (
              <View>
                <MyText className="text-danger text-sm">{errorMessage}</MyText>
              </View>
            )}
          </View>
          <View className="pt-2 pr-4 pl-4">
            <Pressable
              className="border-2 border-primary bg-primary active:bg-[#C14C24] h-[58px] px-4 rounded-full font-rounded items-center justify-center w-full"
              onPress={handleSignup}
            >
              <MyText className="text-white font-semibold text-xl">
                作成する
              </MyText>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
