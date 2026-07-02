/*------------------------------------------------------------------------------
  リスト
------------------------------------------------------------------------------*/
function HorizontalList(){
  HorizontalList.prototype = Object.create( UIBase.prototype );

  //--------------------------------------
  // フォーカスオブジェクトの設定
  //--------------------------------------
  HorizontalList.prototype._setFocusObject = function( object ){
    if ( this.focus_item != object ) {
      if ( this.focus_item ) this.focus_item.blur();
      this.focus_item = object;
      this.focus_item.focus();

      return true;  // 変更があった
    }
  };

  //--------------------------------------
  // 初期化
  //   items ... 配列型式で指定。以下は配列の要素に与えることが可能な値
  //     (string) ... テキストとして選択肢を1つ登録
  //     (array)  ... 配列の0番目にname 1番目に値（文字またはオブジェクト）を指定する
  //     (object) ... 連想配列のキーnameにname、キーvalueに値（文字またはオブジェクト）を指定する
  //--------------------------------------
  HorizontalList.prototype.initialize = function( name, style, items ){
    Object.getPrototypeOf(Object.getPrototypeOf(this)).initialize.call( this, name, style );
    this.focusable = true;
    this.focus_item = null;

    items = items || null;
    if ( false == items instanceof Array ) items = [ items ];
    for ( var i=0; i<items.length; i++ ) {
      if ( ! items[i] ) continue;

      // 要素が文字列の時
      if ( "string" == typeof items[i] ) {
        this.appendObject(
          ( new HorizontalListItem() ).initialize(
            null,
            null,
            ( new ChildText() ).initialize( null, null, items[i] )
          )
        );
      }
      // 要素が配列になっている時
      else if ( items[i] instanceof Array ) {
        this.appendObject( items[i] );
      }
      // 要素が連想配列の時
      else {
        this.appendObject(
          ( new HorizontalListItem() ).initialize(
            items[i].name,
            null,
            items[i].value
          )
        );
      }
    }
    return this;
  };

  //--------------------------------------
  // 型
  //--------------------------------------
  HorizontalList.prototype.objectName = function(){
    return 'HorizontalList';
  };

  //--------------------------------------
  // デフォルトのスタイルを取得
  //--------------------------------------
  HorizontalList.prototype.defaultStyle = function(){
    return Object.assign( 
      {},
      {
        position: "relative",
        display: "inline",
        overflow: "scroll",
        align_items: "stretch",
        color: "system-form-text",
        background_color: "system-form-background",
        border_color: [ "system-form-dark", "system-form-dark", "system-form-light", "system-form-light" ],
        border_width: [ 3, 3, 3, 3 ],
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
  HorizontalList.prototype.forcedStyle = function(){
    return Object.assign( 
      {},
      {
        overflow: "scroll",
      }
    );
  };

  //--------------------------------------
  // オブジェクトの追加
  //--------------------------------------
  HorizontalList.prototype.appendObject = function( object ){
    if ( "HorizontalListItem" == object.objectName() ) {
      Object.getPrototypeOf(Object.getPrototypeOf(this)).appendObject.call( this, object );

      // 初期選択アイテム
      if ( object.default_selected ) {
        this.selectItemByIndex( this.children.length - 1 );
      }
    }
  };

  //--------------------------------------
  // 選択中のアイテムのnameを取得/設定
  //--------------------------------------
  HorizontalList.prototype.val = function( value ){
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
  HorizontalList.prototype.selectedItemName = function(){
    if ( ! this.focus_item ) return null;
    return this.focus_item.name;
  };

  //--------------------------------------
  // 選択中のアイテムのnameを取得
  //--------------------------------------
  HorizontalList.prototype.selectedItemIndex = function(){
    if ( ! this.focus_item ) return null;
    for ( var i=0;i <this.children.length; i++ ) {
      if ( this.children[i] == this.focus_item ) return i;
    }
    return null;    
  };

  //--------------------------------------
  // アイテムをnameで選択する
  //--------------------------------------
  HorizontalList.prototype.selectItemByName = function( name ){
    var item = this.getChildByName( name );
    if ( item ) this._setFocusObject( item );
    this._requestDraw();
  };

  //--------------------------------------
  // アイテムをインデックス番号で選択する
  //--------------------------------------
  HorizontalList.prototype.selectItemByIndex = function( index ){
    var item = this.getChildByIndex( index );
    if ( item ) this._setFocusObject( item );
    this._requestDraw();
  };

  //--------------------------------------
  // 入力状態変更イベント（カーソル）
  //--------------------------------------
  HorizontalList.prototype.onChangeCursorStatuses = function( statuses, screen ){
    var screen_position = this.screenPosition();
    var cursor_position = statuses.getCursorPosition();

    var offset_position = {
      x: cursor_position.x - screen_position.x,
      y: cursor_position.y - screen_position.y,
    };

    // ボーダー内をクリックした？
    if ( 
        ( this.style.margin[3] <= offset_position.x && offset_position.x < this.width - this.style.margin[1] )
     && ( this.style.margin[0] <= offset_position.y && offset_position.y < this.height - this.style.margin[2] )
    ) {
      // カーソルアップした？
      if ( statuses.isUpKey( KEYCODE_CURSOR ) && ! statuses.isDrop( KEYCODE_CURSOR ) ) {

        screen.onObjectEvent( this, "focus", statuses );
        // 子に伝播
        for ( var i=0; i<this.children.length; i++ ) {
          // カーソルイベントの委譲
          if ( this.children[i].onChangeCursorStatuses( statuses, screen ) ) {
            // アイテムがクリックされた
            if ( this._setFocusObject( this.children[i] ) ) {
              screen.onObjectEvent( this, "change", statuses );
              screen.onObjectEvent( this, "request_draw", statuses );
            }
          };
        }
        screen.onObjectEvent( this, "click", statuses );
        return true;
      }
    }

    return Object.getPrototypeOf(Object.getPrototypeOf(this)).onChangeCursorStatuses.call( this, statuses, screen );
  };

  //--------------------------------------
  // 入力状態変更イベント（キー）
  //--------------------------------------
  HorizontalList.prototype.onChangeKeyStatuses = function( statuses, screen ){
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
HorizontalList();
