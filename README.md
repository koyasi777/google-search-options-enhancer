# Google検索オプション強化UI（サイドバー＆状態記憶＋BFCache対応）🔍️

## 📌 概要

Google検索結果ページに、**詳細検索オプションを即時反映で操作できるサイドバーUI**を追加するユーザースクリプトです。

- ✅ 折りたたみ式サイドバー（開閉状態を記憶）
- 🌙 ダークモード対応（OSテーマ連動）
- 🖼️ 画像検索時は自動で折りたたみ
- 🔁 BFCache（Back-Forward Cache）対応で履歴戻りでも値復元
- ⚡️ 入力・選択内容がすぐ検索結果に反映！

<p align="center">
  <img src=".github/images/google_search_sidebar_example.png" alt="Google検索オプションの強化UI例" width="600">
</p>

---

## ✨ 主な機能

- **Google詳細検索パラメータ**を一括操作（入力・選択）
- すぐに検索結果に反映（再検索）
- 折りたたみ機能＆状態記憶（localStorage）
- `画像検索`では自動で閉じた状態に
- OSのダークテーマに自動対応
- `BFCache`対策で戻る操作でもサイドバー内容が保持される

---

## 🧩 対応ページ

- `https://www.google.com/search?*`
- `https://www.google.co.jp/search?*`
- 他 `.google.*` ドメインの検索ページ

---

## ⚙️ インストール方法

1. [Violentmonkey](https://violentmonkey.github.io/) または [Tampermonkey](https://www.tampermonkey.net/) をブラウザに導入
2. 以下のリンクをクリックしてスクリプトをインストール：

👉 **[このスクリプトをインストールする](https://raw.githubusercontent.com/koyasi777/google-search-options-enhancer/main/google-search-options-enhancer.user.js)**

---

## 🛠 技術仕様・内部構成

- `GM_addStyle` でCSSスタイル適用
- `MutationObserver`は未使用（静的HTMLに直接追加）
- Googleの検索パラメータを直接書き換えてURL更新
- 折りたたみ状態は `localStorage` に記録
- `popstate` や `pageshow` により履歴操作後の値復元

---

## 🐛 サポート・不具合報告

ご要望や不具合報告は [Issues](https://github.com/koyasi777/google-search-options-enhancer/issues) よりどうぞ！

---

## 📜 ライセンス

MIT License

---

> 高度な検索、もっと手軽に。  
> Googleの詳細検索を、いつでもワンクリックで。
