import { d1, one } from "./database";
import { hashPassword } from "./auth";

let bootstrapPromise: Promise<void> | null = null;

export function ensureBootstrap() {
  bootstrapPromise ??= seed();
  return bootstrapPromise;
}

async function seed() {
  const existing = await one<{ count: number }>("SELECT COUNT(*) AS count FROM users");
  if ((existing?.count ?? 0) > 0) return;

  const adminHash = await hashPassword("1234");
  const parentHash = await hashPassword("1234");
  const statements = [
    d1().prepare("INSERT INTO users(id,username,password_hash,role,name,phone) VALUES(?,?,?,?,?,?)").bind("usr_admin", "admin", adminHash, "admin", "슬로우 트레인 관리자", "010-0000-0000"),
    d1().prepare("INSERT INTO users(id,username,password_hash,role,name,phone) VALUES(?,?,?,?,?,?)").bind("usr_parent", "slowtrain_parent", parentHash, "parent", "김보호자", "010-1234-5678"),
    d1().prepare("INSERT INTO children(id,parent_id,name,age_group,notes) VALUES(?,?,?,?,?)").bind("child_hajun", "usr_parent", "김하준", "초등 3·4학년", ""),
    d1().prepare("INSERT INTO notification_settings(user_id) VALUES(?)").bind("usr_admin"),
    d1().prepare("INSERT INTO notification_settings(user_id) VALUES(?)").bind("usr_parent"),
    d1().prepare("INSERT INTO notices(id,category,title,content,is_pinned) VALUES(?,?,?,?,?)").bind("notice_welcome", "안내", "수업 예약·변경 이용 방법", "신청은 수업 1시간 전, 변경·취소는 3시간 전까지 가능합니다.", 1),
    d1().prepare("INSERT INTO faqs(id,question,answer,sort_order) VALUES(?,?,?,?)").bind("faq_booking", "수업은 언제까지 신청할 수 있나요?", "수업 시작 1시간 전까지 신청할 수 있습니다.", 1),
    d1().prepare("INSERT INTO faqs(id,question,answer,sort_order) VALUES(?,?,?,?)").bind("faq_change", "수업 변경과 취소는 언제까지 가능한가요?", "수업 시작 3시간 전까지 가능합니다.", 2),
    d1().prepare("INSERT INTO app_settings(key,value_json,updated_by) VALUES(?,?,?)").bind("booking_policy", JSON.stringify({ capacity: 6, waitCapacity: 1, bookingClosesMinutes: 60, changeClosesMinutes: 180 }), "usr_admin"),
    d1().prepare("INSERT INTO fixed_schedules(id,child_id,weekday,start_time) VALUES(?,?,?,?)").bind("fixed_hajun_mon", "child_hajun", 1, "17:00"),
    d1().prepare("INSERT INTO fixed_schedules(id,child_id,weekday,start_time) VALUES(?,?,?,?)").bind("fixed_hajun_wed", "child_hajun", 3, "17:00"),
    d1().prepare("INSERT INTO fixed_schedules(id,child_id,weekday,start_time) VALUES(?,?,?,?)").bind("fixed_hajun_fri", "child_hajun", 5, "17:00"),
    d1().prepare("INSERT INTO center_content(key,title,content,updated_by) VALUES(?,?,?,?)").bind("philosophy", "아이만의 여정", "우리는 지나치는 역이 없습니다.\n발달장애인의 성장과 사회적 연결을 위해 달립니다.", "usr_admin"),
    d1().prepare("INSERT INTO center_content(key,title,content,updated_by) VALUES(?,?,?,?)").bind("address", "센터 주소", "인천 연수구 인천타워대로 301 상가동 2층, CU편의점 맞은편", "usr_admin"),
    d1().prepare("INSERT INTO programs(id,name,summary,description,sort_order) VALUES(?,?,?,?,?)").bind("program_basic", "기초 움직임과 태권도", "감각·균형·협응을 바탕으로 태권도의 기본을 익힙니다.", "개별 발달 수준에 맞춘 움직임 탐색, 기본 자세, 발차기, 미트 활동을 단계적으로 진행합니다.", 1),
    d1().prepare("INSERT INTO programs(id,name,summary,description,sort_order) VALUES(?,?,?,?,?)").bind("program_social", "사회성과 자기조절", "기다리기·차례 지키기·함께하기를 수업 안에서 연습합니다.", "예측 가능한 수업 구조 안에서 또래 및 지도진과 소통하며 자기조절과 사회적 연결을 경험합니다.", 2),
    d1().prepare("INSERT INTO staff(id,name,title,biography,education_json,career_json,awards_json,image_key,sort_order) VALUES(?,?,?,?,?,?,?,?,?)").bind("staff_choi", "최종우", "대표", "슬로우 트레인의 방향과 운영을 총괄합니다.", "[]", "[]", "[]", "/prototype/assets/choi-jongwoo.jpg", 1),
    d1().prepare("INSERT INTO staff(id,name,title,biography,education_json,career_json,awards_json,image_key,sort_order) VALUES(?,?,?,?,?,?,?,?,?)").bind("staff_kim", "김진만", "지도관장", "발달장애 아동과 초등학생 지도 경험을 바탕으로 아이마다 다른 속도와 강점을 존중합니다.", JSON.stringify(["용인대학교 태권도학과 학사"]), JSON.stringify(["현) 슬로우 트레인 지도관장", "MBN 위대한쇼 태권 파이널 진출", "전) 대한민국 태권도 품새 국가대표팀 선수", "전) 해외 태권도 품새 국가대표팀 코치", "전) KTA 국가대표 태권도 시범공연단 단원"]), JSON.stringify(["세계 태권도 품새 선수권대회 자유품새 1위", "세계 태권도 품새 그랑프리 시리즈 자유품새 1위", "전국 및 시·도 공인품새·자유품새 대회 다수 입상"]), "/prototype/assets/kim-jinman.jpg", 2),
    d1().prepare("INSERT INTO facilities(id,title,description,image_key,sort_order) VALUES(?,?,?,?,?)").bind("facility_entrance", "슬로우 트레인 입구", "아이와 보호자가 편안하게 방문할 수 있는 공간입니다.", "/prototype/assets/slow-train-entrance.png", 1),
  ];

  const slots = ["14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];
  const today = new Date();
  for (let offset = 0; offset < 21; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    const weekday = date.getDay();
    if (weekday === 0 || weekday === 6) continue;
    const sessionDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
    for (const startTime of slots) {
      const endTime = `${String(Number(startTime.slice(0, 2)) + 1).padStart(2, "0")}:00`;
      statements.push(d1().prepare("INSERT INTO class_sessions(id,session_date,start_time,end_time,title,capacity,wait_capacity,status) VALUES(?,?,?,?,?,?,?,?)").bind(`class_${sessionDate}_${startTime.replace(":", "")}`, sessionDate, startTime, endTime, "발달 태권도", 6, 1, "open"));
    }
  }
  for (let index = 0; index < statements.length; index += 50) {
    await d1().batch(statements.slice(index, index + 50));
  }
}
