/*------------------------------------------------------------------------------
  画面
------------------------------------------------------------------------------*/
function ScreenBase(){

  //--------------------------------------
  // 初期化
  //--------------------------------------
  ScreenBase.prototype._initializeInstance = function( width, height ){
    this.width = width;
    this.height = height;
    this.focus_ui_object = null;
  };

  //--------------------------------------
  // スクロールまたはフォーカス移動のキー処理
  //--------------------------------------
  ScreenBase.prototype._moveFocusOrScroll = function( statuses ){
    // 上カーソル
    if ( statuses.isDownKey( KEYCODE_UP ) || statuses.isPressKey( KEYCODE_UP ) ) {
      this._movePrevFocusOrScrollUp();
    }
    // 下カーソル
    else if ( statuses.isDownKey( KEYCODE_DOWN ) || statuses.isPressKey( KEYCODE_DOWN ) ) {
      this._moveNextFocusOrScrollDown();
    }
    // 左カーソル
    else if ( statuses.isDownKey( KEYCODE_LEFT ) || statuses.isPressKey( KEYCODE_LEFT ) ) {
      this._moveLeftFocus();
    }
    // 右カーソル
    else if ( statuses.isDownKey( KEYCODE_RIGHT ) || statuses.isPressKey( KEYCODE_RIGHT ) ) {
      this._moveRightFocus();
    }
  };

  //--------------------------------------
  // 上スクロールか前フォーカスに移動
  //--------------------------------------
  ScreenBase.prototype._movePrevFocusOrScrollUp = function(){
    // 現在フォーカス中か、ルートオブジェクトを起点にして、前のフォーカス可能なオブジェクトを探す
    var prev_focusable_object = ( this.focus_ui_object || this.ui_object ).detectDescendingObject( function( object ){
      // フォーカス可能で描画範囲内
      return object.focusable && object.isDisplayed();
    }.bind(this) );
    // フォーカス中で、フォーカス中のオブジェクトがスクロール可能で、次の候補が異なる親か、候補が無い時
    if ( this.focus_ui_object && this.focus_ui_object.canScrollUp() && ( ! prev_focusable_object || ! prev_focusable_object.isAncestorBy( this.focus_ui_object ) ) ) {
      this.focus_ui_object.scrollUp();
      this.screen_manager.requestDraw( this );
    }
    // 次のフォーカス候補がある時
    else if ( prev_focusable_object ) { 
      this.setFocusObject( prev_focusable_object );
    }
    // 次のフォーカス候補も無い時はページスクロール
    else {
      this.ui_object.scrollUp();
      this.screen_manager.requestDraw( this );
    }
  };

  //--------------------------------------
  // 下スクロールか次フォーカスに移動
  //--------------------------------------
  ScreenBase.prototype._moveNextFocusOrScrollDown = function(){
    // 現在フォーカス中か、ルートオブジェクトを起点にして、次のフォーカス可能なオブジェクトを探す
    var next_focusable_object = ( this.focus_ui_object || this.ui_object ).detectAscendingObject( function( object ){
      // フォーカス可能で描画範囲内
      return object.focusable && object.isDisplayed();
    }.bind(this) );
    // フォーカス中で、フォーカス中のオブジェクトがスクロール可能で、次の候補が異なる親か、候補が無い時
    if ( this.focus_ui_object && this.focus_ui_object.canScrollDown() && ( ! next_focusable_object || ! next_focusable_object.isAncestorBy( this.focus_ui_object ) ) ) {
      this.focus_ui_object.scrollDown();
      this.screen_manager.requestDraw( this );
    }
    // 次のフォーカス候補がある時
    else if ( next_focusable_object ) {
      this.setFocusObject( next_focusable_object );
    }
    // 次のフォーカス候補も無い時はページスクロール
    else {
      this.ui_object.scrollDown();
      this.screen_manager.requestDraw( this );
    }
  };

  //--------------------------------------
  // 左方向の前フォーカスに移動
  //--------------------------------------
  ScreenBase.prototype._moveLeftFocus = function(){
    if ( ! this.focus_ui_object ) return;

    // 現在フォーカス中か、ルートオブジェクトを起点にして、前のフォーカス可能なオブジェクトを探す
    var current_screen_position = this.focus_ui_object.screenPosition();
    var prev_focusable_object = this.focus_ui_object.detectDescendingObject( function( object ){
      // フォーカス可能で描画範囲内
      if ( object.focusable && object.isDisplayed() ) {
        var target_screen_position = object.screenPosition();
        if ( current_screen_position.x >= target_screen_position.x + object.width ) return true;
      }
    }.bind(this) );
    // 次のフォーカス候補がある時
    if ( prev_focusable_object ) this.setFocusObject( prev_focusable_object );
  };

  //--------------------------------------
  // 右方向の次フォーカスに移動
  //--------------------------------------
  ScreenBase.prototype._moveRightFocus = function(){
    if ( ! this.focus_ui_object ) return;

    // 現在フォーカス中か、ルートオブジェクトを起点にして、前のフォーカス可能なオブジェクトを探す
    var current_screen_position = this.focus_ui_object.screenPosition();
    var next_focusable_object = this.focus_ui_object.detectAscendingObject( function( object ){
      // フォーカス可能で描画範囲内
      if ( object.focusable && object.isDisplayed() ) {
        var target_screen_position = object.screenPosition();
        if ( current_screen_position.x + this.focus_ui_object.width <= target_screen_position.x ) return true;
      }
    }.bind(this) );
    // 次のフォーカス候補がある時
    if ( next_focusable_object ) this.setFocusObject( next_focusable_object );
  };

  //--------------------------------------
  // 指定オブジェクトとセレクタがマッチしているか？
  //--------------------------------------
  ScreenBase.prototype._isMatcheObjectBySelecter = function( object, selecter ){
    if ( ! object || ! selecter ) return false;

    // オブジェクト名の一致
    if ( "*" == selecter.object || object.objectName().toLowerCase() == selecter.object || object.tag_name == selecter.object ) {
      // IDの一致
      if ( ! selecter.id || object.name == selecter.id ) {
        // クラスの一致
        if ( 0 == selecter.classes.length || isIncludeArray( object.classes, selecter.classes ) ) {
          return true;
        }
      }
    }
    return false;
  };

  //--------------------------------------
  // 指定オブジェクトとセレクタチェーンがマッチしているか？
  //--------------------------------------
  ScreenBase.prototype._isMatcheObjectBySelecterChain = function( object, selecters ){
    var seek_object = object;
    var seek_selecter = selecters;
    var connection = null
    while ( null != seek_selecter ) {
      // マッチする？
      if ( this._isMatcheObjectBySelecter( seek_object, seek_selecter ) ) {
        // 次のセレクタへ
        connection = seek_selecter.connection;
        seek_selecter = ( connection ? connection.selecter : null );

        // この時点でコネクタ無しならマッチ完了
        if ( ! connection ) return true;
        // コネクタが存在するのなら、次のオブジェクトをコネクタの種類に合わせて取得
        switch( connection.type ){
        case " ":
        case ">":
          seek_object = seek_object.parent;
          break;

        case "~":
        case "+":
          seek_object = seek_object.prevElement();
          break;
        }
      }
      // コネクタ有
      else if ( seek_object && connection ) {
        switch( connection.type ){
        // 子孫セレクタなら次の親を取得する
        case " ":
          seek_object = seek_object.parent;
          break;

        // 間接セレクタなら次の（前の）オブジェクトを取得する
        case "~":
          seek_object = seek_object.prevElement();
          break;    

        // 直下セレクタや隣接セレクタなら、これ以上はオブジェクトを取得しない
        case ">":
        case "+":
          // マッチしなかった
          return false;
        }
      }
      // コネクタ無
      else {
        // マッチせず
        return false;
      }
    }
    // 全てマッチしたので、セレクタチェーンにマッチ
    return true;
  }

  //--------------------------------------
  // 初期化
  //--------------------------------------
  ScreenBase.prototype.initialize = function( display_element, width, height, screen_manager ){
    this.finished = false;
    this.screen_manager = screen_manager;
    this.display_element = display_element;
    this.width = width;
    this.height = height;

    this.ui_object = (new Panel()).initialize( "body", `width: ${width};  height: ${height};  background_color:white;` );
    this.ui_object.screen = this;

    this.style_sheets = {};

    this.canvas_input = $("#_HTML5CanvasInputInterface");
    this.canvas_input.on( "press_enterkey", function(){
      if ( this.focus_ui_object ) {
        this.focus_ui_object.blur();
      }
      else {
        this.onObjectEvent( this, "request_blur_input", null );
      }
    }.bind(this) );

    this.canvas_textarea = $("#_HTML5CanvasTextareaInterface");
    this.canvas_textarea.on( "press_esc", function(){
      if ( this.focus_ui_object ) {
        this.focus_ui_object.blur();
      }
      else {
        this.onObjectEvent( this, "request_blur_textarea", null );
      }
    }.bind(this) );
    this.canvas_textarea.on( "keydown", function( event ){
      if ( event.keyCode == 27 ) {
        this.canvas_textarea.trigger( "press_esc" );
      }
      // 文字変換中でなくて、TABキーを押下（SHIFT併用で逆順）
      else if ( event.keyCode == 9 && ! ( event.originalEvent && event.originalEvent.isComposing ) ) {
        // 画面側で処理した場合のみ、ブラウザ標準のフォーカス移動を抑止する
        if ( this.onTextareaTabKey( event.shiftKey ) ) {
          event.preventDefault();
        }
      }
    }.bind(this) );

    this._initializeInstance( width, height );

    return this;
  };

  //--------------------------------------
  // オブジェクトの追加
  //--------------------------------------
  ScreenBase.prototype.appendObject = function( object ){
    if ( false == object instanceof Array ) object = [ object ];
    for ( var i=0; i<object.length; i++ ) {
      this.ui_object.appendObject( object[i] );
    }

    // 再レイアウト・描画要求
    if ( this.screen_manager ) {
      this.screen_manager.requestRelayout( this );
      this.screen_manager.requestDraw( this );  
    }

    return this;
  };

  //--------------------------------------
  // オブジェクトをHTMLで追加
  //--------------------------------------
  ScreenBase.prototype.appendHtml = function( html_string ){
    this.appendObject(
      ( new HTMLPaser() ).createObject( html_string )
    );
    return this;
  };

  //--------------------------------------
  // 最初に見つかった指定の名前のオブジェクトを子孫まで辿って取得する
  //--------------------------------------
  ScreenBase.prototype.findObjectByName = function( name ){
    return this.ui_object.findObjectByName( name );
  };

  //--------------------------------------
  // 指定の名前のオブジェクトを子孫まで辿って取得する（複数対応）
  //--------------------------------------
  ScreenBase.prototype.findObjectsByName = function( name ){
    return this.ui_object.findObjectsByName( name );
  };

  //--------------------------------------
  // 指定のクラス名のオブジェクトを子孫まで辿って取得する（複数対応）
  //--------------------------------------
  ScreenBase.prototype.findObjectsByClass = function( name ){
    return this.ui_object.findObjectsByClass( name );
  };

  //--------------------------------------
  // フォームの選択値を取得する
  //--------------------------------------
  ScreenBase.prototype.getFormParameters = function(){
    return this.ui_object.getFormParameters();
  };

  //--------------------------------------
  // スタイルオブジェクトの追加
  //--------------------------------------
  ScreenBase.prototype.appendStyleSheetObject = function( style_sheet ){
    for ( var target in style_sheet ) {
      this.style_sheets[ target ] = this.style_sheets[ target ] || [];
      for ( var i=0; i<style_sheet[target].length; i++ ) { 
        this.style_sheets[ target ].push( style_sheet[target][i] );
      }
    }

    // 優先順位の昇順でソート
    for ( var target in this.style_sheets ) {
      this.style_sheets[target].sort( function( a, b ){
        return a.priority - b.priority;
      } );
    }

    // 再レイアウト・描画要求
    if ( this.screen_manager ) {
      this.screen_manager.requestRelayout( this );
      this.screen_manager.requestDraw( this );  
    }

    return this;
  };

  //--------------------------------------
  // スタイルシートを文字列で追加
  //--------------------------------------
  ScreenBase.prototype.appendStyleSheet = function( style_sheet_string ){
    this.appendStyleSheetObject(
      ( new StyleSheetPaser() ).createStyleSheet( style_sheet_string )
    );

    return this;
  };

  //--------------------------------------
  // 指定オブジェクトにマッチするスタイル定義を取得する
  //--------------------------------------
  ScreenBase.prototype.getMatchedStyleSheet = function( object ){
    if ( isIncludeArray( ["Text", "ChildText"], object.objectName() ) ) return "";

    var selecters = [];
    // 全オブジェクト対象のセレクタを集める
    if ( this.style_sheets["*"] ) {
      for ( var i=0; i<this.style_sheets["*"].length; i++ ) {
        selecters.push( this.style_sheets["*"][i] );
      }
    }
    // 現在のオブジェクト名と一致するセレクタを集める
    var object_name = object.objectName().toLowerCase();
    if ( this.style_sheets[ object_name ] ) {
      for ( var i=0; i<this.style_sheets[ object_name ].length; i++ ) {
        selecters.push( this.style_sheets[ object_name ][i] );
      }
    }
    // 現在のタグ名（HtmlParser経由でオブジェクト生成した時）と一致するセレクタを集める
    if ( object.tag_name && object_name != object.tag_name ) {
      if ( this.style_sheets[ object.tag_name ] ) {
        for ( var i=0; i<this.style_sheets[ object.tag_name ].length; i++ ) {
          selecters.push( this.style_sheets[ object.tag_name ][i] );
        }
      }  
    }
    // セレクタの優先順位ソートをする
    selecters.sort( function( a, b ){
      return a.priority - b.priority;
    } );
    // マッチするセレクタを探す
    var style = {};
    for ( var i=0; i<selecters.length; i++ ) {
      // マッチする？
      if ( this._isMatcheObjectBySelecterChain( object, selecters[i].selecter ) ) {
        style = Object.assign( style, selecters[i].style );
      }
    }
    // マッチしたスタイルを文字列化する
    var style_string = "";
    for ( var parameter_name in style ) {
      style_string += `${parameter_name}:${style[parameter_name].toString()};`;
    }
    return style_string;
  };

  //--------------------------------------
  // テキストの入力エリア表示
  //--------------------------------------
  ScreenBase.prototype.requestInput = function( text, rect, color, font_size, line_height, padding ){
    color = color || "black";
    font_size = font_size || 16;
    line_height = line_height || ( font_size + 2 );
    var width_rate = Math.floor( this.display_element.width() ) / this.width;
    var height_rate = Math.floor( this.display_element.height() ) / this.height;

    if ( this.focus_ui_object ) {
      this.focus_ui_object.blur();
      this.focus_ui_object = null;
    }

    this.canvas_input.val( text );
    this.canvas_input
      .css( "left",   Math.floor( rect.x * width_rate ).toString() + "px" )
      .css( "top",    Math.floor( rect.y * height_rate ).toString() + "px" )
      .css( "width",  Math.floor( rect.width * width_rate ).toString() + "px" )
      .css( "height", Math.floor( rect.height * height_rate ).toString() + "px" )
      .css( "color",  canvasColorToCssColor( color ) )
      .css( "font-size", Math.floor( font_size * height_rate ).toString() + "px" )
      .css( "line-height", Math.floor( line_height * height_rate ).toString() + "px" )
      .css( "text-stroke", `0px black` )
      .css( "padding", padding || "0" );
    this.canvas_input.show().focus();
    this.screen_manager.requestDraw( this );
  };

  //--------------------------------------
  // テキストの入力エリア非表示
  //--------------------------------------
  ScreenBase.prototype.requestBlurInput = function(){
    if ( null == this.focus_ui_object && this.canvas_input.is(':visible') ) {
      this.canvas_input.hide();
      this.screen_manager.requestDraw( this );
      return this.canvas_input.val();
    }
    return "";
  };

  //--------------------------------------
  // 複数行テキストの入力エリア表示
  //--------------------------------------
  ScreenBase.prototype.requestTextarea = function( text, rect, color, font_size, line_height, padding ){
    color = color || "black";
    font_size = font_size || 16;
    line_height = line_height || ( font_size + 2 );
    var width_rate = Math.floor( this.display_element.width() ) / this.width;
    var height_rate = Math.floor( this.display_element.height() ) / this.height;

    if ( this.focus_ui_object ) {
      this.focus_ui_object.blur();
      this.focus_ui_object = null;
    }

    this.canvas_textarea.val( text );
    this.canvas_textarea
      .css( "left",   Math.floor( rect.x * width_rate ).toString() + "px" )
      .css( "top",    Math.floor( rect.y * height_rate ).toString() + "px" )
      .css( "width",  Math.floor( rect.width * width_rate ).toString() + "px" )
      .css( "height", Math.floor( rect.height * height_rate ).toString() + "px" )
      .css( "color",  canvasColorToCssColor( color ) )
      .css( "font-size", Math.floor( font_size * height_rate ).toString() + "px" )
      .css( "line-height", Math.floor( line_height * height_rate ).toString() + "px" )
      .css( "text-stroke", `0px black` )
      .css( "padding", padding || "0" )
      .css( "resize", "none" );
    this.canvas_textarea.show().focus();
    this.screen_manager.requestDraw( this );
  };

  //--------------------------------------
  // 複数行テキストの入力エリア非表示
  //--------------------------------------
  ScreenBase.prototype.requestBlurTextarea = function(){
    if ( null == this.focus_ui_object && this.canvas_textarea.is(':visible') ) {
      this.canvas_textarea.hide();
      this.screen_manager.requestDraw( this );
      return this.canvas_textarea.val();
    }
    return "";
  };

  //--------------------------------------
  // 複数行テキストの入力エリアでのTABキー押下
  //   is_reverse : SHIFT併用（逆順）か
  //   戻り値     : 処理した場合はtrue（ブラウザ標準のTAB動作を抑止する）
  //--------------------------------------
  ScreenBase.prototype.onTextareaTabKey = function( is_reverse ){
    return false;
  };

  //--------------------------------------
  // オブジェクトのレイアウト
  //--------------------------------------
  ScreenBase.prototype.layout = function(){
    this.ui_object.layout();
  };

  //--------------------------------------
  // オブジェクトの再レイアウト
  //--------------------------------------
  ScreenBase.prototype.relayout = function(){
    this.ui_object.refreshStyle();
    this.ui_object.layout();
  };

  //--------------------------------------
  // 終了状態？
  //--------------------------------------
  ScreenBase.prototype.isFinished = function(){
    return this.finished;
  };

  //--------------------------------------
  // フォーカスオブジェクトの設定
  //--------------------------------------
  ScreenBase.prototype.setFocusObject = function( object ){
    if ( this.focus_ui_object != object ) {
      // フォーカスの切り替え
      if ( this.focus_ui_object ) {
        // 以前のフォーカスオブジェクトのフォーカス消失
        this.focus_ui_object.blur();
      }

      this.focus_ui_object = object;
      this.focus_ui_object.focus();
      this.screen_manager.requestDraw( this );
    }
  };

  //--------------------------------------
  // 終了状態？
  //--------------------------------------
  ScreenBase.prototype.focus = function(){
    this.layout();
    this.screen_manager.requestDraw( this );
  };

  //--------------------------------------
  // 終了状態？
  //--------------------------------------
  ScreenBase.prototype.blur = function(){
    // 入力中だったのなら、強制的に終了させる
    if ( this.canvas_input ) this.canvas_input.trigger( "press_enterkey" );
    if ( this.canvas_textarea ) this.canvas_textarea.trigger( "press_esc" );
  };

  //--------------------------------------
  // ウィンドウサイズ変更イベント
  //--------------------------------------
  ScreenBase.prototype.reload = function( width, height ){
    this._initializeInstance( width, height );

    // 再レイアウト
    this.ui_object.setStyle( `width: ${width};  height: ${height};  background_color:white;` );
    this.ui_object.reload();
    this.relayout();

    // 再描画
    this.screen_manager.requestDraw( this );
  };

  //--------------------------------------
  // 描画
  //--------------------------------------
  ScreenBase.prototype.draw = function( context, intercept_before_absolute_draw_func ){
    this.ui_object.draw( context, 0, 0 );
    if ( intercept_before_absolute_draw_func ) intercept_before_absolute_draw_func.call( this, context );
    this.ui_object.drawAbsoluteObject( context, 0, 0 );
  };

  //--------------------------------------
  // 入力状態変更イベント
  //--------------------------------------
  ScreenBase.prototype.onChangeInputStatuses = function( statuses ){
    // キーイベントならフォーカス中のオブジェクトに処理を委譲
    if ( this.focus_ui_object ) {
      if ( this.focus_ui_object.onChangeKeyStatuses( statuses, this ) ) return true;
    }

    // スクロールまたはフォーカスのキー処理
    this._moveFocusOrScroll( statuses );

    // カーソルイベントならカーソル位置のオブジェクトに処理を委譲
    if ( statuses.isAnyEventKey( KEYCODE_CURSOR ) || statuses.isMovingCursor() || statuses.isMovingWheel() ) {
      var absolute_objects = this.ui_object.findAbsoluteObjects( 0, 0 );
      for ( var i=0; i<absolute_objects.length; i++ ) {
        if ( absolute_objects[i].object.onChangeCursorStatuses( statuses, this ) ) return true;
      }
      return this.ui_object.onChangeCursorStatuses( statuses, this );
    }

    return false;
  };

  //--------------------------------------
  // オブジェクトイベント
  //--------------------------------------
  ScreenBase.prototype.onObjectEvent = function( object, event_name, statuses ){
    switch( event_name ) {
    case "focus":
      this.setFocusObject( object );
      break;

    case "blur":
      this.setFocusObject( null );
      break;
  
    case "click":
      break;

    case "change":
      break;

    case "request_draw":
      this.screen_manager.requestDraw( this );
      break;

    case "request_relayout":
      this.screen_manager.requestRelayout( this );
      this.screen_manager.requestDraw( this );
      break;

    case "request_input":
      var width_rate = Math.floor( this.display_element.width() ) / this.width;
      var height_rate = Math.floor( this.display_element.height() ) / this.height;
      var screen_position = object.screenPosition();
      var padding_inline_rect = object.paddingInlineRect();

      this.focus_ui_object.is_show_input_element = true;
      this.canvas_input.val( object.val() );
      this.canvas_input
        .css( "left",   Math.floor( ( screen_position.x + padding_inline_rect.x - object.x ) * width_rate ).toString() + "px" )
        .css( "top",    Math.floor( ( screen_position.y + padding_inline_rect.y - object.y ) * height_rate ).toString() + "px" )
        .css( "width",  Math.floor( padding_inline_rect.width * width_rate ).toString() + "px" )
        .css( "height", Math.floor( padding_inline_rect.height * height_rate ).toString() + "px" )
        .css( "color",  canvasColorToCssColor( object.getDrawColor() ) )
        .css( "font-size", Math.floor( object.style.font_size * height_rate ).toString() + "px" )
        .css( "line-height", Math.floor( object.style.line_height * height_rate ).toString() + "px" )
        .css( "text-stroke", `${object.style.text_stroke_width}px ${canvasColorToCssColor( object.style.text_stroke_color )}` );
      this.canvas_input.show().focus();
      this.screen_manager.requestDraw( this );
      break;

    case "request_blur_input":
      if ( this.focus_ui_object && this.canvas_input.is(':visible') ) {
        this.canvas_input.hide();
        this.focus_ui_object.is_show_input_element = false;
        object.val( this.canvas_input.val() );
        this.screen_manager.requestDraw( this );
      }
      break;

    case "request_textarea":
      var width_rate = Math.floor( this.display_element.width() ) / this.width;
      var height_rate = Math.floor( this.display_element.height() ) / this.height;
      var screen_position = object.screenPosition();
      var padding_inline_rect = object.paddingInlineRect();

      this.focus_ui_object.is_show_input_element = true;
      this.canvas_textarea.val( object.val() );
      this.canvas_textarea
        .css( "left",   Math.floor( ( screen_position.x + padding_inline_rect.x - object.x ) * width_rate ).toString() + "px" )
        .css( "top",    Math.floor( ( screen_position.y + padding_inline_rect.y - object.y ) * height_rate ).toString() + "px" )
        .css( "width",  Math.floor( padding_inline_rect.width * width_rate ).toString() + "px" )
        .css( "height", Math.floor( padding_inline_rect.height * height_rate ).toString() + "px" )
        .css( "color",  canvasColorToCssColor( object.getDrawColor() ) )
        .css( "font-size", Math.floor( object.style.font_size * height_rate ).toString() + "px" )
        .css( "line-height", Math.floor( object.style.line_height * height_rate ).toString() + "px" )
        .css( "text-stroke", `${object.style.text_stroke_width}px ${canvasColorToCssColor( object.style.text_stroke_color )}` )
        .css( "resize", "none" );
        this.canvas_textarea.show().focus();
      this.screen_manager.requestDraw( this );
      break;

    case "request_blur_textarea":
      if ( this.focus_ui_object && this.canvas_textarea.is(':visible') ) {
        this.canvas_textarea.hide();
        this.focus_ui_object.is_show_input_element = false;
        object.val( this.canvas_textarea.val() );
        this.screen_manager.requestDraw( this );
      }
      break;
    }
  };
}
// prototype継承できる様に定義時点で関数実行し、内部で定義したprototypeを完成させる
ScreenBase();
