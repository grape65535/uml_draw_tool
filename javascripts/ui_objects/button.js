/*------------------------------------------------------------------------------
  ボタン
------------------------------------------------------------------------------*/
function Button(){
  Button.prototype = Object.create( UIBase.prototype );

  //--------------------------------------
  // 初期化
  //--------------------------------------
  Button.prototype.initialize = function( name, style, button_content ){
    Object.getPrototypeOf(Object.getPrototypeOf(this)).initialize.call( this, name, style );
    this.focusable = true;
    this.disabled = false;
    this.text = null;

    if ( "string" == typeof button_content ) {
      this.text = button_content;
      this.appendObject( ( new ChildText() ).initialize( null, null, button_content ) );  
    }
    else if ( button_content instanceof Array ) {
      for ( var i=0; i<button_content.length; i++ ) {
        this.appendObject( button_content[i] );  
      }
    }
    else if ( button_content ) {
      this.appendObject( button_content );  
    }
    return this;
  };

  //--------------------------------------
  // 型
  //--------------------------------------
  Button.prototype.objectName = function(){
    return 'Button';
  };

  //--------------------------------------
  // デフォルトのスタイルを取得
  //--------------------------------------
  Button.prototype.defaultStyle = function(){
    return Object.assign( 
      {},
      {
        position: "relative",
        display: "inline",
        top: "auto",
        left: "auto",
        width: "auto",
        height: "auto",
        overflow: "hidden",
        text_align: "center",
        background_color: "system-form-background",
        border_color: [ "system-form-light", "system-form-light", "system-form-dark", "system-form-dark" ],
        border_width: [ 3, 3, 3, 3 ],
        padding: [ 2, 8, 2, 8 ],
        // focus
        focus_color: null,
        focus_background_color: "system-focus-form-background",
        focus_border_color: [ "system-focus-form-light", "system-focus-form-light", "system-focus-form-dark", "system-focus-form-dark" ],
      }
    );
  };

  //--------------------------------------
  // 強制の固定スタイルを取得
  //--------------------------------------
  Button.prototype.forcedStyle = function(){
    return Object.assign( 
      {},
      {
        overflow: "hidden",
      }
    );
  };

  //--------------------------------------
  // 実行不可（グレーアウト）状態の設定
  //--------------------------------------
  Button.prototype.setDisabled = function( is_disabled ){
    is_disabled = !! is_disabled;
    if ( this.disabled == is_disabled ) return;
    this.disabled = is_disabled;
    this._requestDraw();
  };

  //--------------------------------------
  // 実行不可（グレーアウト）状態？
  //--------------------------------------
  Button.prototype.isDisabled = function(){
    return this.disabled;
  };

  //--------------------------------------
  // 入力状態変更イベント（カーソル）
  //--------------------------------------
  Button.prototype.onChangeCursorStatuses = function( statuses, screen ){
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
        // 実行不可の時は入力を消費するだけで、イベントを発生させない
        if ( this.disabled ) return true;

        screen.onObjectEvent( this, "focus", statuses );
        screen.onObjectEvent( this, "click", statuses );
        return true;  
      }
    }

    return false;
  };

  //--------------------------------------
  // 入力状態変更イベント（キー）
  //--------------------------------------
  Button.prototype.onChangeKeyStatuses = function( statuses, screen ){
    // エンターキー押下はボタン押下とみなす
    if ( statuses.isUpKey( KEYCODE_ENTER ) ) {
      // 実行不可の時は入力を消費するだけで、イベントを発生させない
      if ( this.disabled ) return true;

      screen.onObjectEvent( this, "focus", statuses );
      screen.onObjectEvent( this, "click", statuses );
      return true;
    }

    return false;
  };


}
// prototype継承できる様に定義時点で関数実行し、内部で定義したprototypeを完成させる
Button();
