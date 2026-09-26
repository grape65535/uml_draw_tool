# CLAUDE.md

このリポジトリで作業する AI 向けの指示・作業手順と、コンテキスト節約のためのファイル構成メモ。
機能・仕様の説明は `要求仕様.md` を参照すること（本書には仕様は書かない）。

## 作業ルール

### バージョン番号
- 表記は `vメジャー.マイナー.パッチ`（例: `v1.11.1`）。v1.10.0 から採用（それ以前は数値表記 `1.3`〜`1.9`）。
  - **メジャー**: 大規模な作り直しや、互換性のない変更。
  - **マイナー**: 機能追加のまとまりや、保存データのスキーマ変更。上げたらパッチは 0 に戻す。
  - **パッチ**: 不具合修正・小改善などの個々の変更。
- **コミットの度にパッチ番号を 1 つ上げること**（例: `v1.11.0` → `v1.11.1`）。
  メジャー・マイナーはユーザーから指示があった時に上げる。
- バージョンを上げる時は、以下をすべて同じ値に揃えて更新する。
  - `javascripts/screens/editor_screen.js` の `this.current_version = "vX.Y.Z";`（ヘッダ表示・保存データの `version` に使われる）
  - `index.html` の JS/CSS 参照のキャッシュ制御クエリ `?v=X.Y.Z`（`v` 無し。全件を一括置換する）
    - 更新しないとブラウザキャッシュで新旧ファイルが混在し、ペースト等の機能が不整合を起こす。
  - 例: `sed -i 's/?v=1\.11\.0/?v=1.11.1/g' index.html`
- 保存データのスキーマを変える場合は、`_upgradeSaveData` に `_compareVersion` を使ったマイグレーションを追加する。

### ドキュメント
- 機能・仕様を追加・変更したら `要求仕様.md` の該当箇所も更新する（現状仕様の記録として維持する）。
- AI 向けの手順・ルール・ファイル構成は本書（`CLAUDE.md`）に書く。

### 実装上の約束
- UI に表示する文言はハードコードせず、`javascripts/i18n/ja.js` と `javascripts/i18n/en.js` の**両方**に追加し、
  `i18n.t( "ui.<キー>" )` で取得する（メニューボタンの `ui` キーはボタンの `id` と同じにする）。
- 新しい JS ファイルを追加した場合は `index.html` に `<script src="...?v=X.Y.Z">` を追加する（読み込み順に注意）。
- 周囲のコードの書式（`//----` 見出しコメント、日本語コメント、`( a, b )` の空白の入れ方、ES5 風の `var` 等）に合わせる。
- コミットメッセージは日本語で、1行目に変更の要約を書く。

### 動作確認
- ビルド・テスト基盤は無い。`index.html` を `file://` で開けば動作する（サーバ不要）。
- Playwright（`/opt/node22/lib/node_modules/playwright`）で確認できる。画面オブジェクトはグローバルに公開されていないため、
  読み込み後に `ScreenManager.prototype.draw` をラップして `this` を拾い、ウィンドウサイズ変更などで再描画させて取得する。
  ```js
  await page.evaluate(() => { const d = ScreenManager.prototype.draw;
    ScreenManager.prototype.draw = function(){ window.screen_manager = this; return d.apply(this, arguments); }; });
  await page.setViewportSize({ width: 1400, height: 901 });   // 再描画を誘発
  // window.screen_manager.currentScreen() が EditorScreen。findObjectByName( "<id>" ) でUI部品を取得できる
  ```

## ファイル構成

