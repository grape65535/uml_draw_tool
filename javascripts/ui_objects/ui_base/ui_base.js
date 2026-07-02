/*------------------------------------------------------------------------------
  UIオブジェクト基底クラス
    継承関係： UIBase -> Presenter -> Layouter -> Style -> DomShape -> DomRelation
------------------------------------------------------------------------------*/
function UIBase(){
  UIBase.prototype = Object.create( Presenter.prototype );

  //--------------------------------------
  // 初期化
  //--------------------------------------
  UIBase.prototype.initialize = function( name, style ){
    this._initializeDomRelation( name );
    this._initializeDomShape();

    this.screen = null;
    this.focusable = false;
    this.focused = false;
    this.setStyle( style || "" );
    this._initializeLayout();

    if ( this.image_manager && this.background_image ) {
      // 背景画像の取得
      this._loadBackgroundImage();
    }

    return this;
  };

  //--------------------------------------
  // メソッドチェインへの任意処理割り込み
  //--------------------------------------
  UIBase.prototype.tap = function( block ){
    return block.call( this ) || this;
  };

  //--------------------------------------
  // フォームの選択値を取得する
  //--------------------------------------
  UIBase.prototype.getFormParameters = function(){
    var params = {};
    for ( var i=0; i<this.children.length; i++ ) {
      if ( null != this.children[i].name && 0 <= this.children[i].name.length ) {
        switch ( this.children[i].objectName() ) {
        case "Checkbox":
          if ( this.children[i].isChecked() ) {
            params[ this.children[i].name ] = params[ this.children[i].name ] || [];          
            params[ this.children[i].name ].push( this.children[i].val() );
          }
          break;
  
        case "Radio":
        case "HorizontalList":
        case "List":
        case "PullDown":
        case "TextInput":
        case "MultiTextInput":
        case "ProgressBar":
          params[ this.children[i].name ] = this.children[i].val();
          break;
        }
      }
      Object.assign( params, this.children[i].getFormParameters() );
    }
    return params;
  };

  //--------------------------------------
  // フォーカスイベント
  //--------------------------------------
  UIBase.prototype.focus = function(){
    this.focused = true;
    this._requestDraw();
  };

  //--------------------------------------
  // フォーカス消失イベント
  //--------------------------------------
  UIBase.prototype.blur = function(){
    this.focused = false;
    this._requestDraw();
  };

  //--------------------------------------
  // ウィンドウサイズ変更イベント
  //--------------------------------------
  UIBase.prototype.reload = function(){
    // 子に伝播
    for ( var i=0; i<this.children.length; i++ ) {
      this.children[i].reload();
    }
  };

  //--------------------------------------
  // カーソルがオブジェクト上にある？
  //--------------------------------------
  UIBase.prototype.isHover = function( statuses ){
    // オブジェクト内にカーソルがある？
    var screen_position = this.screenPosition();
    var cursor_position = statuses.getCursorPosition();    
    if ( 
       ( screen_position.x <= cursor_position.x && cursor_position.x < screen_position.x + this.width )
    && ( screen_position.y <= cursor_position.y && cursor_position.y < screen_position.y + this.height )
    ){
      return true;
    }
    return false;
  };

  //--------------------------------------
  // 入力状態変更イベント（カーソル）
  //--------------------------------------
  UIBase.prototype.onChangeCursorStatuses = function( statuses, screen ){
    if ( "none" == this.style.display ) return false;

    // オブジェクト内にカーソルがある？
    var screen_position = this.screenPosition();
    if ( this.isHover( statuses ) ) {
      // 子に伝播
      for ( var i=0; i<this.children.length; i++ ) {
        if ( "none" == this.children[i].style.display ) continue;
  
        // カーソルイベントの委譲
        if ( this.children[i].onChangeCursorStatuses( statuses, screen ) ) return true;
      }
    }

    // スクロール可能？
    if ( this.scrollable ) {
      // ドラッグ開始した？
      if ( statuses.isDrag( KEYCODE_CURSOR ) ) {
        // ドラッグ開始位置がこのオブジェクト内部？
        var drag_start_position = statuses.getDragPosition( KEYCODE_CURSOR );
        if ( 
          ( screen_position.x <= drag_start_position.x && drag_start_position.x < screen_position.x + this.width )
        && ( screen_position.y <= drag_start_position.y && drag_start_position.y < screen_position.y + this.height )
        ){
          // ドラッグ開始情報を記録
          this.drag_scroll_start_pos = {
            cursor_x: drag_start_position.x,
            cursor_y: drag_start_position.y,
            scroll_left: this.scrollLeft(),
            scroll_top: this.scrollTop(),
          };
          return true;
        }
      }

      // ドラッグ中？
      if ( statuses.isDragging( KEYCODE_CURSOR ) ) {
        // カーソル移動量の分だけスクロールさせる
        if ( this.drag_scroll_start_pos ) {
          var cursor_pos = statuses.getCursorPosition();
          var resx = this.scrollLeft( this.drag_scroll_start_pos.scroll_left - ( cursor_pos.x - this.drag_scroll_start_pos.cursor_x ) );
          var resy = this.scrollTop( this.drag_scroll_start_pos.scroll_top - ( cursor_pos.y - this.drag_scroll_start_pos.cursor_y ) );
          if ( resx || resy ) {
            screen.onObjectEvent( this, "request_draw", statuses );
            return true;
          }
          return false;
        }
      }

      // ドラッグ完了
      if ( statuses.isDrop( KEYCODE_CURSOR ) ) {
        this.drag_scroll_start_pos = null;
      }

      // ホイールによるスクロール
      if ( statuses.isMovingWheel() ) {
        var resx = this.scrollLeft( this.scrollLeft() + Math.ceil( statuses.getWheelXAmount() / 2 ) );
        var resy = this.scrollTop( this.scrollTop() + Math.ceil( statuses.getWheelYAmount() / 2 ) );  
        if ( resx || resy ) {
          screen.onObjectEvent( this, "request_draw", statuses );
          return true;
        }
        return false;
      }
    }

    return false;
  };

  //--------------------------------------
  // 入力状態変更イベント（キー）
  //--------------------------------------
  UIBase.prototype.onChangeKeyStatuses = function( statuses, screen ){
    // フォーカス中にのみ呼び出されるので、このオブジェクトにキーイベントがなければ、委譲せずに終了する
    return false;
  };

}
// prototype継承できる様に定義時点で関数実行し、内部で定義したprototypeを完成させる
UIBase();
