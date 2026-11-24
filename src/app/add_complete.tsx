import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const AddComplete = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>登録が完了しました</Text>
      <Text style={styles.message}>予定の保存が正常に完了しました。</Text>

      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => router.push("/home")}
      >
        <Text style={styles.homeButtonText}>ホーム画面に戻る</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e8f5e9",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#2e7d32",
  },
  message: {
    fontSize: 18,
    marginBottom: 30,
    color: "#4e4e4e",
  },
  homeButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    backgroundColor: "#4caf50",
    borderRadius: 8,
  },
  homeButtonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
});

export default AddComplete;
