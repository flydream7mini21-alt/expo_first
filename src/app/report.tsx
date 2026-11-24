import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, {
  Circle,
  Line,
  Path,
  Rect,
  Text as SvgText,
} from "react-native-svg";

type ChartItem = {
  id: number;
  label: string;
  value: string;
};

type ChartData = {
  id: number;
  label: string;
  value: number;
};

type SavedReport = {
  id: string;
  title: string;
  chartType: "histogram" | "pie";
  items: ChartItem[];
  color: string;
  createdAt: string;
};

const chartColors = [
  "#4f86f7",
  "#f28e2b",
  "#59a14f",
  "#e15759",
  "#af7aa1",
  "#76b7b2",
  "#edc948",
  "#ff9da7",
];

const chartHeight = 280;
const chartPadding = {
  top: 20,
  right: 16,
  bottom: 60,
  left: 48,
};

function createPiePath(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) {
  const toRadians = (angle: number) => (angle * Math.PI) / 180;
  const startX = centerX + radius * Math.cos(toRadians(startAngle));
  const startY = centerY + radius * Math.sin(toRadians(startAngle));
  const endX = centerX + radius * Math.cos(toRadians(endAngle));
  const endY = centerY + radius * Math.sin(toRadians(endAngle));
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${centerX} ${centerY}`,
    `L ${startX} ${startY}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
    "Z",
  ].join(" ");
}

