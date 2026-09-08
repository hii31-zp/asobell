import { MyText } from "@/compornents/MyText";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";

type Notification = {
  id: string;
  asobellTitle: string;
  time: string;
  read: boolean;
  asobellId: string;
  groupId: string;
};

type Props = {
  notifications: Notification[];
  onPressNotification: (asobellId: string, groupId: string) => void;
  onOpen: () => void;
};

export function NotificationButton({
  notifications,
  onPressNotification,
  onOpen
}: Props) {

  const [showModal, setShowModal] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const openModal = () => {
    setShowModal(true);
    onOpen();
  };

  return (
    <>
      <Pressable onPress={openModal} className="relative">
        <Ionicons
          name="chatbubble-ellipses-outline"
          size={26}
          color="#8B6F4E"
        />
        {unreadCount > 0 && (
          <View
            style={{
              position: "absolute",
              top: 2,
              left: -2,
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: "#D85A30",
            }}
          />
        )}
      </Pressable>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/40"
          onPress={() => setShowModal(false)}
        >
          <View
            style={{
              position: "absolute",
              top: 64,
              right: 16,
              width: 320,
              maxHeight: 480,
              backgroundColor: "#fff",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: "#EADFCB",
              }}
            >
              <MyText className="text-dark font-rounded-bold text-xl">
                通知
              </MyText>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {notifications.length === 0 ? (
                <View style={{ padding: 24, alignItems: "center" }}>
                  <MyText className="text-textSub text-base">
                    通知はありません
                  </MyText>
                </View>
              ) : (
                notifications.map((n) => (
                  <Pressable
                    key={n.id}
                    onPress={() => onPressNotification(n.asobellId, n.groupId)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: "#EADFCB",
                      flexDirection: "row",
                      gap: 8,
                    }}
                  >
                    <Ionicons
                      name="notifications"
                      size={16}
                      color="#EF9F27"
                      style={{ marginTop: 2 }}
                    />
                    <View style={{ flex: 1 }}>
                      <MyText className="text-dark text-base leading-5">
                        「{n.asobellTitle}」の人数がそろいました🎉
                      </MyText>
                      <MyText className="text-textSub text-[10px] mt-1">
                        {n.time}
                      </MyText>
                    </View>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
