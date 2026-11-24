import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      {/* ロゴ画像 */}

      <Text style={styles.title}>ホーム画面</Text>

      {/* 項目1 */}
      <Pressable
        style={styles.menuButton}
        onPress={() => router.push("/select_top1")}
      >
        <Text style={styles.menuText}>追加・編集</Text>
      </Pressable>

      {/* 項目2 */}
      <Pressable
        style={styles.menuButton}
        onPress={() => router.push("/report")}
      >
        <Text style={styles.menuText}>分析・まとめ</Text>
      </Pressable>

      {/* 項目3 */}
      <Pressable style={styles.menuButton} onPress={() => router.push("/")}>
        <Text style={styles.menuText}>ファイル管理へ</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
  },
  menuButton: {
    width: "80%",
    padding: 16,
    backgroundColor: "#4a90e2",
    borderRadius: 10,
    marginBottom: 15,
    alignItems: "center",
  },
  menuText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
