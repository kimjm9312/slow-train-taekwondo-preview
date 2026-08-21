CREATE TABLE `absences` (
	`id` text PRIMARY KEY NOT NULL,
	`reservation_id` text NOT NULL,
	`reason_code` text NOT NULL,
	`reason_text` text,
	`status` text NOT NULL,
	`reviewed_by` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`reservation_id`) REFERENCES `reservations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_absences_reservation` ON `absences` (`reservation_id`);--> statement-breakpoint
CREATE TABLE `app_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value_json` text NOT NULL,
	`updated_by` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text,
	`action` text NOT NULL,
	`resource` text NOT NULL,
	`resource_id` text,
	`before_json` text,
	`after_json` text,
	`ip_address` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_audit_resource_created` ON `audit_logs` (`resource`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_audit_actor_created` ON `audit_logs` (`actor_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `auth_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_auth_sessions_token` ON `auth_sessions` (`token_hash`);--> statement-breakpoint
CREATE INDEX `idx_auth_sessions_user_expires` ON `auth_sessions` (`user_id`,`expires_at`);--> statement-breakpoint
CREATE TABLE `center_content` (
	`key` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`updated_by` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`message` text NOT NULL,
	`read_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`thread_id`) REFERENCES `chat_threads`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_chat_messages_thread_created` ON `chat_messages` (`thread_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `chat_threads` (
	`id` text PRIMARY KEY NOT NULL,
	`parent_id` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`last_message_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_chat_threads_parent` ON `chat_threads` (`parent_id`);--> statement-breakpoint
CREATE TABLE `children` (
	`id` text PRIMARY KEY NOT NULL,
	`parent_id` text NOT NULL,
	`name` text NOT NULL,
	`age_group` text NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_children_parent_status` ON `children` (`parent_id`,`status`);--> statement-breakpoint
CREATE TABLE `class_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`session_date` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`title` text DEFAULT '발달 태권도' NOT NULL,
	`capacity` integer DEFAULT 6 NOT NULL,
	`wait_capacity` integer DEFAULT 1 NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`booking_closes_minutes` integer DEFAULT 60 NOT NULL,
	`change_closes_minutes` integer DEFAULT 180 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_class_sessions_date_time` ON `class_sessions` (`session_date`,`start_time`);--> statement-breakpoint
CREATE INDEX `idx_class_sessions_status_date` ON `class_sessions` (`status`,`session_date`);--> statement-breakpoint
CREATE TABLE `facilities` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`image_key` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_visible` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_facilities_visible_order` ON `facilities` (`is_visible`,`sort_order`);--> statement-breakpoint
CREATE TABLE `faqs` (
	`id` text PRIMARY KEY NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_visible` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_faqs_visible_order` ON `faqs` (`is_visible`,`sort_order`);--> statement-breakpoint
CREATE TABLE `fixed_schedule_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`child_id` text NOT NULL,
	`requested_plan` text NOT NULL,
	`requested_times_json` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`requested_by` text NOT NULL,
	`reviewed_by` text,
	`reviewed_at` text,
	`rejection_reason` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`child_id`) REFERENCES `children`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_fixed_requests_status_created` ON `fixed_schedule_requests` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `fixed_schedules` (
	`id` text PRIMARY KEY NOT NULL,
	`child_id` text NOT NULL,
	`weekday` integer NOT NULL,
	`start_time` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`child_id`) REFERENCES `children`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_fixed_schedules_child_weekday` ON `fixed_schedules` (`child_id`,`weekday`);--> statement-breakpoint
CREATE INDEX `idx_fixed_schedules_weekday_time` ON `fixed_schedules` (`weekday`,`start_time`,`active`);--> statement-breakpoint
CREATE TABLE `makeup_tickets` (
	`id` text PRIMARY KEY NOT NULL,
	`child_id` text NOT NULL,
	`source_type` text NOT NULL,
	`source_id` text,
	`status` text DEFAULT 'available' NOT NULL,
	`expires_at` text NOT NULL,
	`used_reservation_id` text,
	`issued_by` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`child_id`) REFERENCES `children`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`used_reservation_id`) REFERENCES `reservations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`issued_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_makeup_child_status_expiry` ON `makeup_tickets` (`child_id`,`status`,`expires_at`);--> statement-breakpoint
CREATE TABLE `notices` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`is_pinned` integer DEFAULT false NOT NULL,
	`published_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_notices_pinned_published` ON `notices` (`is_pinned`,`published_at`);--> statement-breakpoint
CREATE TABLE `notification_settings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`booking` integer DEFAULT true NOT NULL,
	`waitlist` integer DEFAULT true NOT NULL,
	`notices` integer DEFAULT true NOT NULL,
	`chat` integer DEFAULT true NOT NULL,
	`quiet_start` text,
	`quiet_end` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `phone_verifications` (
	`id` text PRIMARY KEY NOT NULL,
	`phone` text NOT NULL,
	`code_hash` text NOT NULL,
	`verified_at` text,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_phone_verifications_phone` ON `phone_verifications` (`phone`,`expires_at`);--> statement-breakpoint
CREATE TABLE `programs` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`summary` text NOT NULL,
	`description` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_visible` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_programs_visible_order` ON `programs` (`is_visible`,`sort_order`);--> statement-breakpoint
CREATE TABLE `reservations` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`child_id` text NOT NULL,
	`session_date` text NOT NULL,
	`start_time` text NOT NULL,
	`booking_type` text NOT NULL,
	`status` text NOT NULL,
	`wait_position` integer,
	`cancelled_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `class_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`child_id`) REFERENCES `children`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_reservations_session_child` ON `reservations` (`session_id`,`child_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_reservations_child_datetime` ON `reservations` (`child_id`,`session_date`,`start_time`);--> statement-breakpoint
CREATE INDEX `idx_reservations_session_status` ON `reservations` (`session_id`,`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_reservations_child_status` ON `reservations` (`child_id`,`status`);--> statement-breakpoint
CREATE TABLE `restrictions` (
	`id` text PRIMARY KEY NOT NULL,
	`child_id` text NOT NULL,
	`session_id` text,
	`reason` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`child_id`) REFERENCES `children`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `class_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_restrictions_child_active` ON `restrictions` (`child_id`,`active`);--> statement-breakpoint
CREATE TABLE `staff` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`title` text NOT NULL,
	`biography` text NOT NULL,
	`education_json` text DEFAULT '[]' NOT NULL,
	`career_json` text DEFAULT '[]' NOT NULL,
	`awards_json` text DEFAULT '[]' NOT NULL,
	`image_key` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_visible` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_staff_visible_order` ON `staff` (`is_visible`,`sort_order`);--> statement-breakpoint
CREATE TABLE `trial_applications` (
	`id` text PRIMARY KEY NOT NULL,
	`parent_name` text NOT NULL,
	`phone` text NOT NULL,
	`child_name` text NOT NULL,
	`child_age_group` text NOT NULL,
	`preferred_date` text,
	`note` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`assigned_to` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_trial_status_created` ON `trial_applications` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'parent' NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`profile_image_key` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_username` ON `users` (`username`);--> statement-breakpoint
CREATE INDEX `idx_users_role_status` ON `users` (`role`,`status`);