// ==UserScript==
// @name         Google検索オプション強化UI 🔍️
// @namespace    https://github.com/koyasi777/google-search-options-enhancer
// @version      2.7.2
// @description  Google検索ページに即反映型の詳細検索サイドバーを追加！折りたたみ対応・状態記憶・画像検索時の自動折りたたみ・ダークモード・BFCache対応！
// @author       koyasi777
// @match        *://*.google.*/search?*
// @grant        GM_addStyle
// @license      MIT
// @homepageURL  https://github.com/koyasi777/google-search-options-enhancer
// @supportURL   https://github.com/koyasi777/google-search-options-enhancer/issues
// ==/UserScript==

(function () {
  'use strict';

  const SIDEBAR_ID = 'gso-advanced-sidebar';
  const COLLAPSE_KEY = 'gso_sidebar_collapsed';

  const STYLE = `
    #${SIDEBAR_ID} {
      position: fixed;
      top: 100px;
      right: 20px;
      width: 260px;
      max-height: 90vh;
      overflow-y: auto;
      background: var(--gso-bg, #ffffff);
      border: 1px solid var(--gso-border, #dadce0);
      border-radius: 12px;
      padding: 16px;
      font-family: Roboto, Arial, sans-serif;
      font-size: 13px;
      z-index: 99999;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
      color: var(--gso-text, #202124);
      transition: all 0.3s ease;
    }

    #${SIDEBAR_ID}.collapsed {
      width: 180px;
      max-height: 21px;
      overflow: hidden;
      padding: 6px 12px;
      padding-top:10px;
    }

    #${SIDEBAR_ID}.collapsed label,
    #${SIDEBAR_ID}.collapsed input,
    #${SIDEBAR_ID}.collapsed select,
    #${SIDEBAR_ID}.collapsed .gso-body {
      display: none;
    }

    #${SIDEBAR_ID} .gso-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    #${SIDEBAR_ID} .gso-header h3 {
      font-size: 14px;
      font-weight: bold;
      margin: 0;
      padding: 0;
    }

    #${SIDEBAR_ID} .gso-toggle {
      font-size: 12px;
      cursor: pointer;
      color: #3367d6;
      margin: 0;
      user-select: none;
    }

    #${SIDEBAR_ID} label {
      display: block;
      margin-top: 10px;
      font-weight: 500;
    }

    #${SIDEBAR_ID} input,
    #${SIDEBAR_ID} select {
      width: 100%;
      margin-top: 4px;
      padding: 6px;
      border: 1px solid var(--gso-border, #ccc);
      border-radius: 6px;
      background-color: var(--gso-input-bg, #fff);
      color: var(--gso-text, #202124);
      box-sizing: border-box;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --gso-bg: #202124;
        --gso-text: #e8eaed;
        --gso-border: #5f6368;
        --gso-input-bg: #303134;
      }
    }
  `;
  GM_addStyle(STYLE);

  const selects = {
    as_filetype: [
      ['', 'すべての形式'], ['pdf', 'PDF'], ['doc', 'DOC'], ['xls', 'XLS'],
      ['ppt', 'PPT'], ['rtf', 'RTF'], ['txt', 'TXT'], ['csv', 'CSV'],
      ['swf', 'SWF'], ['html', 'HTML']
    ],
    lr: [
      ['', 'すべての言語'], ['lang_ja', '日本語'], ['lang_en', '英語']
    ],
    cr: [
      ['', 'すべての地域'], ['countryJP', '日本'], ['countryUS', 'アメリカ'], ['countryCN', '中国']
    ],
    as_occt: [
      ['any', 'ページ全体'], ['title', 'タイトル'], ['url', 'URL'], ['links', 'リンク先']
    ],
    as_rights: [
      ['', '制限なし'], ['cc_publicdomain', 'パブリックドメイン'],
      ['cc_attribute', '帰属'], ['cc_sharealike', '継承'], ['cc_noncommercial', '非営利']
    ],
    as_qdr: [
      ['', '指定なし'],
      ['qdr:h', '1時間以内'],
      ['qdr:d', '24時間以内'],
      ['qdr:w', '1週間以内'],
      ['qdr:m', '1か月以内'],
      ['qdr:m3', '3か月以内'],
      ['qdr:m6', '6か月以内'],
      ['qdr:y', '1年以内'],
      ['qdr:y3', '3年以内']
    ]
  };

  function navigateReplacingParam(name, value) {
    let url = new URL(location.href);
    const params = url.searchParams;

    if (name === 'as_q') {
      params.set('as_q', value);
      params.delete('q');
    } else if (name === 'as_qdr') {
      if (value === '') {
        params.delete('tbs');
      } else {
        params.set('tbs', `qdr:${value.split(':')[1]}`);
      }
    } else {
      params.set(name, value);
    }

    url.search = params.toString();
    location.href = url.toString();
  }

  function createInput(labelText, paramName, defaultValue = '') {
    const label = document.createElement('label');
    label.textContent = labelText;
    const input = document.createElement('input');
    input.name = paramName;
    const match = location.href.match(new RegExp(paramName + '=([^&]+)'));
    input.value = match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : defaultValue;
    input.addEventListener('change', () => {
      navigateReplacingParam(paramName, input.value);
    });
    label.appendChild(input);
    return label;
  }

  function createSelect(labelText, paramName, options) {
    const label = document.createElement('label');
    label.textContent = labelText;
    const select = document.createElement('select');
    select.name = paramName;

    let current = '';
    if (paramName === 'as_qdr') {
      const tbsMatch = location.href.match(/[?&]tbs=([^&]+)/);
      if (tbsMatch) {
        const tbsParams = decodeURIComponent(tbsMatch[1]).split(',');
        const qdrParam = tbsParams.find(p => p.startsWith('qdr:'));
        if (qdrParam) {
          current = qdrParam;
        }
      }
    } else {
      const match = location.href.match(new RegExp(paramName + '=([^&]+)'));
      current = match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : '';
    }

    options.forEach(([val, text]) => {
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = text;
      if (val === current) opt.selected = true;
      select.appendChild(opt);
    });

    select.addEventListener('change', () => {
      navigateReplacingParam(paramName, select.value);
    });

    label.appendChild(select);
    return label;
  }

  function getMainQuery() {
    const qMatch = location.href.match(/[?&]q=([^&]+)/);
    return qMatch ? decodeURIComponent(qMatch[1].replace(/\+/g, ' ')) : '';
  }

  function insertSidebar() {
    if (document.getElementById(SIDEBAR_ID)) return;

    const box = document.createElement('div');
    box.id = SIDEBAR_ID;

    const header = document.createElement('div');
    header.className = 'gso-header';

    const title = document.createElement('h3');
    title.textContent = '詳細検索オプション';

    const toggle = document.createElement('div');
    toggle.className = 'gso-toggle';
    toggle.addEventListener('click', () => {
      const collapsed = box.classList.toggle('collapsed');
      toggle.textContent = collapsed ? '▼ 開く' : '▲ 閉じる';
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
    });

    header.appendChild(title);
    header.appendChild(toggle);
    box.appendChild(header);

    const body = document.createElement('div');
    body.className = 'gso-body';
    body.appendChild(createInput('すべてのキーワード', 'as_q', getMainQuery()));
    body.appendChild(createInput('完全一致キーワード', 'as_epq'));
    body.appendChild(createInput('いずれかのキーワード', 'as_oq'));
    body.appendChild(createInput('含めないキーワード', 'as_eq'));
    body.appendChild(createInput('サイト・ドメイン', 'as_sitesearch'));

    Object.entries(selects).forEach(([param, options]) => {
      const labelText = {
        as_filetype: 'ファイル形式',
        lr: '言語',
        cr: '地域',
        as_occt: '検索対象の範囲',
        as_rights: 'ライセンス',
        as_qdr: '最終更新'
      }[param];
      body.appendChild(createSelect(labelText, param, options));
    });

    box.appendChild(body);
    document.body.appendChild(box);

    const url = new URL(location.href);
    const isImageSearch = url.searchParams.get('tbm') === 'isch';
    const savedCollapse = localStorage.getItem(COLLAPSE_KEY);
    const shouldCollapse = isImageSearch || savedCollapse === '1';

    if (shouldCollapse) {
      box.classList.add('collapsed');
      toggle.textContent = '▼ 開く';
    } else {
      toggle.textContent = '▲ 閉じる';
    }
  }

  function updateSidebarValues() {
    const sidebar = document.getElementById(SIDEBAR_ID);
    if (!sidebar) return;

    const inputs = sidebar.querySelectorAll('input');
    const selects = sidebar.querySelectorAll('select');

    inputs.forEach(input => {
      const param = input.name;
      let value = '';

      if (param === 'as_q') {
        const match = location.href.match(/[?&](?:as_q|q)=([^&]+)/);
        value = match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : '';
      } else {
        const match = location.href.match(new RegExp(`${param}=([^&]+)`));
        value = match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : '';
      }

      input.value = value;
    });

    selects.forEach(select => {
      const paramName = select.name;

      let current = '';
      if (paramName === 'as_qdr') {
        const tbsMatch = location.href.match(/[?&]tbs=([^&]+)/);
        if (tbsMatch) {
          const tbsParams = decodeURIComponent(tbsMatch[1]).split(',');
          const qdrParam = tbsParams.find(p => p.startsWith('qdr:'));
          if (qdrParam) {
            current = qdrParam;
          }
        }
      } else {
        const match = location.href.match(new RegExp(`${paramName}=([^&]+)`));
        current = match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : '';
      }

      Array.from(select.options).forEach(opt => {
        opt.selected = opt.value === current;
      });
    });
  }

  window.addEventListener('load', insertSidebar);
  window.addEventListener('popstate', () => {
    updateSidebarValues();
  });
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      updateSidebarValues();
    }
  });

})();
