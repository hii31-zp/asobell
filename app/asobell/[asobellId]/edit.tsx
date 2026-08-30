import { MyText } from "@/compornents/MyText";
import { db } from "@/firebase";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";

export default function AsobellEdit() {
  const router = useRouter();

  const { asobellId, groupId } = useLocalSearchParams<{
    asobellId: string;
    groupId?: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [asobellTitle, setAsobellTitle] = useState("");
  const [description, setDescription] = useState("");
  const [place, setPlace] = useState("");
  const [capacity, setCapacity] = useState<number>(4);

  const [startDate, setStartDate] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);

  const [endDate, setEndDate] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const [showCapacityPicker, setShowCapacityPicker] = useState(false);

  useEffect(() => {
    const fetchAsobellData = async () => {
      if (!asobellId || !groupId) {
        console.warn("IDが不足しています:", { asobellId, groupId });
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, "groups", groupId, "asobells", asobellId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setAsobellTitle(data.title || "");
          setDescription(data.description || "");
          setPlace(data.location || "");
          setCapacity(data.maxParticipants || data.capacity || 4);

          if (data.startAt) {
            const d = new Date(data.startAt);
            if (!isNaN(d.getTime())) {
              const yyyy = d.getFullYear();
              const mm = String(d.getMonth() + 1).padStart(2, "0");
              const dd = String(d.getDate()).padStart(2, "0");
              setStartDate(`${yyyy}-${mm}-${dd}`);
              setStartTime(d);
            }
          } else {
            // 従来の startDate / startTime フィールドの互換処理
            if (data.startDate) setStartDate(data.startDate);
            if (data.startTime) {
              setStartTime(
                data.startTime?.toDate
                  ? data.startTime.toDate()
                  : new Date(data.startTime)
              );
            }
          }

          if (data.endAt) {
            const d = new Date(data.endAt);
            if (!isNaN(d.getTime())) {
              const yyyy = d.getFullYear();
              const mm = String(d.getMonth() + 1).padStart(2, "0");
              const dd = String(d.getDate()).padStart(2, "0");
              setEndDate(`${yyyy}-${mm}-${dd}`);
              setEndTime(d);
            }
          } else {
            if (data.endDate) setEndDate(data.endDate);
            if (data.endTime) {
              setEndTime(
                data.endTime?.toDate
                  ? data.endTime.toDate()
                  : new Date(data.endTime)
              );
            }
          }
        }
      } catch (error) {
        console.error("データ取得エラー:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAsobellData();
  }, [asobellId, groupId]);

  const validate = (title: string) => {
    if (title.trim().length === 0) {
      return "タイトルを入力してください";
    }
    return "";
  };

  const handleUpdate = async () => {
    const error = validate(asobellTitle);
    if (error) {
      setErrorMessage(error);
      return;
    }
    setErrorMessage("");

    if (!asobellId || !groupId) {
      alert("エラー: グループIDまたはあそベルIDが取得できませんでした");
      return;
    }

    try {
      setSaving(true);
      const docRef = doc(db, "groups", groupId, "asobells", asobellId);

      let startAtString: string | null = null;
      if (startDate) {
        let timeStr = "00:00";
        if (startTime) {
          const hh = String(startTime.getHours()).padStart(2, "0");
          const mm = String(startTime.getMinutes()).padStart(2, "0");
          timeStr = `${hh}:${mm}`;
        }
        startAtString = `${startDate}T${timeStr}:00`;
      }

      await updateDoc(docRef, {
        title: asobellTitle,
        description: description || "",
        location: place || "",
        maxParticipants: capacity,
        capacity: capacity,
        startAt: startAtString,
        startDate: startDate || null,
        updatedAt: new Date().toISOString(),
      });

      router.back();
    } catch (error) {
      console.error("更新エラー:", error);
      alert("更新に失敗しました。編集権限がないかパスが正しくありません。");
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <View className="bg-bg flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#D85A30" />
      </View>
    );
  }

  return (
    <View className="bg-bg flex-1">
      <View>
        <View className="p-4 pt-6">
          <Pressable
            className="flex-row items-center gap-1"
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={20} color="#8B6F4E" />
            <MyText className="text-brown text-xl font-bold">戻る</MyText>
          </Pressable>
        </View>
        <MyText className="text-dark text-2xl font-rounded-bold pl-6 pb-2">
          あそベルを編集
        </MyText>
      </View>

      <ScrollView
        className="bg-bg flex-1"
        contentContainerClassName="gap-4 p-4 pb-12"
        showsVerticalScrollIndicator={false}
      >
        <View className="pl-5 pr-5">
          <View className="gap-1">
            <MyText className="text-label text-lg font-rounded-bold">
              タイトル
            </MyText>
            <TextInput
              className="bg-card border border-inputBorder rounded-2xl px-4 py-3 text-dark"
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

        <View className="pl-5 pr-5">
          <View className="gap-1">
            <MyText className="text-label text-lg font-rounded-bold">
              説明（任意）
            </MyText>
            <TextInput
              className="bg-card border border-inputBorder rounded-2xl px-4 py-3 text-dark"
              placeholder="ひとことメッセージ"
              placeholderTextColor="#B9B4A8"
              value={description}
              onChangeText={setDescription}
            />
          </View>
        </View>

        <View className="pl-5 pr-5">
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <MyText className="text-label text-lg font-rounded-bold">
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

            <View className="flex-row items-center gap-2">
              <MyText className="text-label text-lg font-bold w-10">開始</MyText>

              <Pressable
                onPress={() => setShowStartCalendar(true)}
                className="flex-1"
              >
                <View className="bg-card border border-inputBorder rounded-2xl px-4 py-3">
                  <MyText
                    className={startDate ? "text-dark" : "text-placeholder"}
                  >
                    {startDate || "日付を選択"}
                  </MyText>
                </View>
              </Pressable>

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

              <View className="flex-1 relative z-20">
                <Pressable
                  onPress={() => setShowStartTimePicker(true)}
                  className="flex-1"
                >
                  <View className="bg-card border border-inputBorder rounded-2xl px-4 py-3">
                    <MyText
                      className={startTime ? "text-dark" : "text-placeholder"}
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
              </View>
            </View>
          </View>
        </View>

        <View className="pl-5 pr-5">
          <View className="gap-1">
            <MyText className="text-label text-lg font-rounded-bold">
              場所（任意）
            </MyText>
            <TextInput
              className="bg-card border border-inputBorder rounded-2xl px-4 py-3 text-dark"
              placeholder="例：渋谷駅 東口"
              placeholderTextColor="#B9B4A8"
              value={place}
              onChangeText={setPlace}
            />
          </View>
        </View>

        <View className="pl-5 pr-5 pt-2 pb-3">
          <View className="gap-5 flex-row items-center">
            <MyText className="text-label text-lg font-rounded-bold">
              募集人数(自分を含める)
            </MyText>
            <Pressable onPress={() => setShowCapacityPicker(true)}>
              <View className="bg-card border border-inputBorder w-[80px] rounded-2xl px-4 py-3 items-center">
                <MyText
                  className={capacity ? "text-dark font-bold" : "text-placeholder"}
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
              <View className="bg-white rounded-2xl overflow-hidden w-[300px] items-center py-2">
                <Picker
                  selectedValue={capacity}
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

        <View className="pr-8 pl-8 mt-4">
          <Pressable
            disabled={saving}
            className="border-2 border-primary bg-primary active:bg-[#C14C24] h-[58px] px-6 rounded-full items-center justify-center w-full"
            onPress={handleUpdate}
          >
            <MyText className="text-white font-semibold text-xl">
              {saving ? "保存中..." : "変更を保存"}
            </MyText>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}