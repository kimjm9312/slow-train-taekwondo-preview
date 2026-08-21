export type Role = "parent" | "admin";

export type User = {
  id: string;
  username: string;
  role: Role;
  name: string;
  phone: string;
  profileImageKey?: string | null;
  status?: string;
};

export type Child = {
  id: string;
  name: string;
  ageGroup: string;
  notes?: string;
  status: string;
  parentName?: string;
  phone?: string;
};

export type Session = {
  id: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  title: string;
  capacity: number;
  waitCapacity: number;
  status: "open" | "closed" | "cancelled";
  bookingClosesMinutes: number;
  changeClosesMinutes: number;
  confirmedCount: number;
  waitingCount: number;
  myReservationId?: string | null;
  myStatus?: "confirmed" | "waiting" | null;
  myBookingType?: "fixed" | "regular" | "makeup" | null;
};

export type ContentItem = Record<string, unknown> & { id: string };

export type ToastMessage = { id: number; text: string; tone: "success" | "error" };
