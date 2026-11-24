import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
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
  originalIndex?: number;
};

const stepLabels: Record<string, string> = {
  webtest: "Webテスト",
  tekisei: "適性検査",
  first: "一次面接",
  second: "二次面接",
  third: "三次面接",
  final: "最終面接",
  result: "結果",
  intern: "インターン",
  training: "研修",
};

const filterSteps = [
  "",
  "webtest",
  "tekisei",
  "first",
  "second",
  "third",
  "final",
  "result",
  "intern",
  "training",
];

const getStepLabel = (step: string) => stepLabels[step] ?? step;

const getCompanyNames = (item: ScheduleItem) => {
  const names = [
    item.company,
    ...(item.subSchedules ?? []).map((sub) => sub.company ?? ""),
  ]
    .map((name) => name.trim())
    .filter(Boolean);

  return [...new Set(names)].join("・") || "会社名未設定";
};

const EditPage: React.FC = () => {
  const router = useRouter();

  const [dataList, setDataList] = useState<ScheduleItem[]>([]);
  const [recentList, setRecentList] = useState<ScheduleItem[]>([]);
  const [filterStep, setFilterStep] = useState("");
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState<number | null>(
    null,
  );

  const loadData = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem("schedule");
      const list: ScheduleItem[] = data ? JSON.parse(data) : [];

      setDataList(list);
      setRecentList([...list].slice(-3).reverse());
    } catch (error) {
      console.error("データの読み込みに失敗しました", error);
      Alert.alert("エラー", "予定の読み込みに失敗しました");
    }
  }, []);

  useEffect(() => {
    // AsyncStorageからの非同期読み込み後にstateを更新するため、この行だけLintを除外
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  const filteredList = dataList
    .map((item, originalIndex) => ({ ...item, originalIndex }))
    .filter((item) => filterStep === "" || item.step === filterStep);

  const goToEditDetail = (index: number) => {
    router.push({
      pathname: "/edit_detail",
      params: { index: String(index) },
    });
  };

  const deleteItem = async (index: number) => {
    try {
      const newList = [...dataList];
      newList.splice(index, 1);

      await AsyncStorage.setItem("schedule", JSON.stringify(newList));

      Alert.alert("完了", "削除しました");
      setConfirmDeleteIndex(null);
      setDataList(newList);
      setRecentList([...newList].slice(-3).reverse());
    } catch (error) {
      console.error("削除失敗", error);
      Alert.alert("エラー", "削除に失敗しました");
    }
  };

  const renderScheduleItem = (
    item: ScheduleItem,
    index: number,
    recent = false,
  ) => (
    <View
      key={`${recent ? "recent" : "all"}-${index}`}
      style={recent ? styles.recentItem : styles.listItem}
    >
      {item.hasExtra && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>追加アリ</Text>
        </View>
      )}

      <Text style={styles.itemText}>
        {item.date} / {getCompanyNames(item)}
      </Text>
      <Text style={styles.itemText}>{getStepLabel(item.step)}</Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.updateButton}
          onPress={() => goToEditDetail(index)}
        >
          <Text style={styles.buttonText}>更新</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => setConfirmDeleteIndex(index)}
        >
          <Text style={styles.buttonText}>削除</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>編集ページ</Text>

      <Text style={styles.subTitle}>最近アクセスした予定</Text>
      {recentList.map((item, i) =>
        renderScheduleItem(item, dataList.length - 1 - i, true),
      )}

      {confirmDeleteIndex !== null && (
        <View style={styles.confirmBox}>
          <Text style={styles.confirmText}>本当に削除しますか？</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.confirmDelete}
              onPress={() => deleteItem(confirmDeleteIndex)}
            >
              <Text style={styles.buttonText}>削除する</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelDelete}
              onPress={() => setConfirmDeleteIndex(null)}
            >
              <Text style={styles.buttonText}>キャンセル</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Text style={styles.label}>選考ステップで絞り込み</Text>
      <View style={styles.filterContainer}>
        {filterSteps.map((stepValue) => (
          <TouchableOpacity
            key={stepValue || "all"}
            style={[
              styles.filterButton,
              filterStep === stepValue && styles.filterButtonActive,
            ]}
            onPress={() => setFilterStep(stepValue)}
          >
            <Text
              style={[
                styles.filterButtonText,
                filterStep === stepValue && styles.filterButtonTextActive,
              ]}
            >
              {stepValue === "" ? "すべて" : getStepLabel(stepValue)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.subTitle}>予定一覧</Text>

      <View style={styles.scrollListContainer}>
        <ScrollView nestedScrollEnabled>
          {filteredList.map((item) =>
            renderScheduleItem(item, item.originalIndex ?? 0),
          )}
        </ScrollView>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fffde7",
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
  },
  subTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  label: {
    fontSize: 18,
    marginTop: 20,
    marginBottom: 5,
  },
  filterContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#eee",
    borderRadius: 6,
  },
  filterButtonActive: {
    backgroundColor: "#333",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#333",
  },
  filterButtonTextActive: {
    color: "#fff",
  },
  recentItem: {
    padding: 10,
    backgroundColor: "#e1f5fe",
    marginBottom: 10,
    borderRadius: 6,
    position: "relative",
  },
  listItem: {
    padding: 10,
    backgroundColor: "#f0f4c3",
    marginBottom: 10,
    borderRadius: 6,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#ff5722",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  scrollListContainer: {
    maxHeight: 280,
    marginBottom: 30,
  },
  itemText: {
    fontSize: 16,
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 5,
  },
  updateButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#4caf50",
    borderRadius: 6,
    marginRight: 10,
  },
  deleteButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#e53935",
    borderRadius: 6,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  confirmBox: {
    backgroundColor: "#fff3e0",
    padding: 20,
    borderRadius: 8,
    marginTop: 20,
    alignItems: "center",
  },
  confirmText: {
    fontSize: 16,
    marginBottom: 10,
  },
  confirmDelete: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#d32f2f",
    borderRadius: 6,
    marginRight: 10,
  },
  cancelDelete: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#757575",
    borderRadius: 6,
  },
});

export default EditPage;
