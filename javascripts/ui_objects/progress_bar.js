/*------------------------------------------------------------------------------
  進捗バー
------------------------------------------------------------------------------*/
function ProgressBar(){
  ProgressBar.prototype = Object.create( UIBase.prototype );

  //--------------------------------------
  // 初期化
  //--------------------------------------
  ProgressBar.prototype.initialize = function( name, style, value ){
    Object.getPrototypeOf(Object.getPrototypeOf(this)).initialize.call( this, name, style );
    value = value || 0;
    this.value = ( "string" == typeof value ? parseInt( value ) : value );

    return this;
  };

  //--------------------------------------
  // 型
  //--------------------------------------
  ProgressBar.prototype.objectName = function(){
    return 'ProgressBar';
  };
 
  //--------------------------------------
  // デフォルトのスタイルを取得
  //--------------------------------------
  ProgressBar.prototype.defaultStyle = function(){
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
        color: "system-form-text",
        background_color: "system-form-background",
        border_color: [ "system-form-dark", "system-form-dark", "system-form-dark", "system-form-dark" ],
        border_width: [ 1, 1, 1, 1 ],
      }
    );
  };

  //--------------------------------------
  // 選択中のアイテムの値を取得/設定
  //--------------------------------------
  ProgressBar.prototype.val = function( value ){
    if ( "number" == typeof value ) {
      this.value = value;
      this._requestDraw();
    }
    else {
      return this.value;
    }
  };

  //--------------------------------------
  // 背景描画を進捗表示とする
  //--------------------------------------
  ProgressBar.prototype.drawBackground = function( context, offsetx, offsety ){
    var border_inline_rect = this.borderInlineRect();

    var clip_x      = offsetx + border_inline_rect.x;
    var clip_y      = offsety + border_inline_rect.y;
    var clip_width  = border_inline_rect.width;
    var clip_height = border_inline_rect.height;
    var rate        = this.value / 100.0;

    switch( this.style.text_align ){
    case "left":
      clip_width = Math.floor( clip_width * rate );
      break;
    
    case "right":
      clip_width = Math.floor( clip_width * rate );
      clip_x += ( border_inline_rect.width - clip_width );
      break;

    case "center":
      clip_height = Math.floor( clip_height * rate );
      clip_y += ( border_inline_rect.height - clip_height );
      break;  
    }

    clipRect(
      context,
      clip_x,
      clip_y,
      clip_width,
      clip_height,
      function(){
        Object.getPrototypeOf(Object.getPrototypeOf(this)).drawBackground.call( this, context, offsetx, offsety );
      }.bind(this)
    );
  };

}
// prototype継承できる様に定義時点で関数実行し、内部で定義したprototypeを完成させる
ProgressBar();
