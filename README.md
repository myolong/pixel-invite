# pixel-invite

게임을 깨면 열리는 픽셀 청첩장.

- `index.html` 소개 화면
- `invite.html?c=<이름>` 청첩장 화면. `invites/<이름>.json`의 내용을 읽어서 보여줘요.
- 샘플: `invite.html?c=sample`

## 구성

- `js/characters.js` 신랑·신부 픽셀 캐릭터(머리 모양·색·옷·안경·베일 조합)
- `js/stage.js` 예식장 배경과 그리기 도구
- `js/game-bouquet.js` 미니게임 "부케 받기"(30초)
- `js/invite.js` 오프닝, 게임 흐름, 예식 정보(지도, 계좌 복사, 캘린더, 공유)

글꼴: Galmuri(SIL Open Font License 1.1, `fonts/LICENSE.txt`)
