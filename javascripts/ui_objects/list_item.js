/*------------------------------------------------------------------------------
  リストアイテム
------------------------------------------------------------------------------*/
function ListItem(){
  ListItem.prototype = Object.create( UIBase.prototype );

  //--------------------------------------
  // 初期化
  //--------------------------------------
  ListItem.prototype.initialize = function( name, style, items, default_selected ){
    this.default_selected = default_selected;
    Object.getPrototypeOf(Object.getPrototypeOf(this)).initialize.call( this, name, style );

    items = items || null;
    if ( false == items instanceof Array ) items = [ items ];
    for ( var i=0; i<items.length; i++ ) {
      if ( ! items[i] ) continue;
      
      if ( "string" == typeof items[i] ) {
        this.appendObject( ( new ChildText() ).initialize( null, null, items[i] ) );
      }
      else {
        this.appendObject( items[i] );
      }
    }

    return this;
  };

  //--------------------------------------
  // 型
  //--------------------------------------
  ListItem.prototype.objectName = function(){
    return 'ListItem';
  };

  //--------------------------------------
  // デフォルトのスタイルを取得
  //--------------------------------------
  ListItem.prototype.defaultStyle = function(){
    return Object.assign( 
      {},
      {
        position: "relative",
        display: "block",
        width: "max-content",
        height: "auto",
        overflow: "hidden",
        background_color: null,
        padding: [ 2, 8, 2, 8 ],
        // focus
        focus_background_color: "system-focus-form-background-light",
      }
    );
  };

  //--------------------------------------
  // 強制の固定スタイルを取得
  //--------------------------------------
  ListItem.prototype.forcedStyle = function(){
    return Object.assign( 
      {},
      {
        position: "relative",
        display: "block",
        height: "auto",
        overflow: "hidden",
      }
    );
  };

  //--------------------------------------
  // 入力状態変更イベント（カーソル）
  //--------------------------------------
  ListItem.prototype.onChangeCursorStatuses = function( statuses, screen ){
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
      if ( statuses.isUpKey( KEYCODE_CURSOR ) ) {
        return true;
      }
    }

    return false;
  };

}
// prototype継承できる様に定義時点で関数実行し、内部で定義したprototypeを完成させる
ListItem();
