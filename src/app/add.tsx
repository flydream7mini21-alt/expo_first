import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router"; // ★ 追加
import { useState } from "react";
import {
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type ScheduleItem = {
  date: string;
  time: string;
  weekday: string;
  company: string;
  place: string;
  jobType: string;
  step: string;
  interviewType: string;
};

const interviewSteps = ["first", "second", "third", "final"];
const weekdayNames = ["日", "月", "火", "水", "木", "金", "土"];

const years = [2026, 2027, 2028];
const months = Array.from({ length: 12 }, (_, i) => i + 1);
const days = Array.from({ length: 31 }, (_, i) => i + 1);
const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const minutes = ["00", "15", "30", "45"];

const AddPage = () => {
  const router = useRouter(); // ★ 追加

  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState(today.getDate());

  const [selectedHour, setSelectedHour] = useState("10");
  const [selectedMinute, setSelectedMinute] = useState("00");

  const [company, setCompany] = useState("");
  const [jobType, setJobType] = useState("");
  const [step, setStep] = useState("");
  const [interviewType, setInterviewType] = useState("");

  const currentDateObj = new Date(selectedYear, selectedMonth - 1, selectedDay);
  const weekdayIndex = currentDateObj.getDay();
  const weekdayText = `(${weekdayNames[weekdayIndex]}曜日)`;

  const warekiText = `令和${selectedYear - 2018}年 ${selectedMonth}月`;

  const googleMapUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    company,
  )}`;

  const saveData = async () => {
    const formattedDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
    const formattedTime = `${selectedHour}:${selectedMinute}`;

    const newData: ScheduleItem = {
      date: formattedDate,
      time: formattedTime,
      weekday: weekdayText,
      company,
      place: company,
      jobType,
      step,
      interviewType,
    };

    try {
      const existing = await AsyncStorage.getItem("schedule");
      const scheduleList: ScheduleItem[] = existing ? JSON.parse(existing) : [];

      scheduleList.push(newData);

      await AsyncStorage.setItem("schedule", JSON.stringify(scheduleList));

      Alert.alert("完了", "保存しました！");

      // ★ 登録後にホーム画面へ自動で戻る
      setTimeout(() => {
        router.push("/add_complete");
      }, 1000);
    } catch (error) {
      console.error("予定の保存に失敗しました", error);
      Alert.alert("エラー", "保存に失敗しました");
    }
  };

  const openMap = async () => {
    try {
      await Linking.openURL(googleMapUrl);
    } catch {
      Alert.alert("エラー", "Google Mapsを開けませんでした");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>予定追加ページ</Text>

      <Text style={styles.label}>開始日時</Text>

      <View style={styles.dateTimeInlineContainer}>
        <View style={styles.datePickerSection}>
          <Text style={styles.subLabel}>年月日選択</Text>
          <View style={styles.selectorsRow}>
            <View style={styles.pickerWrapperSmall}>
              <Picker
                selectedValue={selectedYear}
                onValueChange={(val) => setSelectedYear(Number(val))}
              >
                {years.map((y) => (
                  <Picker.Item key={y} label={`${y}年`} value={y} />
                ))}
              </Picker>
            </View>

            <View style={styles.pickerWrapperSmall}>
              <Picker
                selectedValue={selectedMonth}
                onValueChange={(val) => setSelectedMonth(Number(val))}
              >
                {months.map((m) => (
                  <Picker.Item key={m} label={`${m}月`} value={m} />
                ))}
              </Picker>
            </View>

            <View style={styles.pickerWrapperSmall}>
              <Picker
                selectedValue={selectedDay}
                onValueChange={(val) => setSelectedDay(Number(val))}
              >
                {days.map((d) => (
                  <Picker.Item key={d} label={`${d}日`} value={d} />
                ))}
              </Picker>
            </View>
          </View>

          <Text style={styles.previewText}>
            {selectedYear}/{selectedMonth}/{selectedDay} {weekdayText} (
            {warekiText})
          </Text>
        </View>

        <View style={styles.timePickerSection}>
          <Text style={styles.subLabel}>時間選択</Text>
          <View style={styles.selectorsRow}>
            <View style={styles.pickerWrapperSmall}>
              <Picker
                selectedValue={selectedHour}
                onValueChange={(val) => setSelectedHour(String(val))}
              >
                {hours.map((h) => (
                  <Picker.Item key={h} label={`${h}時`} value={h} />
                ))}
              </Picker>
            </View>

            <View style={styles.pickerWrapperSmall}>
              <Picker
                selectedValue={selectedMinute}
                onValueChange={(val) => setSelectedMinute(String(val))}
              >
                {minutes.map((min) => (
                  <Picker.Item key={min} label={`${min}分`} value={min} />
                ))}
              </Picker>
            </View>
          </View>

          <Text style={styles.previewText}>
            {selectedHour}:{selectedMinute}
          </Text>
        </View>
      </View>

      <Text style={styles.label}>会社名（場所）</Text>
      <TextInput
        value={company}
        onChangeText={setCompany}
        style={styles.input}
        placeholder="例：株式会社〇〇 または 住所・ビル名"
      />

      <TouchableOpacity style={styles.mapButton} onPress={openMap}>
        <Text style={styles.buttonText}>Google Map で検索</Text>
      </TouchableOpacity>

      <Text style={styles.label}>職種名</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={jobType} onValueChange={setJobType}>
          <Picker.Item label="選択してください" value="" />
          <Picker.Item label="システムエンジニア" value="SE" />
          <Picker.Item label="プログラマー" value="PG" />
          <Picker.Item label="インフラエンジニア" value="Infra" />
          <Picker.Item label="ネットワークエンジニア" value="Network" />
          <Picker.Item label="Webエンジニア" value="Web" />
          <Picker.Item label="アプリエンジニア" value="App" />
          <Picker.Item label="ITコンサルタント" value="Consultant" />
        </Picker>
      </View>

      <Text style={styles.label}>選考ステップ</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={step} onValueChange={setStep}>
          <Picker.Item label="選択してください" value="" />
          <Picker.Item label="Webテスト" value="webtest" />
          <Picker.Item label="適性検査" value="tekisei" />
          <Picker.Item label="一次面接" value="first" />
          <Picker.Item label="二次面接" value="second" />
          <Picker.Item label="三次面接" value="third" />
          <Picker.Item label="最終面接" value="final" />
          <Picker.Item label="結果" value="result" />
          <Picker.Item label="インターン" value="intern" />
          <Picker.Item label="研修" value="training" />
        </Picker>
      </View>

      {interviewSteps.includes(step) && (
        <>
          <Text style={styles.label}>面接方法</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={interviewType}
              onValueChange={setInterviewType}
            >
              <Picker.Item label="選択してください" value="" />
              <Picker.Item label="Zoom" value="zoom" />
              <Picker.Item label="対面" value="face" />
            </Picker>
          </View>
        </>
      )}

      <TouchableOpacity style={styles.submitButton} onPress={saveData}>
        <Text style={styles.buttonText}>登録する</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f1f8e9",
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    marginTop: 15,
    marginBottom: 5,
  },
  subLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 5,
  },
  dateTimeInlineContainer: {
    flexDirection: "row",
    gap: 15,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d0d0d0",
  },
  datePickerSection: {
    flex: 3,
  },
  timePickerSection: {
    flex: 2,
  },
  selectorsRow: {
    flexDirection: "row",
    gap: 5,
  },
  pickerWrapperSmall: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d0d0d0",
    borderRadius: 6,
    backgroundColor: "#fafafa",
    height: 45,
    justifyContent: "center",
  },
  previewText: {
    marginTop: 8,
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  input: {
    width: "100%",
    padding: 10,
    fontSize: 16,
    marginTop: 5,
    borderWidth: 1,
    borderColor: "#d0d0d0",
    borderRadius: 6,
    backgroundColor: "#fff",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#d0d0d0",
    borderRadius: 6,
    backgroundColor: "#fff",
  },
  mapButton: {
    marginTop: 10,
    padding: 12,
    backgroundColor: "#0288d1",
    borderRadius: 6,
    alignItems: "center",
  },
  submitButton: {
    marginTop: 30,
    padding: 12,
    backgroundColor: "#4caf50",
    borderRadius: 6,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default AddPage;
