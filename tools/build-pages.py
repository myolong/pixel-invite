#!/usr/bin/env python3
"""안내 글(guide/*.html)과 소개·개인정보처리방침·문의 페이지, sitemap.xml을 만든다.

원본: tools/pages/*.html. 맨 위 주석에 title·desc·kind·date·type(guide|page)을 적는다.
  저장소 폴더에서: python3 tools/build-pages.py
도메인을 연결하면 SITE만 바꾸고 다시 실행한다.
"""
import html, json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = 'https://gamechodae.co.kr/'
NAME = '게임초대장'
VER = '20261112b'
ADS = 'ca-pub-5781805498180631'
KIND_NAMES = {
    'yearend': '연말 모임 초대장', 'newyear': '신년 모임 초대장', 'xmas': '크리스마스 파티 초대장',
    'seollal': '설 연휴 모임 초대장', 'chuseok': '추석 모임 초대장', 'bungae': '번개 모임 초대장',
    'gather': '모임 초대장', 'wedding': '결혼식 청첩장', 'notice': '결혼 알림장',
}


def read_src():
    pages = []
    d = os.path.join(ROOT, 'tools/pages')
    for fn in sorted(os.listdir(d)):
        if not fn.endswith('.html'):
            continue
        s = open(os.path.join(d, fn), encoding='utf-8').read()
        m = re.match(r'\s*<!--(.*?)-->\s*', s, re.S)
        meta = dict(re.findall(r'^\s*(\w+):\s*(.+?)\s*$', m.group(1), re.M))
        meta['slug'] = fn[:-5]
        meta['body'] = s[m.end():].strip()
        meta.setdefault('type', 'guide')
        meta['order'] = int(meta.get('order', 99))
        pages.append(meta)
    return pages


def head(title, desc, url, depth, ld=None):
    up = '../' * depth
    ld_tag = f'\n  <script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>' if ld else ''
    return f'''<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{html.escape(title)}</title>
  <meta name="description" content="{html.escape(desc)}">
  <link rel="canonical" href="{url}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="{url}">
  <meta property="og:site_name" content="{NAME}">
  <meta property="og:title" content="{html.escape(title)}">
  <meta property="og:description" content="{html.escape(desc)}">
  <meta property="og:image" content="{SITE}assets/og/home.png?v=4">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="theme-color" content="#fff3f5">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Dongle:wght@400;700&display=swap">
  <link rel="stylesheet" href="{up}css/invite.css?v={VER}">
  <link rel="stylesheet" href="{up}css/make.css?v={VER}">
  <link rel="stylesheet" href="{up}css/site.css?v={VER}">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client={ADS}" crossorigin="anonymous"></script>{ld_tag}
</head>
<body class="maker">
  <header class="mk-head">
    <a class="mk-home" href="{up}index.html">{NAME}</a>
    <nav class="mk-nav"><a href="{up}guide/">초대장 가이드</a><a href="{up}make.html">만들기</a></nav>
  </header>
'''


def footer(depth):
    up = '../' * depth
    return f'''  <footer class="site-foot">
    <nav><a href="{up}about.html">사이트 소개</a><a href="{up}guide/">초대장 가이드</a><a href="{up}privacy.html">개인정보처리방침</a><a href="{up}contact.html">문의</a></nav>
    <p>© 2026 {NAME}. 게임을 깨면 열리는 무료 모바일 초대장.</p>
  </footer>
'''


FOOTER_RE = re.compile(r'  <footer class="site-foot">.*?</footer>\n', re.S)


