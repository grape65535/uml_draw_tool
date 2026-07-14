---
name: verify
description: このリポジトリ（UML描画ツール）の変更をヘッドレスChrome+CDPで実際に駆動して検証する手順
---

# UML描画ツールの動作検証手順

静的サイト（バックエンド無し）。UIは単一Canvasに独自フレームワークで描画されるため、
DOMセレクタでは操作できない。CDP（Chrome DevTools Protocol）で実イベントを送って駆動する。

## 起動

```bash
# リポジトリルートで
python3 -m http.server 8123 &
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
  --remote-debugging-port=9333 --user-data-dir=/tmp/uml_verify_profile \
  --window-size=1600,1000 --no-first-run about:blank &
```

CDPクライアントは `pip3 install --user websocket-client` + `http://localhost:9333/json/list` の
`webSocketDebuggerUrl` に接続（node/deno はこのマシンに無い）。

## EditorScreenインスタンスの捕捉

アプリインスタンスは非公開。`ScreenManager.prototype.requestDraw` をパッチして引数から取る:

```js
var orig = ScreenManager.prototype.requestDraw;
ScreenManager.prototype.requestDraw = function( screen ){ window.__editor = screen; return orig.call( this, screen ); };
window.dispatchEvent(new Event("resize"));  // 描画要求を発生させて捕捉
```

以後 `__editor.save_data` / `__editor.findObjectByName("paper").screenPosition()` 等で状態を観測できる。

## 駆動レシピ

- **ファイルドロップ**: `DataTransfer` + `new File(...)` を作り `document.dispatchEvent(new DragEvent("drop", {dataTransfer, bubbles:true, cancelable:true}))`。画像もJSONもこれで実経路を通る。
- **ショートカット**: `Input.dispatchKeyEvent`。Cmd修飾は `modifiers:4`（例 Cmd+V = key:"v", keycode:86, modifiers:4）。Delete は keycode 8。
- **Canvas上のクリック/ドラッグ**: 座標 = `findObjectByName(名前).screenPosition()`（CSSピクセル=CDP座標、zoom_rate=1時）。ドラッグは mousePressed → mouseMoved(buttons:1)数回 → mouseReleased。
- **ツールボタン/メニュー**: `tool_button_*` / `filemenu_*` の screenPosition 中心をクリック。
- **OSクリップボード**: ページセッションで `Browser.grantPermissions {permissions:["clipboardReadWrite","clipboardSanitizedWrite"]}`（origin指定なし・ページws宛が確実）＋ `Page.bringToFront` してから `navigator.clipboard.write/read`。
- **PDFダウンロード**: ブラウザws宛に `Browser.setDownloadBehavior {behavior:"allow", downloadPath}` → File メニュー→ save as PDF をクリック。生成は10秒程度待つ。PDF1ページ目の画像化は `sips -s format png x.pdf --out x.png`（pdftoppm無し）。

## 構文チェック（nodeが無い環境）

```bash
osascript -l JavaScript -e 'ObjC.import("Foundation");
var s=$.NSString.stringWithContentsOfFileEncodingError("<path>", $.NSUTF8StringEncoding, null).js;
try{ new Function(s); "OK" }catch(e){ e.message }'
```

## 注意

- localStorage（仮想クリップボード等）は user-data-dir に永続するため、独立した検証はプロファイルを消すか `localStorage.clear()` してから行う。
- **JSはキャッシュされる**（`?body=1` はバージョンで変化しない）。コード修正後は `Network.setCacheDisabled` + `Page.reload {ignoreCache:true}` で必ずリロードし、`typeof <新関数>` で新コードが載ったか確認してから検証する。
- ペースト（Cmd+V）はネイティブの paste イベントで処理される設計（v1.9〜）。CDPからは `Input.dispatchKeyEvent` に `commands:["Paste"]` を付けると keydown→paste イベントの実チェーンを再現できる（キー既定動作がキャンセルされないことが前提。キャンセルされた場合は発火しない＝それ自体が検証項目）。合成 `new ClipboardEvent("paste", {clipboardData: DataTransfer, ...})` の document への dispatch はハンドラ単体の検証に使える。
- **キー検証の前に必ず一度マウスを動かす**（`Input.dispatchMouseEvent mouseMoved`）。起動直後のカーソル未取得状態は実利用と異なる挙動（過去に isHover の null 例外で preventDefault がスキップされ、誤った検証結果を得た）を生むことがある。
- ⌘V の検証では `window.addEventListener('paste', ...)` のカウンタと `window.addEventListener('error', ...)` の収集を必ず併設し、「pasteイベントが本当に発火したか」「例外で握りつぶされていないか」を状態カウントと突き合わせる。
- Undo/Redo検証は `__editor.data_manager` の `histories.length` / `history_index` を各操作後に観測すると確実。
