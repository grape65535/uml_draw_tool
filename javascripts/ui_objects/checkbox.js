/*------------------------------------------------------------------------------
  チェックボックス
------------------------------------------------------------------------------*/
function Checkbox(){
  Checkbox.prototype = Object.create( UIBase.prototype );

  //--------------------------------------
  // スタイルを適用
  //--------------------------------------
  Checkbox.prototype._applyStyle = function( style ){
    Object.getPrototypeOf(Object.getPrototypeOf(this))._applyStyle.call( this, style );

    // 幅が指定されていない時はフォントサイズ基準にする
    if ( "auto" == this.style.width ) {
      this.style.width = Math.max( this.style.font_size, this.style.line_height ) +
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
  // コンテンツ描画（クリップ済）
  //--------------------------------------
  Checkbox.prototype._drawInnerContents = function( context, offsetx, offsety ){
    if ( this.isChecked() ) {
      Object.getPrototypeOf(Object.getPrototypeOf(this))._drawInnerContents.call( this, context, offsetx, offsety );
    }
  }

  //--------------------------------------
  // 初期化
  //--------------------------------------
  Checkbox.prototype.initialize = function( name, style, value, checked ){
    Object.getPrototypeOf(Object.getPrototypeOf(this)).initialize.call( this, name, style );
    this.focusable = true;
    this.value = value || null;

    this.setChecked( checked );
    this.appendObject( ( new ChildText() ).initialize( null, null, "✔︎" ) );

    return this;
  };

  //--------------------------------------
  // 型
  //--------------------------------------
  Checkbox.prototype.objectName = function(){
    return 'Checkbox';
  };

  //--------------------------------------
  // デフォルトのスタイルを取得
  //--------------------------------------
  Checkbox.prototype.defaultStyle = function(){
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
  Checkbox.prototype.forcedStyle = function(){
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
  Checkbox.prototype.val = function(){
    return this.value;
  };

  //--------------------------------------
  // チェック状態を取得／設定
  //--------------------------------------
  Checkbox.prototype.isChecked = function( value ){
    return this.checked;
  }

  //--------------------------------------
  // チェック状態を取得／設定
  //--------------------------------------
  Checkbox.prototype.setChecked = function( value ){
    this.checked = ( false == value || "undefined" == typeof value ? false : true );
    this._requestDraw();
  }

  //--------------------------------------
  // チェック状態を反転する
  //--------------------------------------
  Checkbox.prototype.checkToggle = function(){
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
  Checkbox.prototype.onChangeCursorStatuses = function( statuses, screen ){
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
        this.checkToggle();
        screen.onObjectEvent( this, "change", statuses );

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
  Checkbox.prototype.onChangeKeyStatuses = function( statuses, screen ){
    // エンターキー押下はボタン押下とみなす
    if ( statuses.isUpKey( KEYCODE_ENTER ) ) {
      this.checkToggle();
      screen.onObjectEvent( this, "change", statuses );
    
      screen.onObjectEvent( this, "focus", statuses );
      screen.onObjectEvent( this, "click", statuses );
      screen.onObjectEvent( this, "request_draw", statuses );
      return true;
    }

    return false;
  };


}
// prototype継承できる様に定義時点で関数実行し、内部で定義したprototypeを完成させる
Checkbox();
