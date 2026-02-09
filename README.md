# FitMind Gym Routine

검색 없이 바로 운동하려고 만든 개인 루틴 웹앱입니다.

## 실행 방법
1. `c:\MyApp\FitMind AI\index.html` 파일을 브라우저로 열기
2. 요일 선택 후 운동 진행
3. `세트 완료` 버튼으로 세트 누적
4. 휴식 타이머 확인 후 다음 세트 진행
5. 운동 종료 후 `오늘 요약 저장`

## Supabase 로그인 + 클라우드 저장 설정
1. Supabase 프로젝트 생성
2. Supabase SQL Editor에서 `supabase/setup.sql` 실행
3. `supabase-config.example.js`를 참고해서 `supabase-config.js` 값 입력
4. 배포 환경(Vercel)에서도 동일하게 `supabase-config.js` 반영
5. 앱 상단 `로그인` 버튼으로 이메일 로그인 후 `클라우드 동기화` 실행

`supabase-config.js` 예시:
```js
window.FITMIND_SUPABASE_URL = "https://YOUR_PROJECT_REF.supabase.co";
window.FITMIND_SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
window.FITMIND_SUPABASE_REDIRECT_URL = "https://fitmind.dmssolution.co.kr";
```

주의:
- `ANON KEY`는 공개 키라 프론트엔드에서 사용 가능하지만, `SERVICE ROLE KEY`는 절대 넣지 마세요.
- 로그인 완료 후 기록은 `fitmind_workout_summaries` 테이블에 사용자별로 저장됩니다.

## 포함 기능
- 루틴 순서 자동 진행 (MON~FRI)
- 운동 가이드 카드
  - 운동방법
  - 기구 설명
  - 공(짐볼) 대체 운동
  - 주의 포인트 / 자주 하는 실수
- 세트 완료 및 휴식 타이머
- 완주율/검색 횟수/불안도 기록
- 최근 기록 저장(LocalStorage)
- Supabase 로그인 + 클라우드 동기화
- 일별/주별/월별 기록 집계
