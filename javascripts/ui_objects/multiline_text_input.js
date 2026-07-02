/*------------------------------------------------------------------------------
  複数行の文字入力
------------------------------------------------------------------------------*/
function MultiLineTextInput(){
  MultiLineTextInput.prototype = Object.create( UIBase.prototype );

  //--------------------------------------
  // コンテンツ描画（クリップ済）
  //--------------------------------------
  MultiLineTextInput.prototype._drawInnerContents = function( context, offsetx, offsety ){
    // 入力中なら実際のinput要素にまかせて描画しない
    if ( this.is_show_input_element ) return;

    // パディングの内側の矩形を取得
    var padding_inline_rect = this.paddingInlineRect();

    // １行づつ描画
    var text_rows = this.text.split("\n");
    for ( var i=0; i<text_rows.length; i++ ) {
      drawText(
        context,
        text_rows[i],
        offsetx + padding_inline_rect.x,
        offsety + padding_inline_rect.y + Math.max( this.style.line_height, this.style.font_size ) * i,
        this.getDrawColor(),
        this.style.font_size,
        true
      );  
    }
  }; 

  //--------------------------------------
  // 初期化
  //--------------------------------------
  MultiLineTextInput.prototype.initialize = function( name, style, default_value ){
    Object.getPrototypeOf(Object.getPrototypeOf(this)).initialize.call( this, name, style );
    this.focusable = true;
    this.text = ( default_value || "" ).toString();
    this.prev_text = this.text;
    this.is_show_input_element = false;

    if ( default_value && "string" != typeof default_value && "number" != typeof default_value ) {
      console.error( "MultiLineTextInput.initialize() 3rd parameter only indicate strings." )
    }

    return this;
  };

  //--------------------------------------
  // スタイルを適用
  //--------------------------------------
  MultiLineTextInput.prototype._applyStyle = function( style ){
    Object.getPrototypeOf(Object.getPrototypeOf(this))._applyStyle.call( this, style );

    // 幅が指定されていない時は10文字分のサイズを基準にする
    if ( "auto" == this.style.width ) {
      this.style.width =  this.style.font_size * 10 +
                          this.style.margin[1] + this.style.border_width[1] + this.style.padding[1] +
                          this.style.margin[3] + this.style.border_width[3] + this.style.padding[3];
    }
    // 高さが指定されていない時はフォントサイズ基準にする
    if ( "auto" == this.style.height ) {
      this.style.height = Math.max( this.style.font_size, this.style.line_height ) +
                          this.style.margin[0] + this.style.border_width[0] + this.style.padding[0] +
                          this.style.margin[2] + this.style.border_width[2] + this.style.padding[2];
    }
  };

  //--------------------------------------
  // 型
  //--------------------------------------
  MultiLineTextInput.prototype.objectName = function(){
    return 'MultiLineTextInput';
  };

  //--------------------------------------
  // デフォルトのスタイルを取得
  //--------------------------------------
  MultiLineTextInput.prototype.defaultStyle = function(){
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
        text_align: "left",
        white_space: "pre",
        background_color: "system-form-background",
        border_color: [ "system-form-dark", "system-form-dark", "system-form-light", "system-form-light" ],
        border_width: [ 3, 3, 3, 3 ],
        padding: [ 2, 2, 2, 2 ],
        // focus
        focus_color: null,
        focus_background_color: "system-focus-form-background",
        focus_border_color: [ "system-focus-form-dark", "system-focus-form-dark", "system-focus-form-light", "system-focus-form-light" ],
      }
    );
  };

  //--------------------------------------
  // 強制の固定スタイルを取得
  //--------------------------------------
  MultiLineTextInput.prototype.forcedStyle = function(){
    return Object.assign( 
      {},
      {
        overflow: "hidden",
      }
    );
  };

  //--------------------------------------
  // 選択中のアイテムのnameを取得/設定
  //--------------------------------------
  MultiLineTextInput.prototype.val = function( value ){
    if ( "string" == typeof value || "number" == typeof value ) {
      this.prev_text = this.text; // 直前のデータを退避
      this.text = value.toString();          // 新しいデータで上書き
      this._requestDraw();
    }
    else {
      return this.text;
    }
  };

  //--------------------------------------
  // フォーカスイベント
  //--------------------------------------
  MultiLineTextInput.prototype.focus = function(){
    Object.getPrototypeOf(Object.getPrototypeOf(this)).focus.call( this );
  };

  //--------------------------------------
  // フォーカス消失イベント
  //--------------------------------------
  MultiLineTextInput.prototype.blur = function(){
    Object.getPrototypeOf(Object.getPrototypeOf(this)).blur.call( this );
    this.screen.onObjectEvent( this, "request_blur_textarea", null );
    if ( this.prev_text != this.text ) this.screen.onObjectEvent( this, "change", null );
  };

  //--------------------------------------
  // 入力状態変更イベント（カーソル）
  //--------------------------------------
  MultiLineTextInput.prototype.onChangeCursorStatuses = function( statuses, screen ){
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

        screen.onObjectEvent( this, "focus", statuses );
        screen.onObjectEvent( this, "click", statuses );
        screen.onObjectEvent( this, "request_textarea", null );
        return true;  
      }
    }

    return false;
  };

  //--------------------------------------
  // 入力状態変更イベント（キー）
  //--------------------------------------
  MultiLineTextInput.prototype.onChangeKeyStatuses = function( statuses, screen ){
    // エンターキー押下はボタン押下とみなす
    if ( statuses.isUpKey( KEYCODE_ENTER ) ) {
      
      screen.onObjectEvent( this, "focus", statuses );
      screen.onObjectEvent( this, "click", statuses );
      screen.onObjectEvent( this, "request_textarea", null );
      return true;
    }

    return false;
  };


}
// prototype継承できる様に定義時点で関数実行し、内部で定義したprototypeを完成させる
MultiLineTextInput();
