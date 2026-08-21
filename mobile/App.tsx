import { useEffect, useState } from "react";
import { SafeAreaView, Text, TouchableOpacity, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { api, clearSessionToken } from "./src/api/client";
import { AdminScreen } from "./src/screens/AdminScreen";
import { CenterScreen } from "./src/screens/CenterScreen";
import { ChatScreen } from "./src/screens/ChatScreen";
import { FixedScheduleScreen } from "./src/screens/FixedScheduleScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { MakeupScreen } from "./src/screens/MakeupScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { ScheduleScreen } from "./src/screens/ScheduleScreen";
import { colors } from "./src/theme";
import type { Child, User } from "./src/types";

export default function App(){const[user,setUser]=useState<User|null>(null),[children,setChildren]=useState<Child[]>([]),[page,setPage]=useState("home"),[loading,setLoading]=useState(true);useEffect(()=>{api<{user:User|null;children:Child[]}>("/api/v1/auth/session").then(data=>{setUser(data.user);setChildren(data.children||[]);}).catch(()=>undefined).finally(()=>setLoading(false));},[]);if(loading)return <SafeAreaView style={{flex:1,justifyContent:"center",alignItems:"center",backgroundColor:colors.cream}}><Text>슬로우 트레인을 준비하고 있습니다.</Text></SafeAreaView>;if(!user)return <><StatusBar style="light"/><LoginScreen onLogin={async(next)=>{setUser(next);const data=await api<{children:Child[]}>("/api/v1/auth/session");setChildren(data.children||[]);setPage(next.role==="admin"?"admin":"home");}}/></>;const tabs=[{key:"home",label:"홈"},{key:"schedule",label:"시간표"},{key:"center",label:"센터"},{key:"chat",label:"톡"},{key:"profile",label:"내정보"},...(user.role==="admin"?[{key:"admin",label:"관리자"}]:[])];async function logout(){try{await api("/api/v1/auth/logout",{method:"POST"});}finally{await clearSessionToken();setUser(null);setChildren([]);setPage("home");}}return <SafeAreaView style={{flex:1,backgroundColor:colors.cream}}><StatusBar style="dark"/><View style={{flex:1}}>{page==="home"&&<HomeScreen user={user} child={children[0]} go={setPage}/>} {page==="schedule"&&<ScheduleScreen child={children[0]}/>} {page==="fixed"&&<FixedScheduleScreen user={user} child={children[0]}/>} {page==="makeup"&&<MakeupScreen child={children[0]}/>} {page==="center"&&<CenterScreen/>} {page==="chat"&&<ChatScreen user={user}/>} {page==="profile"&&<ProfileScreen user={user} onChanged={setUser} onLogout={logout}/>} {page==="admin"&&user.role==="admin"&&<AdminScreen/>}</View><View style={{height:66,flexDirection:"row",borderTopWidth:1,borderColor:colors.line,backgroundColor:colors.paper}}>{tabs.map(tab=><TouchableOpacity key={tab.key} style={{flex:1,alignItems:"center",justifyContent:"center"}} onPress={()=>setPage(tab.key)}><Text style={{fontSize:9,fontWeight:page===tab.key?"800":"500",color:page===tab.key?colors.orange:colors.muted}}>{tab.label}</Text></TouchableOpacity>)}</View></SafeAreaView>}
