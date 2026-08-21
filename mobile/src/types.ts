export type User = { id: string; username: string; role: "parent" | "admin"; name: string; phone: string };
export type Child = { id: string; name: string; ageGroup: string; status: string };
export type Session = { id: string; sessionDate: string; startTime: string; endTime: string; title: string; capacity: number; waitCapacity: number; confirmedCount: number; waitingCount: number; status: string; bookingClosesMinutes: number; myReservationId?: string; myStatus?: string };
