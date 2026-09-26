/*------------------------------------------------------------------------------
  入力管理
------------------------------------------------------------------------------*/
function InputManager(){

  //--------------------------------------
  // 初期化
  //--------------------------------------
  InputManager.prototype._initializeContext = function( resolution_width, resolution_height ){
    // 対象要素のサイズを記録
    this.element_width = Math.floor( this.target_element.width() );
    this.element_height = Math.floor( this.target_element.height() );
    // 解像度を記録
    this.resolution_width = resolution_width;
    this.resolution_height = resolution_height;
  };

  //--------------------------------------
  // 入力状態の初期化
  //--------------------------------------
  InputManager.prototype._initializeInputStatuses = function(){
    this.prev = {
      time: 0,
      cursor: { x:0, y:0, time: 0 },
      wheel: { x:0, y:0, time: 0 },
      touches: {
        points: {
          // touch_id: { press:false, x:0, y:0, down_x:0, down_y:0, up_x:0, up_y:0, time:0 }
        },
        order_ids: [],          // タッチ順序でtouch_idを格納（途中でタッチを放した場合にもキーは残る）
        order_compact_ids: [],  // タッチ順序でtouch_idを格納（途中でタッチを放した場合にはキーは残らず配列は詰められる）
        lefter_compact_ids: [], // タッチ開始位置が左だったものから順にtouch_idを格納
      },
      keys: {},
      histories: [],  // { keycode:0, time:0 }
    };
    // status.current(prev).keys の初期値
    [
      KEYCODE_CURSOR,   KEYCODE_MOUSE_LEFT,   KEYCODE_MOUSE_MIDDLE,   KEYCODE_MOUSE_RIGHT,    KEYCODE_MOUSE_TOUCH,
    ].forEach( function( keycode ){
      this.prev.keys[ keycode ] = { press:false, drag:false, down_x:0, down_y:0, up_x:0, up_y:0, time:0, temporary:null };
    }.bind(this) );
    [
      KEYCODE_0,        KEYCODE_1,        KEYCODE_2,        KEYCODE_3,        KEYCODE_4,
      KEYCODE_5,        KEYCODE_6,        KEYCODE_7,        KEYCODE_8,        KEYCODE_9,
      KEYCODE_A,        KEYCODE_B,        KEYCODE_C,        KEYCODE_D,        KEYCODE_E,
      KEYCODE_F,        KEYCODE_G,        KEYCODE_H,        KEYCODE_I,        KEYCODE_J,
      KEYCODE_K,        KEYCODE_L,        KEYCODE_M,        KEYCODE_N,        KEYCODE_O,
      KEYCODE_P,        KEYCODE_Q,        KEYCODE_R,        KEYCODE_S,        KEYCODE_T,
      KEYCODE_U,        KEYCODE_V,        KEYCODE_W,        KEYCODE_X,        KEYCODE_Y,
      KEYCODE_Z,        KEYCODE_DELETE,   KEYCODE_ENTER,    KEYCODE_SHIFT,    KEYCODE_CTRL,
      KEYCODE_COMMAND,  KEYCODE_RCOMMAND, KEYCODE_ALT,      KEYCODE_SPACE,    KEYCODE_ESC,      KEYCODE_TAB,
      KEYCODE_UP,       KEYCODE_DOWN,     KEYCODE_LEFT,     KEYCODE_RIGHT,
      KEYCODE_OPEN_BRACKET,  KEYCODE_CLOSE_BRACKET,
      KEYCODE_SHORTCUT_SELECT,  KEYCODE_SHORTCUT_SAVE,  KEYCODE_SHORTCUT_UNDO,  KEYCODE_SHORTCUT_REDO,
      KEYCODE_SHORTCUT_CUT,  KEYCODE_SHORTCUT_COPY,  KEYCODE_SHORTCUT_PASTE,   KEYCODE_SHORTCUT_FIND,
      KEYCODE_SHORTCUT_FIND_NEXT, KEYCODE_SHORTCUT_FIND_PREV,
      KEYCODE_SHORTCUT_MOVE_LOW,  KEYCODE_SHORTCUT_MOVE_HIGH,  KEYCODE_SHORTCUT_MOVE_LOWEST,  KEYCODE_SHORTCUT_MOVE_HIGHEST,
      KEYCODE_SHORTCUT_SET_DEFAULT,
    ].forEach( function( keycode ){
      this.prev.keys[ keycode ] = { press:false, time:0 };
    }.bind(this) );

    this.current = this._copyInputStatuses( this.prev ); // currentをprevと同じ内容にする
    this.current.time = this._getTime();
    this.pressKeysDuringMetakey = {};  // metaキー（commandキーやwindowsキー）押下中にkeydownされたキーコード記録用（metaキー解放と同時にkeyup扱いにする）
  };
  
  //--------------------------------------
  // 入力状態のコピー
  //--------------------------------------
  InputManager.prototype._copyInputStatuses = function( statuses ){
    var new_statuses = {};
    new_statuses.time = statuses.time;
    new_statuses.cursor = Object.assign( {}, statuses.cursor );
    new_statuses.wheel = Object.assign( {}, statuses.wheel );

    // タッチ情報を更新しながらコピー
    new_statuses.touches = {
      points: {},
      order_ids: [],
      order_compact_ids: [],
      lefter_compact_ids: [],
    };
    var touch_count = 0;
    for ( var touch_id in statuses.touches.points ) {
      if ( ! statuses.touches.points[touch_id].press ) continue;
      touch_count++;
      new_statuses.touches.points[touch_id] = Object.assign( {}, statuses.touches.points[touch_id] );
    }
    // タッチ中が1つでもあるなら、タッチ順のIDは維持する
    if ( 0 < touch_count ) {
      for ( var i=0, length=statuses.touches.order_ids.length; i<length; i=(i+1)|0 ) {
        new_statuses.touches.order_ids[i] = statuses.touches.order_ids[i];
      }
    }
    // タッチ中のIDだけでタッチ順を生成する
    for ( var i=0, length=statuses.touches.order_compact_ids.length; i<length; i=(i+1)|0 ) {
      if ( statuses.touches.points[ statuses.touches.order_compact_ids[i] ] ) new_statuses.touches.order_compact_ids.push( statuses.touches.order_compact_ids[i] );
    }
    // タッチ中のIDだけでタッチ位置順を生成する
    for ( var i=0, length=statuses.touches.lefter_compact_ids.length; i<length; i=(i+1)|0 ) {
      if ( statuses.touches.points[ statuses.touches.lefter_compact_ids[i] ] ) new_statuses.touches.lefter_compact_ids.push( statuses.touches.lefter_compact_ids[i] );
    }

    new_statuses.keys = {};
    for ( var keycode in statuses.keys ){
      // ショートカット系はコピーせずに初期化
      if ( KEYCODE_SHORTCUT_BASE <= keycode ) {
        new_statuses.keys[keycode] = { press:false, drag:false, down_x:0, down_y:0, up_x:0, up_y:0, time:0, temporary:null };
      }
      else {
        new_statuses.keys[keycode] = Object.assign( {}, statuses.keys[keycode] );
      }
    }
    new_statuses.histories = statuses.histories;

    return new_statuses;
  };

  //--------------------------------------
  // 時刻取得
  //--------------------------------------
  InputManager.prototype._getTime = function(){
    return new Date().getTime();
  };

  //--------------------------------------
  // キー押下の記録
  //--------------------------------------
  InputManager.prototype._writePressStatus = function( keycode, press_status ){
    // 特定のキーコード以外は捨てる
    if ( "undefined" == typeof this.current.keys[ keycode ] ) return;

    // 既に同じ時刻で記録済み？
    if ( this.current.keys[ keycode ].time == this.current.time ) {
      // 同じキー状態なら無視する
      if ( this.current.keys[ keycode ].press == press_status ) return;

      // 現在の記録を1つ前に移す
      this.prev.keys[ keycode ].time  = this.current.keys[ keycode ].time;
      this.prev.keys[ keycode ].press = this.current.keys[ keycode ].press;
    }
    // 記録
    this.current.keys[ keycode ].time  = this.current.time;
    this.current.keys[ keycode ].press = press_status;
  };

  //--------------------------------------
  // キー履歴
  //--------------------------------------
  InputManager.prototype._pushKeyHistory = function( keycode ){
    // 特定のキーコード以外は捨てる
    if ( "undefined" == typeof this.current.keys[ keycode ] ) return;

    this.current.histories.push( { keycode: keycode, time: this._getTime() });
    if ( this.current.histories.length > 10 ) {
      this.current.histories.splice( 0, this.current.histories.length - 10 );
    }
  };

  //--------------------------------------
  // 座標取得
  //--------------------------------------
  InputManager.prototype._isTouchEvent = function( event ){
    if ( event.targetTouches ) {
      return true;
    }
    else if ( event.touches ) {
      return true;
    }
    else if ( event.changedTouches ) {
      return true;
    }
    else if ( event.touches ) {
      return true;
    }
    else if ( event.changedTouches ) {
      return true;
    }
    return false;    
  };

  //--------------------------------------
  // 座標取得
  //--------------------------------------
  InputManager.prototype._getPositionByEvent = function( event ){
    if ( event.originalEvent ) {
      return this._getPositionByEvent( event.originalEvent );
    }
    else if ( event.targetTouches ) {
      if ( 0 == event.targetTouches.length ) return null;
      if ( "number" == typeof event.targetTouches[0].clientX ) {
        return {
          x: event.targetTouches[0].clientX,
          y: event.targetTouches[0].clientY,
        };
      }
      else if ( "number" == typeof event.targetTouches[0].pageX ) {
        return {
          x: event.targetTouches[0].pageX,
          y: event.targetTouches[0].pageY,
        };
      }
      else {
        return {
          x: event.targetTouches[0].screenX,
          y: event.targetTouches[0].screenY,
        };
      }
    }
    else if ( event.touches ) {
      if ( 0 == event.touches.length ) return null;
      if ( "number" == typeof event.touches[0].clientX ) {
        return {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY,
        };  
      }
      else if ( "number" == typeof event.touches[0].pageX ) {
        return {
          x: event.touches[0].pageX,
          y: event.touches[0].pageY
        };          
      }
      else {
        return {
          x: event.touches[0].screenX,
          y: event.touches[0].screenY
        };          
      }
    }
    else if ( event.changedTouches ) {
      if ( 0 == event.changedTouches.length ) return null;
      if ( "number" == typeof event.changedTouches[0].clientX ) {
        return {
          x: event.changedTouches[0].clientX,
          y: event.changedTouches[0].clientY,
        };
      }
      else if ( "number" == typeof event.changedTouches[0].pageX ) {
        return {
          x: event.changedTouches[0].pageX,
          y: event.changedTouches[0].pageY,
        };
      }
      else {
        return {
          x: event.changedTouches[0].screenX,
          y: event.changedTouches[0].screenY
        };  
      }
    }
    else if ( event.offsetX ) {
      return {
        x: event.offsetX,
        y: event.offsetY
      };
    }
    return null;
  };

  //--------------------------------------
  // 複数座標取得
  //--------------------------------------
  InputManager.prototype._getPositionsByEvent = function( event ){
    var positions = [];
    if ( event.originalEvent ) {
      return getPositionsByEvent( event.originalEvent );
    }
    else if ( event.targetTouches ) {
      if ( 0 == event.targetTouches.length ) return null;
      if ( "number" == typeof event.targetTouches[0].clientX ) {
        for ( var i=0, length=event.targetTouches.length; i<length; i=(i+1)|0 ) positions.push( { x:event.targetTouches[i].clientX, y:event.targetTouches[i].clientY, identifier:event.targetTouches[i].identifier } );
      }
      else if ( "number" == typeof event.targetTouches[0].pageX ) {
        for ( var i=0, length=event.targetTouches.length; i<length; i=(i+1)|0 ) positions.push( { x:event.targetTouches[i].pageX, y:event.targetTouches[i].pageY, identifier:event.targetTouches[i].identifier } );
      }
      else {
        for ( var i=0, length=event.targetTouches.length; i<length; i=(i+1)|0 ) positions.push( { x:event.targetTouches[i].screenX, y:event.targetTouches[i].screenY, identifier:event.targetTouches[i].identifier } );
      }
      return positions;
    }
    else if ( event.touches ) {
      if ( 0 == event.touches.length ) return null;
      if ( "number" == typeof event.touches[0].clientX ) {
        for ( var i=0, length=event.touches.length; i<length; i=(i+1)|0 ) positions.push( { x:event.touches[i].clientX, y:event.touches[i].clientY, identifier:event.touches[i].identifier } );
      }
      else if ( "number" == typeof event.touches[0].pageX ) {
        for ( var i=0, length=event.touches.length; i<length; i=(i+1)|0 ) positions.push( { x:event.touches[i].pageX, y:event.touches[i].pageY, identifier:event.touches[i].identifier } );
      }
      else {
        for ( var i=0, length=event.touches.length; i<length; i=(i+1)|0 ) positions.push( { x:event.touches[i].screenX, y:event.touches[i].screenY, identifier:event.touches[i].identifier } );
      }
      return positions;
    }
    else if ( event.changedTouches ) {
      if ( 0 == event.changedTouches.length ) return null;
      if ( "number" == typeof event.changedTouches[0].clientX ) {
        for ( var i=0, length=event.changedTouches.length; i<length; i=(i+1)|0 ) positions.push( { x:event.changedTouches[i].clientX, y:event.changedTouches[i].clientY, identifier:event.changedTouches[i].identifier } );
      }
      else if ( "number" == typeof event.changedTouches[0].pageX ) {
        for ( var i=0, length=event.changedTouches.length; i<length; i=(i+1)|0 ) positions.push( { x:event.changedTouches[i].pageX, y:event.changedTouches[i].pageY, identifier:event.changedTouches[i].identifier } );
      }
      else {
        for ( var i=0, length=event.changedTouches.length; i<length; i=(i+1)|0 ) positions.push( { x:event.changedTouches[i].screenX, y:event.changedTouches[i].screenY, identifier:event.changedTouches[i].identifier } );
      }
      return positions;
    }
    else if ( event.offsetX ) {
      return [{
        x: event.offsetX,
        y: event.offsetY
      }];
    }
    return null;
  };

  //--------------------------------------
  // ホイール量の取得
  //--------------------------------------
  InputManager.prototype._getMouseWheel = function( event ){
    if ( event.originalEvent ) {
      return this._getMouseWheel( event.originalEvent );
    }
    else if ( 'number' == typeof event.deltaX ) {
      return {
        x: event.deltaX,
        y: event.deltaY,
      };
    }
    else {
      return { x:0, y:0 };
    }
  };

  //--------------------------------------
  // キーコードの取得
  //--------------------------------------
  InputManager.prototype._getKeycode = function( event ){
    if ( document.all ) {
      return event.keyCode;
    }
    else if( document.getElementById ) {	    	
      return (event.keyCode)? event.keyCode: event.charCode;
    }
    else if(document.layers) {
      return event.which;
    }
  };

  //--------------------------------------
  // 無効化用イベント
  //--------------------------------------
  InputManager.prototype._disableEvent = function( event ){
    return false;
  }.bind(this);

  //--------------------------------------
  // カーソル移動イベント
  //--------------------------------------
  InputManager.prototype._onCursorMove = function( event ){
    var cursor = this._getPositionByEvent( event );
    if ( ! cursor ) return;

    this.current.cursor.x = Math.round( cursor.x * ( this.resolution_width / this.element_width ) );
    this.current.cursor.y = Math.round( cursor.y * ( this.resolution_height / this.element_height ) );
    this.current.cursor.time = this._getTime();

    // カーソル押下状態ならば、ドラッグの開始
    if ( this.current.keys[KEYCODE_CURSOR].press ) this.current.keys[KEYCODE_CURSOR].drag = true;
    // マウスイベント
    if ( 'number' == typeof event.button && ! this._isTouchEvent( event ) ) {
      switch( event.button ){
        case 0:
          if ( this.current.keys[KEYCODE_MOUSE_LEFT].press ) this.current.keys[KEYCODE_MOUSE_LEFT].drag = true;
          break;
  
        case 1:
          if ( this.current.keys[KEYCODE_MOUSE_MIDDLE].press ) this.current.keys[KEYCODE_MOUSE_MIDDLE].drag = true;
          break;

        case 2:
          if ( this.current.keys[KEYCODE_MOUSE_RIGHT].press ) this.current.keys[KEYCODE_MOUSE_RIGHT].drag = true;
          break;
  
      }
    }
    // タッチイベント
    else {
      if ( this.current.keys[KEYCODE_MOUSE_TOUCH].press ) this.current.keys[KEYCODE_MOUSE_TOUCH].drag = true;

      var touches = this._getPositionsByEvent( event );
      for ( var i=0, length=touches.length; i<length; i=(i+1)|0 ) {
        var touch_id = touches[i].identifier;
        var touch_data = this.current.touches.points[ touch_id ];
        // 既知のタッチ情報なら座標を更新する
        if ( touch_data ){
          touch_data.x = touches[i].x;
          touch_data.y = touches[i].y;
          touch_data.time = this.current.cursor.time
        }
      }
    }

    this.listener.onInput( "on_cursor_move", event );

    return false;
  }.bind(this);

  //--------------------------------------
  // カーソル押下イベント
  //--------------------------------------
  InputManager.prototype._onCursorDown = function( event ){
    var cursor = this._getPositionByEvent( event );
    if ( ! cursor ) return;
    cursor.x = Math.round( cursor.x * ( this.resolution_width / this.element_width ) );
    cursor.y = Math.round( cursor.y * ( this.resolution_height / this.element_height ) );

    // 共通カーソル位置の更新
    this.current.cursor.x = cursor.x;
    this.current.cursor.y = cursor.y;
    this.current.cursor.time = this._getTime();

    // 共通カーソルイベント
    this.current.keys[KEYCODE_CURSOR].up_x = -1;
    this.current.keys[KEYCODE_CURSOR].up_y = -1;
    this.current.keys[KEYCODE_CURSOR].down_x = cursor.x;
    this.current.keys[KEYCODE_CURSOR].down_y = cursor.y;
    this.current.keys[KEYCODE_CURSOR].drag = false;
    this._writePressStatus( KEYCODE_CURSOR, true );

    var keycode = KEYCODE_CURSOR;
    // マウスイベント
    if ( 'number' == typeof event.button && ! this._isTouchEvent( event ) ) {
      switch( event.button ){
      case 0:
        keycode = KEYCODE_MOUSE_LEFT;
        break;

      case 1:
        keycode = KEYCODE_MOUSE_MIDDLE;
        break;

      case 2:
        keycode = KEYCODE_MOUSE_RIGHT;
        break;

      }
    }
    // タッチイベント
    else {
      keycode = KEYCODE_MOUSE_TOUCH;

      var touches = this._getPositionsByEvent( event );
      for ( var i=0, length=touches.length; i<length; i=(i+1)|0 ) {
        var touch_id = touches[i].identifier;
        var touch_data = this.current.touches.points[ touch_id ];
        // 既知のタッチ情報なら座標を更新する
        if ( touch_data ){
          touch_data.x = touches[i].x;
          touch_data.y = touches[i].y;
          touch_data.time = this.current.cursor.time
        }
        // 新規のタッチ情報ならば新規追加する
        else {
          touch_data = {
            press: true,
            down_x: touches[i].x,
            down_y: touches[i].y,
            x: touches[i].x,
            y: touches[i].y,
            up_x: -1,
            up_y: -1,
            time: this.current.cursor.time
          };
          this.current.touches.points[ touch_id ] = touch_data;
          this.current.touches.order_ids.push( touch_id );
          this.current.touches.order_compact_ids.push( touch_id );
          this.current.touches.lefter_compact_ids.push( touch_id );
          this.current.touches.lefter_compact_ids = this.current.touches.lefter_compact_ids.sort( function(a,b){ return a.down_x - b.down_x } );
        }
      }
    }
    this.current.keys[ keycode ].up_x = -1;
    this.current.keys[ keycode ].up_y = -1;
    this.current.keys[ keycode ].down_x = cursor.x;
    this.current.keys[ keycode ].down_y = cursor.y;
    this.current.keys[ keycode ].drag = false;
    this._writePressStatus( keycode, true );
    this._pushKeyHistory( keycode );

    this.listener.onInput( "on_cursor_down", event );

    return false;
  }.bind(this);

  //--------------------------------------
  // カーソル開放イベント
  //--------------------------------------
  InputManager.prototype._onCursorUp = function( event ){
    // カーソル開放時にイベントオブジェクトから座標は取得できないので、既に記録済みの座標を使う
    var cursor = null;
    if ( this.current.keys[KEYCODE_CURSOR].time <= this.current.cursor.time ) {
      cursor = this.current.cursor;
    }
    else {
      cursor = {
        x: this.current.keys[KEYCODE_MOUSE_TOUCH].down_x,
        y: this.current.keys[KEYCODE_MOUSE_TOUCH].down_y,
      }
    }

    // 共通カーソルイベント
    this.current.keys[KEYCODE_CURSOR].up_x = cursor.x;
    this.current.keys[KEYCODE_CURSOR].up_y = cursor.y;
    this.current.keys[KEYCODE_CURSOR].drag = false;
    this._writePressStatus( KEYCODE_CURSOR, false );

    var keycode = KEYCODE_CURSOR;
    // マウスイベント
    if ( 'number' == typeof event.button && ! this._isTouchEvent( event ) ) {
      switch( event.button ){
      case 0:
        keycode = KEYCODE_MOUSE_LEFT;
        break;

      case 1:
        keycode = KEYCODE_MOUSE_MIDDLE;
        break;
        
      case 2:
        keycode = KEYCODE_MOUSE_RIGHT;
        break;

      }
    }
    // タッチイベント
    else {
      keycode = KEYCODE_MOUSE_TOUCH;
      this.current.cursor.x = -1;
      this.current.cursor.y = -1;
      this.current.cursor.time = this._getTime();

      var touches = this._getPositionsByEvent( event );
      for ( var i=0, length=touches.length; i<length; i=(i+1)|0 ) {
        var touch_id = touches[i].identifier;
        var touch_data = this.current.touches.points[ touch_id ];
        // 既知のタッチ情報なら座標を更新する
        if ( touch_data ){
          touch_data.press = false;
          touch_data.x = touches[i].x;
          touch_data.y = touches[i].y;
          touch_data.up_x = touches[i].x;
          touch_data.up_y = touches[i].y;
          touch_data.time = this.current.cursor.time
        }
      }
    }
    this.current.keys[ keycode ].up_x = cursor.x;
    this.current.keys[ keycode ].up_y = cursor.y;
    this.current.keys[ keycode ].drag = false;
    this._writePressStatus( keycode, false );

    this.listener.onInput( "on_cursor_up", event );

    return false;
  }.bind(this);

  //--------------------------------------
  // ホイールイベント
  //--------------------------------------
  InputManager.prototype._onWheel = function( event ){
    var wheel = this._getMouseWheel(event );
    this.current.wheel.x = wheel.x
    this.current.wheel.y = wheel.y
    this.current.wheel.time = this._getTime();

    this.listener.onInput( "on_wheel", event );
  }.bind(this);

  //--------------------------------------
  // キー押下イベント
  //--------------------------------------
  InputManager.prototype._onKeyDown = function( event ){
    var keycode = this._getKeycode( event );
    this._writePressStatus( keycode, true );
    this._pushKeyHistory( keycode );

    // commandキー押下中に新たに押下した全てのキーを記録（macos使用でcommandキー押下中に他キーのkeyupが発火しないため、commandキー解放と同時に解放扱いにするため）
    if ( event.metakey || ( event.originalEvent && event.originalEvent.metaKey ) ) {
      this.pressKeysDuringMetakey[ keycode ] = true;

      // ショートカット系を押下した時には専用のキーコードを記録
      switch ( keycode ) {
      // ペースト（cmd+v）はブラウザ標準のpasteイベント（FileManager._onPaste）で処理するため、
      // ショートカットの記録のみ行い、既定動作はキャンセルしない（キャンセルするとpasteイベントが発火しない）。
      // 記録したショートカットは、pasteイベントが発火しない環境向けのフォールバック判定に使う。
      case KEYCODE_V:
        this._writePressStatus( KEYCODE_SHORTCUT_BASE + keycode, true );
        break;

      case KEYCODE_A:
      case KEYCODE_S:
      case KEYCODE_Z:
      case KEYCODE_X:
      case KEYCODE_C:
      case KEYCODE_D:
      case KEYCODE_F:
      case KEYCODE_G:
      case KEYCODE_OPEN_BRACKET:
      case KEYCODE_CLOSE_BRACKET:

        if ( event.shiftKey || ( event.originalEvent && event.originalEvent.shiftKey ) ) {
          this._writePressStatus( KEYCODE_SHORTCUT_SHIFT_BASE + keycode, true );
        }
        else {
          this._writePressStatus( KEYCODE_SHORTCUT_BASE + keycode, true );
        }
        event.preventDefault();
        break;
      }
    }

    this.listener.onInput( "on_key_down", event );

    // ペースト（cmd/ctrl + v）はブラウザ標準のpasteイベントを発火させるため、既定動作をキャンセルしない
    // （jQueryハンドラのreturn falseはpreventDefaultを行うため、ここで抜ける）
    if ( KEYCODE_V == keycode && ( event.metaKey || event.ctrlKey || ( event.originalEvent && ( event.originalEvent.metaKey || event.originalEvent.ctrlKey ) ) ) ) return;

    return false;
  }.bind(this);

  //--------------------------------------
  // キー開放イベント
  //--------------------------------------
  InputManager.prototype._onKeyUp = function( event ){
    var keycode = this._getKeycode( event );
    this._writePressStatus( keycode, false );

    // commandキーを解放した場合には、commandキー押下中に同時押しされたキーも解放する（macOSの使用でkeyupイベントが発火されないため）
    for ( release_keycode in this.pressKeysDuringMetakey ) {
      if ( release_keycode != KEYCODE_COMMAND ) this._writePressStatus( release_keycode, false );
    }
    this.pressKeysDuringMetakey = {};

    this.listener.onInput( "on_key_up", event );
    return false;
  }.bind(this);

  //--------------------------------------
  // コンストラクタ
  //--------------------------------------
  InputManager.prototype.initialize = function( target_element, resolution_width, resolution_height, listener ){
    this.target_element = target_element;
    this.listener = listener || new InputManagerListenerInterface();
    this._initializeContext( resolution_width, resolution_height );
    this._initializeInputStatuses();

    // イベントリスナーの登録
    this.enableListener();

    // キーコードとキー名の変換テーブル
    this.keycode_to_name = {};
    this.keycode_to_name[ KEYCODE_0 ] = "0";
    this.keycode_to_name[ KEYCODE_1 ] = "1";
    this.keycode_to_name[ KEYCODE_2 ] = "2";
    this.keycode_to_name[ KEYCODE_3 ] = "3";
    this.keycode_to_name[ KEYCODE_4 ] = "4";
    this.keycode_to_name[ KEYCODE_5 ] = "5";
    this.keycode_to_name[ KEYCODE_6 ] = "6";
    this.keycode_to_name[ KEYCODE_7 ] = "7";
    this.keycode_to_name[ KEYCODE_8 ] = "8";
    this.keycode_to_name[ KEYCODE_9 ] = "9";
    this.keycode_to_name[ KEYCODE_A ] = "A";
    this.keycode_to_name[ KEYCODE_B ] = "B";
    this.keycode_to_name[ KEYCODE_C ] = "C";
    this.keycode_to_name[ KEYCODE_D ] = "D";
    this.keycode_to_name[ KEYCODE_E ] = "E";
    this.keycode_to_name[ KEYCODE_F ] = "F";
    this.keycode_to_name[ KEYCODE_G ] = "G";
    this.keycode_to_name[ KEYCODE_H ] = "H";
    this.keycode_to_name[ KEYCODE_I ] = "I";
    this.keycode_to_name[ KEYCODE_J ] = "J";
    this.keycode_to_name[ KEYCODE_K ] = "K";
    this.keycode_to_name[ KEYCODE_L ] = "L";
    this.keycode_to_name[ KEYCODE_M ] = "M";
    this.keycode_to_name[ KEYCODE_N ] = "N";
    this.keycode_to_name[ KEYCODE_O ] = "O";
    this.keycode_to_name[ KEYCODE_P ] = "P";
    this.keycode_to_name[ KEYCODE_Q ] = "Q";
    this.keycode_to_name[ KEYCODE_R ] = "R";
    this.keycode_to_name[ KEYCODE_S ] = "S";
    this.keycode_to_name[ KEYCODE_T ] = "T";
    this.keycode_to_name[ KEYCODE_U ] = "U";
    this.keycode_to_name[ KEYCODE_V ] = "V";
    this.keycode_to_name[ KEYCODE_W ] = "W";
    this.keycode_to_name[ KEYCODE_X ] = "X";
    this.keycode_to_name[ KEYCODE_Y ] = "Y";
    this.keycode_to_name[ KEYCODE_Z ] = "Z";
    this.keycode_to_name[ KEYCODE_OPEN_BRACKET ] = "[";
    this.keycode_to_name[ KEYCODE_CLOSE_BRACKET ] = "]";
    this.keycode_to_name[ KEYCODE_DELETE ] = "[DELETE]";
    this.keycode_to_name[ KEYCODE_ENTER ] = "[ENTER]";
    this.keycode_to_name[ KEYCODE_SHIFT ] = "[SHIFT]";
    this.keycode_to_name[ KEYCODE_CTRL ] = "[CTRL]";
    this.keycode_to_name[ KEYCODE_COMMAND ] = "[COMMAND]";
    this.keycode_to_name[ KEYCODE_RCOMMAND ] = "[R_COMMAND]";
    this.keycode_to_name[ KEYCODE_ALT ] = "[ALT]";
    this.keycode_to_name[ KEYCODE_SPACE ] = "[SPACE]";
    this.keycode_to_name[ KEYCODE_ESC ] = "[ESC]";
    this.keycode_to_name[ KEYCODE_TAB ] = "[TAB]";
    this.keycode_to_name[ KEYCODE_UP ] = "[UP]";
    this.keycode_to_name[ KEYCODE_DOWN ] = "[DOWN]";
    this.keycode_to_name[ KEYCODE_LEFT ] = "[LEFT]";
    this.keycode_to_name[ KEYCODE_RIGHT ] = "[RIGHT]";
    this.keycode_to_name[ KEYCODE_CURSOR ] = "[CURSOR]";
    this.keycode_to_name[ KEYCODE_MOUSE_LEFT ] = "[MOUSE_LEFT]";
    this.keycode_to_name[ KEYCODE_MOUSE_MIDDLE ] = "[MOUSE_MIDDLE]";
    this.keycode_to_name[ KEYCODE_MOUSE_RIGHT ] = "[MOUSE_RIGHT]";
    this.keycode_to_name[ KEYCODE_MOUSE_TOUCH ] = "[TOUCH]";
  };

  //--------------------------------------
  // イベントリスナの開始
  //--------------------------------------
  InputManager.prototype.enableListener = function(){
    this.disableListener();

    this.target_element.on( "mousemove touchmove", this._onCursorMove );
    this.target_element.on( "mousedown touchstart", this._onCursorDown );
    this.target_element.on( "mouseup touchend", this._onCursorUp );
    $(window).on( "wheel", this._onWheel );
    $(window).on( "keydown", this._onKeyDown );
    $(window).on( "keyup", this._onKeyUp );
    // イベント無効化
    $(window).on( "contextmenu", this._disableEvent );
  };

  //--------------------------------------
  // イベントリスナの停止
  //--------------------------------------
  InputManager.prototype.disableListener = function(){
    this.target_element.off( "mousemove touchmove", this._onCursorMove );
    this.target_element.off( "mousedown touchstart", this._onCursorDown );
    this.target_element.off( "mouseup touchend", this._onCursorUp );
    $(window).off( "wheel", this._onWheel );
    $(window).off( "keydown", this._onKeyDown );
    $(window).off( "keyup", this._onKeyUp );
    // イベント無効化
    $(window).off( "contextmenu", this._disableEvent );
  };

  //--------------------------------------
  // キーコードからキー名の取得
  //--------------------------------------
  InputManager.prototype.getKeyNameByKeyCode = function( keycode ){
    if ( ! this.keycode_to_name[ keycode ] ) return null;
    return this.keycode_to_name[ keycode ];
  };

  //--------------------------------------
  // ステータスの取得
  //--------------------------------------
  InputManager.prototype.getStatuses = function(){
    // 現在の入力状態をフリーズ（戻り値用）
    var statuses = new InputStatuses();
    statuses.initialize( { current: this.current, prev: this.prev }, this );

    // 新しい入力状態を作成
    this.prev = this.current;
    this.current = this._copyInputStatuses( this.prev ); // currentをprevと同じ内容にする
    this.current.time = this._getTime();

    return statuses;
  };

  //--------------------------------------
  // ステータスの更新
  //--------------------------------------
  InputManager.prototype.reload = function( resolution_width, resolution_height ){
    this._initializeContext( resolution_width, resolution_height );
  };
}

