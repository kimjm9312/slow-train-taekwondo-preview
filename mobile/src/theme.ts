import { StyleSheet } from "react-native";

export const colors = { orange: "#D8752D", cream: "#F5F1E9", paper: "#FFFDF9", ink: "#211F1B", muted: "#706B63", line: "#E3DDD3", green: "#316D50", danger: "#B33C32" };
export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream }, content: { padding: 18, paddingBottom: 110 }, title: { color: colors.ink, fontSize: 32, fontWeight: "800", letterSpacing: -1.2 }, eyebrow: { marginBottom: 8, color: colors.orange, fontSize: 11, fontWeight: "800", letterSpacing: 1.5 }, card: { marginBottom: 12, padding: 18, borderWidth: 1, borderColor: colors.line, borderRadius: 18, backgroundColor: colors.paper }, button: { alignItems: "center", justifyContent: "center", minHeight: 48, paddingHorizontal: 16, borderRadius: 12, backgroundColor: colors.orange }, buttonText: { color: "white", fontWeight: "800" }, input: { minHeight: 48, marginBottom: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.line, borderRadius: 11, backgroundColor: "white" }, muted: { color: colors.muted, lineHeight: 20 }, row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }
});
