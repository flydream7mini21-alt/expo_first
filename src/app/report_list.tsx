import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";

type ReportItem = {
  id: string;
  title: string;
  chartType?: "histogram" | "pie";
  color?: string;
  createdAt?: string;
  items?: {
    id: number;
    label: string;
    value: string;
  }[];
};

const defaultColors = [
  "#4A90E2",
  "#50C2A7",
  "#F5A623",
  "#E15759",
  "#9B59B6",
  "#76B7B2",
  "#EDC948",
  "#FF9DA7",
];

const formatTitle = (title: string) => {
  const characters = Array.from(title);
  return characters.length >= 20
    ? `${characters.slice(0, 19).join("")}…`
    : title;
};

export default function ReportListScreen() {
  const { width } = useWindowDimensions();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const horizontalPadding = 16;
  const columnGap = 12;
  const cardWidth = (width - horizontalPadding * 2 - columnGap) / 2;

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadReports = async () => {
        try {
          const storedReports = await AsyncStorage.getItem("reports");
          const parsed: unknown = storedReports
            ? JSON.parse(storedReports)
            : [];

          if (!Array.isArray(parsed)) {
            throw new Error("保存されたレポートの形式が正しくありません");
          }

          const validReports = parsed.filter(
            (report): report is ReportItem =>
              report !== null &&
              typeof report === "object" &&
              typeof report.id === "string" &&
              typeof report.title === "string",
          );

          if (isActive) {
            setReports(validReports);
          }
        } catch (error) {
          console.error("レポートの読み込みに失敗しました", error);
          if (isActive) {
            Alert.alert("エラー", "保存したレポートを読み込めませんでした。");
          }
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
      };

      void loadReports();

      return () => {
        isActive = false;
      };
    }, []),
  );

  const renderReport = ({
    item,
    index,
  }: {
    item: ReportItem;
    index: number;
  }) => {
    const dotColor = item.color ?? defaultColors[index % defaultColors.length];

    return (
      <View
        style={[styles.card, { width: cardWidth }]}
        accessibilityLabel={item.title}
      >
        <View style={[styles.colorCircle, { backgroundColor: dotColor }]} />

        <View style={styles.titleContainer}>
          <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">
            {formatTitle(item.title)}
          </Text>
        </View>

        {item.chartType && (
          <Text style={styles.chartType}>
            {item.chartType === "pie" ? "円グラフ" : "棒グラフ"}
          </Text>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>レポートを読み込み中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>保存したレポート</Text>

      <FlatList
        data={reports}
        renderItem={renderReport}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[
          styles.listContent,
          reports.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            保存したレポートはありません。
            {"\n"}レポート作成画面から保存してください。
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 18,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  card: {
    minHeight: 76,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 34,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  colorCircle: {
    position: "absolute",
    left: 14,
    top: 18,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  titleContainer: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    width: "100%",
    textAlign: "center",
    fontSize: 13,
    color: "#333333",
    fontWeight: "500",
  },
  chartType: {
    marginTop: 6,
    fontSize: 11,
    color: "#777",
  },
  emptyText: {
    paddingTop: 40,
    textAlign: "center",
    color: "#777",
    fontSize: 15,
    lineHeight: 24,
  },
});
