import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { api } from "../api/client";
import { colors, styles } from "../theme";
import type { Child } from "../types";

type Ticket = { id: string; status: string; expiresAt: string };
export function MakeupScreen({ child }: { child?: Child }) { const [tickets,setTickets]=useState<Ticket[]>([]); useEffect(()=>{if(!child)return;api<{tickets:Ticket[]}>(`/api/v1/makeup-tickets?childId=${child.id}`).then(data=>setTickets(data.tickets)).catch(error=>Alert.alert("보강권",error instanceof Error?error.message:"불러오지 못했습니다."));},[child]);const available=tickets.filter(ticket=>ticket.status==="available");return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><Text style={styles.eyebrow}>MAKE-UP CLASS</Text><Text style={styles.title}>보강권</Text><View style={{marginVertical:18,padding:28,borderRadius:24,backgroundColor:colors.orange}}><Text style={{color:"rgba(255,255,255,.7)"}}>사용 가능</Text><Text style={{color:"white",fontSize:58,fontWeight:"900"}}>{available.length}<Text style={{fontSize:18}}>회</Text></Text><Text style={{color:"rgba(255,255,255,.72)"}}>당월 말일까지 사용 가능</Text></View>{tickets.map(ticket=><View style={[styles.card,styles.row]} key={ticket.id}><View><Text style={{fontWeight:"800"}}>{ticket.status==="available"?"사용 가능":ticket.status==="reserved"?"예약 중":"사용 완료"}</Text><Text style={styles.muted}>만료 {ticket.expiresAt.slice(0,10)}</Text></View><Text style={styles.muted}>{ticket.id.slice(-6)}</Text></View>)}</ScrollView>}