```
index.html                 起動HTML。全JS/CSSを ?v=X.Y.Z 付きで読み込み、Application を生成
要求仕様.md                 機能・仕様・データモデルの説明（現状仕様）
CLAUDE.md                  本書
fonts/ipag.*               IPAゴシック（画面表示・PDF/SVG埋め込み）
images/icon.png            ツールボタンのアイコン（10×5分割、64×64）
stylesheets/               reset.css / layout.css（DOM側。Canvas内のUIのスタイルは editor_screen.js 内に記述）
javascripts/
  application.js           アプリ本体（画面管理・入力管理の統括）
  screen_manager.js        画面遷移・再レイアウト/再描画要求のとりまとめ
  input_manager.js         マウス/キー/タッチ入力の正規化、KEYCODE_*・ショートカット定義
  data_manager.js          図データ保持と Undo/Redo 履歴
  file_manager.js          D&D 読み込み・ダウンロード・pasteイベント
  image_manager.js         アイコン画像の切り出し
  storage_manager.js       localStorage 仮想FS（未使用）
  draw_functions.js        Canvas 描画の低レベル関数
  draw_pdf_functions.js    PDF 描画（pdf-lib）
  draw_svg_functions.js    SVG 描画
  ttf_subset_functions.js  フォントのサブセット化（PDF/SVG埋め込み用）
  collider_functions.js    当たり判定
  i18n_manager.js          多言語対応（i18n.t など）
  i18n/ja.js, i18n/en.js   UI文言
  external/                外部ライブラリ（jQuery, crypto-js, pdf-lib, fontkit）。編集しない
  screens/editor_screen.js UMLエディタ本体（約8,700行。全機能がここにある）
  screens/screen_base/     画面基底クラス・独自HTML/CSSパーサ
  ui_objects/              Canvas上のUI部品（button, toggle_panel, pull_down, text_input 等）
  ui_objects/ui_base/      UI部品の基底（継承: UIBase → Presenter → Layouter → Style → DomShape → DomRelation）
```

### editor_screen.js の構成
巨大なので全体を読まず、以下の見出し（`/*----` で囲まれたセクション）や関数名を Grep してから必要な範囲だけ読むこと。
セクションは概ね次の順に並んでいる。

| セクション | 主な内容 |
|---|---|
| オブジェクトキーの操作 | `_findUmlObjectByKey` / `_getRootUmlObjectByKey` などキー（`id.children.id.inner_rects.name` 形式）の解決 |
| UMLオブジェクトの座標からの検索 | カーソル位置のオブジェクト検索、ホバー判定 |
| UMLオブジェクトの選択 | `select_uml_object_ids` の操作、`_selectedUmlObjects` / `_selectedRootUmlObjects`、全選択、ドリルイン、パラメータ入力欄（`#object_params`）の生成・反映 |
| 選択されたUMLオブジェクトの変形 | ドラッグでの移動・リサイズ、関連線の接続、描画優先順位（前面/背面） |
| グルーピング | group / ungroup |
| パラメータ初期値の上書き | set as default params |
| 描画関連 | Canvas への UML オブジェクト描画 |
| UMLオブジェクトの生成・削除 | 図形種別ごとの初期データ生成、`_refreshInnerShape`、削除 |
| 画像オブジェクト関連 | 画像プール・画像の配置 |
| マウス・キーイベント処理 | クリック/ダブルクリック/右クリックメニュー、メニューのグレーアウト判定、ショートカットキー、文字入力 |
| クリップボード制御 | コピー/カット/ペースト、関連線付きペースト |
| 関連付け | 関連線の自動接続・経路最適化・向きの逆転 |
| PDF / SVG | エクスポート |
| その他 | 一時保存・ファイル保存/読み込み（`_openSaveData`）、`_upgradeSaveData`（保存データのマイグレーション） |
| 表示言語 | 言語切り替え・文言の差し替え |
| publicメソッド | `initialize`（画面のHTML/CSS定義・メニュー構成）、`draw`、`onChangeInputStatuses`、`onObjectEvent`（メニュー等のクリック処理の switch） |

- メニューの項目を追加する時は、`initialize` の `appendHtml`（ボタン定義）、`onObjectEvent` の `click` の case、
  `i18n/*.js` の `ui` の3箇所を触る。実行可否のグレーアウトは `_getEditMenuAvailabilities` に条件を追加する。
