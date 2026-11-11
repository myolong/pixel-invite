// 초대장 종류: 사람 수, 이름표, 문구, 장면, 게임 소품을 종류마다 정한다.
// 설정 파일의 kind가 없으면 결혼식(wedding)으로 본다.
'use strict';

(function () {
  const look = (outfit, extra) => Object.assign({ outfit, hair: 'short', skin: 0, hairColor: 0, color: 0 }, extra || {});

  const KINDS = {
    wedding: {
      name: '결혼식 초대', short: '결혼식', blurb: '신랑·신부가 부케를 던지고 받는 청첩장',
      people: [
        { label: '신랑', look: look('tux') },
        { label: '신부', look: look('dress', { hair: 'long', hairColor: 1, veil: true }) },
      ],
      parents: true, title: false,
      eyebrow: 'THE WEDDING OF', joiner: '그리고',
      stage: '저희 결혼합니다', pageTitle: '{names} 결혼합니다',
      inviteHead: '소중한 분들을 초대합니다',
      when: '예식 일시', place: '예식장', placeHint: '○○웨딩홀 3층 그랜드홀',
      ddayAfter: '함께해 주셔서 감사합니다', ddayToday: '오늘, 결혼합니다',
      ddayBefore: '{names}의 결혼식이 {n} 남았어요',
      accountSides: ['신랑 측', '신부 측'], accountNote: '참석이 어려우신 분들을 위해 계좌번호를 남겨요.',
      scene: 'wedding', game: { good: 'bouquet', goodName: '부케', hint: '부케를 받아 주세요!' },
      greetings: [
        '서로 다른 길을 걷던 두 사람이\n이제 같은 길을 함께 걸으려 합니다.\n\n귀한 걸음 하시어\n저희의 시작을 축복해 주시면\n더없는 기쁨으로 간직하겠습니다.',
        '오랜 시간 서로의 곁을 지켜 온 두 사람이\n이제 한 가족이 되려 합니다.\n\n바쁘시더라도 오셔서\n따뜻한 마음으로 축하해 주세요.',
        '저희 두 사람, 결혼합니다!\n\n게임 한 판 하시고\n예식장에서 웃으며 만나요.',
      ],
    },
    bihon: {
      name: '비혼식 초대', short: '비혼식', blurb: '나와 함께하는 삶을 축하하는 자리',
      people: [{ label: '주인공', look: look('casual', { hair: 'bob', hairColor: 1, color: 1 }) }],
      parents: false, title: false,
      eyebrow: 'SOLO WEDDING', joiner: '',
      stage: '저, 비혼식 합니다', pageTitle: '{names}의 비혼식에 초대합니다',
      inviteHead: '나와 함께할 날들을 축하해 주세요',
      when: '일시', place: '장소', placeHint: '○○레스토랑 2층 룸',
      ddayAfter: '함께해 주셔서 고마워요', ddayToday: '오늘이 바로 그날이에요',
      ddayBefore: '{names}의 비혼식이 {n} 남았어요',
      accountSides: ['주인공'], accountNote: '마음을 전하고 싶은 분들을 위해 남겨요.',
      scene: 'party', game: { good: 'cake', goodName: '케이크', hint: '축하 케이크를 받아 주세요!' },
      greetings: [
        '누군가와 함께가 아니어도\n충분히 행복한 지금의 나를\n축하하는 자리를 열어요.\n\n늘 곁에 있어 준 고마운 분들과\n맛있는 밥 한 끼 나누고 싶어요.',
        '오늘부터 나는\n나와 평생을 약속합니다.\n\n축의금보다 반가운 건\n여러분의 웃는 얼굴이에요.\n가볍게 놀러 오세요!',
      ],
    },
    ihon: {
      name: '이혼식 초대', short: '이혼식', blurb: '새 출발을 가볍게 응원받는 자리',
      people: [{ label: '주인공', look: look('casual', { color: 2 }) }],
      parents: false, title: false,
      eyebrow: 'NEW START', joiner: '',
      stage: '새 출발을 응원해 주세요', pageTitle: '{names}의 새 출발 파티',
      inviteHead: '새 출발을 함께해 주세요',
      when: '일시', place: '장소', placeHint: '○○펍 단체석',
      ddayAfter: '응원해 주셔서 고마워요', ddayToday: '오늘, 새 출발을 합니다',
      ddayBefore: '새 출발 파티까지 {n} 남았어요',
      accountSides: ['주인공'], accountNote: '마음을 전하고 싶은 분들을 위해 남겨요.',
      scene: 'party', game: { good: 'star', goodName: '별', hint: '반짝이는 별을 받아 주세요!' },
      greetings: [
        '서로의 행복을 위해\n각자의 길을 걷기로 했습니다.\n\n지난 시간을 함께 지켜봐 준\n고마운 분들과\n새 출발을 가볍게 축하하고 싶어요.',
        '인생 2막, 시작합니다!\n\n무거운 이야기는 접어 두고\n맛있는 거 먹으며\n웃고 떠들어요.',
      ],
    },
    yearend: {
      name: '연말 모임', short: '연말 모임', blurb: '송년회·연말 파티 초대장',
      people: [{ label: '모임 대표', look: look('casual', { color: 0 }) }],
      parents: false, title: true, titleHint: '2026 우리 반 송년회',
      eyebrow: 'YEAR END PARTY', joiner: '',
      stage: '올해도 수고 많았어요!', pageTitle: '{title}',
      inviteHead: '한 해 마무리, 같이 해요',
      when: '일시', place: '장소', placeHint: '○○고깃집 단체석',
      ddayAfter: '함께해 주셔서 고마워요', ddayToday: '오늘 만나요!',
      ddayBefore: '모임까지 {n} 남았어요',
      accountSides: ['회비'], accountNote: '회비는 아래 계좌로 보내 주세요.',
      scene: 'winter', game: { good: 'gift', goodName: '선물', hint: '선물 상자를 받아 주세요!' },
      greetings: [
        '올 한 해도 정말 수고 많았어요.\n\n맛있는 거 먹으면서\n한 해를 웃으며 마무리해요.\n얼굴 보는 것만으로도 충분해요!',
        '벌써 연말이에요.\n\n바쁘더라도 이날만큼은\n시간 비워 두기!\n오랜만에 다 같이 모여요.',
      ],
    },
    newyear: {
      name: '연초 모임', short: '신년 모임', blurb: '신년회·새해 모임 초대장',
      people: [{ label: '모임 대표', look: look('casual', { color: 3 }) }],
      parents: false, title: true, titleHint: '2027 새해 첫 모임',
      eyebrow: 'NEW YEAR PARTY', joiner: '',
      stage: '새해 복 많이 받으세요', pageTitle: '{title}',
      inviteHead: '새해 첫 만남에 초대해요',
      when: '일시', place: '장소', placeHint: '○○한정식 2층',
      ddayAfter: '함께해 주셔서 고마워요', ddayToday: '오늘 만나요!',
      ddayBefore: '모임까지 {n} 남았어요',
      accountSides: ['회비'], accountNote: '회비는 아래 계좌로 보내 주세요.',
      scene: 'newyear', game: { good: 'pouch', goodName: '복주머니', hint: '복주머니를 받아 주세요!' },
      greetings: [
        '새해 복 많이 받으세요!\n\n올해도 건강하고\n좋은 일만 가득하길 바라며\n새해 첫 모임에 초대합니다.',
        '새해 다짐은 다 같이 모여서!\n\n떡국 한 그릇 나누며\n올해 계획을 이야기해요.',
      ],
    },
    notice: {
      name: '결혼 알림장', short: '결혼 알림', blurb: '결혼식 없이 결혼 소식만 전하는 알림장',
      people: [
        { label: '신랑', look: look('tux') },
        { label: '신부', look: look('dress', { hair: 'long', hairColor: 1, veil: true }) },
      ],
      parents: true, title: false, placeOptional: true,
      eyebrow: 'WE GOT MARRIED', joiner: '그리고',
      stage: '저희 결혼했어요', pageTitle: '{names} 결혼 소식을 전합니다',
      inviteHead: '결혼 소식을 전합니다',
      when: '혼인 날짜', place: '장소', placeHint: '식사 자리가 있으면 적어 주세요',
      ddayAfter: '부부가 된 지 {n}째예요', ddayToday: '오늘, 부부가 됐어요',
      ddayBefore: '부부가 되기까지 {n} 남았어요',
      accountSides: ['신랑 측', '신부 측'], accountNote: '축하의 마음을 전하실 분들을 위해 남겨요.',
      scene: 'wedding', game: { good: 'bouquet', goodName: '부케', hint: '부케를 받아 주세요!' },
      greetings: [
        '저희 두 사람이 부부가 되었습니다.\n\n예식은 가족끼리 조용히 치르기로 해\n이렇게 소식으로 먼저 인사드려요.\n앞으로도 따뜻하게 지켜봐 주세요.',
        '결혼식 대신\n작은 알림장으로 인사드려요.\n\n서로 아끼며 잘 살겠습니다.\n늘 고맙습니다.',
      ],
    },
    babyshower: {
      name: '베이비샤워 초대', short: '베이비샤워', blurb: '아기를 기다리는 파티 초대장',
      people: [
        { label: '예비 엄마', look: look('casual', { hair: 'long', hairColor: 1, color: 4 }) },
        { label: '예비 아빠', look: look('casual', { color: 1 }), optional: true },
      ],
      parents: false, title: false,
      eyebrow: 'BABY SHOWER', joiner: '그리고',
      stage: '아기가 찾아왔어요', pageTitle: '{names}의 베이비샤워',
      inviteHead: '아기를 함께 기다려 주세요',
      when: '일시', place: '장소', placeHint: '○○카페 파티룸',
      ddayAfter: '함께해 주셔서 고마워요', ddayToday: '오늘 만나요!',
      ddayBefore: '베이비샤워까지 {n} 남았어요',
      accountSides: ['받는 분'], accountNote: '선물 대신 마음을 전하실 분들을 위해 남겨요.',
      scene: 'baby', game: { good: 'bottle', goodName: '젖병', hint: '젖병을 받아 주세요!' },
      greetings: [
        '작고 소중한 아기가\n저희에게 찾아왔어요.\n\n태어날 아기를 함께 기다려 줄\n고마운 분들을 초대합니다.',
        '곧 셋이 됩니다!\n\n맛있는 디저트와 작은 게임이 준비돼 있어요.\n편하게 놀러 오세요.',
      ],
    },
    event: {
      name: '기념 행사 초대', short: '기념 행사', blurb: '돌잔치·생일·집들이·개업 등 각종 행사',
      people: [{ label: '주인공', look: look('casual', { hair: 'bun', hairColor: 2, color: 2 }) }],
      parents: false, title: true, titleHint: '하윤이 첫 돌잔치',
      eyebrow: 'CELEBRATION', joiner: '',
      stage: '초대합니다!', pageTitle: '{title}',
      inviteHead: '기쁜 날을 함께해 주세요',
      when: '일시', place: '장소', placeHint: '○○뷔페 2층 연회장',
      ddayAfter: '함께해 주셔서 고마워요', ddayToday: '오늘 만나요!',
      ddayBefore: '그날까지 {n} 남았어요',
      accountSides: ['받는 분'], accountNote: '마음을 전하실 분들을 위해 남겨요.',
      scene: 'party', game: { good: 'cake', goodName: '케이크', hint: '케이크를 받아 주세요!' },
      greetings: [
        '기쁜 날을 맞아\n고마운 분들을 모시고\n작은 자리를 마련했어요.\n\n오셔서 함께 축하해 주세요.',
        '좋은 일이 생겼어요!\n\n같이 맛있는 거 먹고\n즐거운 시간 보내요.',
      ],
    },
  };
  const ORDER = ['wedding', 'bihon', 'ihon', 'yearend', 'newyear', 'notice', 'babyshower', 'event'];

  const get = k => KINDS[k] || KINDS.wedding;
  // "{names}", "{title}", "{n}" 바꾸기
  const fill = (s, v) => String(s || '').replace(/\{(\w+)\}/g, (_, k) => (v[k] != null ? v[k] : ''));

  window.InviteKinds = { KINDS, ORDER, get, fill };
})();
