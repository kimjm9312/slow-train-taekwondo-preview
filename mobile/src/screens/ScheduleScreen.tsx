import { useCallback, useEffect, useState } from "react";
import { Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { api, json } from "../api/client";
import { colors, styles } from "../theme";
import type { Child, Session } from "../types";

export function ScheduleScreen({ child }: { child?: Child }) {
  const [sessions, setSessions] = useState<Session[]>([]), [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => { if (!child) return; setRefreshing(true); try { const from = new Date().toISOString().slice(0,10), toDate = new Date(Date.now()+7*86400000), to=toDate.toISOString().slice(0,10); const data = await api<{ sessions: Session[] }>(`/api/v1/sessions?from=${from}&to=${to}&childId=${child.id}`); setSessions(data.sessions); } catch (error) { Alert.alert("시간표", error instanceof Error ? error.message : "불러오지 못했습니다."); } finally { setRefreshing(false); } }, [child]);
  useEffect(() => { load(); }, [load]);
  function label(item: Session) { if (item.myStatus === "confirmed") return "참가 완료"; if (item.myStatus === "waiting") return "대기 1번"; if (Number(item.confirmedCount)<item.capacity) return "참가"; if (Number(item.waitingCount)<item.waitCapacity) return "대기 신청"; return "만석"; }
  async function action(item: Session) { if (!child || label(item)==="만석") return; try { if (item.myReservationId) await api(`/api/v1/reservations/${item.myReservationId}`, json("DELETE")); else await api("/api/v1/reservations", json("POST", { sessionId:item.id, childId:child.id, bookingType:"regular" })); await load(); } catch (error) { Alert.alert("예약", error instanceof Error ? error.message : "처리하지 못했습니다."); } }
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}><Text style={styles.eyebrow}>CLASS SCHEDULE</Text><Text style={styles.title}>수업 시간표</Text><Text style={[styles.muted,{marginVertical:12}]}>정원 6명 · 대기 1명 · 신청은 1시간 전까지</Text>{sessions.map((item) => <View style={[styles.card, styles.row]} key={item.id}><View><Text style={{fontSize:20,fontWeight:"800"}}>{item.startTime}</Text><Text style={styles.muted}>{item.sessionDate}</Text></View><View style={{flex:1}}><Text style={{fontWeight:"700"}}>{item.title}</Text><Text style={styles.muted}>{item.confirmedCount}/{item.capacity}명 · 대기 {item.waitingCount}</Text></View><TouchableOpacity style={[styles.button,{minHeight:42,backgroundColor:item.myStatus?colors.green:colors.orange,opacity:label(item)==="만석"?.45:1}]} onPress={()=>action(item)}><Text style={styles.buttonText}>{label(item)}</Text></TouchableOpacity></View>)}</ScrollView>;
}
