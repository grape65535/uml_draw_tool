/*------------------------------------------------------------------------------
  アプリ
------------------------------------------------------------------------------*/
function Application(){

  //--------------------------------------
  // 初期化
  //--------------------------------------
  var initializeInstance = function( width, height ){
    this.width = width;
    this.height = height;
  }.bind(this);

  //--------------------------------------
  // 初期化
  //--------------------------------------
  Application.prototype.initialize = function( display_canvas, display_context, width, height ){
    this.display_canvas = display_canvas;
    this.display_context = display_context;
    initializeInstance( width, height );

    // 画面管理
    this.screen_manager = new ScreenManager();
    this.screen_manager.initialize( this.display_canvas, this.display_context, width, height );

    // 画面表示
    this.screen_manager.moveScreen( new EditorScreen() );

    // 入力管理
    this.input_manager = new InputManager();
    this.input_manager.initialize( display_canvas, width, height, this );

    // 入力や描画をタイマー管理せずに、入力状態変化のイベントドリブンで動作させたい場合には以下をコメント
    /*
    this.timer_manager = new TimerManager();
    this.timer_manager.initialize( this, 30 ); // 30 fpsで動作
    */

    return this;
  };

  //--------------------------------------
  // ウィンドウサイズ変更イベント
  //--------------------------------------
  Application.prototype.reload = function( width, height ){
    initializeInstance( width, height );
    this.screen_manager.reload( width, height );
  };

  //--------------------------------------
  // 入力状態変更イベント
  //--------------------------------------
  Application.prototype.onInput = function( event_name, event ){
    // イベントドリブンで入力イベントを処理したい時は以下のコメントを外す
    this.screen_manager.onChangeInputStatuses( this.input_manager.getStatuses() );
    // レイアウト要求があれば描画する
    this.screen_manager.relayoutByRequest();
    // 描画要求があれば描画する
    this.screen_manager.drawByRequest();
  };

  //--------------------------------------
  // タイマ起動イベント
  //--------------------------------------
  Application.prototype.onTime = function( amount_time, live_fps ){
    // タイマーで入力イベントを処理したい時は以下のコメントを外す
    // this.screen_manager.onChangeInputStatuses( this.input_manager.getStatuses() );
  };

}
