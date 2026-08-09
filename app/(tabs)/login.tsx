import { useState } from "react";
import { View, TextInput, StyleSheet, Alert } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { signUp, logIn } from "@/authService";
import { Pressable } from "react-native";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setLoading(true);
    const { user, error } = await signUp(email, password, displayName);
    setLoading(false);
    if (error) {
      console.log("エラー", error);
    } else {
      console.log("成功", "新規登録が完了しました！");
      console.log("ユーザー名:", user.displayName);
    }
  };

  const handleLogIn = async () => {
    setLoading(true);
    const { user, error } = await logIn(email, password);
    setLoading(false);
    if (error) {
      console.log("エラー", error);
    } else {
      console.log("成功", "ログインしました！");
      console.log("メールアドレス:", user.email);
      console.log("UID:", user.uid);
      console.log("ユーザー名:", user.displayName);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        ログイン
      </ThemedText>

      <TextInput
        style={styles.input}
        placeholder="ユーザー名（新規登録時のみ）"
        value={displayName}
        onChangeText={setDisplayName}
      />

      <TextInput
        style={styles.input}
        placeholder="メールアドレス"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="パスワード"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Pressable style={styles.button} onPress={handleLogIn} disabled={loading}>
        <ThemedText style={styles.buttonText}>ログイン</ThemedText>
      </Pressable>

      <Pressable
        style={[styles.button, styles.signUpButton]}
        onPress={handleSignUp}
        disabled={loading}
      >
        <ThemedText style={styles.buttonText}>新規登録</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  signUpButton: {
    backgroundColor: "#34C759",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});