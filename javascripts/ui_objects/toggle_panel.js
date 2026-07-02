/*------------------------------------------------------------------------------
  トグル表示パネル
------------------------------------------------------------------------------*/
function TogglePanel(){
  TogglePanel.prototype = Object.create( UIBase.prototype );

  //--------------------------------------
  // 初期化
  //--------------------------------------
  TogglePanel.prototype.initialize = function( name, style ){
    Object.getPrototypeOf(Object.getPrototypeOf(this)).initialize.call( this, name, style );
    this.visibility = false;

    return this;
  };

  //--------------------------------------
  // 型
  //--------------------------------------
  TogglePanel.prototype.objectName = function(){
    return 'TogglePanel';
  };

  //--------------------------------------
  // デフォルトのスタイルを取得
  //--------------------------------------
  TogglePanel.prototype.defaultStyle = function(){
    return Object.assign( 
      {},
      {
        position: "fixed",
        display: "inline",
        overflow: "scroll",
      }
    );
  };

  //--------------------------------------
  // 強制の固定スタイルを取得
  //--------------------------------------
  TogglePanel.prototype.forcedStyle = function(){
    return Object.assign( 
      {},
      {}
    );
  };

  //--------------------------------------
  // メニューは表示中？
  //--------------------------------------
  TogglePanel.prototype.isShow = function(){
    return this.visibility;
  };

  //--------------------------------------
  // メニューを表示
  //--------------------------------------
  TogglePanel.prototype.show = function( target_object, is_show_target_side, horizontal_align, vertical_align ){
    is_show_target_side = is_show_target_side || false;
    this.visibility = true;

    if ( target_object ) {
      var screen_position = target_object.screenPosition()
      // 横方向に表示する
      if ( is_show_target_side ) {
        switch( horizontal_align ) {
        case "left":
          this.setDynamicStyleAttr( "left", screen_position.x - this.width );
          break;
  
        case "cneter":
          this.setDynamicStyleAttr( "left", screen_position.x + Math.floor( ( target_object.width - this.width ) / 2 ) );
          break;
  
        case "right":
        default:
          this.setDynamicStyleAttr( "left", screen_position.x + target_object.width );
          break;
        }
        switch( vertical_align ) {
        case "bottom":
          this.setDynamicStyleAttr( "top", screen_position.y + target_object.height - this.height );
          break;
  
        case "middle":
          this.setDynamicStyleAttr( "top", screen_position.y + Math.floor( ( target_object.height - this.height ) / 2 ) );
          break;
  
        case "top":
        default:
          this.setDynamicStyleAttr( "top", screen_position.y );
          break;
        }
      }
      // 縦方向に表示する
      else {
        switch( horizontal_align ) {
        case "right":
          this.setDynamicStyleAttr( "left", screen_position.x + target_object.width - this.width );
          break;
  
        case "cneter":
          this.setDynamicStyleAttr( "left", screen_position.x + Math.floor( ( target_object.width - this.width ) / 2 ) );
          break;
  
        case "left":
        default:
          this.setDynamicStyleAttr( "left", screen_position.x );
          break;
        }
        switch( vertical_align ) {
        case "top":
          this.setDynamicStyleAttr( "top", screen_position.y - this.height );
          break;
  
        case "middle":
          this.setDynamicStyleAttr( "top", screen_position.y + Math.floor( ( target_object.height - this.height ) / 2 ) );
          break;
  
        case "bottom":
        default:
          this.setDynamicStyleAttr( "top", screen_position.y + target_object.height );
          break;
        }
      }
    }

    this._requestRelayoutAndDraw();
  };

  //--------------------------------------
  // メニューを非表示
  //--------------------------------------
  TogglePanel.prototype.hide = function(){
    this.visibility = false;
    this.clearDynamicStyleAttr("left");
    this.clearDynamicStyleAttr("top");
    this._requestRelayoutAndDraw();
  };

  //--------------------------------------
  // 描画
  //--------------------------------------
  TogglePanel.prototype.draw = function( context, offsetx, offsety, is_draw_everything ){
    if ( ! this.visibility ) return;
    Object.getPrototypeOf(Object.getPrototypeOf(this)).draw.call( this, context, offsetx, offsety, is_draw_everything );
  };

  //--------------------------------------
  // 入力状態変更イベント（カーソル）
  //--------------------------------------
  TogglePanel.prototype.onChangeCursorStatuses = function( statuses, screen ){
    if ( ! this.visibility ) return false;

    // カーソルアップした？
    if ( statuses.isUpKey( KEYCODE_CURSOR ) && ! statuses.isDrop( KEYCODE_CURSOR ) ) {

      // 子オブジェクトのクリック判定
      for ( var i=0; i<this.children.length; i++ ) {
        // カーソルイベントの委譲
        if ( this.children[i].onChangeCursorStatuses( statuses, screen ) ) {
          // メニューを非表示にする
          this.hide();
          screen.onObjectEvent( this, "request_relayout", statuses );
          return true;
        };
      }

      // メニューを非表示にする
      this.hide();
      screen.onObjectEvent( this, "click", statuses );
      screen.onObjectEvent( this, "request_relayout", statuses );

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
        
        return true;
      }
    }

    return Object.getPrototypeOf(Object.getPrototypeOf(this)).onChangeCursorStatuses.call( this, statuses, screen );
  };


}
// prototype継承できる様に定義時点で関数実行し、内部で定義したprototypeを完成させる
TogglePanel();
