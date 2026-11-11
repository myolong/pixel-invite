# pixel-invite (픽셀 초대장)

게임을 깨면 열리는 재밌는 초대장. 오프닝과 게임은 픽셀, 초대장 본문은 일반 모바일 청첩장 디자인이에요.

초대장 종류 8개(`js/kinds.js`): 결혼식, 비혼식, 이혼식(새 출발), 연말 모임, 연초 모임, 결혼 알림장(식 생략), 베이비샤워, 기념 행사. 종류마다 사람 수(1~2명)·이름표·인사말 예시·장면 색(`Stage.THEMES`)·게임 소품(부케·케이크·별·선물·복주머니·젖병)이 달라요. 설정의 `kind`가 없으면 결혼식이에요.

- `index.html` 첫 화면: 종류 8개를 움직이는 픽셀 미리보기 카드로 보여줘요(`js/scene.js`)
- `kind.html?k=<종류>` 종류 소개: 설명, 들어가는 것, 미니게임 안내, 휴대폰 틀 안의 예시 초대장(`InviteKinds.sampleConfig`), 만들기 버튼
- `make.html` 만들기 화면(무료 베타). 정보 입력 → 캐릭터 꾸미기 → 청첩장 링크 발행. 가입·서버 없이 내용 전체를 링크에 담아요. 수정은 `make.html?d=<코드>`.
- `invite.html?d=<코드>` 만들기 화면에서 만든 청첩장. 사진이 없으면 픽셀 신랑·신부 그림이 대표 사진 자리에 들어가요.
- `invite.html?c=<이름>` 청첩장 화면. `invites/<이름>.json`의 내용을 읽어서 보여줘요.
- 샘플: `invite.html?c=sample`

## 구성

- `js/characters.js` 신랑·신부 픽셀 캐릭터(머리 모양·색·옷·안경·베일 조합)
- `js/stage.js` 예식장 배경과 그리기 도구
- `js/game-bouquet.js` 미니게임 "부케 받기"(30초)
- `js/invite-code.js` 설정 JSON ↔ 링크 코드(deflate-raw 압축 + base64url, 압축을 못 쓰면 `j.` 형식)
- `js/kinds.js` 초대장 종류 설정
- `js/make.js`, `css/make.css` 만들기 화면(`make.html?k=<종류>`로 종류를 골라서 열 수 있어요)
- `js/invite.js` 오프닝, 게임 흐름, 청첩장 본문(대표 사진·영상, 인사말, 달력, 사진첩 9장, 지도, 계좌, 캘린더, 공유)
- `invites/<이름>/` 그 청첩장의 사진·영상 파일. 설정의 `cover`(`type`: `photo` 또는 `video`)와 `gallery`에 파일 이름을 적어요.

글꼴: Galmuri(SIL Open Font License 1.1, `fonts/LICENSE.txt`)