/*------------------------------------------------------------------------------
  入力状態
------------------------------------------------------------------------------*/
function InputStatuses(){

  //--------------------------------------
  // カーソル位置の取得
  //--------------------------------------
  InputStatuses.prototype.getCursorPosition = function(){
    if ( this.statuses.current.cursor.time == 0 ) return null;

    return {
      x: this.statuses.current.cursor.x,
      y: this.statuses.current.cursor.y
    };
  };

  //--------------------------------------
  // カーソルが移動中？
  //--------------------------------------
  InputStatuses.prototype.isMovingCursor = function(){
    if ( this.statuses.prev.cursor.time == 0 ) return false;
    if ( this.statuses.prev.cursor.time > this.statuses.current.cursor.time ) return false;
    var amount = this.getCursorAmount();
    if ( 0 == amount.x && 0 == amount.y ) return false;
    return true;
  };

  //--------------------------------------
  // カーソル移動量の取得
  //--------------------------------------
  InputStatuses.prototype.getCursorAmount = function(){
    if ( this.statuses.prev.cursor.time == 0 ) return { x:0, y:0 };
    if ( this.statuses.prev.cursor.time > this.statuses.current.cursor.time ) return { x:0, y:0 };
    if ( this.statuses.current.cursor.x == -1 && this.statuses.current.cursor.y == -1 ) return { x:0, y:0 };
    if ( this.statuses.prev.cursor.x == -1 && this.statuses.prev.cursor.y == -1 ) return { x:0, y:0 };

    return {
      x: this.statuses.current.cursor.x - this.statuses.prev.cursor.x,
      y: this.statuses.current.cursor.y - this.statuses.prev.cursor.y
    };
  };

  //--------------------------------------
  // ホイール移動中？
  //--------------------------------------
  InputStatuses.prototype.isMovingWheel = function(){
    if ( this.statuses.current.wheel.time != 0 && this.statuses.prev.wheel.time < this.statuses.current.wheel.time ) {
      if ( 0 != this.statuses.current.wheel.x || 0 != this.statuses.current.wheel.y ) return true;
    }
    return false;
  };

  //--------------------------------------
  // ホイール移動量(X)の取得
  //--------------------------------------
  InputStatuses.prototype.getWheelXAmount = function(){
    if ( this.statuses.current.wheel.time == 0 ) return 0;
    return this.statuses.current.wheel.x;
  };

  //--------------------------------------
  // ホイール移動量(Y)の取得
  //--------------------------------------
  InputStatuses.prototype.getWheelYAmount = function(){
    if ( this.statuses.current.wheel.time == 0 ) return 0;
    return this.statuses.current.wheel.y;
  };

  //--------------------------------------
  // ドラッグ開始？
  //--------------------------------------
  InputStatuses.prototype.isDrag = function( keycode ){
    keycode = keycode || KEYCODE_CURSOR;

    if ( this.statuses.current.keys[ keycode ].time == 0 ) return false;
    if ( ! this.statuses.current.keys[ keycode ].press ) return false;
    if ( this.statuses.prev.keys[ keycode ].drag || ! this.statuses.current.keys[ keycode ].drag ) return false;
    
    return true;
  };

  //--------------------------------------
  // ドラッグ中？
  //--------------------------------------
  InputStatuses.prototype.isDragging = function( keycode ){
    keycode = keycode || KEYCODE_CURSOR;

    if ( this.statuses.current.keys[ keycode ].time == 0 ) return false;
    if ( ! this.statuses.current.keys[ keycode ].press ) return false;
    if ( ! this.statuses.current.keys[ keycode ].drag ) return false;
    
    return true;
  };

  //--------------------------------------
  // ドラッグ終了？
  //--------------------------------------
  InputStatuses.prototype.isDrop = function( keycode ){
    keycode = keycode || KEYCODE_CURSOR;

    if ( this.statuses.current.keys[ keycode ].time == 0 ) return false;
    if ( this.statuses.current.keys[ keycode ].press ) return false;
    if ( ! this.statuses.prev.keys[ keycode ].drag || this.statuses.current.keys[ keycode ].drag ) return false;
    
    return true;
  };

  //--------------------------------------
  // ドラッグ開始座標の取得
  //--------------------------------------
  InputStatuses.prototype.getDragPosition = function( keycode ){
    keycode = keycode || KEYCODE_CURSOR;

    if ( this.isDrag( keycode ) || this.isDragging( keycode ) || this.isDrop( keycode ) ){
      return {
        x: this.statuses.current.keys[ keycode ].down_x,
        y: this.statuses.current.keys[ keycode ].down_y,
      }
    }
    else {
      return null;
    }
  };

  //--------------------------------------
  // ドラッグ終了座標の取得
  //--------------------------------------
  InputStatuses.prototype.getDropPosition = function( keycode ){
    keycode = keycode || KEYCODE_CURSOR;

    if ( this.isDrop( keycode ) ){
      return {
        x: this.statuses.current.keys[ keycode ].up_x,
        y: this.statuses.current.keys[ keycode ].up_y,
      }
    }
    else {
      return null;
    }
  };

  //--------------------------------------
  // ドラッグ中だけの任意の一時データの記録
  //--------------------------------------
  InputStatuses.prototype.storeDraggingTemporaryData = function( keycode, temporary_data ){
    if ( null != temporary_data && "undefined" != typeof temporary_data ) {
      switch( typeof temporary_data ){
      case "object":
        // 連想配列などオブジェクトだった時には、値をコピーして同じデータを参照しない様にする
        temporary_data = Object.assign( {}, temporary_data );
      default:
        break;
      }
    }
 
    this.statuses.current.keys[ keycode ].temporary = temporary_data;
    this.input_manager.current.keys[ keycode ].temporary = temporary_data;
  };

  //--------------------------------------
  // ドラッグ中だけの任意の一時データの読出し
  //--------------------------------------
  InputStatuses.prototype.loadDraggingTemporaryData = function( keycode ){
    var temporary_data = this.statuses.current.keys[ keycode ].temporary || null;
    if ( null == temporary_data || "undefined" == typeof temporary_data ) return null;

    switch( typeof temporary_data ){
    case "object":
      // 連想配列などオブジェクトだった時には、値をコピーして同じデータを参照しない様にする
      return Object.assign( {}, temporary_data );
    default:
      return temporary_data;
    }
  };

  //--------------------------------------
  // キー押下開始？
  //--------------------------------------
  InputStatuses.prototype.isDownKey = function( keycode ){
    if ( ! this.statuses.prev.keys[ keycode ] || this.statuses.current.keys[ keycode ].time == 0 ) return false;
    
    if ( this.statuses.current.keys[ keycode ].press && ! this.statuses.prev.keys[ keycode ].press ) return true;
    return false;
  };

  //--------------------------------------
  // キー押下終了？
  //--------------------------------------
  InputStatuses.prototype.isUpKey = function( keycode ){
    if ( ! this.statuses.prev.keys[ keycode ] || this.statuses.prev.keys[ keycode ].time == 0 ) return false;
    if ( this.statuses.prev.keys[ keycode ].time > this.statuses.current.keys[ keycode ].time ) return false;
    
    if ( ! this.statuses.current.keys[ keycode ].press && this.statuses.prev.keys[ keycode ].press ) return true;
    return false;
  };

  //--------------------------------------
  // キー押下中？
  //--------------------------------------
  InputStatuses.prototype.isPressKey = function( keycode ){
    if ( ! this.statuses.prev.keys[ keycode ] || this.statuses.prev.keys[ keycode ].time == 0 ) return false;
    
    if ( this.statuses.current.keys[ keycode ].press ) return true;
    return false;
  };

  //--------------------------------------
  // 指定キーに何らかのイベントがある？
  //--------------------------------------
  InputStatuses.prototype.isAnyEventKey = function( keycode ){
    return this.isDownKey( keycode ) || this.isUpKey( keycode ) || this.isPressKey( keycode );
  };

  //--------------------------------------
  // ショートカットキーが押下された？
  //--------------------------------------
  InputStatuses.prototype.isShortCutDownKey = function( keycode ){
    if ( KEYCODE_SHORTCUT_BASE > keycode ) return false;
    return this.isAnyEventKey( keycode );
  };

  //--------------------------------------
  // マルチキーダウン？
  //--------------------------------------
  InputStatuses.prototype.isMultiKeyDown = function( keycode, count ){
    count = count || 2;
    if ( this.statuses.current.histories.length < count ) return false;

    // 対象キーを押下した瞬間だけ発火
    if ( ! this.isDownKey( keycode ) ) return false;

    // 同じキーが2連続しているか？
    for ( var i=1; i<=count; i++ ) {
      var cmp_keycode = this.statuses.current.histories[ this.statuses.current.histories.length - i ].keycode;
      if ( KEYCODE_CURSOR == keycode ) {
        if ( ! isIncludeArray( [ KEYCODE_MOUSE_LEFT, KEYCODE_MOUSE_MIDDLE, KEYCODE_MOUSE_RIGHT, KEYCODE_MOUSE_TOUCH ], cmp_keycode ) ) return false;
      }
      else if ( cmp_keycode != keycode ) return false;
    }
    
    // 300msec以上ならダブルキーダウンとはしない
    for ( var i=1; i<count; i++ ) {
      var diff_time = this.statuses.current.histories[ this.statuses.current.histories.length - i ].time - this.statuses.current.histories[ this.statuses.current.histories.length - ( i + 1 ) ].time;
      if ( diff_time > 300 ) return false;
    }

    return true;
  };

  //--------------------------------------
  // マルチキーアップ？
  //--------------------------------------
  InputStatuses.prototype.isMultiKeyUp = function( keycode, count ){
    count = count || 2;
    if ( this.statuses.current.histories.length < count ) return false;

    // 対象キーを押下した瞬間だけ発火
    if ( ! this.isUpKey( keycode ) ) return false;
    if ( 300 < this.statuses.current.keys[ keycode ].time - this.statuses.prev.keys[ keycode ].time ) return false;

    // 同じキーが2連続しているか？
    for ( var i=1; i<=count; i++ ) {
      var cmp_keycode = this.statuses.current.histories[ this.statuses.current.histories.length - i ].keycode;
      if ( KEYCODE_CURSOR == keycode ) {
        if ( ! isIncludeArray( [ KEYCODE_MOUSE_LEFT, KEYCODE_MOUSE_MIDDLE, KEYCODE_MOUSE_RIGHT, KEYCODE_MOUSE_TOUCH ], cmp_keycode ) ) return false;
      }
      else if ( cmp_keycode != keycode ) return false;
    }
    
    // 300msec以上ならダブルキーダウンとはしない
    for ( var i=1; i<count; i++ ) {
      var diff_time = this.statuses.current.histories[ this.statuses.current.histories.length - i ].time - this.statuses.current.histories[ this.statuses.current.histories.length - ( i + 1 ) ].time;
      if ( diff_time > 300 ) return false;
    }

    return true;
  };

  //--------------------------------------
  // 全てのタッチ開始位置をタッチ開始順で配列で取得
  //   is_compress : (オプション)
  //     false : (デフォルト) 配列の順序は常に一定とし、タッチ終了した場合には配列の当該インデックス要素はnullになる
  //     true  : 配列の順序は、タッチ終了したデータが存在すると前に詰めて取得される
  //--------------------------------------
  InputStatuses.prototype.getTouchStartPositions = function( is_compress ){
    if ( "undefined" == typeof is_compress ) is_compress = false;

    var touches = [];
    for ( var i=0, length=this.statuses.current.touches.order_ids.length; i<length; i=(i+1)|0 ){
      var tmp = this.statuses.current.touches.points[ this.statuses.current.touches.order_ids[ i ] ]
      if ( tmp ) {
        touches.push( {
          x: tmp.down_x,
          y: tmp.down_y,
        } );
      }
      else if ( ! is_compress ) {
        touches.push( null );
      }
    }
    return touches;
  };

  //--------------------------------------
  // 全てのタッチ位置をタッチ開始順で配列で取得
  //   is_compress : (オプション)
  //     false : (デフォルト) 配列の順序は常に一定とし、タッチ終了した場合には配列の当該インデックス要素はnullになる
  //     true  : 配列の順序は、タッチ終了したデータが存在すると前に詰めて取得される
  //--------------------------------------
  InputStatuses.prototype.getTouchPositions = function( is_compress ){
    if ( "undefined" == typeof is_compress ) is_compress = false;

    var touches = [];
    for ( var i=0, length=this.statuses.current.touches.order_ids.length; i<length; i=(i+1)|0 ){
      var tmp = this.statuses.current.touches.points[ this.statuses.current.touches.order_ids[ i ] ]
      if ( tmp ) {
        touches.push( {
          x: tmp.x,
          y: tmp.y,
        } );
      }
      else if ( ! is_compress ) {
        touches.push( null );
      }
    }
    return touches;
  };

  //--------------------------------------
  // 2つのタッチ位置間の距離を取得する
  //--------------------------------------
  InputStatuses.prototype.getMultiTouchDistance = function(){
    if ( 2 > this.statuses.current.touches.lefter_compact_ids.length ) return { total_distance:{ x:0, y:0 }, last_distance:{ x:0, y:0 } };

    var prev_left_touch     = this.statuses.prev.touches.points[ this.statuses.current.touches.lefter_compact_ids[0] ] || null;
    var prev_right_touch    = this.statuses.prev.touches.points[ this.statuses.current.touches.lefter_compact_ids[1] ] || null;
    var current_left_touch  = this.statuses.current.touches.points[ this.statuses.current.touches.lefter_compact_ids[0] ] || null;
    var current_right_touch = this.statuses.current.touches.points[ this.statuses.current.touches.lefter_compact_ids[1] ] || null;

    return {
      total_distance: {
        x: ( current_left_touch.down_x - current_left_touch.x ) + ( current_right_touch.x - current_right_touch.down_x ),
        y: ( current_left_touch.down_y - current_left_touch.y ) + ( current_right_touch.y - current_right_touch.down_y ),
      },
      last_distance: {
        x: ( prev_left_touch && prev_right_touch ? ( prev_left_touch.x - current_left_touch.x ) + ( current_right_touch.x - prev_right_touch.x ) : 0 ),
        y: ( prev_left_touch && prev_right_touch ? ( prev_left_touch.y - current_left_touch.y ) + ( current_right_touch.y - prev_right_touch.y ) : 0 ),
      }
    };
  };

  //--------------------------------------
  // 2つのタッチ移動の合成ベクトルを取得する
  //--------------------------------------
  InputStatuses.prototype.getMultiTouchVector = function(){
    if ( 2 > this.statuses.current.touches.lefter_compact_ids.length ) return { total_vector:{ x:0, y:0 }, last_vector:{ x:0, y:0 } };

    var prev_left_touch     = this.statuses.prev.touches.points[ this.statuses.current.touches.lefter_compact_ids[0] ] || null;
    var prev_right_touch    = this.statuses.prev.touches.points[ this.statuses.current.touches.lefter_compact_ids[1] ] || null;
    var current_left_touch  = this.statuses.current.touches.points[ this.statuses.current.touches.lefter_compact_ids[0] ] || null;
    var current_right_touch = this.statuses.current.touches.points[ this.statuses.current.touches.lefter_compact_ids[1] ] || null;

    return {
      total_vector: {
        x: ( current_left_touch.x - current_left_touch.down_x ) + ( current_right_touch.x - current_right_touch.down_x ),
        y: ( current_left_touch.y - current_left_touch.down_y ) + ( current_right_touch.y - current_right_touch.down_y ),
      },
      last_vector: {
        x: ( prev_left_touch && prev_right_touch ? ( current_left_touch.x - prev_left_touch.x ) + ( current_right_touch.x - prev_right_touch.x ) : 0 ),
        y: ( prev_left_touch && prev_right_touch ? ( current_left_touch.y - prev_left_touch.y ) + ( current_right_touch.y - prev_right_touch.y ) : 0 ),
      }
    };
  };

  //--------------------------------------
  // コンストラクタ
  //--------------------------------------
  InputStatuses.prototype.initialize = function( statuses, input_manager ){
    this.statuses = statuses;
    this.input_manager = input_manager;
  };
}

