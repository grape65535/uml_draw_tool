/*------------------------------------------------------------------------------
  CANVAS要素と描画クラスのためのインタフェースを生成するファクトリークラス
------------------------------------------------------------------------------*/
function HTML5CanvasFactory(){
  
  //--------------------------------------
  // HTMLイベントのバブリング無効化ダミー関数
  //--------------------------------------
  HTML5CanvasFactory.prototype._no_bubbling_event = function( event ){
    // キーコードを取得
    var keycode = null;
    if ( document.all ) {
      keycode = event.keyCode;
    }
    else if( document.getElementById ) {	    	
      keycode = (event.keyCode)? event.keyCode: event.charCode;
    }
    else if(document.layers) {
      keycode = event.which;
    }
    // 文字変換中でなくて、エンターキーを押下
    if (
       ( ( event.originalEvent && false == event.originalEvent.isComposing ) || ( "undefined" != typeof event.isComposing && false == event.isComposing ) )
    && ( 13 == keycode )
    ) {
      $(this).trigger("press_enterkey");
    }

    event.stopPropagation();
  };

  //--------------------------------------
  // キャッバスの初期化
  //--------------------------------------
  HTML5CanvasFactory.prototype._canvas_initialize = function( canvas_element, resolution_width, resolution_height ){
    var context = null;
    var canvas = canvas_element.get(0);

    // キャンバスサイズと解像度を記録
    this.canvas_width = Math.floor( canvas_element.width() );
    this.canvas_height = Math.floor( canvas_element.height() );
    this.resolution_width = Math.floor( resolution_width );
    this.resolution_height = Math.floor( resolution_height );

    context = canvas.getContext('2d');
    canvas.width = this._getScreenWidth();
    canvas.height = this._getScreenHeight();
    initializeContext( context, this._getScreenWidth(), this._getScreenHeight() );

    // 入力用のinputを用意しておく
    this.canvas_input = $("<input id='_HTML5CanvasInputInterface' type='text' />")
    this.canvas_input
      .css( "position", "absolute" )
      .css( "top", "0px" ).css( "left", "0px" )
      .css( "zindex", 1 )
      .css( "background-color", "transparent" )
      .css( "margin", "0px" )
      .css( "border", "0 none transparent" )
      .css( "padding", "0px" )
      .css( "font-family", "'ipag'" );
    $(".wrapper").append( this.canvas_input.hide() );
    this.canvas_input.on( "keydown contextmenu click", this._no_bubbling_event );

    this.canvas_textarea = $("<textarea id='_HTML5CanvasTextareaInterface' ></textarea>")
    this.canvas_textarea
      .css( "position", "absolute" )
      .css( "top", "0px" ).css( "left", "0px" )
      .css( "zindex", 1 )
      .css( "background-color", "transparent" )
      .css( "margin", "0px" )
      .css( "border", "0 none transparent" )
      .css( "padding", "0px" )
      .css( "font-family", "'ipag'" );
    $(".wrapper").append( this.canvas_textarea.hide() );
    this.canvas_textarea.on( "keydown contextmenu click", this._no_bubbling_event );

    return context;
  };

  //--------------------------------------
  // 画面サイズを取得
  //--------------------------------------
  HTML5CanvasFactory.prototype._getScreenWidth = function(){
    return this.resolution_width || this.canvas_width;
  };
  HTML5CanvasFactory.prototype._getScreenHeight = function(){
    return this.resolution_height || this.canvas_height;
  };

  // インタフェース生成
  //   canvas_element         : キャンバス要素(JQueryオブジェクト）
  //   html5_canvas_interface : HTML5CanvasInterfaceのインタフェースを継承したオブジェクト
  //   resolution_width       : (オプション) 解像度の幅指定。未指定の場合にはスクリーンサイズが自動設定される
  //   resolution_height      : (オプション) 解像度の幅指定。未指定の場合にはスクリーンサイズが自動設定される
  HTML5CanvasFactory.prototype.create = function( canvas_element, html5_canvas_interface, resolution_width, resolution_height ){
    var context = this._canvas_initialize( canvas_element, resolution_width, resolution_height );
    // インタフェース初期化
    html5_canvas_interface.initialize( canvas_element, context, this._getScreenWidth(), this._getScreenHeight() );
    // ウィンドウサイズの変更イベント
    $(window).on("resize", function(){
      var canvas = canvas_element.get(0);

      // キャンバスサイズを更新
      this.canvas_width = Math.floor( canvas_element.width() );
      this.canvas_height = Math.floor( canvas_element.height() );

      // クリッピング領域
      canvas.width = this._getScreenWidth();
      canvas.height = this._getScreenHeight();
      context.beginPath();
      context.rect( 0, 0, this._getScreenWidth(), this._getScreenHeight() );
      context.clip();
      // 保存
      context.save();
      html5_canvas_interface.reload( this._getScreenWidth(), this._getScreenHeight() );
    }.bind(this) );
  };
}
HTML5CanvasFactory();

/*------------------------------------------------------------------------------
  CANVAS要素からのイベント処理を行うためのインタフェース
------------------------------------------------------------------------------*/
function HTML5CanvasInterface(){
  HTML5CanvasInterface.prototype.initialize = function( context, width, height ){};
  HTML5CanvasInterface.prototype.reload = function( width, height ){};
}

