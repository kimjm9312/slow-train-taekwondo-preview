import { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { api } from "../api/client";
import { colors, styles } from "../theme";
import type { Child, User } from "../types";

export function HomeScreen({ user, child, go }: { user: User; child?: Child; go: (page: string) => void }) {
  const [fixed, setFixed] = useState<{ weekday: number; startTime: string }[]>([]);
  useEffect(() => {
    if (!child) return;
    api<{ schedules: { weekday: number; startTime: string }[] }>(`/api/v1/fixed-schedules?childId=${child.id}`).then((data) => setFixed(data.schedules)).catch(() => undefined);
  }, [child]);
  const fixedLabel = fixed.length ? fixed.map((item) => `${["일", "월", "화", "수", "목", "금", "토"][item.weekday]} ${item.startTime}`).join(" · ") : "고정수업 미등록";
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
    <View style={{ minHeight: 430, padding: 25, borderRadius: 28, backgroundColor: colors.orange }}>
      <Text style={{ color: "rgba(255,255,255,.28)", fontSize: 30, fontWeight: "900" }}>SLOW TRAIN TAEKWONDO</Text>
      <View style={{ marginTop: 90 }}><Text style={{ color: "rgba(255,255,255,.7)", fontSize: 11, fontWeight: "800", letterSpacing: 1.5 }}>NOT SPEEDY, BUT STEADY.</Text><Text style={{ marginTop: 14, color: "white", fontSize: 42, fontWeight: "900", letterSpacing: -2 }}>더 나은 내일을 향한{`\n`}아이만의 여정</Text><Text style={{ marginTop: 20, color: "rgba(255,255,255,.72)", lineHeight: 23 }}>우리는 지나치는 역이 없습니다.{`\n`}발달장애인의 성장과 사회적 연결을 위해 달립니다.</Text></View>
    </View>
    <View style={[styles.row, { marginTop: 14 }]}><TouchableOpacity style={[styles.card, { flex: 1 }]} onPress={() => go("schedule")}><Text style={{ fontSize: 17, fontWeight: "800" }}>수업 시간표</Text><Text style={styles.muted}>참가·변경·취소</Text></TouchableOpacity><TouchableOpacity style={[styles.card, { flex: 1 }]} onPress={() => go("fixed")}><Text style={{ fontSize: 17, fontWeight: "800" }}>고정 수업</Text><Text style={styles.muted}>주 2회·주 3회</Text></TouchableOpacity></View>
    <View style={styles.card}><Text style={styles.eyebrow}>MY SCHEDULE</Text><Text style={{ fontSize: 22, fontWeight: "800" }}>{child?.name || user.name}님의 수업</Text><Text style={[styles.muted, { marginTop: 10 }]}>{fixedLabel}</Text></View>
  </ScrollView>;
}