def main():
    pages = read_src()
    guides = sorted([p for p in pages if p['type'] == 'guide'], key=lambda p: (p['order'], p['slug']))
    os.makedirs(os.path.join(ROOT, 'guide'), exist_ok=True)
    # 안내 글
    for i, g in enumerate(guides):
        url = f"{SITE}guide/{g['slug']}.html"
        ld = {'@context': 'https://schema.org', '@type': 'Article', 'headline': g['title'], 'description': g['desc'],
              'datePublished': g['date'], 'dateModified': g.get('updated', g['date']), 'inLanguage': 'ko',
              'author': {'@type': 'Organization', 'name': NAME}, 'publisher': {'@type': 'Organization', 'name': NAME},
              'mainEntityOfPage': url}
        kind = g.get('kind')
        cta = ''
        if kind in KIND_NAMES:
            cta = f'''      <aside class="g-cta">
        <p><b>{KIND_NAMES[kind]}</b>, 문구만 고르면 1분이면 끝나요.</p>
        <a class="btn primary" href="../make.html?k={kind}">무료로 만들기</a>
        <a class="btn" href="../kind.html?k={kind}">예시 보기</a>
      </aside>
'''
        others = [o for o in guides if o is not g]
        rel = [others[(i + k) % len(others)] for k in range(min(4, len(others)))]
        rel_html = ''.join(f'<li><a href="{o["slug"]}.html">{html.escape(o["title"])}</a></li>' for o in rel)
        upd = f' · 수정 {g["updated"]}' if g.get('updated') else ''
        out = head(f"{g['title']} | {NAME}", g['desc'], url, 1, ld) + f'''  <main class="site guide-page">
    <a class="back" href="./">‹ 초대장 가이드 전체</a>
    <article class="guide">
      <h1>{html.escape(g['title'])}</h1>
      <p class="g-date">작성 {g['date']}{upd}</p>
{g['body']}
{cta}    </article>
    <section class="g-rel"><h2>함께 보면 좋은 글</h2><ul>{rel_html}</ul></section>
  </main>
''' + footer(1) + '</body>\n</html>\n'
        open(os.path.join(ROOT, 'guide', g['slug'] + '.html'), 'w', encoding='utf-8').write(out)
    # 가이드 목록
    items = ''.join(f'<li><a href="{g["slug"]}.html"><b>{html.escape(g["title"])}</b><small>{html.escape(g["desc"])}</small></a></li>' for g in guides)
    out = head(f'초대장 가이드 - 모임 초대 문구·공지·회비 안내 예시 | {NAME}', '송년회·신년회·크리스마스·명절 모임·번개·결혼식 초대 문구와 모임 공지, 회비 안내, 참석 여부 받는 법을 예시와 함께 정리했어요.', f'{SITE}guide/', 1) + f'''  <main class="site guide-page">
    <section class="intro"><h1>초대장 가이드</h1><p>초대 문구 예시부터 공지·회비·참석 여부 받기까지, 모임 준비에 바로 쓰는 글을 모았어요.</p></section>
    <ul class="g-list">{items}</ul>
  </main>
''' + footer(1) + '</body>\n</html>\n'
    open(os.path.join(ROOT, 'guide', 'index.html'), 'w', encoding='utf-8').write(out)
    # 소개·개인정보·문의
    for p in [p for p in pages if p['type'] == 'page']:
        url = f"{SITE}{p['slug']}.html"
        out = head(f"{p['title']} | {NAME}", p['desc'], url, 0) + f'''  <main class="site guide-page">
    <article class="guide">
      <h1>{html.escape(p['title'])}</h1>
{p['body']}
    </article>
  </main>
''' + footer(0) + '</body>\n</html>\n'
        open(os.path.join(ROOT, p['slug'] + '.html'), 'w', encoding='utf-8').write(out)
    # 기존 페이지에 바닥글 넣기(있으면 바꾸기)
    for fn in ['index.html', 'kind.html', 'make.html']:
        f = os.path.join(ROOT, fn)
        s = open(f, encoding='utf-8').read()
        s = FOOTER_RE.sub('', s)
        s = s.replace('  </main>\n', '  </main>\n' + footer(0), 1)
        open(f, 'w', encoding='utf-8').write(s)
    # 사이트맵
    sm = open(os.path.join(ROOT, 'sitemap.xml'), encoding='utf-8').read()
    keep = [u for u in re.findall(r'<url>.*?</url>', sm) if '/guide/' not in u and not re.search(r'/(about|privacy|contact)\.html', u)]
    add = [f'<url><loc>{SITE}guide/</loc><lastmod>{max(g.get("updated", g["date"]) for g in guides)}</lastmod></url>']
    add += [f'<url><loc>{SITE}guide/{g["slug"]}.html</loc><lastmod>{g.get("updated", g["date"])}</lastmod></url>' for g in guides]
    add += [f'<url><loc>{SITE}{p["slug"]}.html</loc><lastmod>{p.get("updated", p["date"])}</lastmod></url>' for p in pages if p['type'] == 'page']
    out = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join(f'  {u}\n' for u in keep + add) + '</urlset>\n'
    open(os.path.join(ROOT, 'sitemap.xml'), 'w', encoding='utf-8').write(out)
    print(f'guides {len(guides)}, pages {len([p for p in pages if p["type"] == "page"])}')


if __name__ == '__main__':
    main()
