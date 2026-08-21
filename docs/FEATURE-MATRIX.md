# 49개 기능 검수표

| # | 기능 | 실제 저장/처리 위치 | 상태 |
|---:|---|---|---|
| 1 | 아이디 로그인 | `POST /api/v1/auth/login`, `users`, `auth_sessions` | 구현 |
| 2 | 로그아웃 | `POST /api/v1/auth/logout` | 구현 |
| 3 | 회원가입 | `POST /api/v1/auth/signup` | 구현 |
| 4 | 아이디 중복확인 | `POST /api/v1/auth/check-id` | 구현 |
| 5 | 휴대전화 인증 요청 | `POST /api/v1/auth/phone/request` | 서버 구현·SMS 업체 연결 필요 |
| 6 | 휴대전화 인증 확인 | `POST /api/v1/auth/phone/confirm` | 구현 |
| 7 | 로그인 세션 확인 | `GET /api/v1/auth/session` | 구현 |
| 8 | 보호자 개인정보 수정 | `PATCH /api/v1/profile` | 구현 |
| 9 | 비밀번호 변경 | `PUT /api/v1/profile` | 구현 |
| 10 | 프로필 사진 업로드 | `POST /api/v1/media`, R2 | 구현 |
| 11 | 회원 탈퇴 | `DELETE /api/v1/profile` | 구현 |
| 12 | 자녀 추가·조회·수정·삭제 | `/api/v1/children` | 구현 |
| 13 | 알림 항목·방해금지 설정 | `/api/v1/notifications` | 설정 저장 구현·실제 푸시 연결 필요 |
| 14 | 기간별 수업 시간표 | `GET /api/v1/sessions` | 구현 |
| 15 | 참가 신청 | `POST /api/v1/reservations` | 구현 |
| 16 | 대기 1명 신청 | `reserve()` | 구현 |
| 17 | 만석 신청 차단 | `SESSION_FULL` | 구현 |
| 18 | 참가 완료·대기 상태 표시 | `myStatus`, `myReservationId` | 구현 |
| 19 | 신청 마감 1시간 | 서버 `booking_closes_minutes` | 구현 |
| 20 | 변경·취소 마감 3시간 | 서버 `change_closes_minutes` | 구현 |
| 21 | 예약 취소 | `DELETE /api/v1/reservations/:id` | 구현 |
| 22 | 동일 자녀·동일 시간 중복 방지 | DB 고유 인덱스+서버 검사 | 구현 |
| 23 | 동시 신청 정원 초과 방지 | 조건부 원자적 INSERT | 자동 테스트 통과 |
| 24 | 취소 시 대기자 자동 참가 전환 | `cancelReservation()` | 자동 테스트 통과 |
| 25 | 관리자 수업 추가 | `POST /api/v1/sessions` | 구현 |
| 26 | 관리자 수업 수정 | `PATCH /api/v1/sessions/:id` | 구현 |
| 27 | 관리자 수업 삭제 | `DELETE /api/v1/sessions/:id` | 구현 |
| 28 | 관리자 수업 열기·닫기·휴강 | 수업 `status` | 구현 |
| 29 | 신청·대기 명단 확인 | `GET /api/v1/sessions/:id/roster` | 구현 |
| 30 | 관리자의 명단 추가·제외 | `POST/DELETE .../roster` | 구현 |
| 31 | 특정 회원 신청 제한·해제 | `/api/v1/admin/restrictions` | 구현 |
| 32 | 주 2회·주 3회 고정수업 | `fixed_schedules` | 구현 |
| 33 | 부모 고정수업 변경 신청 | `POST /api/v1/fixed-schedule-requests` | 구현 |
| 34 | 관리자 고정수업 승인·반려 | `PATCH .../fixed-schedule-requests/:id` | 구현 |
| 35 | 관리자 고정수업 직접 변경 | `PUT /api/v1/fixed-schedules` | 구현 |
| 36 | 고정 타임 정원 확인 | `replaceFixedSchedule()` | 구현 |
| 37 | 결석 신청과 자리 공개 | `POST /api/v1/absences` | 구현 |
| 38 | 정해진 결석 사유 보강권 자동 지급 | `absences`, `makeup_tickets` | 구현 |
| 39 | 기타 사유 관리자 승인·반려 | `PATCH /api/v1/absences/:id` | 구현 |
| 40 | 보강권 조회·유효기간 | `GET /api/v1/makeup-tickets` | 구현 |
| 41 | 보강권으로 수업 신청 | 예약 `bookingType=makeup` | 구현 |
| 42 | 마감 전 보강 취소 시 반환 | `cancelReservation()` | 구현 |
| 43 | 관리자 보강권 지급·차감 | `/api/v1/makeup-tickets` | 구현 |
| 44 | 공지사항 개별 추가·수정·삭제 | `/api/v1/content/notices` | 구현 |
| 45 | FAQ 개별 추가·수정·삭제 | `/api/v1/content/faqs` | 구현 |
| 46 | 프로그램·지도진·시설 개별 CRUD | `/api/v1/content/*` | 구현 |
| 47 | 센터 소개 문구 개별 CRUD | `/api/v1/center` | 구현 |
| 48 | 상담·체험 신청 접수·상태·삭제 | `/api/v1/trials` | 구현 |
| 49 | 슬로우톡·관리자 권한·모든 변경기록 | `/api/v1/chat`, `/admin/users`, `/audit-logs` | 구현 |

화면만 움직이고 끝나는 항목은 없습니다. `SMS 실제 발송`과 `푸시 실제 발송`만 외부 서비스 계정 연결 전 단계이며, 해당 항목은 위 표에 별도로 표시했습니다.
