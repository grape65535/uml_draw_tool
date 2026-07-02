/*------------------------------------------------------------------------------
  プルダウン
------------------------------------------------------------------------------*/
function PullDown(){
  PullDown.prototype = Object.create( UIBase.prototype );

  //--------------------------------------
  // position:absoluteオブジェクトを集める
  //--------------------------------------
  PullDown.prototype._findAbsoluteObjects = function( offsetx, offsety ){
    if ( ! this._isDisplayable() || ! this.menu_visibility ) return [];

    // absoluteならオブジェクトを返却
    var padding_inline_rect = this.paddingInlineRect();    
    return [{
      object: this.menu_panel,
      offsetx: offsetx + padding_inline_rect.x - this.scroll_x,
      offsety: offsety + padding_inline_rect.y - this.scroll_y,
      z_index: this.style.z_index
    }];
  };

  //--------------------------------------
  // フォーカスオブジェクトの設定
  //--------------------------------------
  PullDown.prototype._setFocusObject = function( object ){
    if ( this.focus_item != object ) {
      if ( this.focus_item ) this.focus_item.blur();
      this.focus_item = object;
      this.focus_item.focus();

      return true;  // 変更があった
    }
  };

  //--------------------------------------
  // スタイルを適用
  //--------------------------------------
  PullDown.prototype._applyStyle = function( style ){
    Object.getPrototypeOf(Object.getPrototypeOf(this))._applyStyle.call( this, style );

    // 高さが指定されていない時はフォントサイズ基準にする
    if ( "auto" == this.style.height ) {
      this.style.height = Math.max( this.style.font_size, this.style.line_height ) +
                          this.style.margin[0] + this.style.border_width[0] + this.style.padding[0] +
                          this.style.margin[2] + this.style.border_width[2] + this.style.padding[2];
    }
  };

  //--------------------------------------
  // コンテンツ描画（クリップ済）
  //--------------------------------------
  PullDown.prototype._drawInnerContents = function( context, offsetx, offsety ){
    // ボーダーの内側の矩形を取得
    var border_inline_rect = this.borderInlineRect();
    // パディングの内側の矩形を取得
    var padding_inline_rect = this.paddingInlineRect();

    // 選択中のアイテムがあるならば描画する
    if ( null != this.selectedItemIndex() ) {
      var selected_item = this.menu_panel.children[ this.selectedItemIndex() ];
      for ( var i=0; i<selected_item.children.length; i++ ) {
        selected_item.children[i].draw(
          context,
          offsetx + padding_inline_rect.x,
          offsety + padding_inline_rect.y
        );
      }
    }

    // プルダウンのシンボルを描画
    var mark_symbol_rect = {
      x: offsetx + border_inline_rect.x + border_inline_rect.width - this.pulldown_mark_size,
      y: offsety + border_inline_rect.y,
      width: this.pulldown_mark_size,
      height: border_inline_rect.height
    }
    drawRect(
      context,
      mark_symbol_rect.x,
      mark_symbol_rect.y,
      mark_symbol_rect.width,
      mark_symbol_rect.height,
      this.getColor( this.focused ? "system-focus-form-background" : "system-form-background" ),
      true
    );
    drawTriangle(
      context,
      mark_symbol_rect.x + Math.round( this.pulldown_mark_size / 4 ),
      mark_symbol_rect.y + Math.round( padding_inline_rect.height / 3 ),
      mark_symbol_rect.x + Math.round( this.pulldown_mark_size / 4 * 3 ),
      mark_symbol_rect.y + Math.round( padding_inline_rect.height / 3 ),
      mark_symbol_rect.x + Math.round( this.pulldown_mark_size / 2 ),
      mark_symbol_rect.y + Math.round( padding_inline_rect.height / 3 * 2 ),
      this.getDrawColor(),
      true
    )
  };

  //--------------------------------------
  // 初期化
  //   items ... 配列型式で指定。以下は配列の要素に与えることが可能な値
  //     (string) ... テキストとして選択肢を1つ登録
  //     (array)  ... 配列の0番目にname 1番目に値（文字またはオブジェクト）を指定する
  //     (object) ... 連想配列のキーnameにname、キーvalueに値（文字またはオブジェクト）を指定する
  //--------------------------------------
  PullDown.prototype.initialize = function( name, style, items ){
    this.pulldown_mark_size = 14;

    Object.getPrototypeOf(Object.getPrototypeOf(this)).initialize.call( this, name, style );
    this.focusable = true;
    this.focus_item = null;
    this.menu_panel = ( new Panel() ).initialize( null, "position:absolute; left:-3; top:" + ( this.pulldown_mark_size + 3 ) + "; width:auto; height:auto; overflow:scroll; color:system-form-text; background_color:system-form-background; border_color:system-form-light system-form-light system-form-dark system-form-dark; border_width:3;" );
    this.menu_panel.parent = this;
    this.menu_visibility = false;
    Object.getPrototypeOf(Object.getPrototypeOf(this)).appendObject.call( this, this.menu_panel );

    items = items || null;
    if ( false == items instanceof Array ) items = [ items ];
    for ( var i=0; i<items.length; i++ ) {
      if ( ! items[i] ) continue;

      // 要素が文字列の時
      if ( "string" == typeof items[i] ) {
        this.menu_panel.appendObject(
          ( new PullDownItem() ).initialize(
            null,
            null,
            ( new ChildText() ).initialize( null, null, items[i] )
          )
        );
        this.menu_panel.layout();
      }
      // 要素が配列になっている時
      else if ( items[i] instanceof Array ) {
        this.menu_panel.appendObject( items[i] );
        this.menu_panel.layout();
      }
      // 要素が連想配列の時
      else {
        this.menu_panel.appendObject(
          ( new PullDownItem() ).initialize(
            items[i].name,
            null,
            items[i].value
          )
        );
        this.menu_panel.layout();
      }
    }
    return this;
  };

  //--------------------------------------
  // 型
  //--------------------------------------
  PullDown.prototype.objectName = function(){
    return 'PullDown';
  };

  //--------------------------------------
  // デフォルトのスタイルを取得
  //--------------------------------------
  PullDown.prototype.defaultStyle = function(){
    return Object.assign( 
      {},
      {
        position: "relative",
        display: "inline",
        overflow: "scroll",
        color: "system-form-text",
        background_color: "system-form-background",
        border_color: [ "system-form-dark", "system-form-dark", "system-form-light", "system-form-light" ],
        border_width: [ 3, 3, 3, 3 ],
        padding: [ 2, this.pulldown_mark_size, 2, 2 ],
        // focus
        focus_color: "system-focus-form-text",
        focus_background_color: "system-focus-form-background",
        focus_border_color: [ "system-focus-form-dark", "system-focus-form-dark", "system-focus-form-light", "system-focus-form-light" ],
      }
    );
  };

  //--------------------------------------
  // 強制の固定スタイルを取得
  //--------------------------------------
  PullDown.prototype.forcedStyle = function(){
    return Object.assign( 
      {},
      {
        overflow: "scroll",
      }
    );
  };

  //--------------------------------------
  // ページ幅を取得
  //--------------------------------------
  PullDown.prototype.pageWidth = function(){
    // レイアウト時にwidth:autoではページ幅を初期値とするので、
    // ページ幅をメニュー内のコンテンツ幅＋プルダウンのシンボルマーク幅ということにする
    return this.menu_panel.content_width + this.pulldown_mark_size;
  };

  //--------------------------------------
  // オブジェクトの追加
  //--------------------------------------
  PullDown.prototype.appendObject = function( object ){
    if ( "PullDownItem" == object.objectName() ) {
      this.menu_panel.appendObject( object );
      this.menu_panel.layout();

      // 選択肢の登録の最初の1つ目の時は選択済みにする
      if ( 1 == this.menu_panel.children.length ) {
        this.selectItemByIndex( 0 );
      }
      // 初期選択アイテム
      if ( object.default_selected ) {
        this.selectItemByIndex( this.menu_panel.children.length - 1 );
      }
    }
  };

  //--------------------------------------
  // 選択中のアイテムのnameを取得/設定
  //--------------------------------------
  PullDown.prototype.val = function( value ){
    if ( "string" == typeof value ) {
      this.selectItemByName( value );
    }
    else {
      return this.selectedItemName();
    }
  };

  //--------------------------------------
  // 選択中のアイテムのnameを取得
  //--------------------------------------
  PullDown.prototype.selectedItemName = function(){
    if ( ! this.focus_item ) return null;
    return this.focus_item.name;
  };

  //--------------------------------------
  // 選択中のアイテムのnameを取得
  //--------------------------------------
  PullDown.prototype.selectedItemIndex = function(){
    if ( ! this.focus_item ) return null;
    for ( var i=0;i <this.menu_panel.children.length; i++ ) {
      if ( this.menu_panel.children[i] == this.focus_item ) return i;
    }
    return null;    
  };

  //--------------------------------------
  // アイテムをnameで選択する
  //--------------------------------------
  PullDown.prototype.selectItemByName = function( name ){
    var item = this.menu_panel.getChildByName( name );
    if ( item ) this._setFocusObject( item );
    this._requestDraw();
  };

  //--------------------------------------
  // アイテムをインデックス番号で選択する
  //--------------------------------------
  PullDown.prototype.selectItemByIndex = function( index ){
    var item = this.menu_panel.getChildByIndex( index );
    if ( item ) this._setFocusObject( item );
    this._requestDraw();
  };

  //--------------------------------------
  // アイテムをDOMオブジェクトで選択する
  //--------------------------------------
  PullDown.prototype.selectItemByObject = function( object ){
    for ( var i=0; i<this.menu_panel.children.length; i++ ){
      if ( this.menu_panel.children[i] == object ) {
        this.selectItemByIndex( i );
        return;
      }
    }
  };

  //--------------------------------------
  // 画面（ルート）の高さを取得する（取得できない場合はnull）
  //--------------------------------------
  PullDown.prototype._getScreenHeight = function(){
    var seek = this;
    while ( seek ) {
      if ( seek.screen && "number" == typeof seek.screen.height ) return seek.screen.height;
      seek = seek.parent;
    }
    return null;
  };

  //--------------------------------------
  // メニュー（選択肢）を展開するtop位置を算出する
  //   既定は入力欄の直下（下方向展開）。
  //   選択肢が多く画面下端をはみ出す場合は、選択肢の下端が画面下端に揃う位置まで引き上げる。
  //--------------------------------------
  PullDown.prototype._calcMenuTop = function( screen_height ){
    var default_top = this.height - ( this.style.margin[0] + this.style.border_width[0] + this.style.padding[0] );
    var menu_top = default_top;

    if ( this.menu_visibility && null != screen_height ) {
      // 既定（下方向展開）時の選択肢下端の画面Y座標
      var menu_bottom = this.screenPosition().y + this.height + this.menu_panel.height;
      if ( menu_bottom > screen_height ) {
        menu_top -= ( menu_bottom - screen_height );
      }
    }

    return menu_top;
  };

  //--------------------------------------
  // スタイルを子孫含めて更新
  //--------------------------------------
  PullDown.prototype.refreshStyle = function(){
    // メニュー部分の位置の調整
    this.menu_panel.setDynamicStyleAttr( "left", -( this.style.border_width[3] + this.style.padding[3] ) );
    this.menu_panel.setDynamicStyleAttr( "top", this._calcMenuTop( this._getScreenHeight() ) );
    // 高さは1行のサイズに固定しているので、マージンなどが指定された時のための補正を行う
    this.setDynamicStyleAttr( 
      "height",
      Math.max( this.style.font_size, this.style.line_height ) + 
        this.style.margin[0] + this.style.border_width[0] + this.style.padding[0] +
        this.style.margin[2] + this.style.border_width[2] + this.style.padding[2]
    );
    if ( this.menu_visibility ) {
      this.menu_panel.setDynamicStyleAttr( "display", "block" );
    }
    else {
      this.menu_panel.setDynamicStyleAttr( "display", "none" );
    }
    Object.getPrototypeOf(Object.getPrototypeOf(this)).refreshStyle.call( this );
  };

  //--------------------------------------
  // フォーカスイベント
  //--------------------------------------
  PullDown.prototype.focus = function(){
    Object.getPrototypeOf(Object.getPrototypeOf(this)).focus.call( this );
    this.menu_visibility = true;
    this.refreshStyle();
  };

  //--------------------------------------
  // フォーカス消失イベント
  //--------------------------------------
  PullDown.prototype.blur = function(){
    Object.getPrototypeOf(Object.getPrototypeOf(this)).blur.call( this );
    this.menu_visibility = false;
    this.refreshStyle();
  };

  //--------------------------------------
  // 入力状態変更イベント（カーソル）
  //--------------------------------------
  PullDown.prototype.onChangeCursorStatuses = function( statuses, screen ){
    var screen_position = this.screenPosition();
    var cursor_position = statuses.getCursorPosition();

    var offset_position = {
      x: cursor_position.x - screen_position.x,
      y: cursor_position.y - screen_position.y,
    };

    // カーソルアップした？
    if ( statuses.isUpKey( KEYCODE_CURSOR ) ) {

      // 選択肢のクリック判定
      if ( this.menu_visibility ) {
        for ( var i=0; i<this.menu_panel.children.length; i++ ) {
          // カーソルイベントの委譲
          if ( this.menu_panel.children[i].onChangeCursorStatuses( statuses, screen ) ) {
            // アイテムがクリックされた
            this._setFocusObject( this.menu_panel.children[i] )
            // メニューを非表示にする
            this.menu_visibility = false;

            screen.onObjectEvent( this, "change", statuses );
            screen.onObjectEvent( this, "request_relayout", statuses );
            return false;
          };
        }
      }

      // ボーダー内をクリックした？
      if ( 
          ( this.style.margin[3] <= offset_position.x && offset_position.x < this.width - this.style.margin[1] )
      && ( this.style.margin[0] <= offset_position.y && offset_position.y < this.height - this.style.margin[2] )
      ) {

        screen.onObjectEvent( this, "click", statuses );

        if ( this.menu_visibility ) {
          this.menu_visibility = false;
        }
        else {
          screen.onObjectEvent( this, "focus", statuses );
          this.menu_visibility = true;
        }
        screen.onObjectEvent( this, "request_relayout", statuses );
        return true;
      }

      this._requestRelayoutAndDraw();
    }

    return false;
  };

  //--------------------------------------
  // 入力状態変更イベント（キー）
  //--------------------------------------
  PullDown.prototype.onChangeKeyStatuses = function( statuses, screen ){
    // エンターキー押下はボタン押下とみなす
    if ( statuses.isUpKey( KEYCODE_ENTER ) ) {
      
      screen.onObjectEvent( this, "focus", statuses );
      screen.onObjectEvent( this, "click", statuses );
      return true;
    }

    return false;
  };


}
// prototype継承できる様に定義時点で関数実行し、内部で定義したprototypeを完成させる
PullDown();