export default function ReportScreen() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const nextId = useRef(2);

  const [title, setTitle] = useState("");
  const [chartType, setChartType] = useState<"histogram" | "pie">("histogram");
  const [items, setItems] = useState<ChartItem[]>([
    { id: 1, label: "", value: "" },
  ]);

  const chartData: ChartData[] = items
    .map((item) => ({
      id: item.id,
      label: item.label.trim(),
      value: item.value.trim() === "" ? Number.NaN : Number(item.value),
    }))
    .filter(
      (item) =>
        item.label.length > 0 && Number.isFinite(item.value) && item.value >= 0,
    );

  const invalidCount = items.filter((item) => {
    if (!item.label.trim() || !item.value.trim()) return true;

    const value = Number(item.value);
    return !Number.isFinite(value) || value < 0;
  }).length;

  const updateItem = (id: number, field: "label" | "value", text: string) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id ? { ...item, [field]: text } : item,
      ),
    );
  };

  const addItem = () => {
    const id = nextId.current;
    nextId.current += 1;

    setItems((currentItems) => [...currentItems, { id, label: "", value: "" }]);
  };

  const removeItem = (id: number) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
  };

  const handleSave = async () => {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      Alert.alert("確認", "レポートタイトルを入力してください。");
      return;
    }

    if (chartData.length === 0) {
      Alert.alert("確認", "項目名と0以上の数値を1件以上入力してください。");
      return;
    }

    const newReport: SavedReport = {
      id: `${Date.now()}`,
      title: trimmedTitle,
      chartType,
      items: items.map((item) => ({
        ...item,
        label: item.label.trim(),
        value: item.value.trim(),
      })),
      color: chartColors[0],
      createdAt: new Date().toISOString(),
    };

    try {
      const storedReports = await AsyncStorage.getItem("reports");
      const parsedReports: unknown = storedReports
        ? JSON.parse(storedReports)
        : [];
      const reports: SavedReport[] = Array.isArray(parsedReports)
        ? parsedReports
        : [];

      await AsyncStorage.setItem(
        "reports",
        JSON.stringify([newReport, ...reports]),
      );

      router.push("/report_list");
    } catch (error) {
      console.error("レポートの保存に失敗しました", error);
      Alert.alert("エラー", "レポートを保存できませんでした。");
    }
  };

  const renderHistogram = () => {
    const chartWidth = Math.max(windowWidth - 80, chartData.length * 88);
    const plotWidth = chartWidth - chartPadding.left - chartPadding.right;
    const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;
    const maxValue = Math.max(1, ...chartData.map((item) => item.value));
    const slotWidth = plotWidth / Math.max(chartData.length, 1);
    const barWidth = Math.min(48, slotWidth * 0.62);

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <Svg width={chartWidth} height={chartHeight}>
          {[0, 1, 2, 3, 4].map((tick) => {
            const y = chartPadding.top + (plotHeight * tick) / 4;
            const value = Math.round(maxValue * (1 - tick / 4));

            return (
              <React.Fragment key={tick}>
                <Line
                  x1={chartPadding.left}
                  y1={y}
                  x2={chartWidth - chartPadding.right}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth={1}
                />
                <SvgText
                  x={chartPadding.left - 8}
                  y={y + 4}
                  fontSize={11}
                  fill="#666"
                  textAnchor="end"
                >
                  {value}
                </SvgText>
              </React.Fragment>
            );
          })}

          {chartData.map((item, index) => {
            const barHeight = (item.value / maxValue) * plotHeight;
            const x =
              chartPadding.left +
              slotWidth * index +
              (slotWidth - barWidth) / 2;
            const y = chartPadding.top + plotHeight - barHeight;
            const label =
              item.label.length > 8 ? `${item.label.slice(0, 7)}…` : item.label;

            return (
              <React.Fragment key={item.id}>
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(barHeight, 1)}
                  rx={4}
                  fill={chartColors[index % chartColors.length]}
                />
                <SvgText
                  x={x + barWidth / 2}
                  y={Math.max(y - 6, chartPadding.top + 12)}
                  fontSize={11}
                  fill="#333"
                  textAnchor="middle"
                >
                  {item.value}
                </SvgText>
                <SvgText
                  x={x + barWidth / 2}
                  y={chartHeight - 20}
                  fontSize={11}
                  fill="#444"
                  textAnchor="middle"
                >
                  {label}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </ScrollView>
    );
  };

  const renderPieChart = () => {
    const positiveData = chartData.filter((item) => item.value > 0);
    const total = positiveData.reduce((sum, item) => sum + item.value, 0);
    const size = Math.min(windowWidth - 80, 260);
    const center = size / 2;
    const radius = size * 0.42;

    if (total === 0) {
      return (
        <Text style={styles.emptyChartText}>
          円グラフを表示するには、0より大きい数値を入力してください。
        </Text>
      );
    }

    let currentAngle = -90;

    return (
      <View style={styles.pieChartArea}>
        <Svg width={size} height={size}>
          {positiveData.length === 1 ? (
            <Circle
              cx={center}
              cy={center}
              r={radius}
              fill={
                chartColors[
                  chartData.indexOf(positiveData[0]) % chartColors.length
                ]
              }
            />
          ) : (
            positiveData.map((item) => {
              const dataIndex = chartData.indexOf(item);
              const sliceAngle = (item.value / total) * 360;
              const path = createPiePath(
                center,
                center,
                radius,
                currentAngle,
                currentAngle + sliceAngle,
              );

              currentAngle += sliceAngle;

              return (
                <Path
                  key={item.id}
                  d={path}
                  fill={chartColors[dataIndex % chartColors.length]}
                  stroke="#fff"
                  strokeWidth={2}
                />
              );
            })
          )}
        </Svg>

        <View style={styles.legend}>
          {chartData.map((item, index) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;

            return (
              <View key={item.id} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendColor,
                    {
                      backgroundColor: chartColors[index % chartColors.length],
                    },
                  ]}
                />
                <Text style={styles.legendText}>
                  {item.label}: {item.value}（{percentage.toFixed(1)}%）
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>レポート作成</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>基本情報</Text>
        <Text style={styles.label}>レポートタイトル</Text>
        <TextInput
          style={styles.input}
          placeholder="タイトルを入力してください"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>グラフを作成</Text>
        <Text style={styles.sectionDescription}>
          項目名と数値を入力すると、グラフに反映されます。
        </Text>

        <View style={styles.chartTypeRow}>
          <TouchableOpacity
            style={[
              styles.chartTypeButton,
              chartType === "histogram" && styles.chartTypeButtonActive,
            ]}
            onPress={() => setChartType("histogram")}
          >
            <Text
              style={[
                styles.chartTypeText,
                chartType === "histogram" && styles.chartTypeTextActive,
              ]}
            >
              棒グラフ
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.chartTypeButton,
              chartType === "pie" && styles.chartTypeButtonActive,
            ]}
            onPress={() => setChartType("pie")}
          >
            <Text
              style={[
                styles.chartTypeText,
                chartType === "pie" && styles.chartTypeTextActive,
              ]}
            >
              円グラフ
            </Text>
          </TouchableOpacity>
        </View>

        {items.map((item, index) => (
          <View key={item.id} style={styles.inputRow}>
            <Text style={styles.itemNumber}>{index + 1}.</Text>

            <TextInput
              value={item.label}
              onChangeText={(text) => updateItem(item.id, "label", text)}
              style={[styles.input, styles.nameInput]}
              placeholder="項目名"
            />

            <TextInput
              value={item.value}
              onChangeText={(text) => updateItem(item.id, "value", text)}
              style={[styles.input, styles.valueInput]}
              placeholder="数値"
              keyboardType="decimal-pad"
            />

            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeItem(item.id)}
            >
              <Text style={styles.removeButtonText}>削除</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={addItem}>
          <Text style={styles.addButtonText}>＋ 項目を追加</Text>
        </TouchableOpacity>

        {invalidCount > 0 && (
          <Text style={styles.hintText}>
            グラフに表示するには、各項目名と0以上の数値を入力してください。
          </Text>
        )}

        <Text style={styles.chartTitle}>
          プレビュー（{chartType === "histogram" ? "棒グラフ" : "円グラフ"}）
        </Text>

        {chartData.length === 0 ? (
          <Text style={styles.emptyChartText}>
            項目名と0以上の数値を入力すると、ここにグラフが表示されます。
          </Text>
        ) : chartType === "histogram" ? (
          renderHistogram()
        ) : (
          renderPieChart()
        )}
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>保存する</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#222",
  },
  section: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    color: "#222",
  },
  sectionDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: "#666",
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  chartTypeRow: {
    flexDirection: "row",
    marginBottom: 14,
  },
  chartTypeButton: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#4f86f7",
    borderRadius: 6,
    alignItems: "center",
    marginRight: 6,
    backgroundColor: "#fff",
  },
  chartTypeButtonActive: {
    backgroundColor: "#4f86f7",
  },
  chartTypeText: {
    color: "#4f86f7",
    fontWeight: "600",
    fontSize: 13,
  },
  chartTypeTextActive: {
    color: "#fff",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  itemNumber: {
    width: 20,
    color: "#555",
    fontSize: 13,
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    fontSize: 14,
    marginBottom: 8,
  },
  nameInput: {
    flex: 1,
    marginRight: 6,
    marginBottom: 0,
  },
  valueInput: {
    width: 70,
    marginRight: 6,
    marginBottom: 0,
  },
  removeButton: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: "#fee2e2",
    borderRadius: 6,
  },
  removeButtonText: {
    color: "#b42318",
    fontSize: 12,
    fontWeight: "600",
  },
  addButton: {
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: "#e8f0ff",
    alignItems: "center",
    marginTop: 4,
  },
  addButtonText: {
    color: "#275dad",
    fontWeight: "600",
    fontSize: 13,
  },
  hintText: {
    marginTop: 8,
    fontSize: 11,
    color: "#777",
  },
  chartTitle: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  emptyChartText: {
    paddingVertical: 20,
    textAlign: "center",
    color: "#777",
    fontSize: 13,
  },
  pieChartArea: {
    alignItems: "center",
  },
  legend: {
    width: "100%",
    marginTop: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 2,
    marginRight: 6,
  },
  legendText: {
    flex: 1,
    color: "#444",
    fontSize: 13,
  },
  saveButton: {
    backgroundColor: "#007aff",
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
