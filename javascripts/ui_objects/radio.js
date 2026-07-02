/*------------------------------------------------------------------------------
  ラジオボタン
------------------------------------------------------------------------------*/
function Radio(){
  Radio.prototype = Object.create( UIBase.prototype );

  //--------------------------------------
  // スタイルを適用
  //--------------------------------------
  Radio.prototype._applyStyle = function( style ){
    Object.getPrototypeOf(Object.getPrototypeOf(this))._applyStyle.call( this, style );

    var font_width =  Math.max( this.style.font_size, this.style.line_height ) +
                      this.style.margin[1] + this.style.border_width[1] + this.style.padding[1] +
                      this.style.margin[3] + this.style.border_width[3] + this.style.padding[3];
    var font_height = Math.max( this.style.font_size, this.style.line_height ) +
                      this.style.margin[0] + this.style.border_width[0] + this.style.padding[0] +
                      this.style.margin[2] + this.style.border_width[2] + this.style.padding[2];

    // ボーダーの角丸を設定
    if ( "auto" == this.style.width && "auto" == this.style.height ) {
      var half_font_width = Math.floor( font_width / 2 );
      var half_font_height = Math.floor( font_height / 2 );
      this.style.border_radius = [ [ half_font_width, half_font_height ], [ half_font_width, half_font_height ], [ half_font_width, half_font_height ], [ half_font_width, half_font_height ] ];
    }
    // 幅が指定されていない時はフォントサイズ基準にする
    if ( "auto" == this.style.width ) {
      this.style.width = font_width;
    }
    // 高さが指定されていない時はフォントサイズ基準にする
    if ( "auto" == this.style.height ) {
      this.style.height = font_height;
    }

    // 初期値のチェック状態を確定させる（他に同名IDのラジオボタン間で排他するため）
    if ( this.isChecked() ) this.setChecked( true );
  };

  //--------------------------------------
  // コンテンツ描画（クリップ済）
  //--------------------------------------
  Radio.prototype._drawInnerContents = function( context, offsetx, offsety ){
    if ( this.isChecked() ) {
      Object.getPrototypeOf(Object.getPrototypeOf(this))._drawInnerContents.call( this, context, offsetx, offsety );
    }
  }

  //--------------------------------------
  // 初期化
  //--------------------------------------
  Radio.prototype.initialize = function( name, style, value, checked ){
    Object.getPrototypeOf(Object.getPrototypeOf(this)).initialize.call( this, name, style );
    this.focusable = true;
    this.value = value || null;

    this.setChecked( checked );
    this.appendObject( ( new ChildText() ).initialize( null, null, "・" ) );

    return this;
  };

  //--------------------------------------
  // 型
  //--------------------------------------
  Radio.prototype.objectName = function(){
    return 'Radio';
  };

  //--------------------------------------
  // デフォルトのスタイルを取得
  //--------------------------------------
  Radio.prototype.defaultStyle = function(){
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
        color: "system-form-text",
        background_color: "system-form-background",
        border_color: [ "system-form-dark", "system-form-dark", "system-form-light", "system-form-light" ],
        border_width: [ 1, 1, 1, 1 ],
        border_radius: [ [ 0, 0 ], [ 0, 0 ], [ 0, 0 ], [ 0, 0 ] ],
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
  Radio.prototype.forcedStyle = function(){
    return Object.assign( 
      {},
      {
        overflow: "hidden",
      }
    );
  };

  //--------------------------------------
  // 選択中のアイテムのフォーム設定値を取得
  //--------------------------------------
  Radio.prototype.val = function(){
    return this.value;
  };

  //--------------------------------------
  // チェック状態を取得／設定
  //--------------------------------------
  Radio.prototype.isChecked = function( value ){
    return this.checked;
  }

  //--------------------------------------
  // チェック状態を取得／設定
  //--------------------------------------
  Radio.prototype.setChecked = function( value ){
    this.checked = ( false == value || "undefined" == typeof value ? false : true );

    // チェック状態で、画面追加済みで、オブジェクトのID名が設定されている時
    if ( this.checked && this.screen && null != this.name && 0 < this.name.length ) {
      // 同じオブジェクトのID名のラジオボタンを一旦全て未チェックにした後、このオブジェクトをチェック状態にする（チェック状態を排他する）
      var same_name_radio_buttons = this.screen.findObjectsByName( this.name );
      for ( var i=0; i<same_name_radio_buttons.length; i++ ) {
        if ( same_name_radio_buttons[i].objectName() != "Radio" ) continue;
        same_name_radio_buttons[i].setChecked( false );
      }
      this.checked = true;
    }

    this._requestDraw();
  }

  //--------------------------------------
  // チェック状態を反転する
  //--------------------------------------
  Radio.prototype.checkToggle = function(){
    if ( this.isChecked() ) {
      this.setChecked( false );
    }
    else {
      this.setChecked( true );
    }  
  }

  //--------------------------------------
  // 入力状態変更イベント（カーソル）
  //--------------------------------------
  Radio.prototype.onChangeCursorStatuses = function( statuses, screen ){
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
        if ( false == this.isChecked() ) {
          this.checkToggle();
          screen.onObjectEvent( this, "change", statuses );
        }

        screen.onObjectEvent( this, "focus", statuses );
        screen.onObjectEvent( this, "click", statuses );
        screen.onObjectEvent( this, "request_draw", statuses );
        return true;  
      }
    }

    return false;
  };

  //--------------------------------------
  // 入力状態変更イベント（キー）
  //--------------------------------------
  Radio.prototype.onChangeKeyStatuses = function( statuses, screen ){
    // エンターキー押下はボタン押下とみなす
    if ( statuses.isUpKey( KEYCODE_ENTER ) ) {
      if ( false == this.isChecked() ) {
        this.checkToggle();
        screen.onObjectEvent( this, "change", statuses );
      }
    
      screen.onObjectEvent( this, "focus", statuses );
      screen.onObjectEvent( this, "click", statuses );
      screen.onObjectEvent( this, "request_draw", statuses );
      return true;
    }

    return false;
  };


}
// prototype継承できる様に定義時点で関数実行し、内部で定義したprototypeを完成させる
Radio();
