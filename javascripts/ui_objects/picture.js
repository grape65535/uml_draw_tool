/*------------------------------------------------------------------------------
  画像
------------------------------------------------------------------------------*/
function Picture(){
  Picture.prototype = Object.create( UIBase.prototype );

  //--------------------------------------
  // コンテンツ描画（クリップ済）
  //--------------------------------------
  Picture.prototype._drawInnerContents = function( context, offsetx, offsety ){
    // パディングの内側の矩形を取得
    var padding_inline_rect = this.paddingInlineRect();

    var image_data = this.image_manager.getImagedata( this.image_handle_name );
    drawScaleImage(
      context,
      image_data,
      offsetx + padding_inline_rect.x,
      offsety + padding_inline_rect.y,
      this.width,
      this.height
    );
  };

  //--------------------------------------
  // 画像のロード開始
  //--------------------------------------
  Picture.prototype._loadImageSrc = function(){
    // ロード開始済
    if ( this.image_handle_name || ! this.image_manager ) return null;

    // 画像パスと画像管理があるならロード開始
    if ( this.src ) {
      this.image_handle_name = this.name || this.src;
      this.image_manager.deleteImage( this.image_handle_name );
      this.image_manager.loadImage( this.image_handle_name, this.src );
    }
  };

  //--------------------------------------
  // 初期化
  //--------------------------------------
  Picture.prototype.initialize = function( name, style, args ){
    Object.getPrototypeOf(Object.getPrototypeOf(this)).initialize.call( this, name, style );
    this.src = null;
    this.image_handle_name = null;
    this.image_manager = null;

    // 可変長引数がある？
    if ( 3 <= arguments.length ) {
      for ( var i=2; i<arguments.length; i++ ) {
        switch( typeof arguments[i] ) {
        case "string":
          this.setSrc( arguments[i] );
          break;

        // 画像管理オブジェクト
        case "object":
          if ( arguments[i] instanceof ImageManager ) this.image_manager = arguments[i];
          break;
        }
      }
    }

    if ( this.image_handle_name && this.src ) {
      console.error( "Picture : arguments error" );
    }

    return this;
  };

  //--------------------------------------
  // 型
  //--------------------------------------
  Picture.prototype.objectName = function(){
    return 'Picture';
  };

  //--------------------------------------
  // 画像リソース（画像ハンドルかURL）を指定する
  //--------------------------------------
  Picture.prototype.setSrc = function( src, image_manager ){
    if ( "string" != typeof src ) return;
    image_manager = image_manager || null;
    this.image_manager = this.image_manager || image_manager;

    // URL？
    if ( src.match( /^(((http:|https:|file:|blob:)?\/\/|\.?\.\/).*$|[^.]+\.(jpg|jpeg|gif|png|bmp)|data:image\/[a-zA-Z0-9]+;base64,[a-zA-Z0-9\/+=]+)/i ) ) {
      this.src = src;
      this.image_handle_name = null;
    }
    // URLでなければ画像ハンドル名
    else {
      this.image_handle_name = src;
      this._requestRelayoutAndDraw();
    }

    // 画像のロード開始
    if ( this.image_manager && this.src ) this._loadImageSrc();
  };

  //--------------------------------------
  // デフォルトのスタイルを取得
  //--------------------------------------
  Picture.prototype.defaultStyle = function(){
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
      }
    );
  };

  //--------------------------------------
  // スタイルを子孫含めて更新
  //--------------------------------------
  Picture.prototype.refreshStyle = function(){
    Object.getPrototypeOf(Object.getPrototypeOf(this)).refreshStyle.call( this );

    // 画像のロード開始
    this._loadImageSrc();
  };

  //--------------------------------------
  // レイアウトの実行
  //--------------------------------------
  Picture.prototype.layout = function( parent_caret ){
    if ( "none" == this.style.display ) return;
    
    var image_data = this.image_manager.getImagedata( this.image_handle_name );

    // 縦幅と横幅の指定が無い時は、画像の素のサイズを適用する
    if ( "auto" == this.style.width && "auto" == this.style.height ) {
      if ( image_data ) {
        this.width  = image_data.trim.width;
        this.height = image_data.trim.height;
      }
      else {
        this.width  = Math.floor( this.style.font_size / 2 );
        this.height = this.style.font_size;
      }
    }
    else if ( "auto" == this.style.width && "auto" != this.style.height ) {
      if ( image_data ) {
        var rate = image_data.trim.height / this.style.height;
        this.width  = Math.floor( image_data.trim.width / rate );
        this.height = this.style.height;
      }
      else {
        this.width  = this.style.height;
        this.height = this.style.height;
      }
    }
    else if ( "auto" != this.style.width && "auto" == this.style.height ) {
      if ( image_data ) {
        var rate = image_data.trim.width / this.style.width;
        this.width  = this.style.width;
        this.height = Math.floor( image_data.trim.height / rate );
      }
      else {
        this.width  = this.style.width;
        this.height = this.style.width;
      }
    }
    else {
      this.width  = this.style.width;
      this.height = this.style.height;
    }
  };
}
// prototype継承できる様に定義時点で関数実行し、内部で定義したprototypeを完成させる
Picture();
