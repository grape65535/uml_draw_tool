/*------------------------------------------------------------------------------
  画面管理
------------------------------------------------------------------------------*/
function ScreenManager(){

  //--------------------------------------
  // 初期化
  //--------------------------------------
  ScreenManager.prototype._initializeInstance = function( width, height ){
    this.canvas = createCanvas();
    this.context = getContext( this.canvas, width, height );
    this.width = width;
    this.height = height;
  };

  //--------------------------------------
  // 終了画面の削除
  //--------------------------------------
  ScreenManager.prototype._refreshScreen = function(){
    for ( var i=0; i<this.screen_stack.length; i++ ) {
      if ( this.screen_stack[i].screen.isFinished() ) {
        // カレント画面だった時
        if ( this.screen_stack.length - 1 == i ) {
          // アクティブ・非アクティブの切り替え
          this.screen_stack[i].screen.blur();
          if ( this.screen_stack.length > 1 ) this.screen_stack[i-1].focus();
        }
        // 画面終了
        this.screen_stack.splice( i, 1 );
        i--;
      }
      else {
        for ( var j=0; j<this.screen_stack[i].popup; j++ ) {
          if ( this.screen_stack[i].popup[j].isFinished() ) {
            // ポップアップ終了
            this.screen_stack[i].popup.splice( j, 1 );
            j--;
          }
        }
      }
    }
  };

  //--------------------------------------
  // 指定画面はカレントの画面か？
  //--------------------------------------
  ScreenManager.prototype._isCurrentScreen = function( screen ){
    if ( ! screen ) return false;
    if ( this.currentScreen() == screen ) return true;
    if ( 0 == this.screen_stack.length ) return false;
    for ( var i=0; i<this.screen_stack[this.screen_stack.length-1].popup.length; i++ ) {
      if ( this.screen_stack[this.screen_stack.length-1].popup[i] == screen ) return true;
    }
    return false;
  };

  //--------------------------------------
  // 描画フリップ
  //--------------------------------------
  ScreenManager.prototype._flipContext = function(){
    // 画面消去
    clear( this.display_context, this.width, this.height );
    // 描画
    drawCanvas( this.display_context, this.canvas, 0, 0 );
  };

  //--------------------------------------
  // 初期化
  //   display_canvas   : 表示用HTML要素
  //   display_context  : 表示用canvasコンテキスト
  //   width            : 解像度(幅)
  //   height           : 解像度(高さ)
  //--------------------------------------
  ScreenManager.prototype.initialize = function( display_canvas, display_context, width, height ){
    this.display_canvas = display_canvas;
    this.display_context = display_context;
    this.screen_stack = [];   // { screen: null, popup: [ popup_screen, ... ] }

    this.has_request_draw = false;  // 描画要求フラグ
    this.has_request_relayout = false;  // レイアウト要求フラグ
    this.processing_input_event = false;  // 入力イベント処理中？

    this._initializeInstance( width, height );

    this.draw();

    return this;
  };

  //--------------------------------------
  // 画面遷移
  //--------------------------------------
  ScreenManager.prototype.moveScreen = function( screen ){
    // 初期化
    screen.initialize( this.display_canvas, this.width, this.height, this );

    // 非アクティブ化
    var current_screen = this.currentScreen();
    if ( current_screen ) current_screen.blur();

    // 終了画面の削除
    this._refreshScreen();
    // 画面追加
    this.screen_stack.push( { screen: screen, popup: [] } );

    // アクティブ化
    screen.focus();
  };

  //--------------------------------------
  // ポップアップの追加
  //--------------------------------------
  ScreenManager.prototype.appendPopup = function( popup_screen ){
    // 初期化
    popup_screen.initialize( this.display_canvas, this.display_context, this.width, this.height, this );

    // 終了画面の削除
    this._refreshScreen();

    // ポップアップの追加
    if ( this.screen_stack.length == 0 ) return;
    this.screen_stack[ this.screen_stack.length - 1 ].popup.push( popup_screen );
  };

  //--------------------------------------
  // 現在画面の取得
  //--------------------------------------
  ScreenManager.prototype.currentScreen = function(){
    if ( this.screen_stack.length == 0 ) return null;
    return this.screen_stack[ this.screen_stack.length - 1 ].screen;
  };

  //--------------------------------------
  // 現在のポップアップ配列の取得
  //--------------------------------------
  ScreenManager.prototype.currentPopups = function(){
    if ( this.screen_stack.length == 0 ) return [];
    if ( this.screen_stack[ this.screen_stack.length - 1 ].popup.length == 0 ) return [];
    return this.screen_stack[ this.screen_stack.length - 1 ].popup;
  };

  //--------------------------------------
  // 現在のポップアップの取得
  //--------------------------------------
  ScreenManager.prototype.currentPopup = function(){
    if ( this.screen_stack.length == 0 ) return null;
    if ( this.screen_stack[ this.screen_stack.length - 1 ].popup.length == 0 ) return null;
    return this.screen_stack[ this.screen_stack.length - 1 ].popup[ this.screen_stack[ this.screen_stack.length - 1 ].popup.length - 1 ];
  };

  //--------------------------------------
  // 描画
  //--------------------------------------
  ScreenManager.prototype.draw = function(){
    // 画面消去
    clear( this.context, this.width, this.height );

    // 画面描画
    var current_screen = this.currentScreen();
    if ( current_screen ) {
      current_screen.draw( this.context );

      var current_popups = this.currentPopups();
      for ( var i=0; i<current_popups.length; i++ ) {
        current_popups[i].draw( this.context );
      }
    }

    // 描画を反映
    this._flipContext();

    // 描画要求を消す
    this.has_request_draw = false;
  };

  //--------------------------------------
  // 描画要求
  //--------------------------------------
  ScreenManager.prototype.requestDraw = function( screen ){
    // 終了画面の削除
    this._refreshScreen();

    if ( this._isCurrentScreen( screen ) ) {
      // 入力イベントの中以外で描画要求があった場合には、ただちに描画実行する。既に要求すみの場合は無視
      if ( ! this.has_request_draw && ! this.processing_input_event ) {
        setTimeout( function(){ this.drawByRequest(); }.bind(this), 30 );
      }

      this.has_request_draw = true;
    }
  };

  //--------------------------------------
  // 描画要求があったら描画する
  //--------------------------------------
  ScreenManager.prototype.drawByRequest = function(){
    if ( this.has_request_draw ) this.draw();
  };

  //--------------------------------------
  // リレイアウト
  //--------------------------------------
  ScreenManager.prototype.relayout = function(){
    // 画面描画
    var current_screen = this.currentScreen();
    if ( current_screen ) {
      current_screen.relayout();

      var current_popups = this.currentPopups();
      for ( var i=0; i<current_popups.length; i++ ) {
        current_popups[i].relayout();
      }
    }

    // 描画要求を消す
    this.has_request_relayout = false;
  };

  //--------------------------------------
  // レイアウト要求
  //--------------------------------------
  ScreenManager.prototype.requestRelayout = function( screen ){
    // 終了画面の削除
    this._refreshScreen();

    if ( this._isCurrentScreen( screen ) ) {
      // 入力イベントの中以外で描画要求があった場合には、ただちにレイアウト実行する。既に要求すみの時は無視
      if ( ! this.has_request_relayout && ! this.processing_input_event ) {
        setTimeout( function(){ this.relayoutByRequest(); }.bind(this), 30 );
      }

      this.has_request_relayout = true;
    }
  };

  //--------------------------------------
  // レイアウト要求があったらレイアウトする
  //--------------------------------------
  ScreenManager.prototype.relayoutByRequest = function( screen ){
    if ( this.has_request_relayout ) this.relayout();
  };

  //--------------------------------------
  // ウィンドウサイズ変更イベント
  //--------------------------------------
  ScreenManager.prototype.reload = function( width, height ){
    this._initializeInstance( width, height );

    // 終了画面の削除
    this._refreshScreen();

    // 画面の再ロード
    for ( var i=0; i<this.screen_stack.length; i++ ) {
      this.screen_stack[i].screen.reload( width, height );
      for ( var j=0; j<this.screen_stack[i].popup; j++ ) {
        this.screen_stack[i].popup[j].reload( width, height );
      }
    }

    // 再描画
    this.draw();
  };

  //--------------------------------------
  // 入力状態変更イベント
  //--------------------------------------
  ScreenManager.prototype.onChangeInputStatuses = function( statuses ){
    // 現在フォーカス中のポップアップ、または画面に入力イベントを渡す
    var focus_screen = this.currentPopup() || this.currentScreen();

    if ( focus_screen ) {
      this.processing_input_event = true;   // 入力イベント処理開始
      focus_screen.onChangeInputStatuses( statuses );
      this.processing_input_event = false;  // 入力イベント処理終了
    }
  };
}

/*------------------------------------------------------------------------------
  画面インタフェース
------------------------------------------------------------------------------*/
function ScreenInterface(){
  ScreenInterface.prototype.initialize = function( display_element, width, height, screen_manager ){};
  ScreenInterface.prototype.isFinished = function(){};
  ScreenInterface.prototype.focus = function(){};
  ScreenInterface.prototype.blur = function(){};
  ScreenInterface.prototype.reload = function( width, height ){};
  ScreenInterface.prototype.draw = function( context ){};
}

