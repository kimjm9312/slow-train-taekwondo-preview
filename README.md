# 슬로우 트레인 태권도

정원 6명 수업의 고정회원·신규회원·보강회원 예약을 하나의 데이터베이스에서 관리하는 풀스택 앱입니다.

## 구성

- `app/`: 부모용·관리자용 설치형 웹앱(PWA)과 REST API
- `server/`: 인증, 예약, 대기 전환, 콘텐츠 CRUD, 감사 기록 도메인 로직
- `db/`: D1 데이터베이스 스키마
- `drizzle/`: 배포 시 적용되는 SQL 마이그레이션
- `mobile/`: Android·iOS용 Expo React Native 앱
- `tests/api.integration.mjs`: 로그인, CRUD, 정원 동시성, 대기 승급 통합 테스트

## 로컬 실행

```powershell
pnpm install
pnpm db:generate
node node_modules/wrangler/bin/wrangler.js d1 migrations apply site-creator-d1 --local
node node_modules/vinext/dist/cli.js dev
```

웹: `http://localhost:3000`

### 테스트 계정

- 일반회원: `slowtrain_parent` / `1234`
- 관리자: `admin` / `1234`

운영 전에는 반드시 초기 비밀번호를 변경해야 합니다.

## 검증

```powershell
node node_modules/typescript/bin/tsc --noEmit
node mobile/node_modules/typescript/bin/tsc --noEmit
node node_modules/vinext/dist/cli.js build
node tests/api.integration.mjs
```

## 모바일 앱

`mobile/.env.example`을 `.env`로 복사하고 배포된 API 주소를 입력한 뒤 Expo/EAS로 Android·iOS 빌드를 생성합니다. 모바일 인증 토큰은 `expo-secure-store`에 저장되며, 서버는 웹의 HttpOnly 쿠키와 모바일의 Bearer 토큰을 모두 지원합니다.

## 외부 서비스 연결 필요

- 휴대전화 인증번호 실제 문자 발송 업체
- 앱 푸시 알림(APNs/FCM 또는 Expo Push)
- Apple App Store·Google Play 개발자 계정과 심사

DB·회원인증·권한·예약·관리자 CRUD는 외부 업체 없이 현재 코드에 구현되어 있습니다.
