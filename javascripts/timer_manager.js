/*------------------------------------------------------------------------------
  時間管理
------------------------------------------------------------------------------*/
function TimerManager(){

  //--------------------------------------
  // 時刻取得
  //--------------------------------------
  TimerManager.prototype._getTime = function(){
    return new Date().getTime();
  };

  //--------------------------------------
  // タイマー開始
  //--------------------------------------
  TimerManager.prototype.start = function(){
    this.prevSecTime = this._getTime();
    this.prevMsecTime = this.prevSecTime;
    this.prevFps = 0;
    this.currentFps = 0;
    this.timer_id = setInterval( function(){      
      // FPSの計測
      var currentMsecTime = this._getTime(  );
      if ( currentMsecTime - this.prevSecTime >= 1000 ) {
        this.prevFps = this.currentFps;
        this.currentFps = 0;
        this.prevSecTime = currentMsecTime;
      }
      this.currentFps++;

      // リスナー呼出し
      this.listener.onTime(
        ( currentMsecTime - this.prevMsecTime ), // 前回のフレームからの経過時間
        this.prevFps, // 前回の1秒におけるFPS
      );

      this.prevMsecTime = currentMsecTime;
    }.bind(this), this.frame_msec );
    return this.timer_id;
  };

  //--------------------------------------
  // タイマー停止
  //--------------------------------------
  TimerManager.prototype.stop = function(){
    clearInterval( this.timer_id );
    return null;
  };

  //--------------------------------------
  // タイマー設定
  //--------------------------------------
  TimerManager.prototype.setFps = function( fps ){
    this.fps = fps;
    this.frame_msec = Math.round( 1000 / fps );
    this.timer_id = this.timer_id ? stop() : null;
  };

  //--------------------------------------
  // コンストラクタ
  //--------------------------------------
  TimerManager.prototype.initialize = function( listener, fps ){
    this.listener = listener;
    this.prevSecTime = 0;
    this.prevMsecTime = 0;
    this.prevFps = 0;
    this.currentFps = 0;
    this.setFps( fps || 30 );

    return this;
  };

}


/*------------------------------------------------------------------------------
  時間管理リスナー
------------------------------------------------------------------------------*/
function TimerListenerInterface(){
  TimerListenerInterface.prototype.onTime = function( amount_time, live_fps ){};
}

