import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const SelectTop1 = () => {
  const router = useRouter();

  const handleAdd = () => {
    router.push("/add");
  };

  const handleEdit = () => {
    router.push("/edit");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>項目を選択してください</Text>

      <TouchableOpacity style={styles.buttonAdd} onPress={handleAdd}>
        <Text style={styles.buttonText}>追加する（/add）</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonEdit} onPress={handleEdit}>
        <Text style={styles.buttonText}>編集する（/edit）</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e0f7fa",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 30,
    color: "#004d40",
  },
  buttonAdd: {
    width: 200,
    padding: 12,
    backgroundColor: "#4caf50",
    borderRadius: 8,
    marginBottom: 20,
    alignItems: "center",
  },
  buttonEdit: {
    width: 200,
    padding: 12,
    backgroundColor: "#0288d1",
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
  },
});

export default SelectTop1;
