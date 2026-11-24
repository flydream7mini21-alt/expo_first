import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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

type SubSchedule = {
  date: string;
  time: string;
  jobType: string;
  step: string;
  company?: string;
  place?: string;
  interviewType?: string;
  result?: string;
};

type ScheduleItem = {
  date: string;
  time: string;
  company: string;
  place: string;
  jobType: string;
  step: string;
  interviewType?: string;
  result?: string;
  hasExtra?: boolean;
  subSchedules?: SubSchedule[];
};

type DateTimePickerProps = {
  year: number;
  month: number;
  day: number;
  hour: string;
  minute: string;
  onYearChange: (value: number) => void;
  onMonthChange: (value: number) => void;
  onDayChange: (value: number) => void;
  onHourChange: (value: string) => void;
  onMinuteChange: (value: string) => void;
};

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);
const months = Array.from({ length: 12 }, (_, i) => i + 1);
const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const minutes = ["00", "15", "30", "45"];

const interviewSteps = ["first", "second", "third", "final"];

const jobTypes = [
  { label: "システムエンジニア", value: "SE" },
  { label: "プログラマー", value: "PG" },
  { label: "インフラエンジニア", value: "Infra" },
  { label: "ネットワークエンジニア", value: "Network" },
  { label: "Webエンジニア", value: "Web" },
  { label: "アプリエンジニア", value: "App" },
  { label: "ITコンサルタント", value: "Consultant" },
];

const selectionSteps = [
  { label: "Webテスト", value: "webtest" },
  { label: "適性検査", value: "tekisei" },
  { label: "一次面接", value: "first" },
  { label: "二次面接", value: "second" },
  { label: "三次面接", value: "third" },
  { label: "最終面接", value: "final" },
  { label: "結果", value: "result" },
  { label: "インターン", value: "intern" },
  { label: "研修", value: "training" },
];

const getDaysInMonth = (year: number, month: number) =>
  new Date(year, month, 0).getDate();

