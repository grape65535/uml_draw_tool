/*------------------------------------------------------------------------------
  記録データ管理
------------------------------------------------------------------------------*/
function DataManager(){

  //--------------------------------------
  // 定数
  //--------------------------------------
  var DATA_MANAGER_MAX_HISTORY = 100;   // 制限無しは-1を指定すること

  //--------------------------------------
  // コンストラクタ
  //--------------------------------------
  DataManager.prototype.initialize = function( default_data ){
    this.data = deepCopy( default_data || {} );

    // 初期値は履歴に記録しない
    this.histories = [];
    this.history_index = 0;

    return this;
  };

  //--------------------------------------
  // ヒストリのサイズを取得
  //--------------------------------------
  DataManager.prototype.getHistorySize = function(){
    return this.histories.length;
  };

  //--------------------------------------
  // データの設定
  //--------------------------------------
  DataManager.prototype.setData = function( data ){
    // 保存済みのデータから変化があれば記録する
    if ( JSON.stringify( this.data ) != JSON.stringify( data ) ) {
      this.data = deepCopy( data );

      // 履歴に記録
      this.storeHistory();

      return true;
    }
    return false;
  };

  //--------------------------------------
  // データの取得
  //--------------------------------------
  DataManager.prototype.getData = function(){
    return deepCopy( this.data );
  };

  //--------------------------------------
  // データ属性の取得
  //   path: 添字改装を.区切りで指定。ex) foo.bar.1.baz
  //--------------------------------------
  DataManager.prototype.getProperty = function( path, default_value ){
    paths = path.split(".");
    var seek_object = this.data;
    for( var i=0; i<paths.length; i++ ) {
      if ( seek_object instanceof Array ) {
        seek_object = seek_object[ parseInt( paths[i] ) ];
      }
      else {
        seek_object = seek_object[ paths[i] ];
      }
      if ( null == seek_object || "undefined" == typeof seek_object ) {
        return default_value;
      }
    }
    return deepCopy( seek_object );
  };

  //--------------------------------------
  // 履歴に記録する
  //--------------------------------------
  DataManager.prototype.storeHistory = function(){
    // 履歴に最新のデータを記録する（this.dataと参照を共有しないよう複製して保持する）
    this.histories.splice( this.history_index + 1, this.histories.length );
    this.histories.push( deepCopy( this.data ) )
    this.history_index = this.histories.length - 1;

    // 履歴数の上限管理
    if ( 0 <= DATA_MANAGER_MAX_HISTORY && DATA_MANAGER_MAX_HISTORY < this.histories.length ) {
      this.history_index -= ( this.histories.length - DATA_MANAGER_MAX_HISTORY );
      if ( 0 > this.history_index ) this.history_index = 0;
      this.histories.splice( 0, ( this.histories.length - DATA_MANAGER_MAX_HISTORY ) );
    }
  };

  //--------------------------------------
  // データ属性の設定
  //   path: 添字改装を.区切りで指定。ex) foo.bar.1.baz
  //--------------------------------------
  DataManager.prototype.setProperty = function( path, value ){
    paths = path.split(".");
    var copy_object = deepCopy( this.data );
    var seek_object = copy_object;
    for( var i=0; i<paths.length-1; i++ ) {
      if ( seek_object instanceof Array ) {
        seek_object = seek_object[ parseInt( paths[i] ) ];
      }
      else {
        seek_object = seek_object[ paths[i] ];
      }
      if ( null == seek_object || "undefined" == typeof seek_object ) {
        return;
      }
    }

    if ( seek_object instanceof Array ) {
      seek_object[ parseInt( paths[ paths.length-1 ] ) ] = value;
    }
    else {
      seek_object[ paths[ paths.length-1 ] ] = value;
    }

    this.setData( copy_object );
  };

  //--------------------------------------
  // 戻せる？
  //--------------------------------------
  DataManager.prototype.canUndo = function(){
    return ( 0 < this.history_index && 1 < this.histories.length );
  };

  //--------------------------------------
  // やり直せる？
  //--------------------------------------
  DataManager.prototype.canRedo = function(){
    return ( this.histories.length - 1 > this.history_index && 1 < this.histories.length );
  };

  //--------------------------------------
  // 戻す
  //--------------------------------------
  DataManager.prototype.undo = function(){
    if ( this.canUndo() ) {
      this.history_index--;
      // 履歴と参照を共有しないよう複製したものを現在データとする
      this.data = deepCopy( this.histories[ this.history_index ] );
    }
    return this.getData();
  };

  //--------------------------------------
  // やり直す
  //--------------------------------------
  DataManager.prototype.redo = function(){
    if ( this.canRedo() ) {
      this.history_index++;
      // 履歴と参照を共有しないよう複製したものを現在データとする
      this.data = deepCopy( this.histories[ this.history_index ] );
    }
    return this.getData();
  };

}
DataManager();

