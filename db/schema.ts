import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
};

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["parent", "admin"] }).notNull().default("parent"),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  profileImageKey: text("profile_image_key"),
  status: text("status", { enum: ["active", "suspended", "withdrawn"] }).notNull().default("active"),
  ...timestamps,
}, (table) => [
  uniqueIndex("idx_users_username").on(table.username),
  index("idx_users_role_status").on(table.role, table.status),
]);

export const authSessions = sqliteTable("auth_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("idx_auth_sessions_token").on(table.tokenHash),
  index("idx_auth_sessions_user_expires").on(table.userId, table.expiresAt),
]);

export const phoneVerifications = sqliteTable("phone_verifications", {
  id: text("id").primaryKey(),
  phone: text("phone").notNull(),
  codeHash: text("code_hash").notNull(),
  verifiedAt: text("verified_at"),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_phone_verifications_phone").on(table.phone, table.expiresAt)]);

export const children = sqliteTable("children", {
  id: text("id").primaryKey(),
  parentId: text("parent_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  ageGroup: text("age_group").notNull(),
  notes: text("notes").notNull().default(""),
  status: text("status", { enum: ["active", "inactive"] }).notNull().default("active"),
  ...timestamps,
}, (table) => [index("idx_children_parent_status").on(table.parentId, table.status)]);

export const classSessions = sqliteTable("class_sessions", {
  id: text("id").primaryKey(),
  sessionDate: text("session_date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  title: text("title").notNull().default("발달 태권도"),
  capacity: integer("capacity").notNull().default(6),
  waitCapacity: integer("wait_capacity").notNull().default(1),
  status: text("status", { enum: ["open", "closed", "cancelled"] }).notNull().default("open"),
  bookingClosesMinutes: integer("booking_closes_minutes").notNull().default(60),
  changeClosesMinutes: integer("change_closes_minutes").notNull().default(180),
  ...timestamps,
}, (table) => [
  uniqueIndex("idx_class_sessions_date_time").on(table.sessionDate, table.startTime),
  index("idx_class_sessions_status_date").on(table.status, table.sessionDate),
]);

export const reservations = sqliteTable("reservations", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => classSessions.id, { onDelete: "cascade" }),
  childId: text("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  sessionDate: text("session_date").notNull(),
  startTime: text("start_time").notNull(),
  bookingType: text("booking_type", { enum: ["fixed", "regular", "makeup", "admin"] }).notNull(),
  status: text("status", { enum: ["confirmed", "waiting", "cancelled", "attended", "absent"] }).notNull(),
  waitPosition: integer("wait_position"),
  cancelledAt: text("cancelled_at"),
  ...timestamps,
}, (table) => [
  uniqueIndex("idx_reservations_session_child").on(table.sessionId, table.childId),
  uniqueIndex("idx_reservations_child_datetime").on(table.childId, table.sessionDate, table.startTime),
  index("idx_reservations_session_status").on(table.sessionId, table.status, table.createdAt),
  index("idx_reservations_child_status").on(table.childId, table.status),
]);

export const fixedSchedules = sqliteTable("fixed_schedules", {
  id: text("id").primaryKey(),
  childId: text("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  weekday: integer("weekday").notNull(),
  startTime: text("start_time").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  ...timestamps,
}, (table) => [
  uniqueIndex("idx_fixed_schedules_child_weekday").on(table.childId, table.weekday),
  index("idx_fixed_schedules_weekday_time").on(table.weekday, table.startTime, table.active),
]);

export const fixedScheduleRequests = sqliteTable("fixed_schedule_requests", {
  id: text("id").primaryKey(),
  childId: text("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  requestedPlan: text("requested_plan", { enum: ["2", "3"] }).notNull(),
  requestedTimesJson: text("requested_times_json").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected", "cancelled"] }).notNull().default("pending"),
  requestedBy: text("requested_by").notNull().references(() => users.id),
  reviewedBy: text("reviewed_by").references(() => users.id),
  reviewedAt: text("reviewed_at"),
  rejectionReason: text("rejection_reason"),
  ...timestamps,
}, (table) => [index("idx_fixed_requests_status_created").on(table.status, table.createdAt)]);

export const absences = sqliteTable("absences", {
  id: text("id").primaryKey(),
  reservationId: text("reservation_id").notNull().references(() => reservations.id, { onDelete: "cascade" }),
  reasonCode: text("reason_code").notNull(),
  reasonText: text("reason_text"),
  status: text("status", { enum: ["approved", "pending", "rejected", "late"] }).notNull(),
  reviewedBy: text("reviewed_by").references(() => users.id),
  ...timestamps,
}, (table) => [uniqueIndex("idx_absences_reservation").on(table.reservationId)]);

export const makeupTickets = sqliteTable("makeup_tickets", {
  id: text("id").primaryKey(),
  childId: text("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  sourceType: text("source_type", { enum: ["absence", "center_cancel", "admin"] }).notNull(),
  sourceId: text("source_id"),
  status: text("status", { enum: ["available", "reserved", "used", "expired", "revoked"] }).notNull().default("available"),
  expiresAt: text("expires_at").notNull(),
  usedReservationId: text("used_reservation_id").references(() => reservations.id),
  issuedBy: text("issued_by").references(() => users.id),
  ...timestamps,
}, (table) => [index("idx_makeup_child_status_expiry").on(table.childId, table.status, table.expiresAt)]);

export const notices = sqliteTable("notices", {
  id: text("id").primaryKey(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isPinned: integer("is_pinned", { mode: "boolean" }).notNull().default(false),
  publishedAt: text("published_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  ...timestamps,
}, (table) => [index("idx_notices_pinned_published").on(table.isPinned, table.publishedAt)]);

export const faqs = sqliteTable("faqs", {
  id: text("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isVisible: integer("is_visible", { mode: "boolean" }).notNull().default(true),
  ...timestamps,
}, (table) => [index("idx_faqs_visible_order").on(table.isVisible, table.sortOrder)]);

export const programs = sqliteTable("programs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  summary: text("summary").notNull(),
  description: text("description").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isVisible: integer("is_visible", { mode: "boolean" }).notNull().default(true),
  ...timestamps,
}, (table) => [index("idx_programs_visible_order").on(table.isVisible, table.sortOrder)]);

export const staff = sqliteTable("staff", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  biography: text("biography").notNull(),
  educationJson: text("education_json").notNull().default("[]"),
  careerJson: text("career_json").notNull().default("[]"),
  awardsJson: text("awards_json").notNull().default("[]"),
  imageKey: text("image_key"),
  sortOrder: integer("sort_order").notNull().default(0),
  isVisible: integer("is_visible", { mode: "boolean" }).notNull().default(true),
  ...timestamps,
}, (table) => [index("idx_staff_visible_order").on(table.isVisible, table.sortOrder)]);

export const facilities = sqliteTable("facilities", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  imageKey: text("image_key").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isVisible: integer("is_visible", { mode: "boolean" }).notNull().default(true),
  ...timestamps,
}, (table) => [index("idx_facilities_visible_order").on(table.isVisible, table.sortOrder)]);

export const centerContent = sqliteTable("center_content", {
  key: text("key").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  updatedBy: text("updated_by").references(() => users.id),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const trialApplications = sqliteTable("trial_applications", {
  id: text("id").primaryKey(),
  parentName: text("parent_name").notNull(),
  phone: text("phone").notNull(),
  childName: text("child_name").notNull(),
  childAgeGroup: text("child_age_group").notNull(),
  preferredDate: text("preferred_date"),
  note: text("note").notNull().default(""),
  status: text("status", { enum: ["new", "contacted", "scheduled", "completed", "cancelled"] }).notNull().default("new"),
  assignedTo: text("assigned_to").references(() => users.id),
  ...timestamps,
}, (table) => [index("idx_trial_status_created").on(table.status, table.createdAt)]);

export const chatThreads = sqliteTable("chat_threads", {
  id: text("id").primaryKey(),
  parentId: text("parent_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["open", "closed"] }).notNull().default("open"),
  lastMessageAt: text("last_message_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  ...timestamps,
}, (table) => [uniqueIndex("idx_chat_threads_parent").on(table.parentId)]);

export const chatMessages = sqliteTable("chat_messages", {
  id: text("id").primaryKey(),
  threadId: text("thread_id").notNull().references(() => chatThreads.id, { onDelete: "cascade" }),
  senderId: text("sender_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  readAt: text("read_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_chat_messages_thread_created").on(table.threadId, table.createdAt)]);

export const notificationSettings = sqliteTable("notification_settings", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  booking: integer("booking", { mode: "boolean" }).notNull().default(true),
  waitlist: integer("waitlist", { mode: "boolean" }).notNull().default(true),
  notices: integer("notices", { mode: "boolean" }).notNull().default(true),
  chat: integer("chat", { mode: "boolean" }).notNull().default(true),
  quietStart: text("quiet_start"),
  quietEnd: text("quiet_end"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const restrictions = sqliteTable("restrictions", {
  id: text("id").primaryKey(),
  childId: text("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  sessionId: text("session_id").references(() => classSessions.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdBy: text("created_by").notNull().references(() => users.id),
  ...timestamps,
}, (table) => [index("idx_restrictions_child_active").on(table.childId, table.active)]);

export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  valueJson: text("value_json").notNull(),
  updatedBy: text("updated_by").references(() => users.id),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  actorId: text("actor_id").references(() => users.id),
  action: text("action").notNull(),
  resource: text("resource").notNull(),
  resourceId: text("resource_id"),
  beforeJson: text("before_json"),
  afterJson: text("after_json"),
  ipAddress: text("ip_address"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_audit_resource_created").on(table.resource, table.createdAt),
  index("idx_audit_actor_created").on(table.actorId, table.createdAt),
]);