const formatDate = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const parseDate = (value: string) => {
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value);

  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    if (
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= getDaysInMonth(year, month)
    ) {
      return { year, month, day };
    }
  }

  const today = new Date();
  return {
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    day: today.getDate(),
  };
};

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  year,
  month,
  day,
  hour,
  minute,
  onYearChange,
  onMonthChange,
  onDayChange,
  onHourChange,
  onMinuteChange,
}) => {
  const yearOptions = years.includes(year)
    ? years
    : [...years, year].sort((a, b) => a - b);

  return (
    <>
      <View style={styles.row}>
        <View style={styles.pickerWrapperSmall}>
          <Picker
            selectedValue={year}
            onValueChange={(value) => {
              const nextYear = Number(value);
              onYearChange(nextYear);
              onDayChange(Math.min(day, getDaysInMonth(nextYear, month)));
            }}
          >
            {yearOptions.map((value) => (
              <Picker.Item key={value} label={`${value}年`} value={value} />
            ))}
          </Picker>
        </View>

        <View style={styles.pickerWrapperSmall}>
          <Picker
            selectedValue={month}
            onValueChange={(value) => {
              const nextMonth = Number(value);
              onMonthChange(nextMonth);
              onDayChange(Math.min(day, getDaysInMonth(year, nextMonth)));
            }}
          >
            {months.map((value) => (
              <Picker.Item key={value} label={`${value}月`} value={value} />
            ))}
          </Picker>
        </View>

        <View style={styles.pickerWrapperSmall}>
          <Picker
            selectedValue={day}
            onValueChange={(value) => onDayChange(Number(value))}
          >
            {Array.from(
              { length: getDaysInMonth(year, month) },
              (_, i) => i + 1,
            ).map((value) => (
              <Picker.Item key={value} label={`${value}日`} value={value} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.pickerWrapperSmall}>
          <Picker
            selectedValue={hour}
            onValueChange={(value) => onHourChange(String(value))}
          >
            {hours.map((value) => (
              <Picker.Item key={value} label={`${value}時`} value={value} />
            ))}
          </Picker>
        </View>

        <View style={styles.pickerWrapperSmall}>
          <Picker
            selectedValue={minute}
            onValueChange={(value) => onMinuteChange(String(value))}
          >
            {minutes.map((value) => (
              <Picker.Item key={value} label={`${value}分`} value={value} />
            ))}
          </Picker>
        </View>
      </View>
    </>
  );
};

const EditDetailPage: React.FC = () => {
  const router = useRouter();
  const { index, expand } = useLocalSearchParams<{
    index?: string;
    expand?: string;
  }>();

  const selectedIndex = useMemo(
    () => (Array.isArray(index) ? Number(index[0]) : Number(index ?? 0)),
    [index],
  );

  const today = new Date();

  const [item, setItem] = useState<ScheduleItem | null>(null);

  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [selectedHour, setSelectedHour] = useState("10");
  const [selectedMinute, setSelectedMinute] = useState("00");

  const [companyPlace, setCompanyPlace] = useState("");
  const [jobType, setJobType] = useState("");
  const [step, setStep] = useState("");
  const [interviewType, setInterviewType] = useState("");
  const [subSchedules, setSubSchedules] = useState<SubSchedule[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const [mainAccordionOpen, setMainAccordionOpen] = useState(true);
  const [resultAccordionOpen, setResultAccordionOpen] = useState(
    expand === "true",
  );
  const [openSubScheduleIndex, setOpenSubScheduleIndex] = useState<
    number | null
  >(null);

  const [resultStatus, setResultStatus] = useState("");
  const [continueFormOpen, setContinueFormOpen] = useState(false);
  const [newAppointmentFormOpen, setNewAppointmentFormOpen] = useState(false);

  const [nextYear, setNextYear] = useState(today.getFullYear());
  const [nextMonth, setNextMonth] = useState(today.getMonth() + 1);
  const [nextDay, setNextDay] = useState(today.getDate());
  const [nextHour, setNextHour] = useState("10");
  const [nextMinute, setNextMinute] = useState("00");
  const [nextJobType, setNextJobType] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [nextInterviewType, setNextInterviewType] = useState("");
  const [newContinueResult, setNewContinueResult] = useState("");

  const [newYear, setNewYear] = useState(today.getFullYear());
  const [newMonth, setNewMonth] = useState(today.getMonth() + 1);
  const [newDay, setNewDay] = useState(today.getDate());
  const [newHour, setNewHour] = useState("10");
  const [newMinute, setNewMinute] = useState("00");
  const [newCompanyPlace, setNewCompanyPlace] = useState("");
  const [newJobType, setNewJobType] = useState("");
  const [newStep, setNewStep] = useState("");
  const [newInterviewType, setNewInterviewType] = useState("");

  const date = formatDate(selectedYear, selectedMonth, selectedDay);
  const time = `${selectedHour}:${selectedMinute}`;

  useEffect(() => {
    let isActive = true;

    const loadData = async () => {
      try {
        const data = await AsyncStorage.getItem("schedule");
        const list: ScheduleItem[] = data ? JSON.parse(data) : [];
        const selected = list[selectedIndex];

        if (!isActive) return;

        if (!selected) {
          setLoadFailed(true);
          return;
        }

        const parsedDate = parseDate(selected.date);
        const [hourValue, minuteValue] = selected.time.split(":");

        setItem(selected);
        setSelectedYear(parsedDate.year);
        setSelectedMonth(parsedDate.month);
        setSelectedDay(parsedDate.day);

        if (hourValue && minuteValue) {
          setSelectedHour(hourValue.padStart(2, "0"));
          setSelectedMinute(minuteValue.padStart(2, "0"));
        }

        setCompanyPlace(selected.place || selected.company || "");
        setJobType(selected.jobType ?? "");
        setStep(selected.step ?? "");
        setInterviewType(selected.interviewType ?? "");
        setSubSchedules(selected.subSchedules ?? []);
        setMainAccordionOpen(
          expand === "true" || (selected.subSchedules ?? []).length === 0,
        );
      } catch {
        setLoadFailed(true);
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isActive = false;
    };
  }, [selectedIndex, expand]);

  const mapDestination = companyPlace.trim();
  const googleMapUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    mapDestination,
  )}`;

  const openGoogleMaps = async () => {
    if (!mapDestination) {
      Alert.alert("確認", "会社名または場所を入力してください");
      return;
    }

    try {
      await Linking.openURL(googleMapUrl);
    } catch {
      Alert.alert("エラー", "Google Mapを開けませんでした");
    }
  };

  const saveUpdate = async () => {
    try {
      const data = await AsyncStorage.getItem("schedule");
      const list: ScheduleItem[] = data ? JSON.parse(data) : [];

      if (!list[selectedIndex]) {
        Alert.alert("エラー", "更新する予定が見つかりませんでした");
        return;
      }

      list[selectedIndex] = {
        ...list[selectedIndex],
        date,
        time,
        company: companyPlace.trim(),
        place: companyPlace.trim(),
        jobType,
        step,
        interviewType,
      };

      await AsyncStorage.setItem("schedule", JSON.stringify(list));
      Alert.alert("完了", "更新しました");
      router.push("/edit" as any);
    } catch {
      Alert.alert("エラー", "更新に失敗しました");
    }
  };

  const deleteItem = async () => {
    Alert.alert("確認", "本当に削除しますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除する",
        style: "destructive",
        onPress: async () => {
          try {
            const data = await AsyncStorage.getItem("schedule");
            const list: ScheduleItem[] = data ? JSON.parse(data) : [];

            list.splice(selectedIndex, 1);

            await AsyncStorage.setItem("schedule", JSON.stringify(list));
            Alert.alert("完了", "削除しました");
            router.push("/edit" as any);
          } catch {
            Alert.alert("エラー", "削除に失敗しました");
          }
        },
      },
    ]);
  };

  const copyAll = async () => {
    const text = `
【予定内容】
年月日：${date}
時間：${time}
会社名・場所：${companyPlace}
職種：${jobType}
選考ステップ：${step}
面接方法：${interviewType || "なし"}
GoogleMap：${googleMapUrl}
`;

    try {
      await Clipboard.setStringAsync(text);
      Alert.alert("完了", "内容をコピーしました");
    } catch {
      Alert.alert("エラー", "コピーに失敗しました");
    }
  };

  const addResult = async () => {
    if (!step.trim()) {
      Alert.alert(
        "エラー",
        "予定内容で選考ステップを選択してから結果を追加してください",
      );
      return;
    }

    if (!resultStatus) {
      Alert.alert("エラー", "結果を選択してください");
      return;
    }

    try {
      const data = await AsyncStorage.getItem("schedule");
      const list: ScheduleItem[] = data ? JSON.parse(data) : [];

      if (!list[selectedIndex]) {
        Alert.alert("エラー", "結果を追加する予定が見つかりませんでした");
        return;
      }

      const newSub: SubSchedule = {
        date,
        time,
        jobType,
        step,
        interviewType,
        result: resultStatus,
      };

      list[selectedIndex] = {
        ...list[selectedIndex],
        result: resultStatus,
        hasExtra: true,
        subSchedules: [...(list[selectedIndex].subSchedules ?? []), newSub],
      };

      await AsyncStorage.setItem("schedule", JSON.stringify(list));
      Alert.alert("完了", "結果を追加しました");
      router.push("/edit" as any);
    } catch {
      Alert.alert("エラー", "結果の追加に失敗しました");
    }
  };

  const addContinue = async () => {
    const formattedDate = formatDate(nextYear, nextMonth, nextDay);
    const formattedTime = `${nextHour}:${nextMinute}`;

    try {
      const data = await AsyncStorage.getItem("schedule");
      const list: ScheduleItem[] = data ? JSON.parse(data) : [];

      if (!list[selectedIndex]) {
        Alert.alert("エラー", "追加先の予定が見つかりませんでした");
        return;
      }

      const newSub: SubSchedule = {
        date: formattedDate,
        time: formattedTime,
        jobType: nextJobType || jobType,
        step: nextStep || step,
        interviewType: nextInterviewType || interviewType,
        ...(newContinueResult ? { result: newContinueResult } : {}),
      };

      list[selectedIndex] = {
        ...list[selectedIndex],
        ...(newContinueResult ? { result: newContinueResult } : {}),
        hasExtra: true,
        subSchedules: [...(list[selectedIndex].subSchedules ?? []), newSub],
      };

      await AsyncStorage.setItem("schedule", JSON.stringify(list));
      Alert.alert("完了", "続きを追加しました");
      router.push("/edit" as any);
    } catch {
      Alert.alert("エラー", "続きの追加に失敗しました");
    }
  };

  const addNewAppointment = async () => {
    const formattedDate = formatDate(newYear, newMonth, newDay);
    const formattedTime = `${newHour}:${newMinute}`;

    try {
      const data = await AsyncStorage.getItem("schedule");
      const list: ScheduleItem[] = data ? JSON.parse(data) : [];

      const addedSchedule: SubSchedule = {
        date: formattedDate,
        time: formattedTime,
        jobType: newJobType,
        step: newStep,
        interviewType: newInterviewType,
        ...(newCompanyPlace.trim()
          ? {
              company: newCompanyPlace.trim(),
              place: newCompanyPlace.trim(),
            }
          : {}),
      };

      if (!list[selectedIndex]) {
        Alert.alert("エラー", "追加先の予定が見つかりませんでした");
        return;
      }

      list[selectedIndex] = {
        ...list[selectedIndex],
        hasExtra: true,
        subSchedules: [
          ...(list[selectedIndex].subSchedules ?? []),
          addedSchedule,
        ],
      };

      await AsyncStorage.setItem("schedule", JSON.stringify(list));
      Alert.alert("完了", "新しい予定を追加しました");
      router.push("/edit" as any);
    } catch {
      Alert.alert("エラー", "新しい予定の追加に失敗しました");
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  if (loadFailed || !item) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>予定が見つかりませんでした。</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>予定の編集</Text>

      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>【追加された履歴・結果】</Text>

        {subSchedules.length === 0 ? (
          <Text style={styles.emptyHistoryText}>
            追加された履歴はありません。
          </Text>
        ) : (
          subSchedules.map((sub, idx) => (
            <TouchableOpacity
              key={`${sub.date}-${sub.time}-${idx}`}
              style={styles.historyItem}
              onPress={() =>
                setOpenSubScheduleIndex((current) =>
                  current === idx ? null : idx,
                )
              }
            >
              <Text style={styles.historyText}>
                {openSubScheduleIndex === idx ? "ー" : "＋"} {sub.date}{" "}
                {sub.time} ／ {sub.step || "ステップ未設定"}
              </Text>

              {openSubScheduleIndex === idx && (
                <View style={styles.historyItemBody}>
                  <Text style={styles.historyText}>
                    職種: {sub.jobType || "未設定"}
                  </Text>
                  {sub.company && (
                    <Text style={styles.historyText}>
                      会社名・場所: {sub.company}
                    </Text>
                  )}
                  <Text style={styles.historyText}>
                    面接方法: {sub.interviewType || "なし"}
                  </Text>
                  {sub.result && (
                    <Text style={styles.historyResult}>結果: {sub.result}</Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>

      <TouchableOpacity
        style={styles.accordionHeader}
        onPress={() => setMainAccordionOpen((open) => !open)}
      >
        <Text style={styles.accordionHeaderText}>
          {mainAccordionOpen ? "ー 予定内容を閉じる" : "＋ 予定内容を開く"}
        </Text>
      </TouchableOpacity>

      {mainAccordionOpen && (
        <View style={styles.accordionBody}>
          <Text style={styles.label}>年月日</Text>
          <DateTimePicker
            year={selectedYear}
            month={selectedMonth}
            day={selectedDay}
            hour={selectedHour}
            minute={selectedMinute}
            onYearChange={setSelectedYear}
            onMonthChange={setSelectedMonth}
            onDayChange={setSelectedDay}
            onHourChange={setSelectedHour}
            onMinuteChange={setSelectedMinute}
          />

          <Text style={styles.label}>会社名（場所）</Text>
          <TextInput
            value={companyPlace}
            onChangeText={setCompanyPlace}
            style={styles.input}
            placeholder="会社名、住所、ビル名など"
          />

          <TouchableOpacity style={styles.mapButton} onPress={openGoogleMaps}>
            <Text style={styles.buttonText}>Google Map で検索</Text>
          </TouchableOpacity>

          <Text style={styles.label}>職種名</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={jobType} onValueChange={setJobType}>
              <Picker.Item label="選択してください" value="" />
              {jobTypes.map((job) => (
                <Picker.Item
                  key={job.value}
                  label={job.label}
                  value={job.value}
                />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>選考ステップ</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={step} onValueChange={setStep}>
              <Picker.Item label="選択してください" value="" />
              {selectionSteps.map((selectionStep) => (
                <Picker.Item
                  key={selectionStep.value}
                  label={selectionStep.label}
                  value={selectionStep.value}
                />
              ))}
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

          <TouchableOpacity style={styles.updateButton} onPress={saveUpdate}>
            <Text style={styles.buttonText}>保存する</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={deleteItem}>
            <Text style={styles.buttonText}>削除する</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.copyButton} onPress={copyAll}>
            <Text style={styles.buttonText}>全項目をコピーする</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addAppointmentButton}
            onPress={() => setNewAppointmentFormOpen((open) => !open)}
          >
            <Text style={styles.buttonText}>
              {newAppointmentFormOpen
                ? "ー 新しい予定の入力を閉じる"
                : "＋ 新しい予定を追加"}
            </Text>
          </TouchableOpacity>

          {newAppointmentFormOpen && (
            <View style={styles.formBox}>
              <Text style={styles.sectionTitle}>新しい予定を追加</Text>

              <Text style={styles.label}>年月日・時間</Text>
              <DateTimePicker
                year={newYear}
                month={newMonth}
                day={newDay}
                hour={newHour}
                minute={newMinute}
                onYearChange={setNewYear}
                onMonthChange={setNewMonth}
                onDayChange={setNewDay}
                onHourChange={setNewHour}
                onMinuteChange={setNewMinute}
              />

              <Text style={styles.label}>会社名（場所・任意）</Text>
              <TextInput
                value={newCompanyPlace}
                onChangeText={setNewCompanyPlace}
                style={styles.input}
                placeholder="会社名、住所、ビル名など"
              />

              <Text style={styles.label}>職種名</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={newJobType}
                  onValueChange={setNewJobType}
                >
                  <Picker.Item label="選択してください" value="" />
                  {jobTypes.map((job) => (
                    <Picker.Item
                      key={job.value}
                      label={job.label}
                      value={job.value}
                    />
                  ))}
                </Picker>
              </View>

              <Text style={styles.label}>選考ステップ</Text>
              <View style={styles.pickerContainer}>
                <Picker selectedValue={newStep} onValueChange={setNewStep}>
                  <Picker.Item label="選択してください" value="" />
                  {selectionSteps.map((selectionStep) => (
                    <Picker.Item
                      key={selectionStep.value}
                      label={selectionStep.label}
                      value={selectionStep.value}
                    />
                  ))}
                </Picker>
              </View>

              {interviewSteps.includes(newStep) && (
                <>
                  <Text style={styles.label}>面接方法</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={newInterviewType}
                      onValueChange={setNewInterviewType}
                    >
                      <Picker.Item label="選択してください" value="" />
                      <Picker.Item label="Zoom" value="zoom" />
                      <Picker.Item label="対面" value="face" />
                    </Picker>
                  </View>
                </>
              )}

              <TouchableOpacity
                style={styles.updateButton}
                onPress={addNewAppointment}
              >
                <Text style={styles.buttonText}>新しい予定を保存する</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity
        style={styles.accordionHeader}
        onPress={() => setResultAccordionOpen((open) => !open)}
      >
        <Text style={styles.accordionHeaderText}>
          {resultAccordionOpen
            ? "ー 追加項目（結果）を閉じる"
            : "＋ 追加項目（結果）を開く"}
        </Text>
      </TouchableOpacity>

      {resultAccordionOpen && (
        <View style={styles.accordionBody}>
          <Text style={styles.sectionTitle}>結果を追加</Text>

          <Text style={styles.label}>対象の選考ステップ</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={step}
              onValueChange={(value) => setStep(value)}
            >
              {step.trim() ? (
                <Picker.Item
                  label={
                    selectionSteps.find(
                      (selectionStep) => selectionStep.value === step,
                    )?.label ?? step
                  }
                  value={step}
                />
              ) : (
                <Picker.Item
                  label="予定内容で選考ステップを選択してください"
                  value=""
                />
              )}
            </Picker>
          </View>

          <Text style={styles.label}>結果を選択</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={resultStatus}
              onValueChange={(value) => setResultStatus(value)}
            >
              <Picker.Item label="選択してください" value="" />
              <Picker.Item label="通過" value="通過" />
              <Picker.Item label="合格" value="合格" />
              <Picker.Item label="不合格" value="不合格" />
            </Picker>
          </View>

          <TouchableOpacity style={styles.updateButton} onPress={addResult}>
            <Text style={styles.buttonText}>結果を追加する</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.addContinueButton}
        onPress={() => setContinueFormOpen((open) => !open)}
      >
        <Text style={styles.buttonText}>
          {continueFormOpen ? "ー 続きの入力を閉じる" : "＋ 続きを新規追加"}
        </Text>
      </TouchableOpacity>

      {continueFormOpen && (
        <View style={styles.accordionBody}>
          <Text style={styles.sectionTitle}>続きを新規追加</Text>

          <Text style={styles.label}>年月日・時間</Text>
          <DateTimePicker
            year={nextYear}
            month={nextMonth}
            day={nextDay}
            hour={nextHour}
            minute={nextMinute}
            onYearChange={setNextYear}
            onMonthChange={setNextMonth}
            onDayChange={setNextDay}
            onHourChange={setNextHour}
            onMinuteChange={setNextMinute}
          />

          <Text style={styles.label}>職種名</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={nextJobType} onValueChange={setNextJobType}>
              <Picker.Item label="選択してください" value="" />
              {jobTypes.map((job) => (
                <Picker.Item
                  key={job.value}
                  label={job.label}
                  value={job.value}
                />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>選考ステップ</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={nextStep} onValueChange={setNextStep}>
              <Picker.Item label="選択してください" value="" />
              {selectionSteps.map((selectionStep) => (
                <Picker.Item
                  key={selectionStep.value}
                  label={selectionStep.label}
                  value={selectionStep.value}
                />
              ))}
            </Picker>
          </View>

          {interviewSteps.includes(nextStep) && (
            <>
              <Text style={styles.label}>面接方法</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={nextInterviewType}
                  onValueChange={setNextInterviewType}
                >
                  <Picker.Item label="選択してください" value="" />
                  <Picker.Item label="Zoom" value="zoom" />
                  <Picker.Item label="対面" value="face" />
                </Picker>
              </View>
            </>
          )}

          <Text style={styles.label}>結果（任意）</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={newContinueResult}
              onValueChange={setNewContinueResult}
            >
              <Picker.Item label="結果を追加しない" value="" />
              <Picker.Item label="通過" value="通過" />
              <Picker.Item label="合格" value="合格" />
              <Picker.Item label="不合格" value="不合格" />
            </Picker>
          </View>

          <TouchableOpacity style={styles.updateButton} onPress={addContinue}>
            <Text style={styles.buttonText}>続きを保存する</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff3e0",
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    fontSize: 16,
    color: "#333",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    marginTop: 12,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  mapButton: {
    backgroundColor: "#0288d1",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 10,
  },
  updateButton: {
    backgroundColor: "#2196f3",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  deleteButton: {
    backgroundColor: "#f44336",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  copyButton: {
    backgroundColor: "#ff9800",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  addAppointmentButton: {
    backgroundColor: "#4caf50",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  addContinueButton: {
    backgroundColor: "#4caf50",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  accordionHeader: {
    backgroundColor: "#ffcc80",
    padding: 14,
    borderRadius: 8,
    marginTop: 20,
    alignItems: "center",
  },
  accordionHeaderText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  accordionBody: {
    marginTop: 10,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ffe0b2",
  },
  formBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ffe0b2",
    borderRadius: 8,
  },
  historyContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 6,
  },
  emptyHistoryText: {
    fontSize: 14,
    color: "#777",
    paddingVertical: 6,
  },
  historyItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  historyText: {
    fontSize: 14,
    color: "#444",
  },
  historyItemBody: {
    paddingTop: 6,
    paddingLeft: 16,
  },
  historyResult: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#d9534f",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 5,
  },
  pickerWrapperSmall: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 5,
  },
});

export default EditDetailPage;