//--------------------------------------
// 定数
//--------------------------------------
var KEYCODE_0 = 48;
var KEYCODE_1 = 49;
var KEYCODE_2 = 50;
var KEYCODE_3 = 51;
var KEYCODE_4 = 52;
var KEYCODE_5 = 53;
var KEYCODE_6 = 54;
var KEYCODE_7 = 55;
var KEYCODE_8 = 56;
var KEYCODE_9 = 57;
var KEYCODE_A = 65;
var KEYCODE_B = 66;
var KEYCODE_C = 67;
var KEYCODE_D = 68;
var KEYCODE_E = 69;
var KEYCODE_F = 70;
var KEYCODE_G = 71;
var KEYCODE_H = 72;
var KEYCODE_I = 73;
var KEYCODE_J = 74;
var KEYCODE_K = 75;
var KEYCODE_L = 76;
var KEYCODE_M = 77;
var KEYCODE_N = 78;
var KEYCODE_O = 79;
var KEYCODE_P = 80;
var KEYCODE_Q = 81;
var KEYCODE_R = 82;
var KEYCODE_S = 83;
var KEYCODE_T = 84;
var KEYCODE_U = 85;
var KEYCODE_V = 86;
var KEYCODE_W = 87;
var KEYCODE_X = 88;
var KEYCODE_Y = 89;
var KEYCODE_Z = 90;
var KEYCODE_OPEN_BRACKET = 219
var KEYCODE_CLOSE_BRACKET = 221
var KEYCODE_DELETE = 8;
var KEYCODE_ENTER = 13;
var KEYCODE_SHIFT = 16;
var KEYCODE_CTRL = 17;
var KEYCODE_COMMAND = 91;
var KEYCODE_RCOMMAND = 93;
var KEYCODE_ALT = 18;
var KEYCODE_SPACE = 32;
var KEYCODE_ESC = 27;
var KEYCODE_TAB = 9;
var KEYCODE_UP = 38;
var KEYCODE_DOWN = 40;
var KEYCODE_LEFT = 37;
var KEYCODE_RIGHT = 39;
var KEYCODE_CURSOR = 1000;  // マウスクリックとタップで共通
var KEYCODE_MOUSE_LEFT = 1010;
var KEYCODE_MOUSE_MIDDLE = 1011;
var KEYCODE_MOUSE_RIGHT = 1012;
var KEYCODE_MOUSE_TOUCH = 1020;
var KEYCODE_SHORTCUT_BASE = 10000;
var KEYCODE_SHORTCUT_SHIFT_BASE = 11000;
var KEYCODE_SHORTCUT_SELECT = KEYCODE_SHORTCUT_BASE + KEYCODE_A;        // cmd + a
var KEYCODE_SHORTCUT_SAVE   = KEYCODE_SHORTCUT_BASE + KEYCODE_S;        // cmd + s
var KEYCODE_SHORTCUT_UNDO   = KEYCODE_SHORTCUT_BASE + KEYCODE_Z;        // cmd + z
var KEYCODE_SHORTCUT_REDO   = KEYCODE_SHORTCUT_SHIFT_BASE + KEYCODE_Z;  // cmd + shift + z
var KEYCODE_SHORTCUT_CUT    = KEYCODE_SHORTCUT_BASE + KEYCODE_X;        // cmd + x
var KEYCODE_SHORTCUT_COPY   = KEYCODE_SHORTCUT_BASE + KEYCODE_C;        // cmd + c
var KEYCODE_SHORTCUT_PASTE  = KEYCODE_SHORTCUT_BASE + KEYCODE_V;        // cmd + v
var KEYCODE_SHORTCUT_FIND   = KEYCODE_SHORTCUT_BASE + KEYCODE_F;        // cmd + f
var KEYCODE_SHORTCUT_FIND_NEXT = KEYCODE_SHORTCUT_BASE + KEYCODE_G;       // cmd + g
var KEYCODE_SHORTCUT_FIND_PREV = KEYCODE_SHORTCUT_SHIFT_BASE + KEYCODE_G; // cmd + shift + g
var KEYCODE_SHORTCUT_MOVE_LOW  = KEYCODE_SHORTCUT_BASE + KEYCODE_OPEN_BRACKET;        // cmd + [
var KEYCODE_SHORTCUT_MOVE_HIGH = KEYCODE_SHORTCUT_BASE + KEYCODE_CLOSE_BRACKET;       // cmd + ]
var KEYCODE_SHORTCUT_MOVE_LOWEST  = KEYCODE_SHORTCUT_SHIFT_BASE + KEYCODE_OPEN_BRACKET;  // cmd + shift + [
var KEYCODE_SHORTCUT_MOVE_HIGHEST = KEYCODE_SHORTCUT_SHIFT_BASE + KEYCODE_CLOSE_BRACKET; // cmd + shift + ]
var KEYCODE_SHORTCUT_SET_DEFAULT  = KEYCODE_SHORTCUT_BASE + KEYCODE_D;  // cmd + d

/*------------------------------------------------------------------------------
  InputManagerからのイベント処理を行うためのインタフェース
------------------------------------------------------------------------------*/
function InputManagerListenerInterface(){
  InputManagerListenerInterface.prototype.onInput = function( event_name, event ){};
}
