import React from "react";
import { Modal, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MyText } from "@/compornents/MyText";

type Props = {
  visible: boolean;
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function JoinConfirmModal({ visible, title, onConfirm, onCancel }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 bg-black/40 items-center justify-center px-6">
        <Pressable className="absolute inset-0" onPress={onCancel} />

        <View className="bg-card border border-cardBorder rounded-3xl p-6 w-full max-w-[300px] items-center z-10 shadow-lg">
          <View className="mb-3 bg-primaryLight p-4 rounded-full">
            <Ionicons name="notifications" size={36} color="#EF9F27" />
          </View>

          <MyText className="text-dark font-rounded-bold text-lg text-center">
            あそベルを鳴らす？
          </MyText>
          
          <MyText className="text-textSub text-xs text-center mt-2 leading-5">
            「{title}」に参加しよう！
          </MyText>

          <View className="flex-row gap-3 mt-6 w-full">
            <Pressable
              onPress={onCancel}
              className="flex-1 py-3 rounded-full bg-inputBorder items-center"
            >
              <MyText className="text-textSub font-bold text-xs">今はやめとく</MyText>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              className="flex-1 py-3 rounded-full bg-primary items-center"
            >
              <MyText className="text-white font-bold text-xs">あそぶ！✨</MyText>
            </Pressable>
          </View>

        </View>
      </View>
    </Modal>
  );
}