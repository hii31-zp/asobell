import { MyText } from "@/compornents/MyText";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";

import { auth, db } from "@/firebase";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

type Group = {
  id: string;
  name: string;
};

export default function CreateAsobellScreen() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [showGroupPicker, setShowGroupPicker] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [asobellTitle, setAsobellTitle] = useState("");
  const [description, setDescription] = useState("");
  const [place, setPlace] = useState("");
  const [capacity, setCapacity] = useState<number | null>(null);

  const [startDate, setStartDate] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);

  const [endDate, setEndDate] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const [showCapacityPicker, setShowCapacityPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const fetchUserGroups = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setLoadingGroups(false);
        return;
      }

      try {
        const q = query(
          collection(db, "groups"),
          where("memberIds", "array-contains", currentUser.uid),
        );

        const querySnapshot = await getDocs(q);
        const fetchedGroups: Group[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedGroups.push({
            id: doc.id,
            name: data.name || "名称未設定グループ",
          });
        });

        setGroups(fetchedGroups);
        if (fetchedGroups.length > 0) {
          setSelectedGroup(fetchedGroups[0]);
        }
      } catch (err) {
        console.error("グループ一覧の取得に失敗しました:", err);
      } finally {
        setLoadingGroups(false);
      }
    };

    fetchUserGroups();
  }, []);

  const validate = () => {
    if (asobellTitle.trim().length === 0) {
      return "タイトルを入力してください";
    }
    return "";
  };

  const combineDateAndTime = (
    dateStr: string | null,
    timeObj: Date | null,
  ): Date | null => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    if (timeObj) {
      date.setHours(timeObj.getHours(), timeObj.getMinutes(), 0, 0);
    } else {
      date.setHours(0, 0, 0, 0);
    }
    return date;
  };

  const handleCreate = async () => {
    const error = validate();
    if (error) {
      setErrorMessage(error);
      return;
    }

    if (!selectedGroup) {
      setErrorMessage("グループを選択してください");
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("エラー", "ログイン情報が見つかりません。");
      return;
    }

    setErrorMessage("");
    setLoading(true);

    try {
      const startAtDate = combineDateAndTime(startDate, startTime);
      const endAtDate = combineDateAndTime(endDate, endTime);

      const payload = {
        title: asobellTitle.trim(),
        description: description.trim(),
        location: place.trim(),
        capacity: capacity ?? 4,
        maxParticipants: capacity ?? 4,
        startAt: startAtDate ? startAtDate.toISOString() : null,
        endAt: endAtDate ? endAtDate.toISOString() : null,
        startDate: startDate || null,
        status: "open",
        groupId: selectedGroup.id,
        createdBy: currentUser.uid,
        participantIds: [currentUser.uid],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(
        collection(db, "groups", selectedGroup.id, "asobells"),
        payload,
      );

      Alert.alert("成功", "あそベルを作成しました！", [
        {
          text: "OK",
          onPress: () => router.push("/"),
        },
      ]);
    } catch (err: any) {
      console.error("Firestore Error: ", err);
      Alert.alert(
        "エラー",
        "あそベルの作成に失敗しました。時間をおいて再度お試しください。",
      );
    } finally {
      setLoading(false);
    }
  };

  const compactCalendarTheme = {
    textDayFontSize: 13,
    textMonthFontSize: 14,
    textDayHeaderFontSize: 11,
    "stylesheet.calendar.header": {
      header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 2,
      },
      monthText: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#2d4150",
      },
    },
    "stylesheet.day.basic": {
      base: {
        width: 28,
        height: 28,
        alignItems: "center",
        justifyContent: "center",
      },
      text: {
        fontSize: 13,
        marginTop: 2,
      },
    },
  };

  return (
    <View className="bg-bg flex-1">
      <View className="pt-2">
        <View className="p-4">
          <Pressable
            className="flex-row items-center gap-1"
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={20} color="#8B6F4E" />
            <MyText className="text-brown text-xl font-bold">戻る</MyText>
          </Pressable>
        </View>
        <MyText className="text-dark text-2xl font-rounded-bold pl-6 pb-2">
          あそベルを作成
        </MyText>
      </View>

      <ScrollView
        className="bg-bg flex-1"
        contentContainerClassName="gap-5 p-4 pb-12"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-3">
          <View className="gap-1">
            <MyText className="text-label text-base font-rounded-bold">
              タイトル
            </MyText>
            <TextInput
              className="bg-card border border-inputBorder rounded-2xl px-4 py-3 text-dark text-base"
              placeholder="例：夜ごはんいかない？"
              placeholderTextColor="#B9B4A8"
              value={asobellTitle}
              onChangeText={setAsobellTitle}
            />
            {errorMessage !== "" && (
              <MyText className="text-danger text-sm">{errorMessage}</MyText>
            )}
          </View>
        </View>

        <View className="px-3">
          <View className="gap-1">
            <MyText className="text-label text-base font-rounded-bold">
              対象グループ
            </MyText>
            <Pressable
              onPress={() => {
                if (groups.length > 0) {
                  setShowGroupPicker(true);
                }
              }}
              disabled={loadingGroups || groups.length === 0}
            >
              <View className="bg-card border border-inputBorder rounded-2xl px-4 py-3 flex-row items-center justify-between">
                <MyText
                  className={
                    selectedGroup
                      ? "text-dark text-base"
                      : "text-[#B9B4A8] text-base"
                  }
                >
                  {loadingGroups
                    ? "グループを読み込み中..."
                    : groups.length === 0
                      ? "所属グループがありません"
                      : selectedGroup?.name}
                </MyText>
                {groups.length > 0 && (
                  <Ionicons name="chevron-down" size={18} color="#B9B4A8" />
                )}
              </View>
            </Pressable>
          </View>
        </View>

        <Modal
          visible={showGroupPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowGroupPicker(false)}
        >
          <Pressable
            className="flex-1 bg-black/40 items-center justify-center"
            onPress={() => setShowGroupPicker(false)}
          >
            <View className="bg-white rounded-2xl overflow-hidden w-[300px] p-4">
              <MyText className="text-dark font-bold text-lg mb-3 text-center">
                グループを選択
              </MyText>
              {groups.map((group) => (
                <Pressable
                  key={group.id}
                  onPress={() => {
                    setSelectedGroup(group);
                    setShowGroupPicker(false);
                  }}
                  className={`p-3 rounded-xl mb-1 flex-row justify-between items-center ${
                    selectedGroup?.id === group.id ? "bg-orange-50" : ""
                  }`}
                >
                  <MyText
                    className={
                      selectedGroup?.id === group.id
                        ? "text-primary font-bold"
                        : "text-dark"
                    }
                  >
                    {group.name}
                  </MyText>
                  {selectedGroup?.id === group.id && (
                    <Ionicons name="checkmark" size={18} color="#C14C24" />
                  )}
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Modal>

        <View className="px-3">
          <View className="gap-1">
            <MyText className="text-label text-base font-rounded-bold">
              説明（任意）
            </MyText>
            <TextInput
              className="bg-card border border-inputBorder rounded-2xl px-4 py-3 text-dark text-base"
              placeholder="ひとことメッセージ"
              placeholderTextColor="#B9B4A8"
              value={description}
              onChangeText={setDescription}
            />
          </View>
        </View>

        <View className="px-3">
          <View className="gap-2">
            <View className="flex-row items-center justify-between mb-1">
              <MyText className="text-label text-base font-rounded-bold">
                日時（任意）
              </MyText>
              {(startDate || startTime || endDate || endTime) && (
                <Pressable
                  onPress={() => {
                    setStartDate(null);
                    setStartTime(null);
                    setEndDate(null);
                    setEndTime(null);
                  }}
                >
                  <MyText className="text-danger text-xs underline">
                    クリア
                  </MyText>
                </Pressable>
              )}
            </View>

            <View className="gap-1">
              <MyText className="text-label text-xs font-bold">開始</MyText>
              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={() => setShowStartCalendar(true)}
                  className="flex-1"
                >
                  <View className="bg-card border border-inputBorder rounded-2xl px-4 py-3 items-center justify-center">
                    <MyText
                      className={
                        startDate
                          ? "text-dark text-base"
                          : "text-[#B9B4A8] text-base"
                      }
                    >
                      {startDate ? startDate : "日付を選択"}
                    </MyText>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => setShowStartTimePicker(true)}
                  className="flex-1"
                >
                  <View className="bg-card border border-inputBorder rounded-2xl px-4 py-3 items-center justify-center">
                    <MyText
                      className={
                        startTime
                          ? "text-dark text-base"
                          : "text-[#B9B4A8] text-base"
                      }
                    >
                      {startTime
                        ? startTime.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "時刻を選択"}
                    </MyText>
                  </View>
                </Pressable>
              </View>
            </View>

            <Modal
              visible={showStartCalendar}
              transparent
              animationType="fade"
              onRequestClose={() => setShowStartCalendar(false)}
            >
              <Pressable
                className="flex-1 bg-black/40 items-center justify-center"
                onPress={() => setShowStartCalendar(false)}
              >
                <View className="bg-white rounded-2xl overflow-hidden w-[320px]">
                  <Calendar
                    theme={compactCalendarTheme}
                    onDayPress={(day) => {
                      setStartDate(day.dateString);
                      setShowStartCalendar(false);
                    }}
                  />
                </View>
              </Pressable>
            </Modal>

            <Modal
              visible={showStartTimePicker}
              transparent
              animationType="fade"
              onRequestClose={() => setShowStartTimePicker(false)}
            >
              <Pressable
                className="flex-1 bg-black/40 items-center justify-center"
                onPress={() => setShowStartTimePicker(false)}
              >
                <View className="bg-white rounded-2xl overflow-hidden w-[300px] items-center py-4">
                  <DateTimePicker
                    value={startTime || new Date()}
                    mode="time"
                    themeVariant="light"
                    display="spinner"
                    onChange={(event, selectedTime) => {
                      setShowStartTimePicker(false);
                      if (selectedTime) setStartTime(selectedTime);
                    }}
                  />
                </View>
              </Pressable>
            </Modal>

            <View className="gap-1 mt-1">
              <MyText className="text-label text-xs font-bold">終了</MyText>
              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={() => setShowEndCalendar(true)}
                  className="flex-1"
                >
                  <View className="bg-card border border-inputBorder rounded-2xl px-4 py-3 items-center justify-center">
                    <MyText
                      className={
                        endDate
                          ? "text-dark text-base"
                          : "text-[#B9B4A8] text-base"
                      }
                    >
                      {endDate ? endDate : "日付を選択"}
                    </MyText>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => setShowEndTimePicker(true)}
                  className="flex-1"
                >
                  <View className="bg-card border border-inputBorder rounded-2xl px-4 py-3 items-center justify-center">
                    <MyText
                      className={
                        endTime
                          ? "text-dark text-base"
                          : "text-[#B9B4A8] text-base"
                      }
                    >
                      {endTime
                        ? endTime.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "時刻を選択"}
                    </MyText>
                  </View>
                </Pressable>
              </View>
            </View>

            <Modal
              visible={showEndCalendar}
              transparent
              animationType="fade"
              onRequestClose={() => setShowEndCalendar(false)}
            >
              <Pressable
                className="flex-1 bg-black/40 items-center justify-center"
                onPress={() => setShowEndCalendar(false)}
              >
                <View className="bg-white rounded-2xl overflow-hidden w-[320px]">
                  <Calendar
                    theme={compactCalendarTheme}
                    onDayPress={(day) => {
                      setEndDate(day.dateString);
                      setShowEndCalendar(false);
                    }}
                  />
                </View>
              </Pressable>
            </Modal>

            <Modal
              visible={showEndTimePicker}
              transparent
              animationType="fade"
              onRequestClose={() => setShowEndTimePicker(false)}
            >
              <Pressable
                className="flex-1 bg-black/40 items-center justify-center"
                onPress={() => setShowEndTimePicker(false)}
              >
                <View className="bg-white rounded-2xl overflow-hidden w-[300px] items-center py-4">
                  <DateTimePicker
                    value={endTime || new Date()}
                    mode="time"
                    themeVariant="light"
                    display="spinner"
                    onChange={(event, selectedTime) => {
                      setShowEndTimePicker(false);
                      if (selectedTime) setEndTime(selectedTime);
                    }}
                  />
                </View>
              </Pressable>
            </Modal>
          </View>
        </View>

        <View className="px-3">
          <View className="gap-1">
            <MyText className="text-label text-base font-rounded-bold">
              場所（任意）
            </MyText>
            <TextInput
              className="bg-card border border-inputBorder rounded-2xl px-4 py-3 text-dark text-base"
              placeholder="例：渋谷駅 東口"
              placeholderTextColor="#B9B4A8"
              value={place}
              onChangeText={setPlace}
            />
          </View>
        </View>

        <View className="px-3">
          <View className="flex-row items-center justify-between">
            <MyText className="text-label text-base font-rounded-bold">
              募集人数(自分を含める)
            </MyText>
            <Pressable onPress={() => setShowCapacityPicker(true)}>
              <View className="bg-card border border-inputBorder rounded-2xl px-4 py-3 min-w-[90px] items-center justify-center">
                <MyText
                  className={
                    capacity
                      ? "text-dark text-base"
                      : "text-[#B9B4A8] text-base"
                  }
                >
                  {capacity ? `${capacity}人` : "例：4人"}
                </MyText>
              </View>
            </Pressable>
          </View>

          <Modal
            visible={showCapacityPicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowCapacityPicker(false)}
          >
            <Pressable
              className="flex-1 bg-black/40 items-center justify-center"
              onPress={() => setShowCapacityPicker(false)}
            >
              <View className="bg-white rounded-2xl overflow-hidden w-[300px] items-center py-4">
                <Picker
                  selectedValue={capacity ?? 2}
                  onValueChange={(value) => setCapacity(value)}
                  itemStyle={{ color: "#2C2C2A", fontSize: 18 }}
                  style={{ width: "100%" }}
                >
                  {Array.from({ length: 15 }, (_, i) => i + 2).map((num) => (
                    <Picker.Item key={num} label={`${num}人`} value={num} />
                  ))}
                </Picker>
                <Pressable
                  onPress={() => setShowCapacityPicker(false)}
                  className="bg-primary rounded-full px-6 py-2 mt-2"
                >
                  <MyText className="text-white font-bold text-sm">完了</MyText>
                </Pressable>
              </View>
            </Pressable>
          </Modal>
        </View>

        <View className="px-3 pt-4">
          <Pressable
            className={`border-2 border-primary bg-primary active:bg-[#C14C24] h-[58px] px-6 rounded-full items-center justify-center w-full ${
              loading ? "opacity-50" : ""
            }`}
            onPress={handleCreate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <MyText className="text-white font-semibold text-xl">作成</MyText>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
