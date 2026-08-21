import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from "react-native";
import { api, json, setSessionToken } from "../api/client";
import { colors, styles } from "../theme";
import type { User } from "../types";

export function LoginScreen({ onLogin }: { onLogin: (user: User) => void }) {
  const [username, setUsername] = useState("slowtrain_parent"), [password, setPassword] = useState("1234"), [busy, setBusy] = useState(false);
  async function login() { setBusy(true); try { const result = await api<{ user: User; sessionToken: string }>("/api/v1/auth/login", json("POST", { username, password })); await setSessionToken(result.sessionToken); onLogin(result.user); } catch (error) { Alert.alert("로그인", error instanceof Error ? error.message : "로그인하지 못했습니다."); } finally { setBusy(false); } }
  return <KeyboardAvoidingView style={[styles.screen, { justifyContent: "center", padding: 22 }]} behavior={Platform.OS === "ios" ? "padding" : undefined}><View style={{ padding: 28, borderRadius: 28, backgroundColor: colors.orange }}><Text style={{ color: "rgba(255,255,255,.65)", fontSize: 12, fontWeight: "800", letterSpacing: 1.4 }}>SLOW TRAIN TAEKWONDO</Text><Text style={{ marginTop: 38, color: "white", fontSize: 40, fontWeight: "900", letterSpacing: -2 }}>더 나은 내일을 향한{`\n`}아이만의 여정</Text><Text style={{ marginTop: 18, color: "rgba(255,255,255,.72)", lineHeight: 22 }}>우리는 지나치는 역이 없습니다.{`\n`}아이의 속도에 맞춰 함께 달립니다.</Text></View><View style={[styles.card, { marginTop: -18, marginHorizontal: 12 }]}><TextInput style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" placeholder="아이디" /><TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="비밀번호" /><TouchableOpacity style={styles.button} onPress={login} disabled={busy}><Text style={styles.buttonText}>{busy ? "확인 중…" : "로그인"}</Text></TouchableOpacity></View></KeyboardAvoidingView>;
}
