# pixel-invite

게임을 깨면 열리는 청첩장. 오프닝과 게임은 픽셀, 청첩장 본문은 일반 모바일 청첩장 디자인이에요.

- `index.html` 소개 화면
- `invite.html?c=<이름>` 청첩장 화면. `invites/<이름>.json`의 내용을 읽어서 보여줘요.
- 샘플: `invite.html?c=sample`

## 구성

- `js/characters.js` 신랑·신부 픽셀 캐릭터(머리 모양·색·옷·안경·베일 조합)
- `js/stage.js` 예식장 배경과 그리기 도구
- `js/game-bouquet.js` 미니게임 "부케 받기"(30초)
- `js/invite.js` 오프닝, 게임 흐름, 청첩장 본문(대표 사진·영상, 인사말, 달력, 사진첩 9장, 지도, 계좌, 캘린더, 공유)
- `invites/<이름>/` 그 청첩장의 사진·영상 파일. 설정의 `cover`(`type`: `photo` 또는 `video`)와 `gallery`에 파일 이름을 적어요.

글꼴: Galmuri(SIL Open Font License 1.1, `fonts/LICENSE.txt`)
