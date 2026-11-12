# pixel-invite (게임초대장)

게임을 깨면 열리는 재밌는 초대장. 오프닝과 게임은 픽셀, 초대장 본문은 일반 모바일 청첩장 디자인이에요.

초대장 종류 9개(`js/kinds.js` ORDER): 결혼식, 연말 모임, 신년 모임, 크리스마스 파티, 설 연휴 모임, 추석 모임, 결혼 알림장(식 생략), 번개 모임, 기타 모임. 종류마다 이름표·인사말 예시·무대(`Stage.THEMES`의 벽·하늘과 뒤/앞 꾸밈)·게임 소품·꾸미기 선택지(`STYLE`: 옷 7가지와 소품)가 달라요. 예전 종류(비혼식·이혼식·베이비샤워·기념 행사)는 이미 보낸 링크가 열리도록 KINDS에만 남겨 뒀어요. 설정의 `kind`가 없으면 결혼식이에요.

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

- `js/face-crop.js` 사진 얼굴: 사진에서 얼굴을 자동으로 찾아(MediaPipe Face Detector, 처음 쓸 때 jsdelivr·Google 저장소에서 받음) 72px 동그란 얼굴로 오려요. 사진은 기기 안에서만 처리하고, 오린 얼굴(몇 KB)만 링크(`look.face`)에 들어가요. 캐릭터는 얼굴이 있으면 픽셀 머리 대신 이 얼굴을 그려요.

- `js/rsvp.js`, `supabase/rsvp.sql` 참석 여부(RSVP). Supabase에 `rsvp.sql`을 한 번 실행해 두고, `js/rsvp.js`에 Project URL과 공개(publishable) 키를 적어요. 비워 두면 기능이 꺼져요. 초대장 링크에는 초대장 번호만, 수정용 링크에는 만든 사람 열쇠(`rsvpKey`)도 들어가요. 연말·신년 모임(`rsvpPublic`)은 받은 사람 모두가 명단을 보고, 나머지는 수정용 링크로만 봐요.
- `supabase/short-link.sql` 짧은 링크. 초대장 내용을 Supabase에 저장하고 `invite-<종류>.html?s=<8글자 번호>`로 줘요. 긴 링크는 카카오톡이 긴 글로 접어서 미리보기를 안 만들기 때문이에요. 저장이 안 되면 예전처럼 `?d=` 긴 링크로 나가고, 예전 긴 링크도 그대로 열려요.

글꼴: Galmuri(SIL Open Font License 1.1, `fonts/LICENSE.txt`)

## 예시 사진·화면 캡처

- `invites/examples/<종류>/p1~p6.png` 예시 초대장 사진첩(픽셀 그림, 실제 사람 사진 아님)
- `assets/shots/<종류>-1~3.jpg` 종류 페이지의 오프닝·게임·초대장 화면 캡처
- 다시 만들기: 저장소 폴더에서 `python3 -m http.server 8765`를 켜고 `node tools/make-examples.js` (`tools/photo-gen.js`가 장면을 그림)

## 카톡 미리보기

- 초대장 링크는 종류별 입구 `invite-<종류>.html`로 나가요. 내용은 `invite.html`과 같고, 카톡·문자 미리보기용 제목("결혼식 청첩장" 등)과 그림(`assets/og/<종류>.png`)만 달라요.
- `invite.html`을 고치면 `python3 -m http.server 8765`를 켜고 `node tools/make-og.js`로 입구 파일과 그림을 다시 만들어 주세요.

## 배포할 때

HTML의 `js/…`, `css/…` 주소 끝에 `?v=날짜` 가 붙어 있어요. 브라우저가 예전 파일을 기억해서 새 화면이 깨지는 걸 막으려는 것이라, JS·CSS를 고치면 모든 HTML의 `?v=` 값을 함께 바꿔 주세요.

## 광고

애드센스(자동 광고) 코드는 만드는 사람이 보는 `index.html`, `kind.html`, `make.html`에만 넣었어요. 손님이 여는 `invite.html`·`invite-<종류>.html`에는 넣지 않아요. `ads.txt`는 도메인 맨 위에 있어야 해서, 지금 주소(github.io 하위 경로)에서는 쓰이지 않고 도메인을 연결하면 쓰여요.

## 안내 글·소개·개인정보처리방침

원본은 `tools/pages/*.html`. 고친 뒤 `python3 tools/build-pages.py`를 실행하면 `guide/`, `about.html`, `privacy.html`, `contact.html`, `sitemap.xml`과 첫 화면·종류·만들기 페이지의 바닥글이 새로 만들어져요. 도메인을 연결하면 스크립트의 `SITE`를 바꾸고 다시 실행해요.
